import { PrismaClient } from "@prisma/client";
import { BlockchainService } from "./blockchain.service";
import crypto from 'crypto';
import axios from 'axios';

const VERIFF_API_KEY = process.env.VERIFF_API_KEY || "";
const VERIFF_API_SECRET = process.env.VERIFF_API_SECRET || "";
const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

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

    const sessionData = {
      verification: {
        vendorData: user.id,
      }
    };
    
    let veriffSessionUrl = "mock_url_if_no_keys";
    let veriffSessionId = user.id + "_mock"; // Fallback ID
    try {
        if (VERIFF_API_KEY) {
            const response = await axios({
                method: 'post',
                url: VERIFF_BASE_URL + '/v1/sessions/',
                headers: {
                    'X-AUTH-CLIENT': VERIFF_API_KEY,
                    'Content-Type': 'application/json'
                },
                data: sessionData
            });
            veriffSessionUrl = response.data.verification.url;
            veriffSessionId = response.data.verification.id;
        }
    } catch(e) {
        console.error("Veriff API error. Generating mock URL for test.", e);
    }

    const request = await this.prisma.kycRequest.create({
      data: {
        userId: user.id,
        jurisdiction,
        documentId,
        status: "PENDING",
        veriffSessionId: veriffSessionId,
      },
    });

    return { request, veriffSessionUrl };
  }

  /**
   * Process webhook from Veriff
   */
  public async processVeriffWebhook(payload: any) {
    const verification = payload.verification;
    if (!verification || !verification.id) return;
    
    const sessionId = verification.id;
    const status = verification.status;

    const request = await this.prisma.kycRequest.findFirst({
      where: { veriffSessionId: sessionId },
      include: { user: true },
    });

    if (!request || request.status !== "PENDING") return;

    if (status === 'approved') {
      // If APPROVED, interact with the blockchain to whitelist the address
      const txHash = await this.blockchainService.addToWhitelist(request.user.walletAddress);

      // Update DB
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { isWhitelisted: true },
      });

      await this.prisma.kycRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED", txHash },
      });
    } else if (status === 'declined' || status === 'abandoned') {
      await this.prisma.kycRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" },
      });
    }
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
