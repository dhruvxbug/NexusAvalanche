import { ethers } from "ethers";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private nonceMap: Map<string, number> = new Map();

  private readonly TX_ALLOWLIST_ADDRESS = "0x0200000000000000000000000000000000000002";
  private readonly TX_ALLOWLIST_ABI = [
    "function setEnabled(address addr) external",
    "function readAllowList(address addr) external view returns (uint256 role)"
  ];

  constructor() {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:9650/ext/bc/jurisdiction-chain/rpc";
    const privateKey = process.env.ADMIN_PRIVATE_KEY || "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(this.TX_ALLOWLIST_ADDRESS, this.TX_ALLOWLIST_ABI, this.wallet);
  }

  /**
   * Safe nonce getter for concurrent transactions.
   */
  private async getNextNonce(address: string): Promise<number> {
    const networkNonce = await this.provider.getTransactionCount(address, "latest");
    const localNonce = this.nonceMap.get(address) || 0;
    const nextNonce = Math.max(networkNonce, localNonce);
    this.nonceMap.set(address, nextNonce + 1);
    return nextNonce;
  }

  public async isWhitelisted(address: string): Promise<boolean> {
    try {
      const role = await this.contract.readAllowList(address);
      return role > 0n;
    } catch (error) {
      console.error(`BlockchainService: Error checking whitelist status for ${address}`, error);
      throw new Error("Blockchain status check failed.");
    }
  }

  public async addToWhitelist(address: string): Promise<string> {
    let retries = 3;
    while (retries > 0) {
      try {
        const nonce = await this.getNextNonce(this.wallet.address);
        const tx = await this.contract.setEnabled(address, { nonce });
        await tx.wait(); // Wait for confirmation
        return tx.hash;
      } catch (error: any) {
        retries--;
        // If nonce error, resync local nonce
        if (error.message && error.message.includes("nonce")) {
            this.nonceMap.delete(this.wallet.address); // Reset nonce cache
        }
        if (retries === 0) {
          console.error(`BlockchainService: Failed to whitelist ${address} after retries.`);
          throw error;
        }
      }
    }
    throw new Error("Failed to whitelist address.");
  }
}
