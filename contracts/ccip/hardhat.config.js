/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.27",
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  networks: {
    // The local Jurisdiction-Aware Chain. The RPC path uses the generated
    // blockchain ID, so export L1_RPC_URL from network/resolve-rpc.mjs.
    jurisdictionChain: {
      type: "http",
      url: process.env.L1_RPC_URL || "http://127.0.0.1:9650",
      chainId: 99999,
      accounts: [
        process.env.ADMIN_PRIVATE_KEY ||
          "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
      ],
    },
    hardhat: {
      type: "edr-simulated",
    },
  },
};
