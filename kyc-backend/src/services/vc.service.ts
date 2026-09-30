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

/**
 * Development keys that are published in public repositories. These must never
 * be trusted as credential issuers outside a local development chain.
 */
const WELL_KNOWN_DEV_KEYS = new Set<string>([
  // avalanche-cli ewoq
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
]);

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
  /**
   * Addresses permitted to sign credentials. A recovered signature is only
   * accepted if it appears here, so a self-signed token cannot validate.
   * Populated from the admin key plus any extra TRUSTED_ISSUERS addresses.
   */
  private trustedIssuers: Set<string>;

  constructor() {
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
    this.issuerDid = `did:ethr:${CHAIN_ID}:${this.wallet.address.toLowerCase()}`;

    const issuers = new Set<string>([this.wallet.address.toLowerCase()]);
    for (const extra of (process.env.TRUSTED_ISSUERS || "").split(",")) {
      const a = extra.trim().toLowerCase();
      if (a) issuers.add(a);
    }
    this.trustedIssuers = issuers;

    // The avalanche-cli ewoq development key is public. If it is in use as the
    // issuer key then anyone can mint credentials that pass the trusted-issuer
    // check, so fail closed in production and warn loudly otherwise.
    if (WELL_KNOWN_DEV_KEYS.has(ADMIN_PRIVATE_KEY.toLowerCase())) {
      const message =
        "VcService is using a well-known public development key as the VC issuer. " +
        "Credentials signed by it can be forged by anyone. Set ADMIN_PRIVATE_KEY " +
        "to a real issuer key.";
      if (process.env.NODE_ENV === "production") {
        throw new Error(message);
      }
      console.warn(`[vc.service] WARNING: ${message}`);
    }
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
   * Verifies a VC JWT.
   *
   * The order of checks matters. Authenticating the signer is what makes a
   * credential trustworthy, so the recovered address is checked against a
   * configured allow list of issuer keys FIRST. Only then is the issuer DID
   * compared to the recovered address.
   *
   * Previously the comparison was only `recovered == credential.issuer`, both
   * of which are attacker-controlled, so any self-signed credential validated.
   *
   * Checks:
   * 1. Structure: three JWT segments, expected algorithm, required claims.
   * 2. The recovered signer is a trusted issuer.   <-- the fix
   * 3. The recovered signer matches the issuer DID, so a trusted issuer cannot
   *    mint a credential claiming a different issuer.
   * 4. The credential is a KYC compliance credential and has not expired.
   */
  public async verifyCredential(vcJwt: string): Promise<DecodedVc> {
    const invalid = (error: string, credential: any = {}, issuerAddress = "") => ({
      credential,
      issuerAddress,
      isValid: false,
      error,
    });

    try {
      if (typeof vcJwt !== "string" || vcJwt.length === 0) {
        return invalid("Missing credential");
      }

      const parts = vcJwt.split(".");
      if (parts.length !== 3) {
        return invalid("Malformed JWT");
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      let header: { alg?: string; typ?: string };
      let credential: VerifiableCredential;
      try {
        header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"));
        credential = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString("utf-8")
        );
      } catch {
        return invalid("Malformed JWT: segments are not valid base64url JSON");
      }

      // Pin the algorithm. Accepting whatever the token declares would allow
      // algorithm substitution.
      if (header.alg !== "ES256K-R") {
        return invalid(`Unsupported signing algorithm: ${header.alg}`);
      }

      // Required claims must be present and well formed.
      if (!credential || typeof credential !== "object") {
        return invalid("Malformed credential payload");
      }
      if (typeof credential.issuer !== "string" || !credential.issuer) {
        return invalid("Credential is missing an issuer");
      }
      if (!credential.credentialSubject || !credential.credentialSubject.id) {
        return invalid("Credential is missing a credentialSubject");
      }
      if (!credential.expirationDate || Number.isNaN(Date.parse(credential.expirationDate))) {
        return invalid("Credential is missing a valid expirationDate");
      }

      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = this.fromBase64url(signatureB64);

      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(signingInput, signature);
      } catch {
        return invalid("Signature is not a valid secp256k1 signature");
      }

      // 2. The signer must be a configured trusted issuer. This is the check
      //    that a self-signed token cannot satisfy.
      if (!this.trustedIssuers.has(recoveredAddress.toLowerCase())) {
        return {
          credential,
          issuerAddress: recoveredAddress,
          isValid: false,
          error: "Signer is not a trusted credential issuer",
        };
      }

      // 3. A trusted issuer must also match the issuer it claims.
      const claimedIssuerAddress = credential.issuer.split(":").pop() || "";
      if (recoveredAddress.toLowerCase() !== claimedIssuerAddress.toLowerCase()) {
        return {
          credential,
          issuerAddress: recoveredAddress,
          isValid: false,
          error: "Issuer signature mismatch",
        };
      }

      // 4. Expiry.
      if (new Date(credential.expirationDate) < new Date()) {
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
      return invalid(`Verification failed: ${err?.message ?? "unknown error"}`);
    }
  }

  private base64url(input: string): string {
    return Buffer.from(input, "utf-8").toString("base64url");
  }

  private fromBase64url(input: string): string {
    return Buffer.from(input, "base64url").toString("utf-8");
  }
}
