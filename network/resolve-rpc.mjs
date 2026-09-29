#!/usr/bin/env node
//
// Resolve the live RPC URL for the local Jurisdiction-Aware Chain.
//
// The RPC path is /ext/bc/<blockchainID>/rpc where <blockchainID> is a
// generated base58 ID. It is NOT the alias and NOT the chainId, which is why
// hardcoded URLs like /ext/bc/jurisdiction-chain/rpc never work.
//
// Resolution order:
//   1. L1_RPC_URL, if already exported
//   2. Read the L1 node's flags.json: http-port gives the port and the
//      base64 chain-config-content gives the blockchain IDs
//   3. Confirm the candidate answers eth_chainId with the genesis chainId
//
// Prints the resolved URL on stdout. Exits non-zero if the chain is not up.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LOCAL_DIR = path.join(os.homedir(), ".avalanche-cli", "local");
const CHAIN_ALIAS = "jurisdictionchain";

// 99999, the chainId declared in network/genesis.json.
const EXPECTED_CHAIN_ID = "0x1869f";

function findFlagFiles() {
  const found = [];
  let runDirs = [];
  try {
    runDirs = fs.readdirSync(LOCAL_DIR).filter((d) => d.startsWith(CHAIN_ALIAS));
  } catch {
    return found;
  }

  for (const runDir of runDirs) {
    const nodeRoot = path.join(LOCAL_DIR, runDir);
    let nodeIds = [];
    try {
      nodeIds = fs.readdirSync(nodeRoot);
    } catch {
      continue;
    }
    for (const nodeId of nodeIds) {
      const flagsPath = path.join(nodeRoot, nodeId, "flags.json");
      if (!fs.existsSync(flagsPath)) continue;
      try {
        found.push({ flagsPath, flags: JSON.parse(fs.readFileSync(flagsPath, "utf8")) });
      } catch {
        // A partially written flags.json during startup is not fatal.
      }
    }
  }
  return found;
}

function decodeChainIds(flags) {
  const encoded = flags["chain-config-content"];
  if (!encoded) return [];
  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    // The primary network is keyed "C"; every other key is an L1.
    return Object.keys(decoded).filter((id) => id !== "C");
  } catch {
    return [];
  }
}

async function chainIdOf(url) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      signal: AbortSignal.timeout(3000),
    });
    const json = await res.json();
    return json.result ?? null;
  } catch {
    return null;
  }
}

async function main() {
  if (process.env.L1_RPC_URL) {
    console.log(process.env.L1_RPC_URL);
    return;
  }

  for (const { flags } of findFlagFiles()) {
    const port = flags["http-port"];
    if (!port) continue;

    for (const blockchainID of decodeChainIds(flags)) {
      const url = `http://127.0.0.1:${port}/ext/bc/${blockchainID}/rpc`;
      const chainId = await chainIdOf(url);
      if (chainId === EXPECTED_CHAIN_ID) {
        console.log(url);
        return;
      }
    }
  }

  process.exit(1);
}

main();
