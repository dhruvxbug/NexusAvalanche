#!/usr/bin/env bash
# ============================================================================
# kyc-approve.sh — one-command KYC approval for the local demo
#
# Simulates the Veriff approval webhook end-to-end against the local
# compliance backend (no Veriff keys required):
#   1. Submits a KYC request for the given address
#   2. Looks up the user's session ID in the local SQLite DB
#   3. Fires the approval webhook (→ JRDL check → on-chain TxAllowList
#      whitelist → W3C Verifiable Credential issued)
#
# Usage:
#   ./scripts/kyc-approve.sh [0xAddress] [Jurisdiction]
#
# Defaults to the demo persona User 1 address and "US".
# Requires: the kyc-backend running on port 3001, sqlite3 (bundled with macOS).
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="$REPO_ROOT/kyc-backend/prisma/dev.db"
API="${KYC_API_URL:-http://localhost:3001}"

ADDRESS="${1:-0xA1602f982E36ca8294e0f7B32b2054f28aa6317f}"
JURISDICTION="${2:-US}"

if [ ! -f "$DB" ]; then
  echo "✗ SQLite DB not found at $DB — is kyc-backend set up?" >&2
  exit 1
fi

echo "→ Submitting KYC request for $ADDRESS (jurisdiction: $JURISDICTION)..."
SUBMIT=$(curl -s -X POST "$API/api/kyc/verify" \
  -H "Content-Type: application/json" \
  -d "{\"userAddress\":\"$ADDRESS\",\"jurisdiction\":\"$JURISDICTION\",\"documentId\":\"DEMO-PASSPORT-001\"}")

if echo "$SUBMIT" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "  ✓ KYC request created (CID: $(echo "$SUBMIT" | jq -r '.ipfsCid'))"
else
  echo "  ✗ Submit failed: $(echo "$SUBMIT" | jq -r '.error // "unknown error"')" >&2
  echo "    Is the backend running on port 3001?" >&2
  exit 1
fi

# Without Veriff keys the session ID is "<user uuid>_mock"
USER_ID=$(sqlite3 "$DB" "SELECT id FROM User WHERE walletAddress = '$ADDRESS' LIMIT 1;")
if [ -z "$USER_ID" ]; then
  echo "✗ No user found in DB for $ADDRESS" >&2
  exit 1
fi
SESSION_ID="${USER_ID}_mock"
echo "→ Resolved mock Veriff session: $SESSION_ID"

echo "→ Firing approval webhook..."
WEBHOOK=$(curl -s -X POST "$API/api/kyc/webhook" \
  -H "Content-Type: application/json" \
  -d "{\"verification\":{\"id\":\"$SESSION_ID\",\"status\":\"approved\"}}")
echo "  $(echo "$WEBHOOK" | jq -c '.')"

echo "→ Final on-chain status:"
curl -s "$API/api/kyc/status/$ADDRESS" | jq .
