#!/bin/bash
echo "Deploying eERC Standalone token to Jurisdiction-Aware Chain..."

cd contracts/eerc
# Install dependencies if they haven't been installed yet
npm install

# Run the deployment script on our custom L1 network
npx hardhat run scripts/deploy-standalone.ts --network jurisdictionChain

echo "Deployment complete. Make sure to save the contract address!"
