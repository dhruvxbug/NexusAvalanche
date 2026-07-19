import { PrismaClient } from "@prisma/client";
import { BlockchainService } from "./blockchain.service";

export class KycService {
  private prisma = new PrismaClient();
  private blockchainService = new BlockchainService();

  /**
   * Submit a new KYC request or return existing.
   */
  public async submitKyc(walletAddress: string, jurisdiction: string, documentId: string) {
    // Basic geofencing mock check
    if (jurisdiction === "RestrictedRegion") {
      throw new Error("Jurisdiction is restricted by geofencing rules.");
    }

    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress },
      });
    }

    if (user.isWhitelisted) {
      throw new Error("User is already whitelisted.");
    }

    const request = await this.prisma.kycRequest.create({
      data: {
        userId: user.id,
        jurisdiction,
        documentId,
        status: "PENDING",
      },
    });

    return request;
  }

  /**
   * Mock webhook processor: simulates async approval from Onfido/Sumsub
   */
  public async processWebhook(kycRequestId: string, decision: "APPROVED" | "REJECTED") {
    const request = await this.prisma.kycRequest.findUnique({
      where: { id: kycRequestId },
      include: { user: true },
    });

    if (!request) throw new Error("KYC Request not found");
    if (request.status !== "PENDING") throw new Error("Request already processed");

    if (decision === "REJECTED") {
      return await this.prisma.kycRequest.update({
        where: { id: kycRequestId },
        data: { status: "REJECTED" },
      });
    }

    // If APPROVED, interact with the blockchain to whitelist the address
    const txHash = await this.blockchainService.addToWhitelist(request.user.walletAddress);

    // Update DB
    await this.prisma.user.update({
      where: { id: request.userId },
      data: { isWhitelisted: true },
    });

    return await this.prisma.kycRequest.update({
      where: { id: kycRequestId },
      data: { status: "APPROVED", txHash },
    });
  }

  public async getStatus(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
      include: {
        kycRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return { isWhitelisted: false, latestStatus: null };
    }

    // Also check on-chain just to be sure (optional, but good for robust sync)
    const isOnChain = await this.blockchainService.isWhitelisted(walletAddress);
    
    // Sync local state if off
    if (isOnChain && !user.isWhitelisted) {
       await this.prisma.user.update({ where: { id: user.id }, data: { isWhitelisted: true }});
    }

    return {
      isWhitelisted: isOnChain || user.isWhitelisted,
      latestStatus: user.kycRequests.length > 0 ? user.kycRequests[0].status : null,
      txHash: user.kycRequests.length > 0 ? user.kycRequests[0].txHash : null
    };
  }
}
