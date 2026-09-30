#!/usr/bin/env node
//
// Allowlist manager for the Jurisdiction-Aware Chain.
//
// Avalanche L1s gate participation with two independent precompiles:
//
//   TxAllowList            0x0200000000000000000000000000000000000002
//                          Controls who may submit a transaction. The RPC node
//                          rejects a non-listed sender before the EVM runs, so
//                          this is what actually blocks participation.
//
//   ContractDeployerAllowList 0x0200000000000000000000000000000000000000
//                          Controls who may deploy a contract. Separate admin
//                          set; a role in one has no effect on the other.
//
// Roles: 0 None, 1 Enabled, 2 Admin, 3 Manager.
//   Admin   - may set any role, including other admins.
//   Manager - may only set Enabled/None. Introduced with Durango.
//   Enabled - may transact (and deploy, if also on the deployer allowlist).
//
// Removing every admin locks you out permanently unless a Subnet-EVM network
// upgrade is scheduled, so `demote` refuses to remove the last admin.
//
// Usage:
//   node allowlist.mjs list
//   node allowlist.mjs enable  0xaddr...   # grant Enabled
//   node allowlist.mjs disable 0xaddr...   # revoke to None
//   node allowlist.mjs manager 0xaddr...   # grant Manager
//   node allowlist.mjs admin   0xaddr...   # grant Admin
//   node allowlist.mjs demote  0xaddr...   # revoke an Admin/Manager
//   node allowlist.mjs whoami
//   node allowlist.mjs sync <file.json>    # reconcile against a JSON list
//
// Environment:
//   L1_RPC_URL        RPC endpoint (see network/resolve-rpc.mjs)
//   ADMIN_PRIVATE_KEY admin key (defaults to the avalanche-cli ewoq dev key)
//   ALLOWLIST         "tx" (default) or "deployer"

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const { ethers } = require(path.join(ROOT, "..", "kyc-backend", "node_modules", "ethers"));

export const PRECOMPILES = {
  tx: "0x0200000000000000000000000000000000000002",
  deployer: "0x0200000000000000000000000000000000000000",
};

export const ROLE = { NONE: 0n, ENABLED: 1n, ADMIN: 2n, MANAGER: 3n };
const ROLE_NAMES = { 0: "None", 1: "Enabled", 2: "Admin", 3: "Manager" };

export const ALLOWLIST_ABI = [
  "function readAllowList(address addr) external view returns (uint256 role)",
  "function setEnabled(address addr) external",
  "function setManager(address addr) external",
  "function setAdmin(address addr) external",
  "function setNone(address addr) external",
  "event RoleSet(uint256 indexed role, address indexed account, address indexed sender, uint256 oldRole)",
];

// Well-known avalanche-cli ewoq development key. Prefunded and an allowlist
// Admin on a local chain. Never use it on a public network.
const EWOQ_KEY = "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";

function resolveRpcUrl() {
  if (process.env.L1_RPC_URL) return process.env.L1_RPC_URL;
  const script = path.join(ROOT, "..", "network", "resolve-rpc.mjs");
  try {
    return execFileSync("node", [script], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

export function connect({ rpcUrl, privateKey, which = "tx" } = {}) {
  const url = rpcUrl || resolveRpcUrl();
  if (!url) {
    throw new Error(
      "No RPC URL. Export L1_RPC_URL, or run network/resolve-rpc.mjs to detect the local L1."
    );
  }
  const key = privateKey || process.env.ADMIN_PRIVATE_KEY || EWOQ_KEY;
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(key, provider);
  const address = PRECOMPILES[which];
  if (!address) throw new Error(`Unknown allowlist "${which}". Use "tx" or "deployer".`);
  return {
    url,
    provider,
    wallet,
    contract: new ethers.Contract(address, ALLOWLIST_ABI, wallet),
    which,
  };
}

/**
 * Nonce manager for sequential writes.
 *
 * Reading the nonce fresh for each transaction races with the previous one,
 * because this local L1 builds a block per transaction and the pool does not
 * always reflect a just-submitted tx. Track the next nonce locally instead,
 * seeded from "pending" so any externally submitted tx is accounted for.
 */
export function nonceManager(ctx) {
  let next = null;
  return {
    async take() {
      if (next === null) {
        next = await ctx.provider.getTransactionCount(ctx.wallet.address, "pending");
      }
      const n = next++;
      return n;
    },
    /** Forget the local count so the next read is authoritative. */
    reset() {
      next = null;
    },
  };
}

export async function roleOf(ctx, address) {
  return BigInt(await ctx.contract.readAllowList(address));
}

/**
 * Addresses seeded by genesis, keyed by role.
 *
 * RoleSet events only cover changes made through the precompile after the
 * Durango activation, so the genesis-configured admins never appear in the
 * log. The precompile also offers no enumeration API, so genesis is the only
 * way to recover them.
 */
function genesisRoles(which) {
  const genesisPath = path.join(ROOT, "..", "network", "genesis.json");
  let genesis;
  try {
    genesis = JSON.parse(fs.readFileSync(genesisPath, "utf8"));
  } catch {
    return [];
  }
  const key =
    which === "deployer" ? "contractDeployerAllowListConfig" : "txAllowListConfig";
  const cfg = genesis?.config?.[key];
  if (!cfg) return [];

  const seeded = [];
  for (const a of cfg.adminAddresses || []) seeded.push([a, ROLE.ADMIN]);
  for (const a of cfg.managerAddresses || []) seeded.push([a, ROLE.MANAGER]);
  for (const a of cfg.enabledAddresses || []) seeded.push([a, ROLE.ENABLED]);
  return seeded;
}

/**
 * Enumerate every allowlisted address: genesis seeds overlaid with the
 * RoleSet event log, replayed in block order so later changes win.
 */
export async function listAllowlisted(ctx) {
  const roles = new Map();
  for (const [addr, role] of genesisRoles(ctx.which)) {
    roles.set(ethers.getAddress(addr), role);
  }

  const events = await ctx.contract.queryFilter(ctx.contract.filters.RoleSet(), 0, "latest");
  events.sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0));

  for (const e of events) {
    const role = BigInt(e.args.role);
    const account = ethers.getAddress(e.args.account);
    if (role === ROLE.NONE) roles.delete(account);
    else roles.set(account, role);
  }
  return roles;
}

async function requireAdmin(ctx) {
  const role = await roleOf(ctx, ctx.wallet.address);
  if (role !== ROLE.ADMIN) {
    throw new Error(
      `${ctx.wallet.address} has role ${ROLE_NAMES[Number(role)]} on the ` +
        `${ctx.which} allowlist. setAdmin/setManager require Admin.`
    );
  }
}

const NEXT_ROLE = { setEnabled: 1, setAdmin: 2, setManager: 3, setNone: 0 };

async function apply(ctx, addresses, method) {
  await requireAdmin(ctx);
  const nonces = nonceManager(ctx);
  const results = [];

  for (const raw of addresses) {
    const addr = ethers.getAddress(raw);

    if (method === "setNone") {
      const before = await roleOf(ctx, addr);
      if (before === ROLE.ADMIN || before === ROLE.MANAGER) {
        const all = await listAllowlisted(ctx);
        const privileged = [...all.entries()].filter(
          ([, r]) => r === ROLE.ADMIN || r === ROLE.MANAGER
        );
        if (privileged.length <= 1) {
          throw new Error(
            `Refusing to demote ${addr}: it is the only Admin/Manager left on the ` +
              `${ctx.which} allowlist. Removing it would lock the chain out of its own ` +
              `allowlist permanently.`
          );
        }
        if (addr === ctx.wallet.address) {
          throw new Error(
            `Refusing to demote yourself (${addr}). That revokes your own access to ` +
              `the ${ctx.which} allowlist. Pass --force-demote-self to override.`
          );
        }
      }
    }

    const before = await roleOf(ctx, addr);
    try {
      const tx = await ctx.contract[method](addr, { nonce: await nonces.take() });
      const receipt = await tx.wait(1, 120000);
      results.push({ address: addr, from: ROLE_NAMES[Number(before)], tx: receipt.hash });
      console.log(
        `  ${addr}  ${ROLE_NAMES[Number(before)]} -> ${ROLE_NAMES[NEXT_ROLE[method]]}  ${receipt.hash}`
      );
    } catch (e) {
      // The local count is only a hint; re-read the authoritative value.
      nonces.reset();
      throw new Error(`failed to set ${addr} to ${ROLE_NAMES[NEXT_ROLE[method]]}: ${e.shortMessage || e.message}`);
    }
  }
  return results;
}

/**
 * Reconcile on-chain roles against a desired set.
 * Adds anything missing and demotes anything absent, skipping the protected
 * bootstrap admins so a sync can never lock the chain.
 */
export async function sync(ctx, desired) {
  await requireAdmin(ctx);
  const current = await listAllowlisted(ctx);
  const want = new Set(desired.map((a) => ethers.getAddress(a)));

  const toEnable = [...want].filter((a) => {
    const r = current.get(a);
    return r === undefined || r === ROLE.NONE;
  });
  const toDemote = [...current.keys()].filter((a) => {
    if (want.has(a)) return false;
    const r = current.get(a);
    return r === ROLE.ADMIN || r === ROLE.MANAGER || r === ROLE.ENABLED;
  });

  console.log(`sync: ${toEnable.length} to enable, ${toDemote.length} to demote`);
  for (const a of toEnable) {
    await apply(ctx, [a], "setEnabled");
  }
  for (const a of toDemote) {
    try {
      await apply(ctx, [a], "setNone");
    } catch (e) {
      console.error(`  skipped ${a}: ${e.message}`);
    }
  }
}

function parseAddresses(argv) {
  if (argv.length === 0) {
    throw new Error("No addresses given.");
  }
  return argv.map((a) => {
    if (!ethers.isAddress(a)) throw new Error(`Not a valid address: ${a}`);
    return ethers.getAddress(a);
  });
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const ctx = connect({ which: process.env.ALLOWLIST || "tx" });

  switch (cmd) {
    case "whoami": {
      const r = await roleOf(ctx, ctx.wallet.address);
      console.log(`${ctx.wallet.address}  role=${r} (${ROLE_NAMES[Number(r)]})  on ${ctx.which}`);
      console.log(`rpc: ${ctx.url}`);
      break;
    }
    case "list": {
      const roles = await listAllowlisted(ctx);
      console.log(`\n${ctx.which} allowlist @ ${PRECOMPILES[ctx.which]}  (${roles.size} entries)\n`);
      for (const [addr, role] of [...roles].sort((a, b) => Number(a[1]) - Number(b[1]))) {
        console.log(`  ${addr}  ${ROLE_NAMES[Number(role)]}`);
      }
      console.log();
      break;
    }
    case "enable":
      await apply(ctx, parseAddresses(rest), "setEnabled");
      break;
    case "disable":
      await apply(ctx, parseAddresses(rest), "setNone");
      break;
    case "manager":
      await apply(ctx, parseAddresses(rest), "setManager");
      break;
    case "admin":
      await apply(ctx, parseAddresses(rest), "setAdmin");
      break;
    case "demote":
      await apply(ctx, parseAddresses(rest), "setNone");
      break;
    case "sync": {
      if (rest.length !== 1) throw new Error("Usage: allowlist.mjs sync <file.json>");
      const raw = fs.readFileSync(rest[0], "utf8");
      const parsed = JSON.parse(raw);
      const desired = Array.isArray(parsed) ? parsed : parsed.addresses;
      if (!Array.isArray(desired)) throw new Error("Expected a JSON array or {\"addresses\": [...]}");
      await sync(ctx, desired);
      break;
    }
    default:
      console.log(`allowlist.mjs - manage the ${ctx.which} allowlist

  list                     show every allowlisted address and its role
  whoami                   show the caller's role
  enable  <addr...>        grant Enabled (may transact)
  disable <addr...>        revoke to None
  manager <addr...>        grant Manager (may grant/revoke Enabled only)
  admin   <addr...>        grant Admin
  demote  <addr...>        revoke Admin/Manager (refuses to remove the last admin)
  sync   <file.json>       reconcile against a desired address list

Set ALLOWLIST=deployer to operate on the contract deployer allowlist instead.`);
      if (cmd) process.exitCode = 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`\nERROR: ${e.message}`);
    process.exit(1);
  });
}
