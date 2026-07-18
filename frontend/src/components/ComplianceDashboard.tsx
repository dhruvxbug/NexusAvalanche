import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const ComplianceDashboard = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Not Connected');
  const [loading, setLoading] = useState<boolean>(false);

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        checkStatus(accounts[0]);
      } catch (err) {
        console.error("User denied account access");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const checkStatus = async (address: string) => {
    try {
      // Calls our mock KYC backend
      const response = await fetch(`http://localhost:3001/api/kyc/status/${address}`);
      const data = await response.json();
      if (data.isWhitelisted) {
        setStatus('Verified (Whitelisted)');
      } else {
        setStatus('Pending / Not Verified');
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setStatus('Error fetching status (Backend offline?)');
    }
  };

  const submitKyc = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/kyc/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account,
          jurisdiction: 'US', // mock data
          documentId: 'DOC-1234' // mock data
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("KYC Verified! Your address is now on the Jurisdiction Allowlist. Tx: " + data.txHash);
        setStatus('Verified (Whitelisted)');
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting KYC. Ensure the backend is running on port 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-xl mb-12 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <h2 className="text-3xl font-serif mb-2 text-white">Compliance & Identity</h2>
      <p className="text-white/60 mb-8 max-w-xl">
        Complete your KYC verification to get whitelisted on the Jurisdiction-Aware Chain. 
        Only verified users are permitted to execute transactions.
      </p>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-accent/80 transition-all hover:scale-105"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-white/50 text-sm font-medium mb-1">Connected Address</p>
              <p className="text-white font-mono text-sm truncate">{account}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
              <p className="text-white/50 text-sm font-medium mb-1">Network Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.includes('Verified') ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`} />
                <p className={`font-medium ${status.includes('Verified') ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status}
                </p>
              </div>
            </div>
          </div>

          {!status.includes('Verified') && (
            <button 
              onClick={submitKyc}
              disabled={loading}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-white/90 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Processing on L1...' : 'Submit KYC Details'}
            </button>
          )}

          {status.includes('Verified') && (
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              Your identity has been verified and your address has been successfully written to the TxAllowList precompile on the Jurisdiction-Aware Chain.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
