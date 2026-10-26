# NexusChain Demo Runbook

Step-by-step script for presenting the jurisdiction-aware L1. Follow the
pre-flight checklist **before every rehearsal and the live demo**.

## Pre-flight checklist (10 min before the demo)

```bash
cd /path/to/avalancheProject

# 1. Is the L1 up? (should return a block number)
export L1_RPC_URL=$(node network/resolve-rpc.mjs)
echo "$L1_RPC_URL"
curl -s -X POST -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  "$L1_RPC_URL"

# 2. If NOT up (rebooted / fresh machine), redeploy (~10 min, see LOCAL_DEV.md):
./network/deploy_l1.sh
cd eerc-backend-converter
npm run l1:init && npm run l1:core
WALLET_NUMBER=1 npm run l1:register && WALLET_NUMBER=2 npm run l1:register
npm run l1:auditor
npm run l1:verify        # must pass end-to-end
cd ..

# 3. Point the compliance backend at the live chain, then start it
#    (check kyc-backend/.env RPC_URL matches the URL printed in step 1)
cd kyc-backend
npm run build && npm start          # port 3001
cd ..

# 4. Sanity-check the backend (should return JSON with blockNumber)
curl -s http://localhost:3001/api/eerc/status | jq '.network.blockNumber'

# 5. Start the frontend (separate terminal)
cd frontend && npm run dev          # http://localhost:5173
```

## The demo script (~7 min)

1. **Landing page** — hero, scroll through Features / How It Works / FAQ.
   Brand consistency: everything reads "NexusChain".
2. **"Launch Live L1 Demo"** — enters the operator dashboard (demo persona).
3. **eERC Payments tab (default)** — show the two-card contrast:
   decrypted balance (owner view) vs on-chain ciphertext (validator view).
4. **Send a private transfer** — 5 PRIV from User 1 to User 2. The animated
   pipeline (allowlist check → curve encryption → Groth16 proof → L1
   submission → verified) runs while the backend proves and submits. Both
   balance cards refresh after confirmation.
5. **L1 Devnet Status tab** — live block height, RPC URL, contract registry.
   Note the block number advancing from the transfer.
6. **TxAllowList tab** — check any address; show that a non-allowlisted
   address has no role (enforcement at RPC layer, 0 gas).
7. **DID & Verifiable Credentials tab** — DID document, VC JWT, encrypted
   IPFS storage with CID.
8. **KYC flow (optional, requires prep)** — connect a *fresh* wallet to see
   the Veriff compliance flow, then approve it with `./scripts/kyc-approve.sh`
   and show the whitelist + VC issued.

## KYC approval helper (mock Veriff)

```bash
./scripts/kyc-approve.sh 0xFreshAddress US
```

Runs the entire approval pipeline: KYC submit → mock Veriff webhook → JRDL
policy check → on-chain TxAllowList whitelist → W3C VC issuance. Verified
working; the final `jq` output shows `isWhitelisted: true` and a `vcJwt`.

> ⚠️ An address that was already whitelisted is rejected by design
> ("User is already whitelisted") — use a fresh address for this step.

## Failure modes & recovery

| Symptom | Cause | Fix |
|---|---|---|
| Frontend shows `Block #--` / "Loading..." | backend down or L1 down | re-run pre-flight 3–4 |
| "Compliance service unreachable" | backend not on port 3001 | `cd kyc-backend && npm start` |
| Backend log shows `404 page not found` on `9650` or an alias RPC | `.env` RPC_URL stale after redeploy | set `RPC_URL` from `node network/resolve-rpc.mjs`, restart |
| "User is already whitelisted" on KYC submit | address cleared earlier | use a fresh address |
| Chain wiped / block 1 | `deploy_l1.sh` re-run | re-run steps in pre-flight 2 |

## Demo data reference

- **Demo User 1 (Admin/Owner)** `0xA1602f982E36ca8294e0f7B32b2054f28aa6317f`
- **Demo User 2 (Auditor)** `0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2`
- Token: PRIV (2 decimals), chain ID 99999 (0x1869f)
