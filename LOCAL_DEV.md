# Local Development: Allowlist + eERC on the Jurisdiction-Aware Chain

This is the verified, reproducible path to running the allowlist and real eERC
transactions against a local Avalanche L1.

Two independent things are proven here:

1. **Allowlist enforcement** — the `TxAllowList` precompile rejects transactions
   from addresses with no role, at the RPC layer, *before* the EVM runs.
2. **Encrypted ERC activity** — Groth16-proven registration, private mint, and
   private transfer, with balances stored as ElGamal ciphertext.

## Quick start

```bash
# 1. Deploy the L1 (generates genesis, boots the chain, verifies it)
./network/deploy_l1.sh

# 2. Inspect the allowlist
node scripts/allowlist.mjs list

# 3. Run the end-to-end eERC + allowlist verification
cd eerc-backend-converter
export L1_RPC_URL=$(node ../network/resolve-rpc.mjs)
npm run l1:init      # deploy verifiers + BabyJubJub library
npm run l1:core      # deploy Registrar + EncryptedERC
WALLET_NUMBER=1 npm run l1:register   # register the owner
WALLET_NUMBER=2 npm run l1:register   # register the auditor
npm run l1:auditor   # set the auditor public key
npm run l1:verify    # full e2e check: allowlist + mint + transfer
```

## Why `deploy_l1.sh` generates genesis.json

A hand-written genesis **cannot** boot this chain. Three separate things go
wrong, and each produced a different confusing error:

| Symptom | Cause |
|---|---|
| `cannot issue transaction from non-allow listed address` | The TxAllowList was active at block 0, but the address the CLI uses to initialize the PoA Validator Manager was not an Admin. |
| `no contract code at given address (tx failed to be submitted)` | `avalanche-cli` pre-installs the ValidatorManager, its Transparent Proxy and the Validator Messages Library as **bytecode in the genesis `alloc`**. A genesis without those entries boots but never has a validator, so it produces no blocks. |
| `gas limit in fee config (X) does not match gas limit in header (Y)` | Subnet-EVM validates the genesis and requires `feeConfig.gasLimit == header.gasLimit`. |

So `deploy_l1.sh` lets the CLI generate a base genesis, then merges the
allowlist configuration into it with `network/build-genesis.mjs`, which also
keeps the two gas limits in sync.

Do not hand-edit `network/genesis.json` to change the allowlist. Change
`network/build-genesis.mjs` and re-run the deploy.

## The allowlist

Two **independent** allowlists gate the chain. A role in one has no effect on
the other.

| Precompile | Address | Controls |
|---|---|---|
| TxAllowList | `0x0200000000000000000000000000000000000002` | Who may submit a transaction |
| ContractDeployerAllowList | `0x0200000000000000000000000000000000000000` | Who may deploy a contract |

Roles: `0` None, `1` Enabled, `2` Admin, `3` Manager.

- **Admin** can set any role, including other admins.
- **Manager** can only grant/revoke Enabled. Requires Durango (available here).
- **Enabled** can transact, and deploy if also on the deployer allowlist.

### Lockout warning

Removing every Admin permanently locks you out. Changing it back requires
scheduling a Subnet-EVM network upgrade. `allowlist.mjs demote` refuses to
remove the last privileged account, and also refuses to demote yourself unless
`--force-demote-self` is passed.

### Managing the allowlist

```bash
node scripts/allowlist.mjs whoami
node scripts/allowlist.mjs list
node scripts/allowlist.mjs enable  0xaddr...   # grant Enabled
node scripts/allowlist.mjs disable 0xaddr...   # revoke to None
node scripts/allowlist.mjs manager 0xaddr...   # grant Manager
node scripts/allowlist.mjs admin   0xaddr...   # grant Admin
node scripts/allowlist.mjs demote  0xaddr...   # revoke, with lockout guard
node scripts/allowlist.mjs sync    allowed.json  # reconcile to a desired list

ALLOWLIST=deployer node scripts/allowlist.mjs list   # deployer allowlist
```

`list` merges the genesis seed with the `RoleSet` event log, because the
precompile has no enumeration API and genesis-configured admins never appear
in the events.

Environment: `L1_RPC_URL`, `ADMIN_PRIVATE_KEY`.

## Block production

This local PoA L1 **builds a block in response to transactions** rather than on
a fixed timer. Waiting for the block number to advance on an idle chain will
hang forever — send a transaction instead. Don't write health checks that
assume a ticking block time.

## RPC URL resolution

The RPC path is `/ext/bc/<blockchainID>/rpc` where `<blockchainID>` is a
generated base58 ID. It is **not** the alias and **not** the chainId, which is
why a hardcoded `/ext/bc/jurisdiction-chain/rpc` never resolves.

`network/resolve-rpc.mjs` finds the live URL by reading the node's
`flags.json` (`http-port` plus the base64 `chain-config-content`) and
confirming the chainId. The blockchain ID changes on every redeploy, so never
hardcode it.

```bash
export L1_RPC_URL=$(node network/resolve-rpc.mjs)
```

## Environment

The eERC tooling reads keys from `.env` in `eerc-backend-converter/`:

| Variable | Address | Role in genesis |
|---|---|---|
| `PRIVATE_KEY` | `0xA1602f982E36ca8294e0f7B32b2054f28aa6317f` | Admin (contract owner) |
| `PRIVATE_KEY_2` | `0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2` | Enabled (auditor) |
| ewoq | `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC` | Admin (genesis funded) |

Wallet 1 is the contract owner; wallet 2 is the auditor. Keeping the auditor
on a separate key is the point of the auditor role.

**Wallet 2 can transact only because genesis seeds it as `Enabled`.** Remove it
from the allowlist and registration will fail with
`cannot issue transaction from non-allow listed address`.

All of these are well-known development keys. Never use them on a public
network.

## Verifying

```bash
# L1 + allowlist (12 checks, idempotent, restores its own state)
node network/verify-l1.mjs "$L1_RPC_URL"

# Full e2e: allowlist + eERC mint/transfer with balance decryption
cd eerc-backend-converter && npm run l1:verify
```

`verify-l1.mjs` proves a non-allowlisted address is rejected, then grants it a
role and shows the same transaction succeeding, then revokes the role again.

## Troubleshooting

**`cannot issue transaction from non-allow listed address`** — the sender has no
role. Grant it one with `allowlist.mjs enable`, or check `whoami`.

**`non-allow listed` but the address *is* in the list** — you are reading
`genesis.json`, which is the *seed*. Check the live role with
`allowlist.mjs whoami` or `readAllowList`.

**`nonce too low` / `nonce has already been used`** — the transaction count was
stale. The scripts track nonces locally for this reason; if you write your own,
seed from `"pending"` and keep your own counter.

**`execution reverted` when setting the auditor** — `setAuditorPublicKey` is
`onlyOwner onlyIfUserRegistered`. The auditor address must be registered first
(`WALLET_NUMBER=2 npm run l1:register`). The original script hardcoded an
auditor address whose key is not in the repo, which is why it always reverted.

**A balance reads 0 after a mint** — the check script may be pointed at a
different wallet than the one that received the mint. `balanceOfStandalone`
returns a positional tuple, not the `EncryptedBalance` struct, and `amountPCTs`
entries are structs with a `.pct` field.

**Balances fail to decrypt above ~100,000 units** — `decryptEGCTBalance` is a
discrete-log brute force and does not scale. Use the `balancePCT` path.

**`avalanche network` commands reject `--local`** — `network start|stop|status`
take no network flag. Only `blockchain` and `validator` subcommands do.
