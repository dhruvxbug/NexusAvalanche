#!/usr/bin/env node
//
// Verify the local Jurisdiction-Aware Chain is live and the allowlist is
// enforcing. Run as part of network/deploy_l1.sh, or standalone:
//
//   node verify-l1.mjs <rpc-url>
//
// Checks:
//   1. The chain answers eth_chainId / eth_blockNumber and is producing blocks
//   2. The TxAllowList precompile is registered and responsive
//   3. Bootstrap addresses hold the expected roles
//   4. A non-allowlisted address is rejected with the expected error

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ethers } = require("../kyc-backend/node_modules/ethers");

const TX_ALLOWLIST = "0x0200000000000000000000000000000000000002";
const DEPLOYER_ALLOWLIST = "0x0200000000000000000000000000000000000000";
const EXPECTED_CHAIN_ID = 99999n;

export const ROLE_NONE = 0n;
export const ROLE_ENABLED = 1n;
export const ROLE_ADMIN = 2n;
export const ROLE_MANAGER = 3n;
export const ROLE_NAMES = {
  0: "None",
  1: "Enabled",
  2: "Admin",
  3: "Manager",
};

export const ALLOWLIST_ABI = [
  "function readAllowList(address addr) external view returns (uint256 role)",
  "function setEnabled(address addr) external",
  "function setManager(address addr) external",
  "function setAdmin(address addr) external",
  "function setNone(address addr) external",
  "event RoleSet(uint256 indexed role, address indexed account, address indexed sender, uint256 oldRole)",
];

// Any address whose role is above None may transact.
// Deployer permission is a separate, stricter allowlist.
export const CAN_TRANSACT = new Set([ROLE_ENABLED, ROLE_ADMIN, ROLE_MANAGER]);

export const ADDRESSES = {
  ewoq: "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
  eercDeployer: "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f",
  vmOwner: "0xa1602F06C2E246B9A888C3Be313C0516b3457a41",
  cliDeployer: "0x42faA16E82Aa2b4ad9162EB482C6AE2c4c332f87",
  user: "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2",
};

let failures = 0;

function pass(msg) {
  console.log(`  \x1b[32mPASS\x1b[0m ${msg}`);
}
function fail(msg) {
  failures++;
  console.log(`  \x1b[31mFAIL\x1b[0m ${msg}`);
}

export async function getRole(provider, address, which = TX_ALLOWLIST) {
  const contract = new ethers.Contract(which, ALLOWLIST_ABI, provider);
  return BigInt(await contract.readAllowList(address));
}

async function main() {
  const rpcUrl = process.argv[2] || process.env.L1_RPC_URL;
  if (!rpcUrl) {
    console.error("Usage: node verify-l1.mjs <rpc-url>");
    process.exit(2);
  }

  console.log(`\nVerifying Jurisdiction-Aware Chain at ${rpcUrl}\n`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // 1. Liveness
  const net = await provider.getNetwork();
  if (net.chainId === EXPECTED_CHAIN_ID) {
    pass(`chainId = ${net.chainId} (matches genesis)`);
  } else {
    fail(`chainId = ${net.chainId}, expected ${EXPECTED_CHAIN_ID}`);
  }

  const block1 = await provider.getBlockNumber();
  await new Promise((r) => setTimeout(r, 2500));
  const block2 = await provider.getBlockNumber();
  if (block2 > block1) {
    pass(`producing blocks (${block1} -> ${block2})`);
  } else {
    fail(`not producing blocks (stuck at ${block1})`);
  }

  // 2. Precompile reachable
  try {
    await getRole(provider, ADDRESSES.ewoq);
    pass("TxAllowList precompile is registered and responsive");
  } catch (e) {
    fail(`TxAllowList precompile unreachable: ${e.shortMessage || e.message}`);
    process.exit(1);
  }

  // 3. Bootstrap roles
  const expectations = [
    [ADDRESSES.ewoq, ROLE_ADMIN, "ewoq (genesis funded)"],
    [ADDRESSES.eercDeployer, ROLE_ADMIN, "eERC deployer"],
    [ADDRESSES.vmOwner, ROLE_ADMIN, "validator manager owner"],
    [ADDRESSES.cliDeployer, ROLE_ADMIN, "avalanche-cli deployer"],
    [ADDRESSES.user, ROLE_ENABLED, "seeded user"],
  ];
  for (const [addr, want, label] of expectations) {
    const got = await getRole(provider, addr);
    if (got === want) {
      pass(`${label} role = ${got} (${ROLE_NAMES[Number(got)]})`);
    } else {
      fail(`${label} role = ${got} (${ROLE_NAMES[Number(got)]}), expected ${want} (${ROLE_NAMES[Number(want)]})`);
    }
  }

  // 4. Enforcement: an unknown address must be rejected.
  const stranger = ethers.Wallet.createRandom().connect(provider);
  const admin = new ethers.Wallet(
    "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
    provider
  );
  await (await admin.sendTransaction({ to: stranger.address, value: ethers.parseEther("1") })).wait();

  let blocked = false;
  let errorText = "";
  try {
    await stranger.sendTransaction({ to: admin.address, value: 0n });
  } catch (e) {
    errorText = e.message || "";
    blocked = errorText.includes("non-allow listed");
  }

  if (blocked) {
    pass("non-allowlisted address is rejected before reaching the EVM");
  } else {
    fail(`non-allowlisted address was not rejected: ${errorText.slice(0, 120) || "no error"}`);
  }

  // 5. setEnabled lifts the restriction
  const asAdmin = new ethers.Contract(TX_ALLOWLIST, ALLOWLIST_ABI, admin);
  await (await asAdmin.setEnabled(stranger.address)).wait();
  const role = await getRole(provider, stranger.address);
  if (role === ROLE_ENABLED) {
    pass("setEnabled grants transaction permission");
  } else {
    fail(`setEnabled left role = ${role}, expected ${ROLE_ENABLED}`);
  }

  try {
    const tx = await stranger.sendTransaction({ to: admin.address, value: 0n });
    await tx.wait();
    pass("allowlisted address can transact");
  } catch (e) {
    fail(`allowlisted address could not transact: ${(e.shortMessage || e.message).slice(0, 120)}`);
  }

  // Leave the chain as we found it.
  await (await asAdmin.setNone(stranger.address)).wait();
  const restored = await getRole(provider, stranger.address);
  if (restored === ROLE_NONE) {
    pass("setNone revokes permission (cleanup verified)");
  } else {
    fail(`setNone left role = ${restored}, expected ${ROLE_NONE}`);
  }

  console.log();
  if (failures === 0) {
    console.log(`\x1b[32mAll checks passed.\x1b[0m`);
  } else {
    console.log(`\x1b[31m${failures} check(s) failed.\x1b[0m`);
  }
  process.exit(failures === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
