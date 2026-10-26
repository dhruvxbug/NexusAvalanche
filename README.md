# NexusChain — The Jurisdiction-Aware Chain

NexusChain is a specialized Layer-1 blockchain (built on Avalanche's
Subnet-EVM) designed from the ground up for compliance-bound use cases. It
natively enforces validator and user rules by region — KYC checks, geofencing,
and license requirements — directly at the protocol level, via the
`TxAllowList` precompile, before transactions are ever executed.

Paired with the **eERC** (Encrypted ERC) standard, the chain keeps sensitive
payloads confidential: balances are stored as ElGamal ciphertext on the
BabyJubJub curve and every transfer is backed by a Groth16 zero-knowledge
proof — private even to the validator set.

## Core features

- **Built-in compliance** — KYC results are written to the `TxAllowList`
  precompile; non-allowlisted transactions are rejected at the RPC layer with
  zero gas consumed.
- **eERC privacy** — Groth16-proven registration, private mint/transfer/burn,
  ElGamal ciphertext balances, auditor decryption support.
- **DID & Verifiable Credentials** — `did:ethr` identity documents, W3C
  Verifiable Credential JWTs (ES256K-R), trusted-issuer allowlists.
- **Encrypted off-chain storage** — KYC documents are AES-256-GCM encrypted
  and pinned to IPFS (local fallback included), with crypto-shredding for GDPR.
- **Cross-chain identity** — Chainlink CCIP `CrossChainIdentity` contract for
  propagating credential status across chains.
- **EVM compatible** — standard tooling (MetaMask, Hardhat, ethers) works as-is.

## Repository layout

| Path | What it is |
|---|---|
| `frontend/` | React + Vite landing page and live operator dashboard (eERC payments, L1 status, allowlist checker, DID/VC identity) |
| `kyc-backend/` | Express + Prisma compliance backend — KYC (Veriff), DID, VC issuance/verification, IPFS storage, JRDL policy engine, eERC API bridge |
| `eerc-backend-converter/` | Working Hardhat project for the eERC token on the jurisdiction L1 (Groth16 circuits, deploy scripts, API runner) |
| `network/` | L1 deployment — `deploy_l1.sh`, genesis builder, RPC resolver, allowlist benchmarks |
| `contracts/eerc/` | Audited upstream copy of Ava Labs' EncryptedERC (reference) |
| `contracts/ccip/` | Chainlink CCIP cross-chain identity contracts + mocks |
| `scripts/` | Allowlist management CLI (`allowlist.mjs`) and research chart generators |
| `reference/` | Protocol documentation: L1 customization, access restrictions, eERC overview |

## Quick start (demo)

```bash
# 1. Deploy & boot the L1 (~5–10 min, requires avalanche-cli)
./network/deploy_l1.sh

# 2. Resolve the chain's RPC URL
export L1_RPC_URL=$(node network/resolve-rpc.mjs)

# 3. Deploy eERC contracts & register users
cd eerc-backend-converter
npm run l1:init && npm run l1:core
WALLET_NUMBER=1 npm run l1:register
WALLET_NUMBER=2 npm run l1:register
npm run l1:auditor
cd ..

# 4. Start the compliance backend (port 3001)
cd kyc-backend && npm install && npm run build && npm start &

# 5. Start the frontend
cd frontend && npm install && npm run dev
```

See `DEMO.md` for the step-by-step presentation script, `LOCAL_DEV.md` for the
full verified development path, and `L1_CLI_GUIDE.md` for L1 tooling.

## License

© NexusChain. All rights reserved.
