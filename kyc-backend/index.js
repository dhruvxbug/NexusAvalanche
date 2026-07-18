const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
// In a real environment, these would be loaded from .env
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:9650/ext/bc/jurisdiction-chain/rpc';
// Private key for 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027'; 

// Subnet-EVM TxAllowList Precompile Address & ABI
const TX_ALLOWLIST_ADDRESS = '0x0200000000000000000000000000000000000002';
const TX_ALLOWLIST_ABI = [
  "function setEnabled(address addr) external",
  "function readAllowList(address addr) external view returns (uint256 role)"
];

// Initialize Ethers provider and wallet (assuming chain is running)
let provider;
let wallet;
let txAllowListContract;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  txAllowListContract = new ethers.Contract(TX_ALLOWLIST_ADDRESS, TX_ALLOWLIST_ABI, wallet);
} catch (e) {
  console.warn("Could not connect to RPC immediately. Will retry on requests.", e.message);
}

app.post('/api/kyc/verify', async (req, res) => {
  try {
    const { userAddress, jurisdiction, documentId } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }

    console.log(`Received KYC request for address: ${userAddress} in jurisdiction: ${jurisdiction}`);

    // MOCK KYC CHECK
    // In a production scenario, this integrates with Onfido, Sumsub, or Stripe Identity
    if (jurisdiction === 'RestrictedRegion') {
       return res.status(403).json({ error: 'Jurisdiction not supported due to geofencing.' });
    }

    // Re-initialize if undefined
    if (!txAllowListContract) {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      txAllowListContract = new ethers.Contract(TX_ALLOWLIST_ADDRESS, TX_ALLOWLIST_ABI, wallet);
    }

    // Check if they are already on the allowlist
    const role = await txAllowListContract.readAllowList(userAddress);
    if (role > 0n) {
      return res.json({ success: true, message: 'User is already verified and on the allowlist.' });
    }

    console.log('Sending transaction to TxAllowList precompile...');
    
    // Call setEnabled on the precompile using the Admin Wallet
    const tx = await txAllowListContract.setEnabled(userAddress);
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for the transaction to be mined
    await tx.wait();
    console.log(`User ${userAddress} has been successfully whitelisted.`);

    return res.json({
      success: true,
      message: 'KYC verified and address whitelisted.',
      txHash: tx.hash
    });

  } catch (error) {
    console.error('Error during KYC verification:', error);
    return res.status(500).json({ 
      error: 'Internal server error during blockchain transaction.',
      details: error.message
    });
  }
});

app.get('/api/kyc/status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const role = await txAllowListContract.readAllowList(address);
    
    // Role 0 = None, 1 = Enabled, 2 = Admin, 3 = Manager
    return res.json({
      address,
      isWhitelisted: role > 0n,
      role: role.toString()
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return res.status(500).json({ error: 'Failed to fetch status from blockchain' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`KYC Compliance Service running on port ${PORT}`);
  console.log(`Admin Wallet Address: ${wallet ? wallet.address : 'Not loaded'}`);
  console.log(`RPC Endpoint: ${RPC_URL}`);
});
