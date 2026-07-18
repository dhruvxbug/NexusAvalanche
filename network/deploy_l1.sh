#!/bin/bash

# Script to deploy the Jurisdiction-Aware Chain locally using Avalanche CLI

echo "Deploying the Jurisdiction-Aware Chain..."

# 1. Create the Subnet configuration
avalanche subnet create jurisdiction-chain \
  --custom \
  --genesis ./genesis.json

# 2. Deploy it locally for testing
echo "Deploying the Subnet locally..."
avalanche subnet deploy jurisdiction-chain \
  --local

echo "L1 deployment completed!"
echo "Make sure you save the RPC URL and Chain ID provided above."
