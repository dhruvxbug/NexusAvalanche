import React, { useState, useEffect } from "react";
import {
  Shield,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { apiUrl } from "../lib/api";

export interface TransactionRecord {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  operation: "PrivateTransfer" | "PrivateMint";
  sender: string;
  toContract: string;
  recipient: string;
  amount: string;
  tokenSymbol: string;
  gasUsed: string;
  proofVerification: string;
  isPrivate: boolean;
  network?: string;
  chainId?: number;
  onChainVisibility?: {
    sender: string;
    contract: string;
    value: string;
    plaintextRecipient: string;
    plaintextAmount: string;
    proofPointsVerified: string;
  };
}

interface ZKPrivacyExplorerProps {
  network: "jurisdictionChain" | "fuji";
  contractAddress: string;
  blockNumber?: number;
  onRefreshParent?: () => void;
}

export default function ZKPrivacyExplorer({
  network,
  contractAddress,
  blockNumber,
  onRefreshParent,
}: ZKPrivacyExplorerProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isFuji = network === "fuji";
  const chainName = isFuji ? "Avalanche Fuji Testnet" : "Nexus Sovereign L1";
  const chainId = isFuji ? 43113 : 99999;

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/eerc/transactions?network=${network}`));
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [network]);

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getExplorerTxUrl = (txHash: string) => {
    if (isFuji) {
      return `https://explorer-test.avax.network/c-chain/tx/${txHash}`;
    }
    return `http://127.0.0.1:9654/ext/bc/tx/${txHash}`;
  };

  const getExplorerAddressUrl = (addr: string) => {
    if (isFuji) {
      return `https://explorer-test.avax.network/c-chain/address/${addr}`;
    }
    return `http://127.0.0.1:9654/ext/bc/address/${addr}`;
  };

  const filteredTxs = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.txHash?.toLowerCase().includes(q) ||
      tx.sender?.toLowerCase().includes(q) ||
      tx.recipient?.toLowerCase().includes(q) ||
      tx.operation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-gradient-to-r from-card to-card/60 backdrop-blur shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground font-display tracking-tight flex items-center gap-2">
                eERC Zero-Knowledge Privacy Explorer
                <span className={`text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full border ${
                  isFuji ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-green-500/10 text-green-600 border-green-500/20"
                }`}>
                  {chainName} • Chain ID {chainId}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect live confidential transactions on-chain. Demonstrates how Groth16 zero-knowledge proofs shield addresses and values from public view {blockNumber ? `(Current Block #${blockNumber})` : ""}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchTransactions();
              if (onRefreshParent) onRefreshParent();
            }}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <a
            href={getExplorerAddressUrl(contractAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>{isFuji ? "Avalanche Testnet Explorer" : "Devnet Contract"}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Contract & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Contract Address (EncryptedERC)
          </span>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-foreground font-semibold truncate mr-2" title={contractAddress}>
              {contractAddress ? `${contractAddress.slice(0, 10)}...${contractAddress.slice(-8)}` : "Loading..."}
            </span>
            <button
              onClick={() => copyToClipboard(contractAddress)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary"
              title="Copy Contract Address"
            >
              {copiedHash === contractAddress ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Zero-Knowledge Verifier
          </span>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-xs text-foreground font-semibold">Groth16 Pairing SNARK</span>
          </div>
          <span className="text-[10px] text-muted-foreground block mt-1">BabyJubJub ElGamal Ciphertext</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Recorded Transactions
          </span>
          <span className="text-xl font-bold font-mono text-foreground">
            {transactions.length} Verified
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Confidential transfers & mints</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Public Visibility
          </span>
          <span className="text-xs font-semibold text-green-600 flex items-center gap-1.5 mt-1">
            <Lock className="h-3.5 w-3.5" /> 100% Confidential
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Amounts & recipients encrypted</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Tx Hash, Sender Address, or Operation..."
          className="bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full font-mono"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Block</th>
                <th className="py-3 px-4">Sender (From)</th>
                <th className="py-3 px-4">Recipient (Plaintext)</th>
                <th className="py-3 px-4">Amount (Plaintext)</th>
                <th className="py-3 px-4">Proof Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-body">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No transactions recorded on this network yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Execute a private transfer or mint from the Payments tab to see it appear here in real-time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr
                    key={tx.txHash}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                  >
                    {/* Tx Hash */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary hover:underline">
                          {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : "Pending"}
                        </span>
                        <button
                          onClick={(e) => copyToClipboard(tx.txHash, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded text-muted-foreground transition-opacity"
                          title="Copy Tx Hash"
                        >
                          {copiedHash === tx.txHash ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Operation */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          tx.operation === "PrivateTransfer"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {tx.operation === "PrivateTransfer" ? "Private Transfer" : "Private Mint"}
                      </span>
                    </td>

                    {/* Block */}
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      #{tx.blockNumber}
                    </td>

                    {/* Sender */}
                    <td className="py-3.5 px-4 font-mono text-foreground">
                      <span title={tx.sender}>
                        {tx.sender ? `${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}` : "—"}
                      </span>
                    </td>

                    {/* Plaintext Recipient (Emphasize Privacy) */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 font-mono text-[11px] font-medium" title="Plaintext recipient is never exposed on the blockchain">
                        <Lock className="h-3 w-3" /> HIDDEN (ZK)
                      </span>
                    </td>

                    {/* Plaintext Amount (Emphasize Privacy) */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 font-mono text-[11px] font-medium" title="Plaintext amount is encrypted in BabyJubJub curve ciphertext">
                        <EyeOff className="h-3 w-3" /> CONFIDENTIAL
                      </span>
                    </td>

                    {/* Proof Verification */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Groth16 Verified
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
                      >
                        Inspect Proof
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof & Privacy Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground font-display">
                    Confidential Transaction Privacy Audit
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Tx: {selectedTx.txHash}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Contrast Side-by-Side: Public vs Authorized */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Public View */}
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5 uppercase tracking-wider">
                    <EyeOff className="h-4 w-4" /> Public Blockchain View
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Validators & Explorers</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Interacting Contract:</span>
                    <span className="text-foreground font-semibold break-all">{selectedTx.toContract} (EncryptedERC)</span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Transaction Value:</span>
                    <span className="text-foreground font-semibold">0.00 {isFuji ? "AVAX" : "JUR"}</span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Recipient Address:</span>
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <Lock className="h-3 w-3" /> HIDDEN (BabyJubJub Curve Point)
                    </span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Transferred Amount:</span>
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> CONFIDENTIAL (Encrypted ElGamal C1, C2)
                    </span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Validity Proof:</span>
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Groth16 zk-SNARK Pairing Checked
                    </span>
                  </div>
                </div>
              </div>

              {/* Authorized View */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 uppercase tracking-wider">
                    <Unlock className="h-4 w-4" /> Authorized Decrypted View
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Owner, Recipient & Auditor</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Operation:</span>
                    <span className="text-foreground font-semibold">{selectedTx.operation}</span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Decrypted Amount:</span>
                    <span className="text-green-600 font-bold text-sm">
                      {selectedTx.amount} {selectedTx.tokenSymbol || "PRIV"}
                    </span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Sender Wallet:</span>
                    <span className="text-foreground font-semibold break-all">{selectedTx.sender}</span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Recipient Wallet:</span>
                    <span className="text-foreground font-semibold break-all">{selectedTx.recipient}</span>
                  </div>
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <span className="text-muted-foreground block text-[10px] uppercase">Compliance Decryption:</span>
                    <span className="text-foreground font-semibold">
                      Auditor key can decrypt via Discrete Logarithm (PCT)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground font-mono">
                Block #{selectedTx.blockNumber} • Gas Used: {selectedTx.gasUsed}
              </div>

              <div className="flex items-center gap-2">
                {isFuji && (
                  <a
                    href={getExplorerTxUrl(selectedTx.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 shadow transition-colors"
                  >
                    <span>View on Avalanche Testnet Explorer</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
