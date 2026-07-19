import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Loader2, Fingerprint, Activity } from 'lucide-react';

interface ComplianceDashboardProps {
  account: string;
}

export const ComplianceDashboard = ({ account }: ComplianceDashboardProps) => {
  const [status, setStatus] = useState<string>('Checking Status...');
  const [loading, setLoading] = useState<boolean>(false);

  const checkStatus = async (address: string) => {
    try {
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

  useEffect(() => {
    if (account) {
      checkStatus(account);
    }
  }, [account]);

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
          jurisdiction: 'US',
          documentId: 'DOC-1234'
        })
      });
      const data = await response.json();
      
      if (data.success && data.kycRequestId) {
        // Simulate the asynchronous webhook from a provider (e.g. Onfido)
        const webhookResponse = await fetch(`http://localhost:3001/api/kyc/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kycRequestId: data.kycRequestId,
            decision: "APPROVED"
          })
        });
        const webhookData = await webhookResponse.json();
        
        if (webhookData.success) {
          alert("KYC Verified! Tx: " + webhookData.txHash);
          setStatus('Verified (Whitelisted)');
        } else {
          alert("Webhook Error: " + webhookData.error);
        }
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
            Verify your jurisdiction to unlock trading on the NexusChain. Only cleared wallets are permitted.
          </p>
        </div>
        
        <div className="bg-secondary p-3 rounded-lg border border-border">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mb-1">Network Enforcement</p>
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Activity className="w-4 h-4" />
            Active (TxAllowList)
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-secondary/50 border border-border">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Connected Address</p>
            <p className="text-foreground font-mono text-sm break-all">{account}</p>
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
          <div className="p-5 rounded-xl bg-green-50 border border-green-200 mt-6 flex gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <h4 className="text-green-800 font-semibold mb-1">Identity Verified</h4>
              <p className="text-green-700 text-sm">
                Your address has been successfully written to the TxAllowList precompile.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
