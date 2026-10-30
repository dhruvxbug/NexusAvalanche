import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Loader2, Fingerprint, Activity, ExternalLink } from 'lucide-react';
import { createVeriffFrame } from '@veriff/incontext-sdk';
import { apiUrl } from '../lib/api';
import { useExplorer } from '../lib/explorer';

interface ComplianceDashboardProps {
  account: string;
  onVerify?: () => void;
}

export const ComplianceDashboard = ({ account, onVerify }: ComplianceDashboardProps) => {
  const [status, setStatus] = useState<string>('Checking Status...');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { activePreset, getExplorerAddressUrl, getExplorerTxUrl } = useExplorer();

  const checkStatus = async (address: string) => {
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/kyc/status/${address}`));
      const data = await response.json();
      if (data.txHash) {
        setTxHash(data.txHash);
      }
      if (data.isWhitelisted) {
        setStatus('Verified (Whitelisted)');
        if (onVerify) onVerify();
        return true;
      } else {
        setStatus('Pending / Not Verified');
        return false;
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setStatus('Compliance service unreachable');
      setError('Could not reach the compliance backend. Start it with `npm run dev` inside kyc-backend/ (port 3001).');
      return false;
    }
  };

  useEffect(() => {
    if (account) {
      checkStatus(account);
    }
  }, [account]);

  // Polling mechanism when pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'Pending / Not Verified' && loading) {
      interval = setInterval(async () => {
        const isVerified = await checkStatus(account);
        if (isVerified) {
          clearInterval(interval);
          setLoading(false);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status, loading, account]);

  const submitKyc = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiUrl(`/api/kyc/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: account,
          jurisdiction: 'US',
          documentId: 'DOC-1234'
        })
      });
      const data = await response.json();
      
      if (data.success && data.veriffSessionUrl) {
        createVeriffFrame({
            url: data.veriffSessionUrl,
            onEvent: function(msg) {
                switch(msg) {
                    case 'STARTED':
                        break;
                    case 'CANCELED':
                        setLoading(false);
                        break;
                    case 'FINISHED':
                        // The user completed the flow. Polling will handle the status update.
                        break;
                }
            }
        });
      } else {
        setError(data.error || 'Failed to create KYC request');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError('Could not submit the KYC request. Ensure the compliance backend is running on port 3001.');
      setLoading(false);
    }
  };

  const isVerified = status.includes('Verified');

  return (
    <div className="max-w-4xl mx-auto p-8 border border-border rounded-xl bg-card shadow-sm font-body">
      
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-10 pb-6 border-b border-border">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-display font-bold text-foreground mb-2">
            <Fingerprint className="w-6 h-6 text-primary" />
            Compliance Identity
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Verify your jurisdiction to unlock trading on NexusChain. Only cleared wallets are permitted by the native Avalanche Subnet precompile.
          </p>
        </div>
        
        <div className="bg-secondary p-3 rounded-lg border border-border flex flex-col gap-1">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Network Enforcement</p>
          <a
            href={getExplorerAddressUrl("0x0200000000000000000000000000000000000002")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary font-medium text-sm hover:underline"
            title="View TxAllowList Precompile on Avalanche Explorer"
          >
            <Activity className="w-4 h-4" />
            <span>Active (TxAllowList)</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-secondary/50 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Connected Address</p>
                <a
                  href={getExplorerAddressUrl(account)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  title={`View address on ${activePreset.shortName}`}
                >
                  <span>View on {activePreset.shortName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-foreground font-mono text-sm break-all">{account}</p>
            </div>
          </div>
          
          <div className="p-5 rounded-xl bg-secondary/50 border border-border flex flex-col justify-center">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Current Status</p>
            <div className="flex items-center gap-2">
              {status === 'Checking Status...' ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : isVerified ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-yellow-600" />
              )}
              <p className={`font-medium ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {status}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-semibold text-sm mb-1">Request failed</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!isVerified && status !== 'Checking Status...' && (
          <div className="pt-4 flex flex-col items-center">
            <button 
              onClick={submitKyc}
              disabled={loading}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Start KYC Verification'}
            </button>
          </div>
        )}

        {isVerified && (
          <div className="p-5 rounded-xl bg-green-50 border border-green-200 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-800 font-semibold mb-1">Identity Verified</h4>
                <p className="text-green-700 text-sm">
                  Your address has been successfully written to the TxAllowList precompile on the Avalanche L1.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {txHash && (
                <a
                  href={getExplorerTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>View Whitelist Tx</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a
                href={getExplorerAddressUrl(account)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-background border border-green-300 text-green-800 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors inline-flex items-center gap-1.5"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
