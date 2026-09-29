import { PrismaClient } from "@prisma/client";
import { BlockchainService } from "./blockchain.service";
import { DidService } from "./did.service";
import { VcService } from "./vc.service";
import { IpfsService } from "./ipfs.service";
import { JrdlService } from "./jrdl.service";
import crypto from 'crypto';
import axios from 'axios';

const VERIFF_API_KEY = process.env.VERIFF_API_KEY || "";
const VERIFF_API_SECRET = process.env.VERIFF_API_SECRET || "";
const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

export class KycService {
  private prisma = new PrismaClient();
  private blockchainService = new BlockchainService();
  private didService = new DidService();
  private vcService = new VcService();
  private ipfsService = new IpfsService();
  private jrdlService = new JrdlService();

  /**
   * Submit a new KYC request or return existing.
   *
   * Flow:
   * 1. Resolve the user's DID (did:ethr) and persist it
   * 2. Encrypt the KYC document payload and upload to IPFS
   * 3. Store the IPFS CID on the KycRequest record
   * 4. Create a Veriff session (or mock) for identity verification
   */
  public async submitKyc(walletAddress: string, jurisdiction: string, documentId: string) {
    // Basic geofencing mock check
    if (jurisdiction === "RestrictedRegion") {
      throw new Error("Jurisdiction is restricted by geofencing rules.");
    }

    // --- DID Resolution ---
    const did = this.didService.resolveDid(walletAddress);

    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { walletAddress, did },
      });
    } else if (!user.did) {
      // Backfill DID for existing users
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { did },
      });
    }

    if (user.isWhitelisted) {
      throw new Error("User is already whitelisted.");
    }

    // --- IPFS: Encrypt and upload KYC document payload ---
    const documentPayload = {
      walletAddress,
      jurisdiction,
      documentId,
      submittedAt: new Date().toISOString(),
      did,
    };
    const ipfsResult = await this.ipfsService.encryptAndUpload(documentPayload);

    // --- Veriff Session ---
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
        ipfsCid: ipfsResult.cid,
      },
    });

    return { request, veriffSessionUrl, did, ipfsCid: ipfsResult.cid };
  }

  /**
   * Process webhook from Veriff.
   *
   * On approval:
   * 1. Whitelist the address on-chain via TxAllowList precompile
   * 2. Issue a W3C Verifiable Credential (VC) for the user
   * 3. Store the VC JWT on the KycRequest record
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
      // Evaluate JRDL policy
      const userAttributes = {
        kycStatus: "APPROVED",
        jurisdiction: request.jurisdiction,
        amlRiskScore: 0, // Mock: low risk
        isSanctioned: false // Mock: not sanctioned
      };

      try {
        this.jrdlService.evaluate(userAttributes);
      } catch (error: any) {
        await this.prisma.kycRequest.update({
          where: { id: request.id },
          data: { status: "REJECTED_BY_JRDL" },
        });
        console.warn(`JRDL rejected user ${request.userId}: ${error.message}`);
        return;
      }

      // 1. Whitelist on-chain
      const txHash = await this.blockchainService.addToWhitelist(request.user.walletAddress);

      // 2. Issue Verifiable Credential
      const userDid = request.user.did || this.didService.resolveDid(request.user.walletAddress);
      const vcJwt = await this.vcService.issueCredential(
        userDid,
        request.jurisdiction,
        request.id,
        txHash
      );

      // 3. Update DB
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { isWhitelisted: true },
      });

      await this.prisma.kycRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED", txHash, vcJwt },
      });
    } else if (status === 'declined' || status === 'abandoned') {
      await this.prisma.kycRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" },
      });
    }
  }

  /**
   * Get full compliance status for a wallet address.
   * Returns DID, on-chain whitelist status, latest VC, and IPFS CID.
   */
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

    const latestRequest = user.kycRequests.length > 0 ? user.kycRequests[0] : null;

    return {
      isWhitelisted: isOnChain || user.isWhitelisted,
      did: user.did || this.didService.resolveDid(walletAddress),
      latestStatus: latestRequest?.status || null,
      txHash: latestRequest?.txHash || null,
      ipfsCid: latestRequest?.ipfsCid || null,
      vcJwt: latestRequest?.vcJwt || null,
    };
  }

  /**
   * Retrieve the DID Document for a wallet address.
   */
  public getDidDocument(walletAddress: string) {
    return this.didService.createDidDocument(walletAddress);
  }

  /**
   * Get the latest Verifiable Credential for a wallet address.
   */
  public async getLatestVc(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
      include: {
        kycRequests: {
          where: { vcJwt: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.kycRequests.length === 0) {
      return null;
    }

    return {
      vcJwt: user.kycRequests[0].vcJwt,
      issuedAt: user.kycRequests[0].updatedAt,
    };
  }

  /**
   * Verify a Verifiable Credential JWT.
   */
  public async verifyVc(vcJwt: string) {
    return this.vcService.verifyCredential(vcJwt);
  }
}
