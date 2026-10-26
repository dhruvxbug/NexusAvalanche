import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { ethers } = require(path.join(process.cwd(), "kyc-backend", "node_modules", "ethers"));

const TX_ALLOWLIST = "0x0200000000000000000000000000000000000002";
const ABI = [
  "function readAllowList(address addr) external view returns (uint256 role)",
  "function setEnabled(address addr) external",
];

const ADMIN_KEY = "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";

async function main() {
  const rpcUrl = process.argv[2];
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const admin = new ethers.Wallet(ADMIN_KEY, provider);
  const allowlist = new ethers.Contract(TX_ALLOWLIST, ABI, admin);

  const target = ethers.Wallet.createRandom().address;
  const nonce = await provider.getTransactionCount(admin.address, "latest");
  
  const tx = await allowlist.setEnabled(target, { nonce });
  const rec = await tx.wait();
  
  const t2 = process.hrtime.bigint();
  const reader = new ethers.Contract(TX_ALLOWLIST, ABI, new ethers.JsonRpcProvider(rpcUrl));
  const role = BigInt(await reader.readAllowList(target));
  const t3 = process.hrtime.bigint();
  
  console.log(`NEW_GAS: ${rec.gasUsed}`);
  console.log(`NEW_LATENCY: ${Number(t3 - t2) / 1e6} ms`);
}

main().catch(console.error);
