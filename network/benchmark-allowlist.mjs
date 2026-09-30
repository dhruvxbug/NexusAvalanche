#!/usr/bin/env node
//
// Benchmark: TxAllowList compliance-path metrics.
//
// Measures two distinct things that are easy to conflate:
//
//   1. Proposal latency  - client submit -> transaction included in a block.
//   2. Propagation latency - block included -> a fresh reader observes the new
//      role. This is the number that matters for "how fast does the allowlist
//      sync", because a compliance backend or wallet is a *reader*.
//
// Both are reported separately. On this local L1 a block is only built when a
// transaction arrives, so an idle chain does not tick.
//
// Usage:
//   node benchmark-allowlist.mjs [rpc-url] [--samples N]

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const { ethers } = require(path.join(ROOT, "..", "kyc-backend", "node_modules", "ethers"));

const TX_ALLOWLIST = "0x0200000000000000000000000000000000000002";
const ABI = [
  "function readAllowList(address addr) external view returns (uint256 role)",
  "function setEnabled(address addr) external",
  "function setNone(address addr) external",
];

function resolveRpc(arg) {
  if (arg && !arg.startsWith("--")) return arg;
  if (process.env.L1_RPC_URL) return process.env.L1_RPC_URL;
  return null;
}

const ADMIN_KEY =
  process.env.ADMIN_PRIVATE_KEY ||
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min: s[0],
    max: s[s.length - 1],
    mean: sum / s.length,
    median: s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2,
    p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))],
  };
};

const fmtMs = (st) =>
  `n=${st.n} min=${st.min.toFixed(2)}ms median=${st.median.toFixed(2)}ms ` +
  `mean=${st.mean.toFixed(2)}ms p95=${st.p95.toFixed(2)}ms max=${st.max.toFixed(2)}ms`;

const fmtGas = (st) =>
  `n=${st.n} min=${st.min} median=${st.median} mean=${st.mean.toFixed(1)} ` +
  `p95=${st.p95} max=${st.max}`;

async function main() {
  const args = process.argv.slice(2);
  const samples = Number(args[args.indexOf("--samples") + 1]) || 10;
  const rpcUrl = resolveRpc(args[0]) || process.argv[2];

  if (!rpcUrl) {
    console.error("Usage: node benchmark-allowlist.mjs <rpc-url> [--samples N]");
    process.exit(2);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const admin = new ethers.Wallet(ADMIN_KEY, provider);
  const allowlist = new ethers.Contract(TX_ALLOWLIST, ABI, admin);

  const net = await provider.getNetwork();
  console.log(`\nTxAllowList benchmark`);
  console.log(`  rpc      : ${rpcUrl}`);
  console.log(`  chainId  : ${net.chainId}`);
  console.log(`  sender   : ${admin.address}`);
  console.log(`  samples  : ${samples}\n`);

  const nonceN = { v: null };
  const nextNonce = async () => {
    if (nonceN.v === null) nonceN.v = await provider.getTransactionCount(admin.address, "pending");
    return nonceN.v++;
  };

  const grant = [], revoke = [], readAfter = [], gasSetEnabled = [], gasSetNone = [];
  const plain = [], gasPlain = [];

  // Baseline: a plain value transfer with no allowlist involvement. If this
  // shows the same multi-second delay, the delay is the L1's block scheduler,
  // not the allowlist, and must not be attributed to the compliance path.
  for (let i = 0; i < samples; i++) {
    const t0 = process.hrtime.bigint();
    const rec = await (
      await admin.sendTransaction({ to: admin.address, value: 0n, nonce: await nextNonce() })
    ).wait(1, 120000);
    const t1 = process.hrtime.bigint();
    plain.push(Number(t1 - t0) / 1e6);
    gasPlain.push(rec.gasUsed);
  }

  for (let i = 0; i < samples; i++) {
    // A distinct throwaway address per sample, so each grant is a real
    // None -> Enabled transition rather than a no-op.
    const target = ethers.getAddress(
      ethers.zeroPadValue(ethers.toBeHex(0x51de0000 + i), 20)
    );

    // --- grant ---
    const t0 = process.hrtime.bigint();
    const tx = await allowlist.setEnabled(target, { nonce: await nextNonce() });
    const rec = await tx.wait(1, 120000);
    const t1 = process.hrtime.bigint();
    grant.push(Number(t1 - t0) / 1e6);
    gasSetEnabled.push(rec.gasUsed);

    // --- propagation: an independent reader observes the new role ---
    const reader = new ethers.Contract(
      TX_ALLOWLIST,
      ABI,
      new ethers.JsonRpcProvider(rpcUrl)
    );
    const t2 = process.hrtime.bigint();
    const role = BigInt(await reader.readAllowList(target));
    const t3 = process.hrtime.bigint();
    readAfter.push(Number(t3 - t2) / 1e6);
    if (role !== 1n) throw new Error(`role not Enabled after grant: ${role}`);

    // --- revoke, returning the chain to its prior state ---
    const t4 = process.hrtime.bigint();
    const rec2 = await (await allowlist.setNone(target, { nonce: await nextNonce() })).wait(1, 120000);
    const t5 = process.hrtime.bigint();
    revoke.push(Number(t5 - t4) / 1e6);
    gasSetNone.push(rec2.gasUsed);
  }

  const out = {
    setEnabled: {
      latency_ms: stats(grant),
      gas: stats(gasSetEnabled.map(Number)),
    },
    setNone: {
      latency_ms: stats(revoke),
      gas: stats(gasSetNone.map(Number)),
    },
    readAllowList_observation_ms: stats(readAfter),
    plain_transfer: {
      latency_ms: stats(plain),
      gas: stats(gasPlain.map(Number)),
    },
  };

  console.log("Results");
  console.log(`  setEnabled  (None -> Enabled) end-to-end : ${fmtMs(out.setEnabled.latency_ms)}`);
  console.log(`    gasUsed per call                       : ${fmtGas(out.setEnabled.gas)}`);
  console.log(`  setNone     (Enabled -> None) end-to-end : ${fmtMs(out.setNone.latency_ms)}`);
  console.log(`    gasUsed per call                       : ${fmtGas(out.setNone.gas)}`);
  console.log(`  readAllowList observation latency         : ${fmtMs(out.readAllowList_observation_ms)}`);
  console.log(`  baseline plain transfer (self->self)     : ${fmtMs(out.plain_transfer.latency_ms)}`);
  console.log(`    gasUsed per transfer                   : ${fmtGas(out.plain_transfer.gas)}`);
  console.log(`\nJSON:`);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.shortMessage || e.message);
  process.exit(1);
});
