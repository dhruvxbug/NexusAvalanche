/**
 * Regression tests for Verifiable Credential verification.
 *
 * The original implementation compared the recovered signature against the
 * issuer string inside the credential payload. Both values are supplied by the
 * token holder, so any self-signed credential satisfied the check. These tests
 * pin the corrected behaviour: only a configured trusted issuer may mint a
 * credential that validates.
 */

import { ethers } from "ethers";
import { VcService } from "../src/services/vc.service";

const CHAIN_ID = process.env.CHAIN_ID || "99999";

const b64url = (s: string) => Buffer.from(s, "utf-8").toString("base64url");

/** Hand-build and self-sign a credential, the way an attacker would. */
async function forgeCredential(
  signer: ethers.Wallet,
  overrides: Record<string, any> = {}
): Promise<string> {
  const now = new Date();
  const credential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "KYCComplianceCredential"],
    issuer: `did:ethr:${CHAIN_ID}:${signer.address.toLowerCase()}`,
    issuanceDate: now.toISOString(),
    expirationDate: new Date(now.getTime() + 86400000).toISOString(),
    credentialSubject: {
      id: "did:ethr:99999:0xattacker",
      kycStatus: "APPROVED",
      jurisdiction: "US",
      kycRequestId: "forged",
    },
    ...overrides,
  };
  const header = b64url(JSON.stringify({ alg: "ES256K-R", typ: "JWT" }));
  const payload = b64url(JSON.stringify(credential));
  const signingInput = `${header}.${payload}`;
  const signature = b64url(await signer.signMessage(signingInput));
  return `${signingInput}.${signature}`;
}

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log("\nVC verification regression tests\n");
  const service = new VcService();
  const issuer = (service as any).wallet.address as string;
  console.log(`  configured issuer: ${issuer}\n`);

  // The core vulnerability: a self-signed credential must NOT validate.
  const attacker = ethers.Wallet.createRandom();
  const forged = await forgeCredential(attacker);
  const r1 = await service.verifyCredential(forged);
  check(
    "self-signed credential from an unknown key is rejected",
    r1.isValid === false,
    `got isValid=${r1.isValid} error=${r1.error}`
  );
  check(
    "rejection reason names the untrusted signer",
    /not a trusted credential issuer/i.test(r1.error || ""),
    `error=${r1.error}`
  );

  // Tampering with a genuine credential must invalidate the signature.
  const genuine = await service.issueCredential(
    "did:ethr:99999:0xuser",
    "US",
    "req-1"
  );
  const r2 = await service.verifyCredential(genuine);
  check("genuine credential issued by the trusted key validates", r2.isValid === true, r2.error);

  const parts = genuine.split(".");
  const tamperedPayload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8")
  );
  tamperedPayload.credentialSubject.jurisdiction = "KP";
  const tampered = `${parts[0]}.${b64url(JSON.stringify(tamperedPayload))}.${parts[2]}`;
  const r3 = await service.verifyCredential(tampered);
  check("payload tampering invalidates the credential", r3.isValid === false, r3.error);

  // An expired credential must not validate.
  const expired = await forgeCredential(
    ethers.Wallet.createRandom(),
    { expirationDate: new Date(Date.now() - 1000).toISOString() }
  );
  const r4 = await service.verifyCredential(expired);
  check("expired credential is rejected", r4.isValid === false, r4.error);

  // A trusted issuer must not be able to claim a different issuer DID.
  const mismatched = await forgeCredential(
    ethers.Wallet.createRandom(),
    { issuer: `did:ethr:${CHAIN_ID}:0x000000000000000000000000000000000000dEaD` }
  );
  const r5 = await service.verifyCredential(mismatched);
  check("untrusted signer claiming another issuer is rejected", r5.isValid === false, r5.error);

  // Malformed input must not throw.
  for (const bad of ["", "not-a-jwt", "a.b", "a.b.c.d"]) {
    const r = await service.verifyCredential(bad);
    check(`malformed input is rejected without throwing (${JSON.stringify(bad)})`, r.isValid === false);
  }

  console.log(
    process.exitCode ? "\nSome tests FAILED\n" : "\nAll tests passed\n"
  );
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
