/**
 * IPFS Service — Encrypted Off-Chain Document Storage
 *
 * Encrypts KYC document payloads with AES-256-GCM and stores them on IPFS.
 *
 * Two backends:
 * 1. **Pinata** (production): When PINATA_JWT is set in .env, documents are
 *    pinned to the real IPFS network via Pinata's API.
 * 2. **Local mock** (development): Documents are written to ./ipfs-store/ on
 *    disk with a SHA-256-based mock CID. This allows full end-to-end testing
 *    without running an IPFS node or having a Pinata account.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import axios from "axios";

const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_API_URL = "https://api.pinata.cloud";
const LOCAL_STORE_DIR = path.resolve(process.cwd(), "ipfs-store");

// Derive a deterministic encryption key from the admin private key.
// In production you'd use a dedicated KMS; here we derive from the admin key
// so the system is self-contained.
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY || "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(ADMIN_KEY)
  .digest(); // 32 bytes for AES-256

export interface IpfsUploadResult {
  cid: string;
  backend: "pinata" | "local";
  size: number;
}

export class IpfsService {
  /**
   * Encrypts a document payload and uploads it to IPFS.
   *
   * @param data - The plaintext data object to encrypt and store
   * @returns The IPFS CID and metadata
   */
  public async encryptAndUpload(data: Record<string, any>): Promise<IpfsUploadResult> {
    const plaintext = JSON.stringify(data);
    const encrypted = this.encrypt(plaintext);

    if (PINATA_JWT) {
      return this.uploadToPinata(encrypted);
    } else {
      return this.uploadToLocal(encrypted);
    }
  }

  /**
   * Downloads an encrypted document from IPFS and decrypts it.
   *
   * @param cid - The IPFS content identifier
   * @returns The decrypted document payload
   */
  public async downloadAndDecrypt(cid: string): Promise<Record<string, any>> {
    let encryptedHex: string;

    if (PINATA_JWT) {
      encryptedHex = await this.downloadFromPinata(cid);
    } else {
      encryptedHex = this.downloadFromLocal(cid);
    }

    const decrypted = this.decrypt(encryptedHex);
    return JSON.parse(decrypted);
  }

  // ─── Encryption ──────────────────────────────────────────────────────

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(plaintext, "utf-8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Pack as: iv:authTag:ciphertext
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  private decrypt(packed: string): string {
    const [ivHex, authTagHex, ciphertext] = packed.split(":");
    if (!ivHex || !authTagHex || !ciphertext) {
      throw new Error("Invalid encrypted payload format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf-8");
    decrypted += decipher.final("utf-8");

    return decrypted;
  }

  // ─── Pinata (Production) ─────────────────────────────────────────────

  private async uploadToPinata(encrypted: string): Promise<IpfsUploadResult> {
    const blob = Buffer.from(encrypted, "utf-8");

    const formData = new FormData();
    const file = new Blob([blob], { type: "application/octet-stream" });
    formData.append("file", file, "encrypted-kyc-doc.bin");

    const metadata = JSON.stringify({ name: `kyc-doc-${Date.now()}` });
    formData.append("pinataMetadata", metadata);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        maxBodyLength: Infinity,
      }
    );

    return {
      cid: response.data.IpfsHash,
      backend: "pinata",
      size: blob.length,
    };
  }

  private async downloadFromPinata(cid: string): Promise<string> {
    const response = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      { responseType: "text" }
    );
    return response.data;
  }

  // ─── Local Mock (Development) ────────────────────────────────────────

  private uploadToLocal(encrypted: string): IpfsUploadResult {
    // Ensure store directory exists
    if (!fs.existsSync(LOCAL_STORE_DIR)) {
      fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
    }

    // Generate a mock CID using SHA-256 hash (mimics IPFS content-addressing)
    const hash = crypto.createHash("sha256").update(encrypted).digest("hex");
    const mockCid = `Qm${hash.substring(0, 44)}`; // Approximate CIDv0 format

    fs.writeFileSync(path.join(LOCAL_STORE_DIR, mockCid), encrypted, "utf-8");

    return {
      cid: mockCid,
      backend: "local",
      size: Buffer.byteLength(encrypted, "utf-8"),
    };
  }

  private downloadFromLocal(cid: string): string {
    const filePath = path.join(LOCAL_STORE_DIR, cid);
    if (!fs.existsSync(filePath)) {
      throw new Error(`IPFS document not found locally: ${cid}`);
    }
    return fs.readFileSync(filePath, "utf-8");
  }
}
