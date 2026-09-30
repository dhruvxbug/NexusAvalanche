#!/usr/bin/env bash
#
# Deploy the Jurisdiction-Aware Chain (NexusAvalanche) as a local L1.
#
# Why this script generates genesis.json instead of shipping a static one:
#
#   avalanche-cli pre-installs the PoA ValidatorManager, its Transparent Proxy
#   and the Validator Messages Library as bytecode in the genesis `alloc`.
#   A hand-written genesis without those allocations boots the chain but fails
#   PoA init with "no contract code at given address", and the chain never
#   produces a block. So we let the CLI generate a base genesis, then merge our
#   allowlist configuration into it via build-genesis.mjs.
#
# Two further gotchas this script handles:
#   * The ValidatorManager owner must be a TxAllowList Admin in genesis,
#     otherwise the CLI cannot initialize PoA and bootstrap fails.
#   * Subnet-EVM validates that feeConfig.gasLimit equals the header gasLimit;
#     a mismatch aborts with "gas limit in fee config (X) does not match gas
#     limit in header (Y)". build-genesis.mjs keeps them in sync.
#
# The chain boots with txAllowListConfig and contractDeployerAllowListConfig
# active at blockTimestamp 0, so transactions from non-allowlisted addresses
# are rejected at the RPC layer before they ever reach the EVM.

set -euo pipefail

cd "$(dirname "$0")"

CHAIN="jurisdictionchain"
# Only letters, no hyphens: the CLI rejects "jurisdiction-chain".
TOKEN="JUR"
CHAIN_ID=99999
# Must be a TxAllowList Admin in genesis.json. This is the avalanche-cli ewoq
# development key, which the CLI prefunds by default.
OWNER="0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$1" >&2; exit 1; }

# Answer the CLI's interactive prompts: token symbol, then ICM interop default.
# $1 = blockchain name, $2 = genesis file (optional).
#
# A config created WITH a --genesis skips the CLI's "use default values for the
# Blockchain configuration" prompt. A config created without one is prompted
# for it, so the base-genesis run passes --test-defaults to avoid hanging.
create_chain() {
  local name="$1"
  # macOS ships bash 3.2, where expanding an empty array under `set -u` is an
  # "unbound variable" error, so the flags are built as plain strings.
  #
  # --genesis carries its own chainId, and the CLI rejects it alongside
  # --evm-chain-id / --evm-defaults / --test-defaults. Supply those only when
  # generating a base config without a genesis file.
  local genesis_flag=""
  local chain_flag="--evm-chain-id ${CHAIN_ID}"
  if [[ -n "${2:-}" ]]; then
    genesis_flag="--genesis $2"
    chain_flag=""
  else
    # Without --genesis the CLI otherwise prompts for blockchain defaults.
    chain_flag="${chain_flag} --test-defaults"
  fi

  expect -c "
set timeout 300
log_user 1
spawn avalanche blockchain create ${name} ${genesis_flag} \\
  --evm --evm-token ${TOKEN} ${chain_flag} \\
  --proof-of-authority --sovereign \\
  --validator-manager-owner ${OWNER} \\
  --proxy-contract-owner ${OWNER} \\
  --latest --force
expect {
  -re \"Token Symbol:\"      { send \"${TOKEN}\r\"; exp_continue }
  -re \"connect your blockchain\" { send \"\r\"; exp_continue }
  eof {}
}
" 2>&1 | sed -e 's/\x1b\[[0-9;]*[a-zA-Z]//g'
}

log "Cleaning previous state for ${CHAIN}"
pkill -f "avalanchego" 2>/dev/null || true
sleep 2
rm -rf "${HOME}/.avalanche-cli/subnets/${CHAIN}"
rm -rf "${HOME}/.avalanche-cli/local/${CHAIN}-local-node-local-network"
rm -rf "${HOME}/.avalanche-cli/subnets/genesisbase" \
       "${HOME}/.avalanche-cli/local/genesisbase-local-node-local-network"

log "Generating a base genesis from the CLI (supplies the VM contract bytecode)"
# Created under a throwaway name so it never collides with the real config.
create_chain genesisbase >/dev/null 2>&1 || die "base genesis generation failed"
BASE_GENESIS="${HOME}/.avalanche-cli/subnets/genesisbase/genesis.json"
[[ -f "${BASE_GENESIS}" ]] || die "could not generate a base genesis at ${BASE_GENESIS}"

log "Merging the allowlist configuration into the base genesis"
node ./build-genesis.mjs "${BASE_GENESIS}" ./genesis.json
rm -rf "${HOME}/.avalanche-cli/subnets/genesisbase"

log "Creating ${CHAIN} from the merged genesis"
create_chain "${CHAIN}" "./genesis.json" | tail -3

log "Deploying locally (this takes a few minutes)"
expect -c "
set timeout 1800
log_user 1
spawn avalanche blockchain deploy ${CHAIN} --local
expect {
  -re \"overwrite the current local L1 deploy\" { send \"n\r\"; exp_continue }
  -re \"Proceed\" { send \"y\r\"; exp_continue }
  eof {}
}
" 2>&1 | sed -e 's/\x1b\[[0-9;]*[a-zA-Z]//g' | tail -40

log "Resolving the live RPC endpoint"
# The RPC path uses the generated blockchain ID, not the alias and not the
# chainId. Hardcoding /ext/bc/jurisdiction-chain/rpc never works.
RPC_URL="$(node ./resolve-rpc.mjs)" || die "the chain is not responding; check ~/.avalanche-cli/logs/avalanche.log"

echo
echo "  RPC URL : ${RPC_URL}"
echo "  Chain ID: ${CHAIN_ID}"
echo
echo "  export L1_RPC_URL=${RPC_URL}"
echo

log "Verifying the chain and the allowlist"
node ./verify-l1.mjs "${RPC_URL}" || die "verification failed"

cat <<EOF

L1 is live with the allowlist active from genesis.

Next steps:

  # Manage the allowlist
  node ../scripts/allowlist.mjs list
  node ../scripts/allowlist.mjs enable 0xYourAddress
  node ../scripts/allowlist.mjs disable 0xYourAddress

  # Run the eERC + allowlist end-to-end check
  cd ../eerc-backend-converter
  export L1_RPC_URL=${RPC_URL}
  npm run l1:verify

EOF
