#!/bin/bash

# Script to deploy the Jurisdiction-Aware Chain locally using modern Avalanche CLI

echo "Creating the Jurisdiction-Aware Chain..."

# 1. Create the blockchain configuration
avalanche blockchain create jurisdictionchain \
  --genesis ./genesis.json \
  --force

# 2. Deploy it locally for testing
echo "Deploying the blockchain locally..."
avalanche blockchain deploy jurisdictionchain \
  --local

echo "L1 deployment completed!"
