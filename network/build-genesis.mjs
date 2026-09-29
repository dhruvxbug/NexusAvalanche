// Merge the allowlist config into the CLI-generated genesis.
// The CLI pre-installs the ValidatorManager / Proxy / MessagesLib bytecode into
// genesis alloc. A hand-written genesis without those allocations boots the
// chain but leaves "no contract code at given address" during PoA VM init.
import fs from "node:fs";

const base = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

const ADMIN = [
  "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
  "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f",
  "0xa1602F06C2E246B9A888C3Be313C0516b3457a41",
  "0x42faA16E82Aa2b4ad9162EB482C6AE2c4c332f87",
];
const USER = "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2";
const FUND = "0x295BE96E64066972000000"; // 50,000,000 * 1e18

base.config.chainId = 99999;
base.config.feeConfig = {
  gasLimit: 15000000,
  minBaseFee: 25000000000,
  targetGas: 15000000,
  baseFeeChangeDenominator: 36,
  minBlockGasCost: 0,
  maxBlockGasCost: 1000000,
  targetBlockRate: 2,
  blockGasCostStep: 200000,
};
base.config.allowFeeRecipients = false;

// Subnet-EVM validates the genesis and rejects a chain whose feeConfig
// gasLimit disagrees with the header gasLimit:
//   "gas limit in fee config (X) does not match gas limit in header (Y)"
const headerGasLimit = typeof base.gasLimit === "number"
  ? base.gasLimit
  : parseInt(base.gasLimit, 16);
base.config.feeConfig.gasLimit = headerGasLimit;
base.gasLimit = "0x" + headerGasLimit.toString(16);

// The CLI stamps a nonzero start timestamp and a warpConfig. Keep whatever
// the CLI generated so validation passes unchanged.
if (base.timestamp === "0x0" || base.timestamp === "0x00") {
  base.timestamp = "0x6abb8399";
}
if (!base.extraData) base.extraData = "0x";
if (base.extraData === "0x00") base.extraData = "0x";
if (base.difficulty === undefined) base.difficulty = "0x0";
if (base.mixHash === undefined) {
  base.mixHash = "0x" + "0".repeat(64);
}

base.config.contractDeployerAllowListConfig = {
  blockTimestamp: 0,
  adminAddresses: ADMIN,
};
base.config.txAllowListConfig = {
  blockTimestamp: 0,
  adminAddresses: ADMIN,
  managerAddresses: [],
  enabledAddresses: [USER],
};

// Fund every bootstrap address while preserving the CLI's contract
// allocations, which are required for the PoA validator manager.
for (const addr of [...ADMIN, USER]) {
  base.alloc[addr.toLowerCase()] = { balance: FUND };
}

fs.writeFileSync(process.argv[3], JSON.stringify(base, null, 2) + "\n");
console.log(`wrote ${process.argv[3]}`);
console.log(`  chainId:  ${base.config.chainId}`);
console.log(`  alloc entries: ${Object.keys(base.alloc).length}`);
for (const [a, v] of Object.entries(base.alloc)) {
  if (v.code) console.log(`  code @ ${a} (${v.code.length} chars)`);
}
