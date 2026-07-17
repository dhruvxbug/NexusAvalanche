# Building a Privacy-Focused Avalanche L1 with CLI

This guide explains how to use `avalanche-cli` to create a permissioned Avalanche L1 (Subnet-EVM) with the TxAllowList precompile enabled for jurisdiction-aware access control, as required for the Jurisdiction-Aware Chain + eERC project.

## Overview

The Jurisdiction-Aware Chain uses:
- **Avalanche Subnet-EVM** as the base blockchain layer
- **TxAllowList precompile** to enforce jurisdiction-based access control at the transaction level
- **eERC (Encrypted ERC-20)** for confidential transactions
- **Custom smart contracts** for compliance registry (`ComplianceRegistry.sol`) and validator management (`ValidatorManager.sol`)

## Prerequisites

Before beginning, ensure you have installed:
- [avalanche-cli](https://github.com/ava-labs/avalanche-cli) (v1.9.6+)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contract development)
- Node.js (v22.x LTS)

## Step 1: Create the L1 with TxAllowList Precompile

To create a permissioned L1 with TxAllowList enabled at genesis (recommended for simplicity):

```bash
avalanche blockchain create jurisdiction-chain \
  --sovereign \
  --evm \
  --evm-chain-id=12345 \
  --evm-token=JUR \
  --vm-version=latest \
  --test-defaults \
  --enable-tx-allowlist
```

> **Note**: The `--enable-tx-allowlist` flag ensures the TxAllowList precompile is activated at genesis. If this flag isn't available in your version, you can enable it via a genesis upgrade later (but genesis-time activation is simpler).

### Alternative: Manual Configuration

If the CLI doesn't have a direct flag for TxAllowList, you can:

1. Create a basic L1 first:
   ```bash
   avalanche blockchain create jurisdiction-chain \
     --sovereign \
     --evm \
     --evm-chain-id=12345 \
     --evm-token=JUR \
     --vm-version=latest \
     --test-defaults
   ```

2. Then create a genesis upgrade file to enable TxAllowList:
   ```json
   {
     "txAllowListConfig": {
       "adminAddresses": ["0xYourAdminAddressHere"],
       "managerAddresses": [],
       "enabledAddresses": []
     }
   }
   ```

## Step 2: Initialize Validator Keys

During blockchain creation, you'll be prompted to:
1. Select **Proof of Authority** (PoA) as the validator management type (simplest for demo)
2. Choose an existing key or create a new one for the ValidatorManager controller
3. Set up your deployer address (this will be the Admin for TxAllowList)

### Creating Keys

```bash
# Create a deployer key (will be Admin for TxAllowList)
avalanche key create deployer

# Create a validator key (for PoA)
avalanche key create validator
```

## Step 3: Start the Local Network

After creating the blockchain:

```bash
avalanche network start
```

Check status:
```bash
avalanche network status
```

Your RPC endpoint will be available at: `http://127.0.0.1:9650/ext/bc/{blockchainID}/rpc`

## Step 4: Configure TxAllowList (Post-Deployment)

Once your chain is running, you need to configure the TxAllowList to enforce jurisdiction-based access.

### Using Foundry Scripts

The project includes scripts in `/scripts/` to manage the AllowList:

1. **Sync compliance status** (reads from your Solidity ComplianceRegistry):
   ```bash
   ts-node scripts/sync-allowlist.ts
   ```

2. **Deploy L1 contracts**:
   ```bash
   ./scripts/deploy-l1.sh
   ```

### Manual Configuration (Example)

If you prefer to configure directly via RPC:

```bash
# Give an address the ENABLED role (can transact)
curl -X POST http://127.0.0.1:9650/ext/bc/{blockchainID}/rpc \
  -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"evm_call",
    "params":[
      {
        "from":"0xYourAddress",
        "to":"0x000000000000000000000000000000000000000A",  // TxAllowList precompile address
        "data":"0x"+hexEncodeFunctionCall("enable(address)", ["0xTargetAddress"])
      },
      "latest"
    ]
  }'
```

## Step 5: Deploy Compliance Registry and Validator Contracts

Deploy your Solidity contracts to manage jurisdiction/KYC status:

```bash
cd contracts
forge install  # if needed
forge build

# Deploy to your local L1
forge create src/ComplianceRegistry.sol:ComplianceRegistry \
  --rpc-url http://127.0.0.1:9650/ext/bc/{blockchainID}/rpc \
  --private-key $PRIVATE_KEY  # your deployer key

forge create src/ValidatorManager.sol:ValidatorManager \
  --rpc-url http://127.0.0.1:9650/ext/bc/{blockchainID}/rpc \
  --private-key $PRIVATE_KEY
```

## Step 6: Integrate with eERC

Deploy the eERC contracts (from `/contracts/eerc/`) to your L1:

```bash
# Copy eERC contracts if needed
cp -r /reference/EncryptedERC/contracts ./contracts/eerc/

# Modify deployment scripts to point to your L1 RPC
# Update networks/hardhat.config.ts or deployment scripts

# Deploy eERC suite
npx hardhat run scripts/deploy-standalone.ts --network localhost
```

> **Important**: Since TxAllowList is active at the chain level, **no modifications to eERC contracts are needed**. The L1 will automatically block transactions from non-Enabled addresses before they reach the EVM.

## Step 7: Testing the Setup

### Test 1: Blocked Address Transaction
```bash
# Try to send a transaction from a non-Enabled address
# This should be rejected by the TxAllowList precompile before reaching the mempool
```

### Test 2: Authorized Address Transaction
```bash
# Fund and enable an address
# Send a transaction - should succeed
# Verify transaction appears on explorer with encrypted amount (if using eERC)
```

### Test 3: Auditor Decryption
```bash
# Use eERC SDK with auditor key to decrypt a transaction amount
```

## Production Deployment to Fuji Testnet

For testnet deployment:

```bash
avalanche blockchain create jurisdiction-chain-fuji \
  --fuji \
  --evm \
  --evm-chain-id=12345 \
  --evm-token=JUR \
  --vm-version=latest \
  --public  # deploys to Fuji testnet
```

You'll need testnet AVAX from the [Fuji Faucet](https://faucet.avax.network/).

## Key Files in this Project

- `/contracts/ComplianceRegistry.sol` - Manages jurisdiction/license/KYC status per address
- `/contracts/ValidatorManager.sol` - Manages validator metadata for PoA
- `/scripts/sync-allowlist.ts` - Reads ComplianceRegistry and updates TxAllowList
- `/reference/ac-eerc-sdk/` - The selected eERC SDK for frontend integration
- `/contracts/eerc/` - The eERC contracts (used unmodified)

## Important Notes

1. **TxAllowList at Genesis**: Enabling TxAllowList at genesis is stronger than upgrading later because it protects the chain from the very first block.

2. **PoA for Demo**: Proof of Authority is recommended for hackathon demos as it doesn't require token staking and provides instant finality.

3. **Address Management**: The deployer address used during creation automatically becomes the Admin for TxAllowList, allowing them to grant ENABLED roles to compliant addresses.

4. **Performance**: Remember that every transaction is checked against the TxAllowList precompile, which adds minimal gas overhead but provides strong access control guarantees.

5. **Compliance Flow**:
   - User address gets attested in `ComplianceRegistry` (jurisdiction, license, KYC)
   - `sync-allowlist.ts` script reads this and calls TxAllowList to enable the address
   - Only enabled addresses can submit transactions to the chain
   - eERC transactions from enabled addresses remain confidential
   - Auditor can decrypt transactions using their key

## Troubleshooting

- **"TxAllowList not found"**: Ensure you enabled it at genesis or via upgrade
- **Permission denied errors**: Verify the address has the ENABLED role in TxAllowList
- **RPC connection issues**: Check that `avalanche network status` shows your chain as healthy
- **Contract deployment failures**: Ensure you have enough AVAX for gas

## References

- [Avalanche L1 Documentation](https://docs.avax.build/)
- [TxAllowList Precompile Spec](https://github.com/ava-labs/subnet-evm/blob/master/docs/precompiles/tx-allowlist.md)
- [eERC Documentation](https://docs.avacloud.io/encrypted-erc)
- [Avalanche CLI Reference](https://docs.avax.build/build/tutorials/avalanche-cli/avalanche-cli-overview)