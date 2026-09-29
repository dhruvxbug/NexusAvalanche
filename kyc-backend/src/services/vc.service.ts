/**
 * Verifiable Credentials Service — W3C SSI
 *
 * Issues and verifies W3C Verifiable Credentials as JWTs.
 * The admin key (same key used for on-chain TxAllowList operations) acts as
 * the credential issuer. This keeps the trust anchor consistent: the entity
 * that whitelists you on-chain is the same entity that signs your VC.
 *
 * VC structure follows: https://www.w3.org/TR/vc-data-model/
 */

import { ethers } from "ethers";
import crypto from "crypto";

const ADMIN_PRIVATE_KEY =
  process.env.ADMIN_PRIVATE_KEY ||
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
const CHAIN_ID = process.env.CHAIN_ID || "99999";

// VC validity period: 1 year
const VC_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

export interface VerifiableCredential {
  "@context": string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string; // The holder's DID
    kycStatus: string;
    jurisdiction: string;
    kycRequestId: string;
    whitelistTxHash?: string;
  };
}

interface DecodedVc {
  credential: VerifiableCredential;
  issuerAddress: string;
  isValid: boolean;
  error?: string;
}

export class VcService {
  private wallet: ethers.Wallet;
  private issuerDid: string;

  constructor() {
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
    this.issuerDid = `did:ethr:${CHAIN_ID}:${this.wallet.address.toLowerCase()}`;
  }

  /**
   * Issues a Verifiable Credential for a KYC-approved user.
   *
   * The VC is encoded as a compact JWT:
   *   base64url(header).base64url(payload).base64url(signature)
   *
   * The signature is produced by ethers Wallet.signMessage over the
   * header.payload string, making it verifiable by recovering the signer.
   */
  public async issueCredential(
    userDid: string,
    jurisdiction: string,
    kycRequestId: string,
    whitelistTxHash?: string
  ): Promise<string> {
    const now = new Date();
    const expiration = new Date(now.getTime() + VC_VALIDITY_MS);

    const credential: VerifiableCredential = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/secp256k1recovery-2020/v2",
      ],
      type: ["VerifiableCredential", "KYCComplianceCredential"],
      issuer: this.issuerDid,
      issuanceDate: now.toISOString(),
      expirationDate: expiration.toISOString(),
      credentialSubject: {
        id: userDid,
        kycStatus: "APPROVED",
        jurisdiction,
        kycRequestId,
        whitelistTxHash,
      },
    };

    // Build JWT
    const header = {
      alg: "ES256K-R", // secp256k1 with recovery
      typ: "JWT",
    };

    const headerB64 = this.base64url(JSON.stringify(header));
    const payloadB64 = this.base64url(JSON.stringify(credential));
    const signingInput = `${headerB64}.${payloadB64}`;

    // Sign with admin wallet
    const signature = await this.wallet.signMessage(signingInput);
    const signatureB64 = this.base64url(signature);

    return `${signingInput}.${signatureB64}`;
  }

  /**
   * Verifies a VC JWT by:
   * 1. Recovering the signer from the signature
   * 2. Checking the signer matches the issuer DID
   * 3. Checking the credential has not expired
   */
  public async verifyCredential(vcJwt: string): Promise<DecodedVc> {
    try {
      const parts = vcJwt.split(".");
      if (parts.length !== 3) {
        return { credential: {} as any, issuerAddress: "", isValid: false, error: "Malformed JWT" };
      }

      const [headerB64, payloadB64, signatureB64] = parts;
      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = this.fromBase64url(signatureB64);

      // Recover signer address
      const recoveredAddress = ethers.verifyMessage(signingInput, signature);

      // Decode payload
      const credential: VerifiableCredential = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString("utf-8")
      );

      // Verify issuer matches recovered signer
      const expectedIssuerAddress = credential.issuer.split(":").pop() || "";
      const issuerMatch =
        recoveredAddress.toLowerCase() === expectedIssuerAddress.toLowerCase();

      if (!issuerMatch) {
        return {
          credential,
          issuerAddress: recoveredAddress,
          isValid: false,
          error: "Issuer signature mismatch",
        };
      }

      // Check expiration
      const expirationDate = new Date(credential.expirationDate);
      if (expirationDate < new Date()) {
        return {
          credential,
          issuerAddress: recoveredAddress,
          isValid: false,
          error: "Credential expired",
        };
      }

      return {
        credential,
        issuerAddress: recoveredAddress,
        isValid: true,
      };
    } catch (err: any) {
      return {
        credential: {} as any,
        issuerAddress: "",
        isValid: false,
        error: `Verification failed: ${err.message}`,
      };
    }
  }

  private base64url(input: string): string {
    return Buffer.from(input, "utf-8").toString("base64url");
  }

  private fromBase64url(input: string): string {
    return Buffer.from(input, "base64url").toString("utf-8");
  }
}
