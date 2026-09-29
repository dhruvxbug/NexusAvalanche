/**
 * DID Service — Decentralized Identifiers (did:ethr)
 *
 * Implements the did:ethr method which deterministically derives a DID from
 * an Ethereum wallet address and chain ID. No external registry is required;
 * the DID Document is constructed on-the-fly.
 *
 * Reference: https://github.com/decentralized-identity/ethr-did-resolver
 */

const CHAIN_ID = process.env.CHAIN_ID || "99999"; // NexusChain L1

export interface DidDocument {
  "@context": string[];
  id: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    blockchainAccountId: string;
  }[];
  authentication: string[];
  assertionMethod: string[];
}

export class DidService {
  /**
   * Derives a did:ethr identifier from a wallet address.
   * Format: did:ethr:<chainId>:<address>
   */
  public resolveDid(walletAddress: string): string {
    const normalized = walletAddress.toLowerCase();
    return `did:ethr:${CHAIN_ID}:${normalized}`;
  }

  /**
   * Constructs a W3C-compliant DID Document for a wallet address.
   *
   * The document includes:
   * - A verification method tied to the wallet's blockchain account
   * - Authentication and assertion method references
   */
  public createDidDocument(walletAddress: string): DidDocument {
    const did = this.resolveDid(walletAddress);
    const normalized = walletAddress.toLowerCase();

    return {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/secp256k1recovery-2020/v2",
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#controller`,
          type: "EcdsaSecp256k1RecoveryMethod2020",
          controller: did,
          blockchainAccountId: `eip155:${CHAIN_ID}:${normalized}`,
        },
      ],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
    };
  }
}
