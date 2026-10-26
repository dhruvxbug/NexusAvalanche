# NexusChain — The Jurisdiction-Aware L1

**Frontend** for the NexusAvalanche jurisdiction-aware chain: a React + Vite
application combining a product landing page with the live operator dashboard
used to demo the L1.

## What's inside

**Logged-out state** — product landing page:
- Fullscreen ambient hero with a frosted-glass dashboard preview
- Feature cards, 4-step "How It Works" timeline, animated FAQ
- Connect Wallet / Live L1 Demo entry points

**Connected state** — the real dashboards:
- **eERC Payments** — confidential transfers with a live Groth16/ZK-pipeline
  visualizer, decrypted (owner) vs ciphertext (validator) balance views,
  and a private mint utility
- **L1 Devnet Status** — live block height, RPC endpoint, and contract registry
- **TxAllowList Precompile** — check any address's on-chain permission role
- **DID & Verifiable Credentials** — DID documents, VC JWTs, encrypted IPFS
  document storage
- **Compliance KYC flow** — Veriff in-context verification with on-chain
  whitelist enforcement

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS 3 with semantic `hsl(var(--token))` design tokens
- Framer Motion animations, lucide-react icons
- ethers v6, `@avalabs/ac-eerc-sdk`, `@veriff/incontext-sdk`

## Run

```bash
npm install
npm run dev
```

The dashboard talks to the compliance backend at `http://localhost:3001`
(configurable via `VITE_API_URL` in a `.env` file). To see live on-chain data,
start the full stack first — see the root-level `LOCAL_DEV.md` and `DEMO.md`.
