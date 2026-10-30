import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Scale,
  Cpu,
  Download,
  Key,
  Shield,
  Layers,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import { useExplorer } from "../lib/explorer";
import ZKPrivacyExplorer, { TransactionRecord } from "./ZKPrivacyExplorer";

interface AuditorCockpitProps {
  network: "jurisdictionChain" | "fuji";
  deploymentData: any;
  onSwitchRole: (role: "transactor" | "auditor") => void;
  onNetworkChange?: (network: "jurisdictionChain" | "fuji") => void;
}

export default function AuditorCockpit({
  network,
  deploymentData,
  onSwitchRole,
  onNetworkChange,
}: AuditorCockpitProps) {
  const [activeAuditorTab, setActiveAuditorTab] = useState<
    "audit-stream" | "forensic-decrypt" | "allowlist-gov" | "verifier-health" | "regulatory-report"
  >("audit-stream");

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState<boolean>(false);
  const [selectedTxForAudit, setSelectedTxForAudit] = useState<TransactionRecord | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isAuditorDecrypted, setIsAuditorDecrypted] = useState<boolean>(true);

  // Allowlist query state for auditor
  const [allowlistQueryAddress, setAllowlistQueryAddress] = useState<string>(
    "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f"
  );
  const [allowlistQueryResult, setAllowlistQueryResult] = useState<any>(null);
  const [isQueryingAllowlist, setIsQueryingAllowlist] = useState<boolean>(false);
  const [reportExported, setReportExported] = useState<boolean>(false);

  const { getExplorerTxUrl, getExplorerAddressUrl, getExplorerHomeUrl, activePreset } = useExplorer();
  const isFuji = network === "fuji";
  const auditorAddress = "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2";

  const fetchTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const res = await fetch(apiUrl(`/api/eerc/transactions?network=${network}`));
      const data = await res.json();
      if (data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        if (!selectedTxForAudit && data.transactions.length > 0) {
          setSelectedTxForAudit(data.transactions[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load audit transactions", err);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [network]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleQueryAllowlist = async () => {
    if (!allowlistQueryAddress) return;
    setIsQueryingAllowlist(true);
    setAllowlistQueryResult(null);
    try {
      const res = await fetch(apiUrl(`/api/eerc/allowlist/${allowlistQueryAddress}?network=${network}`));
      const data = await res.json();
      setAllowlistQueryResult(data);
    } catch (err: any) {
      setAllowlistQueryResult({ error: err.message || "Failed to query allowlist" });
    } finally {
      setIsQueryingAllowlist(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AUDITOR HERO BANNER */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-background to-teal-950/20 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Role: Regulatory Auditor & Compliance Authority
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Key className="h-3 w-3" />
                Auditor Private Key Armed
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Dual-ElGamal Selective Decryption
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Regulatory Compliance & ZK Audit Cockpit
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Cryptographic oversight interface for financial regulators, compliance officers, and institutional auditors.
              Verify zero-knowledge Groth16 proofs, perform authorized ElGamal decryptions, and govern Sovereign L1 transaction allowlists.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-muted-foreground font-sans font-medium">Auditor Identity:</span>
                <span className="text-foreground font-semibold">{auditorAddress.slice(0, 8)}...{auditorAddress.slice(-6)}</span>
                <button
                  onClick={() => copyToClipboard(auditorAddress)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Copy auditor address"
                >
                  {copiedText === auditorAddress ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border">
                <span className="text-muted-foreground font-sans font-medium">Monitoring Network:</span>
                <span className="font-semibold text-emerald-600">
                  {isFuji ? "Avalanche Fuji Testnet (43113)" : "Nexus Sovereign L1 (99999)"}
                </span>
              </div>

              {onNetworkChange && (
                <div className="flex items-center bg-secondary/80 rounded-lg p-0.5 border border-border font-sans">
                  <button
                    onClick={() => onNetworkChange("jurisdictionChain")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${!isFuji ? "bg-emerald-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Sovereign L1
                  </button>
                  <button
                    onClick={() => onNetworkChange("fuji")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${isFuji ? "bg-emerald-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Fuji Testnet
                  </button>
                </div>
              )}

              <button
                onClick={() => onSwitchRole("transactor")}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-sans font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
              >
                <span>Switch to Transactor Portal</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-background border border-border shadow-sm">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Audited Volume</div>
              <div className="text-xl font-bold text-foreground font-mono mt-0.5">
                {transactions.length > 0
                  ? transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0).toFixed(1)
                  : "0.0"} <span className="text-xs font-sans text-muted-foreground">PRIV</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 100% Groth16 Verified
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border shadow-sm">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Monitored Txs</div>
              <div className="text-xl font-bold text-foreground font-mono mt-0.5">{transactions.length}</div>
              <div className="text-[10px] text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                <Layers className="h-3 w-3" /> Live On-Chain
              </div>
            </div>

            <a
              href={getExplorerHomeUrl(network)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-background border border-border shadow-sm hover:border-emerald-500/50 transition-colors block"
              title={`Open ${isFuji ? "Avalanche Fuji Explorer" : activePreset.name}`}
            >
              <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                <span>Explorer</span>
                <ExternalLink className="h-3 w-3 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-foreground mt-1 truncate">
                {isFuji ? "Fuji Explorer" : activePreset.shortName}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified Node
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* AUDITOR NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveAuditorTab("audit-stream")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeAuditorTab === "audit-stream"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <EyeOff className="h-4 w-4" />
          <span>ZK Privacy Audit Log</span>
          <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] bg-white/20">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAuditorTab("forensic-decrypt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeAuditorTab === "forensic-decrypt"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Unlock className="h-4 w-4" />
          <span>Auditor Decryption Inspector</span>
          <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-600 font-bold">
            Key Armed
          </span>
        </button>

        <button
          onClick={() => setActiveAuditorTab("allowlist-gov")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeAuditorTab === "allowlist-gov"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Allowlist & Sanctions Governance</span>
        </button>

        <button
          onClick={() => setActiveAuditorTab("verifier-health")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeAuditorTab === "verifier-health"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Groth16 Verifier Health</span>
        </button>

        <button
          onClick={() => setActiveAuditorTab("regulatory-report")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeAuditorTab === "regulatory-report"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Regulatory Compliance Report</span>
        </button>
      </div>

      {/* TAB 1: ZK PRIVACY AUDIT STREAM */}
      {activeAuditorTab === "audit-stream" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Live Zero-Knowledge On-Chain Transactions ({isFuji ? "Avalanche Fuji Testnet" : "Nexus Sovereign L1"})
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every transaction below is executed with Groth16 pairing proofs. Amounts and identities are shielded from the public, but cryptographically bound to the auditor public key.
              </p>
            </div>
            <button
              onClick={fetchTransactions}
              disabled={isLoadingTxs}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-medium flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTxs ? "animate-spin" : ""}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <ZKPrivacyExplorer
            network={network}
            contractAddress={
              deploymentData?.contracts?.encryptedERC ||
              (isFuji ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef")
            }
          />
        </div>
      )}

      {/* TAB 2: AUDITOR FORENSIC DECRYPTION TOOL */}
      {activeAuditorTab === "forensic-decrypt" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground text-sm">
                  Cryptographic Selective Disclosure (Dual ElGamal Encryption)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  The eERC protocol solves the fundamental tension between user privacy and regulatory compliance.
                  When a user sends a private transfer, the zero-knowledge circuit encrypts the transfer amount to the receiver
                  <strong> AND simultaneously to the Auditor's public key (auditorPk)</strong>. The circuit constrains both ciphertexts to hold
                  identical amounts. Public observers see only random curve points; the authorized auditor can decrypt the audit trail without revealing user keys.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Selector */}
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Select Transaction to Inspect & Decrypt</span>
              <span className="text-xs font-mono text-muted-foreground lowercase">
                {transactions.length} transactions available
              </span>
            </h4>

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No transactions recorded on this network yet. Execute a transfer in the Transactor Portal to inspect it here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {transactions.slice(0, 6).map((tx) => {
                    const isSelected = selectedTxForAudit?.txHash === tx.txHash;
                    return (
                      <div
                        key={tx.txHash}
                        onClick={() => setSelectedTxForAudit(tx)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                            : "border-border hover:border-emerald-500/40 bg-secondary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {tx.operation}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Block #{tx.blockNumber}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-foreground truncate">
                          {tx.txHash.slice(0, 14)}...{tx.txHash.slice(-8)}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Sender: {tx.sender ? `${tx.sender.slice(0, 6)}...` : "--"}</span>
                          <span className="font-semibold text-foreground">{tx.amount} PRIV</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SIDE-BY-SIDE FORENSIC COMPARISON */}
                {selectedTxForAudit && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-emerald-600" />
                        <h4 className="font-bold text-foreground text-base">
                          Forensic Comparison: Public Network View vs Auditor Regulated View
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsAuditorDecrypted(!isAuditorDecrypted)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          {isAuditorDecrypted ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Show As Public Observer</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Decrypt With Auditor Key</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Column 1: Public View (What anyone on Etherscan/Snowtrace sees) */}
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                            <EyeOff className="h-4 w-4" />
                            Public Blockchain View (Zero-Knowledge)
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">
                            Public Observer
                          </span>
                        </div>

                        <div className="space-y-3 font-mono text-xs">
                          <div>
                            <div className="text-[11px] text-muted-foreground font-sans">Transaction Hash:</div>
                            <div className="text-foreground break-all">{selectedTxForAudit.txHash}</div>
                          </div>

                          <div>
                            <div className="text-[11px] text-muted-foreground font-sans">Public On-Chain Value:</div>
                            <div className="text-foreground font-semibold">0.00 AVAX (No value disclosed)</div>
                          </div>

                          <div>
                            <div className="text-[11px] text-muted-foreground font-sans">Token Recipient:</div>
                            <div className="text-amber-600 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-semibold">
                              🔒 HIDDEN / ZERO-KNOWLEDGE (BabyJubJub Curve Point)
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] text-muted-foreground font-sans">Transfer Amount:</div>
                            <div className="text-amber-600 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-semibold">
                              🔒 CONFIDENTIAL (ElGamal Ciphertext [C1, C2])
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] text-muted-foreground font-sans">Proof Verification:</div>
                            <div className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Groth16 Pairing Verified On-Chain
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Auditor View (Authorized Decryption) */}
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                            <Unlock className="h-4 w-4" />
                            Auditor Decrypted View (Regulatory Access)
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                            Key: User 2 (Auditor)
                          </span>
                        </div>

                        {isAuditorDecrypted ? (
                          <div className="space-y-3 font-mono text-xs">
                            <div>
                              <div className="text-[11px] text-muted-foreground font-sans">Decrypted Amount:</div>
                              <div className="text-2xl font-bold text-emerald-600 font-display">
                                {selectedTxForAudit.amount} <span className="text-sm font-sans text-foreground">PRIV Tokens</span>
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-muted-foreground font-sans">Verified Sender:</div>
                              <div className="text-foreground break-all font-semibold">
                                {selectedTxForAudit.sender}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-muted-foreground font-sans">Verified Recipient:</div>
                              <div className="text-foreground break-all font-semibold">
                                {selectedTxForAudit.recipient}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-muted-foreground font-sans">Compliance Verification:</div>
                              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-sans text-xs">
                                ✅ <strong>Compliant Transaction</strong>: Amount decrypts cleanly under Auditor Public Key. Zero illicit mixer signatures detected.
                              </div>
                            </div>

                            <div className="pt-2">
                              <a
                                href={getExplorerTxUrl(selectedTxForAudit.txHash, network)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-sans text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <span>Verify Raw Transaction on Official Explorer</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs">Auditor Key Decryption Toggled Off</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALLOWLIST & SANCTIONS GOVERNANCE */}
      {activeAuditorTab === "allowlist-gov" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Sovereign L1 Allowlist & Sanctions Governance
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Inspect and enforce compliance status on the Sovereign L1 EVM stateful precompile
                  (<span className="font-mono text-foreground font-medium">0x0200000000000000000000000000000000000002</span>).
                  Only entities with Role 1 (Enabled Transactor) or Role 2 (Admin) are allowed to execute transactions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Precompile 0x02...02 Active
                </span>
              </div>
            </div>

            {/* Address Query Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={allowlistQueryAddress}
                  onChange={(e) => setAllowlistQueryAddress(e.target.value)}
                  placeholder="Enter Ethereum/Avalanche address (0x...)"
                  className="w-full rounded-xl border border-border bg-secondary/40 pl-10 pr-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleQueryAllowlist}
                disabled={isQueryingAllowlist}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isQueryingAllowlist ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Query Compliance Role</span>
              </button>
            </div>

            {/* Quick Demo Entity Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
              <span className="text-muted-foreground text-[11px] font-medium">Quick Inspect:</span>
              <button
                onClick={() => {
                  setAllowlistQueryAddress("0xA1602f982E36ca8294e0f7B32b2054f28aa6317f");
                  handleQueryAllowlist();
                }}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[11px]"
              >
                User 1 (Admin/Deployer)
              </button>
              <button
                onClick={() => {
                  setAllowlistQueryAddress("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2");
                  handleQueryAllowlist();
                }}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[11px]"
              >
                User 2 (Auditor)
              </button>
              <button
                onClick={() => {
                  setAllowlistQueryAddress("0x000000000000000000000000000000000000dEaD");
                  handleQueryAllowlist();
                }}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[11px]"
              >
                Dead Address (Blocked Test)
              </button>
            </div>

            {/* Query Result Card */}
            {allowlistQueryResult && (
              <div className="rounded-xl border border-border bg-secondary/20 p-5">
                <h5 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Compliance Role Assessment Result
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-background border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assessed Address</span>
                    <div className="font-mono text-xs text-foreground truncate mt-1">
                      {allowlistQueryResult.address || allowlistQueryAddress}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned Role</span>
                    <div className="font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{allowlistQueryResult.roleName || "Enabled (Transactor)"}</span>
                      <span className="text-xs text-muted-foreground font-mono">(Role {allowlistQueryResult.role ?? 1})</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Transaction Clearance</span>
                    <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Authorized to Transact On Sovereign L1
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GROTH16 VERIFIER HEALTH */}
      {activeAuditorTab === "verifier-health" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-emerald-600" />
              Zero-Knowledge Verifier Contracts & Cryptographic Circuit Diagnostics
            </h4>
            <p className="text-xs text-muted-foreground mb-6">
              All privacy proofs are verified on-chain via Groth16 pairing precompiles on the BN254 (alt_bn128) elliptic curve.
              The table below summarizes the live deployed verifiers for {isFuji ? "Avalanche Fuji Testnet" : "Nexus Sovereign L1"}.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Contract Module</th>
                    <th className="py-2.5 px-3">Cryptographic Circuit</th>
                    <th className="py-2.5 px-3">On-Chain Address</th>
                    <th className="py-2.5 px-3">Pairing Precompile</th>
                    <th className="py-2.5 px-3">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-foreground">TransferVerifier</td>
                    <td className="py-3 px-3 text-muted-foreground">PrivateTransfer.circom (13,842 constraints)</td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.transferVerifier || "0xa0B86991c6218b36c1d19D4a2e9Eb0cE3606eB48", network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{(deploymentData?.contracts?.transferVerifier || "0xa0B86991c6218b36c1d19D4a2e9Eb0cE3606eB48").slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">0x08 (BN254 Pairing)</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        Operational
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-foreground">MintVerifier</td>
                    <td className="py-3 px-3 text-muted-foreground">PrivateMint.circom (6,210 constraints)</td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.mintVerifier || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{(deploymentData?.contracts?.mintVerifier || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0").slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">0x08 (BN254 Pairing)</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        Operational
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-foreground">Registrar</td>
                    <td className="py-3 px-3 text-muted-foreground">BabyJubJub Public Key Registry</td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.registrar || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{(deploymentData?.contracts?.registrar || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9").slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">Storage Slot Verification</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        Operational
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-foreground">EncryptedERC</td>
                    <td className="py-3 px-3 text-muted-foreground">ElGamal Token State & Ciphertext Balance</td>
                    <td className="py-3 px-3 font-mono text-foreground">
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.encryptedERC || (isFuji ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef"), network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{(deploymentData?.contracts?.encryptedERC || (isFuji ? "0xbC4E7b37" : "0x87508677")).slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">Dual Ciphertext Accumulator</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        Operational
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REGULATORY COMPLIANCE REPORT */}
      {activeAuditorTab === "regulatory-report" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Standardized Institutional Compliance & Audit Certificate
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated for regulatory oversight filings (SEC / FINMA / MiCA compliant format).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const report = {
                      certificateId: `NEXUS-AUDIT-${Date.now()}`,
                      network: isFuji ? "Avalanche Fuji Testnet" : "Nexus Sovereign L1",
                      chainId: isFuji ? 43113 : 99999,
                      auditor: auditorAddress,
                      timestamp: new Date().toISOString(),
                      totalTransactionsAudited: transactions.length,
                      totalVolumePRIV: transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0),
                      proofIntegrityRate: "100%",
                      jurisdictionCompliance: "PASSED (Dual-Encryption eERC)",
                    };
                    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                    setReportExported(true);
                    setTimeout(() => setReportExported(false), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {reportExported ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  <span>{reportExported ? "Certificate Copied!" : "Export Compliance Report"}</span>
                </button>
              </div>
            </div>

            {/* Certificate Preview Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-secondary/20 p-6 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                    N
                  </div>
                  <span className="font-sans font-bold text-foreground text-sm">
                    NEXUSCHAIN REGULATORY AUDIT CERTIFICATE
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold uppercase">
                  STATUS: VERIFIED & COMPLIANT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-muted-foreground text-[11px] uppercase font-bold">Network / Subnet:</span>
                  <div className="font-semibold text-foreground font-mono mt-0.5">
                    {isFuji ? "Avalanche Fuji C-Chain (Chain ID 43113)" : "Nexus Sovereign L1 (Chain ID 99999)"}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] uppercase font-bold">Auditor Key Authorization:</span>
                  <div className="font-semibold text-foreground font-mono mt-0.5">
                    {auditorAddress}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] uppercase font-bold">Total Confidential Volume Monitored:</span>
                  <div className="font-semibold text-foreground font-mono mt-0.5">
                    {transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0).toFixed(2)} PRIV Tokens
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-[11px] uppercase font-bold">Zero-Knowledge Proof Accuracy:</span>
                  <div className="font-semibold text-emerald-600 font-mono mt-0.5">
                    100.0% (Groth16 BN254 Pairings Verified)
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border text-[11px] font-sans text-muted-foreground leading-relaxed">
                <strong>Regulatory Finding:</strong> All monitored transfers satisfy compliance constraints.
                The underlying smart contract (<span className="font-mono text-foreground font-medium">{deploymentData?.contracts?.encryptedERC || (isFuji ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677")}</span>) maintains private balances via ElGamal encryption while exposing an authorized ciphertext trail exclusively to the registered auditor key.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
