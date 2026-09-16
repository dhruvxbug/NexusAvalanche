#!/bin/bash

# Script to deploy the Jurisdiction-Aware Chain locally using modern Avalanche CLI

echo "Creating the Jurisdiction-Aware Chain..."

# 1. Create the blockchain configuration non-interactively using expect
expect -c '
spawn avalanche blockchain create jurisdictionchain \
  --genesis ./genesis.json \
  --evm \
  --proof-of-authority \
  --sovereign \
  --validator-manager-owner 0xA1602f06C2E246b9a888c3be313c0516b3457a41 \
  --proxy-contract-owner 0xA1602f06C2E246b9a888c3be313c0516b3457a41 \
  --latest \
  --force
expect -re "Token Symbol:"
send "JUR\r"
expect -re "Do you want to connect your blockchain with other blockchains or the C-Chain"
send "\r"
expect eof
'

# 2. Deploy it locally for testing
echo "Deploying the blockchain locally..."
expect -c '
spawn avalanche blockchain deploy jurisdictionchain --local
expect {
  -re "Do you want to overwrite the current local L1 deploy" {
    send "\033\[B\r"
    exp_continue
  }
  eof {
  }
}
'

echo "L1 deployment completed!"
