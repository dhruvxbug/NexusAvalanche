#!/usr/bin/env node
/**
 * Benchmark: CrossChainIdentity EVM-to-Any CCIP initiation.
 *
 * IMPORTANT — what this measures and what it does not.
 *
 * A real Chainlink CCIP send requires a live CCIP Router, a funded LINK
 * balance, and a destination chain registered in the Router's allow list. None
 * of those exist on a local development L1, so the real CCIP network fee
 * cannot be measured here. Reporting a mock router's cost as "CCIP cross-chain
 * cost" would misrepresent an oracle-priced operation.
 *
 * What this script DOES measure, against the live NexusAvalanche L1:
 *   - EVM cost of CrossChainIdentity's own send logic: onlyOwner check,
 *     payload encoding, LINK approval + transferFrom, and event emission
 *   - EVM cost of one router call (MockCCIPRouter, a faithful stub of
 *     IRouterClient's surface)
 *   - EVM cost of the inbound _ccipReceive path, including the source-chain
 *     allow-list check inherited from CCIPReceiver
 *
 * These are LOWER BOUNDS on a real send. The Chainlink network fee is quoted
 * off-chain by Chainlink oracles and paid in LINK; it is excluded here and
 * cannot be substituted with a local measurement.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const { ethers } = require(
  path.join(HERE, "..", "..", "..", "kyc-backend", "node_modules", "ethers")
);

const ART = path.join(HERE, "..", "artifacts", "contracts");

function artifact(name, file) {
  return JSON.parse(fs.readFileSync(path.join(ART, name, file), "utf8"));
}

const results = {};
function record(name, data) {
  results[name] = data;
  console.log(`\n[${name}]`);
  for (const [k, v] of Object.entries(data)) {
    console.log(`  ${k}: ${typeof v === "number" ? v : JSON.stringify(v)}`);
  }
}

async function main() {
  const rpc = process.argv[2] || process.env.L1_RPC_URL;
  if (!rpc) {
    console.error("Usage: node benchmark-ccip.mjs <rpc-url>");
    process.exit(2);
  }
  const provider = new ethers.JsonRpcProvider(rpc);
  const deployer = new ethers.Wallet(
    process.env.ADMIN_PRIVATE_KEY ||
      "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
    provider
  );
  const net = await provider.getNetwork();

  console.log(`\nCCIP EVM-to-Any benchmark`);
  console.log(`  rpc      : ${rpc}`);
  console.log(`  chainId  : ${net.chainId}`);
  console.log(`  deployer : ${deployer.address}`);

  let nonce = await provider.getTransactionCount(deployer.address, "pending");
  const next = () => nonce++;

  // ── Harness ───────────────────────────────────────────────────────────
  const routerArt = artifact("MockCCIPRouter.sol", "MockCCIPRouter.json");
  const routerFactory = new ethers.ContractFactory(routerArt.abi, routerArt.bytecode, deployer);
  const router = await routerFactory.deploy({ nonce: next() });
  await router.waitForDeployment();

  // Minimal LINK stand-in. The real token's economics are irrelevant to gas.
  const linkArt = artifact("MockLink.sol", "MockLink.json");
  const linkFactory2 = new ethers.ContractFactory(
    linkArt.abi,
    linkArt.bytecode,
    deployer
  );
  const link = await linkFactory2.deploy({ nonce: next() });
  await link.waitForDeployment();

  const idArt = artifact("CrossChainIdentity.sol", "CrossChainIdentity.json");
  const idFactory = new ethers.ContractFactory(idArt.abi, idArt.bytecode, deployer);
  const identity = await idFactory.deploy(await router.getAddress(), await link.getAddress(), {
    nonce: next(),
  });
  await identity.waitForDeployment();

  // Fund the contract so its fee check passes.
  await (
    await deployer.sendTransaction({
      to: await link.getAddress(),
      data: link.interface.encodeFunctionData("mint", [
        await identity.getAddress(),
        ethers.parseEther("10"),
      ]),
      nonce: next(),
    })
  ).wait(1);

  console.log(`  CrossChainIdentity: ${await identity.getAddress()}`);
  console.log(`  MockCCIPRouter    : ${await router.getAddress()}`);
  console.log(`  MockLink          : ${await link.getAddress()}`);

  // ── Outbound EVM -> Any ───────────────────────────────────────────────
  {
    const DEST = 16015286601757825753n; // Arbitrum One selector (fixed)
    const user = "0x1111111111111111111111111111111111111111";
    const did = "did:ethr:99999:0x1111111111111111111111111111111111111111";

    const t0 = process.hrtime.bigint();
    const tx = await identity.sendCredentialStatus(
      DEST,
      await router.getAddress(),
      user,
      true,
      did,
      { nonce: next() }
    );
    const rec = await tx.wait(1, 120000);
    const t1 = process.hrtime.bigint();

    const evt = rec.logs
      .map((l) => {
        try {
          return identity.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((l) => l?.name === "CredentialStatusSent");

    record("ccipSend_evm_to_any", {
      gas_total: rec.gasUsed.toString(),
      submit_ms: +(Number(t1 - t0) / 1e6).toFixed(2),
      event_emitted: !!evt,
      mock_router_fee_wei: (await router.MOCK_FEE()).toString(),
      scope: "LOWER BOUND - excludes the real Chainlink CCIP network fee",
    });
  }

  // ── Inbound Any -> EVM ────────────────────────────────────────────────
  {
    const user = "0x2222222222222222222222222222222222222222";
    const did = "did:ethr:99999:0x2222222222222222222222222222222222222222";
    const payload = new ethers.AbiCoder().encode(
      ["address", "bool", "string"],
      [user, true, did]
    );
    const SOURCE = 43114n;

    // Fail closed: with no trusted chains configured the message must be
    // rejected even though the caller is the configured router.
    let rejectedUntrustedChain = false;
    let rejection = "";
    try {
      await router.deliver.staticCall(await identity.getAddress(), payload, SOURCE);
    } catch (e) {
      rejectedUntrustedChain = true;
      rejection = (e.shortMessage || e.message).slice(0, 90);
    }

    // A trusted but non-router caller is also rejected.
    let rejectedFromNonRouter = false;
    try {
      await identity.ccipReceive.staticCall({
        messageId: ethers.ZeroHash,
        sourceChainSelector: SOURCE,
        sender: "0x",
        data: payload,
        destTokenAmounts: [],
      });
    } catch (e) {
      rejectedFromNonRouter = true;
      rejection = (e.shortMessage || e.message).slice(0, 90);
    }

    await (await identity.setSupportedChains([SOURCE], { nonce: next() })).wait(1);

    const t0 = process.hrtime.bigint();
    const tx = await router.deliver(await identity.getAddress(), payload, SOURCE, {
      nonce: next(),
    });
    const rec = await tx.wait(1, 120000);
    const t1 = process.hrtime.bigint();

    const verified = await identity.isVerifiedFromChain(user, SOURCE);
    const didStored = await identity.userDids(user);

    record("ccipReceive_any_to_evm", {
      gas_total: rec.gasUsed.toString(),
      submit_ms: +(Number(t1 - t0) / 1e6).toFixed(2),
      untrusted_source_chain_rejected: rejectedUntrustedChain,
      non_router_caller_rejected: rejectedFromNonRouter,
      rejection,
      user_verified_after_receive: verified,
      did_stored: didStored,
    });
  }

  console.log(`\nJSON:`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.shortMessage || e.message);
  process.exit(1);
});
