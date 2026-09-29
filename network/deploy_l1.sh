#!/usr/bin/env bash
#
# Deploy the Jurisdiction-Aware Chain (NexusAvalanche) as a local L1.
#
# Verified working sequence:
#   1. create  - sovereign Subnet-EVM L1, PoA validator management, custom genesis
#   2. deploy  - convert to L1 and start the local network
#   3. report  - print the real RPC URL and verify the allowlist is live
#
# The chain boots with txAllowListConfig and contractDeployerAllowListConfig
# active at blockTimestamp 0, so every transaction from a non-allowlisted
# address is rejected at the RPC layer before it ever reaches the EVM.

set -euo pipefail

cd "$(dirname "$0")"

BLOCKCHAIN_NAME="jurisdictionchain"
TOKEN_SYMBOL="JUR"
GENESIS="./genesis.json"

# The Validator Manager owner must be an allowlist Admin in genesis.json,
# otherwise the CLI cannot initialize the PoA validator manager and the
# bootstrap fails with "no contract code at given address".
VM_OWNER="0xA1602f06C2E246b9a888c3be313c0516b3457a41"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

log "Cleaning up any previous deployment of ${BLOCKCHAIN_NAME}"
rm -rf "${HOME}/.avalanche-cli/subnets/${BLOCKCHAIN_NAME}"
rm -rf "${HOME}/.avalanche-cli/local/${BLOCKCHAIN_NAME}-local-node-local-network"
# A stale local network from a previous run keeps holding ports 9650-9654.
pkill -f "avalanchego.*${BLOCKCHAIN_NAME}" 2>/dev/null || true
sleep 2

log "Creating blockchain configuration"
# --evm-token is passed explicitly so the CLI does not prompt for the symbol.
# The ICM prompt is answered with a bare newline (accepts the default).
expect -c "
set timeout 300
log_user 1
spawn avalanche blockchain create ${BLOCKCHAIN_NAME} \\
  --genesis ${GENESIS} \\
  --evm \\
  --evm-token ${TOKEN_SYMBOL} \\
  --proof-of-authority \\
  --sovereign \\
  --validator-manager-owner ${VM_OWNER} \\
  --proxy-contract-owner ${VM_OWNER} \\
  --latest \\
  --force
expect {
  -re \"Token Symbol:\"              { send \"${TOKEN_SYMBOL}\r\"; exp_continue }
  -re \"connect your blockchain\"     { send \"\r\"; exp_continue }
  eof {}
}
"

log "Deploying locally and starting the network"
expect -c "
set timeout 900
log_user 1
spawn avalanche blockchain deploy ${BLOCKCHAIN_NAME} --local
expect {
  -re \"overwrite the current local L1 deploy\" { send \"n\r\"; exp_continue }
  -re \"Proceed\"                              { send \"y\r\"; exp_continue }
  eof {}
}
" || true

log "Resolving the live RPC endpoint"
# The RPC path uses the generated blockchain ID (base58), not the alias.
RPC_URL="$(node ./resolve-rpc.cjs 2>/dev/null || true)"

if [[ -z "${RPC_URL}" ]]; then
  echo "ERROR: could not resolve an RPC URL for ${BLOCKCHAIN_NAME}." >&2
  echo "       Check that the deploy succeeded and the node is still running:" >&2
  echo "         pgrep -fl avalanchego" >&2
  exit 1
fi

echo
echo "  RPC URL : ${RPC_URL}"
echo "  Chain ID: 99999"
echo
echo "Export it for the tooling:"
echo "  export L1_RPC_URL=${RPC_URL}"
echo

# Verify the chain actually produces blocks.
if node ./verify-l1.cjs "${RPC_URL}"; then
  log "L1 is live and the allowlist is enforcing"
else
  echo "WARNING: chain did not respond as expected. Inspect ~/.avalanche-cli/logs/avalanche.log" >&2
  exit 1
fi

cat <<'EOF'

Next steps:

  # 1. Inspect and manage the allowlist
  node ../scripts/allowlist.mjs list
  node ../scripts/allowlist.mjs enable 0xYourAddress
  node ../scripts/allowlist.mjs disable 0xYourAddress

  # 2. Run the end-to-end eERC + allowlist verification
  cd ../eerc-backend-converter
  npx hardhat run ../scripts/verify-e2e.ts --network jurisdictionChain

EOF
