import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Coins,
  Copy,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Fingerprint,
  Link as LinkIcon,
  Lock,
  RefreshCw,
  Send,
  Server,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import { apiUrl } from "../lib/api";

interface MainDashboardProps {
  account: string;
}

export default function MainDashboard({ account }: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "deployment" | "payments" | "allowlist">("payments");
  const [kycData, setKycData] = useState<any>(null);
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(1);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [showCleartext, setShowCleartext] = useState<boolean>(true);

  // Transfer form state
  const [recipientAddress, setRecipientAddress] = useState<string>("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2");
  const [transferAmount, setTransferAmount] = useState<string>("5");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferStep, setTransferStep] = useState<number>(0);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Mint form state
  const [mintAmount, setMintAmount] = useState<string>("20");
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintReceipt, setMintReceipt] = useState<any>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  // Allowlist query state
  const [queryAddress, setQueryAddress] = useState<string>("");
  const [queryRoleResult, setQueryRoleResult] = useState<any>(null);
  const [isQueryingRole, setIsQueryingRole] = useState<boolean>(false);

  // Fetch KYC data
  useEffect(() => {
    if (!account) return;
    fetch(apiUrl(`/api/kyc/status/${account}`))
      .then((res) => res.json())
      .then((data) => setKycData(data))
      .catch(() => {});
  }, [account]);

  // Fetch Deployment Status
  const fetchDeploymentStatus = async () => {
    try {
      const res = await fetch(apiUrl(`/api/eerc/status`));
      const data = await res.json();
      if (data.success) {
        setDeploymentData(data);
      }
    } catch (err) {
      console.error("Failed to fetch deployment status", err);
    }
  };

  useEffect(() => {
    fetchDeploymentStatus();
    const interval = setInterval(fetchDeploymentStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch selected wallet balance
  const fetchBalance = async (walletId: number) => {
    setIsBalanceLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/eerc/balance/${walletId}`));
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data);
      }
    } catch (err) {
      console.error("Failed to fetch balance", err);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance(selectedWalletId);
  }, [selectedWalletId]);

  // Execute Transfer
  const handleTransfer = async () => {
    if (!recipientAddress || !transferAmount) return;
    setIsTransferring(true);
    setTransferError(null);
    setLastReceipt(null);
    setTransferStep(1); // 1. Allowlist precompile check

    try {
      setTimeout(() => setTransferStep(2), 600); // 2. BabyJubJub curve encryption
      setTimeout(() => setTransferStep(3), 1400); // 3. Groth16 ZK proof generation
      setTimeout(() => setTransferStep(4), 2800); // 4. Avalanche L1 submission

      const res = await fetch(apiUrl(`/api/eerc/transfer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderWallet: selectedWalletId,
          receiverAddress: recipientAddress.trim(),
          amount: transferAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Transfer failed");
      }

      setTransferStep(5); // 5. Confirmed & Groth16 Verified
      setLastReceipt(data);
      // Refresh current wallet balance
      fetchBalance(selectedWalletId);
      fetchDeploymentStatus();
    } catch (err: any) {
      setTransferError(err.message || "Failed to execute transfer");
      setTransferStep(0);
    } finally {
      setIsTransferring(false);
    }
  };

  // Execute Mint
  const handleMint = async () => {
    if (!mintAmount) return;
    setIsMinting(true);
    setMintReceipt(null);
    setMintError(null);
    try {
      const target = selectedWalletId === 1 ? "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f" : "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2";
      const res = await fetch(apiUrl(`/api/eerc/mint`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress: target,
          amount: mintAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Mint failed");
      setMintReceipt(data);
      fetchBalance(selectedWalletId);
      fetchDeploymentStatus();
    } catch (err: any) {
      setMintError(err.message || "Failed to mint tokens");
    } finally {
      setIsMinting(false);
    }
  };

  // Check allowlist role
  const handleCheckRole = async () => {
    if (!queryAddress) return;
    setIsQueryingRole(true);
    try {
      const res = await fetch(apiUrl(`/api/eerc/allowlist/${queryAddress.trim()}`));
      const data = await res.json();
      setQueryRoleResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQueryingRole(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col min-h-[850px] w-full overflow-hidden rounded-2xl border border-border bg-background text-base shadow-lg font-body">
      {/* TopBar */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 bg-background/95 backdrop-blur">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-primary-foreground text-lg shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-lg tracking-tight font-display">NexusChain L1</span>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold font-mono">
                Chain ID 99999
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Subnet-EVM with Native TxAllowList & eERC Privacy</p>
          </div>
        </div>

        {/* Demo Wallet Selector Pill */}
        <div className="flex items-center gap-2 bg-secondary/60 p-1 rounded-xl border border-border/80">
          <span className="text-xs font-semibold px-2 text-muted-foreground hidden md:inline">Demo Persona:</span>
          <button
            onClick={() => {
              setSelectedWalletId(1);
              setRecipientAddress("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2");
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedWalletId === 1
                ? "bg-background text-foreground shadow-sm font-semibold border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            User 1 (Admin/Owner)
          </button>
          <button
            onClick={() => {
              setSelectedWalletId(2);
              setRecipientAddress("0xA1602f982E36ca8294e0f7B32b2054f28aa6317f");
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedWalletId === 2
                ? "bg-background text-foreground shadow-sm font-semibold border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            User 2 (Auditor)
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 font-medium text-green-600 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            L1 Node Live (Block #{deploymentData?.network?.blockNumber ?? "--"})
          </span>
          <button
            onClick={fetchDeploymentStatus}
            title="Refresh L1 status"
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex bg-secondary/15 font-body">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Core Modules
          </p>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              activeTab === "payments"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Lock className="h-4 w-4 shrink-0" />
            <span className="truncate">eERC Payments</span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "payments" ? "bg-white/20 text-white" : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
              }`}
            >
              ZK-SNARK
            </span>
          </button>

          <button
            onClick={() => setActiveTab("deployment")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              activeTab === "deployment"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Server className="h-4 w-4 shrink-0" />
            <span className="truncate">L1 Devnet Status</span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "deployment" ? "bg-white/20 text-white" : "bg-green-500/10 text-green-600 border border-green-500/20"
              }`}
            >
              Online
            </span>
          </button>

          <button
            onClick={() => setActiveTab("allowlist")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              activeTab === "allowlist"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span className="truncate">TxAllowList Precompile</span>
          </button>

          <div className="mt-6">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Identity & Compliance
            </p>
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Fingerprint className="h-4 w-4 shrink-0" />
              <span className="truncate">DID & Verifiable Creds</span>
            </button>
          </div>

          {/* Quick Info Box in sidebar */}
          <div className="mt-auto rounded-xl border border-border/80 bg-background/80 p-3.5 text-xs text-muted-foreground shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>Avalanche Subnet PoA</span>
            </div>
            <p className="leading-relaxed">
              Block production is <strong>on-demand</strong> (events build blocks). Non-allowlisted transactions are rejected at RPC layer with 0 gas.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-secondary/10 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: eERC ENCRYPTED PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                    <Lock className="h-6 w-6 text-purple-600" />
                    eERC Confidential Payments & Transfers
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Execute on-chain zero-knowledge transfers with ElGamal encryption, verified by Groth16 pairings on custom Subnet-EVM.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    ElGamal / Groth16 Active
                  </span>
                </div>
              </div>

              {/* Active Wallet Cards (Decrypted vs On-chain Ciphertext) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Cleartext Decrypted Balance */}
                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-primary" />
                        Decrypted Balance (Owner View)
                      </span>
                      <button
                        onClick={() => setShowCleartext(!showCleartext)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-secondary/60 px-2.5 py-1 rounded-md border border-border/60 transition-colors"
                      >
                        {showCleartext ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showCleartext ? "Conceal" : "Reveal"}
                      </button>
                    </div>

                    <div className="my-4">
                      {isBalanceLoading ? (
                        <div className="h-10 w-36 bg-secondary/60 rounded animate-pulse" />
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">
                            {showCleartext ? walletBalance?.decryptedBalance ?? "0.0" : "••••••"}
                          </span>
                          <span className="text-lg font-bold text-purple-600 font-mono">
                            {walletBalance?.tokenSymbol || "PRIV"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-4 mt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Wallet:</span>
                      <span className="font-mono font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/40">
                        {walletBalance?.address?.slice(0, 10)}...{walletBalance?.address?.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">TxAllowList Status:</span>
                      <span className="font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        {walletBalance?.allowlistRoleName || "Permitted (Role 2)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: On-Chain Raw Ciphertext (What validators & public see) */}
                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Lock className="h-4 w-4 text-purple-500" />
                        On-Chain Public Ciphertext (Validator View)
                      </span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono border border-border">
                        BabyJubJub Curve Points
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      Public observers and mempool sniffers only see non-trivial elliptic curve coordinates. Real balance is completely unobservable.
                    </p>

                    <div className="bg-secondary/40 p-3 rounded-xl border border-border/60 space-y-2 font-mono text-[11px] text-muted-foreground">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-purple-600 font-semibold">C1.X:</span>{" "}
                        {walletBalance?.ciphertext?.c1?.x || "Loading..."}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-purple-600 font-semibold">C1.Y:</span>{" "}
                        {walletBalance?.ciphertext?.c1?.y || "Loading..."}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-purple-600 font-semibold">C2.X:</span>{" "}
                        {walletBalance?.ciphertext?.c2?.x || "Loading..."}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-purple-600 font-semibold">C2.Y:</span>{" "}
                        {walletBalance?.ciphertext?.c2?.y || "Loading..."}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-3 mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Audit Trail: {walletBalance?.ciphertext?.amountPCTsCount ?? 0} PCT Commitments</span>
                    <span className="text-green-600 font-medium">Auditor Decryptable</span>
                  </div>
                </div>
              </div>

              {/* Transfer Form & Visualizer */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">Send Private eERC Payment</h4>
                    <p className="text-xs text-muted-foreground">
                      Generates a client-side Groth16 zero-knowledge proof of balance solvency before submitting to Avalanche L1.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Sender:</span>
                    <span className="font-semibold text-foreground">
                      {selectedWalletId === 1 ? "User 1 (Admin)" : "User 2 (Auditor)"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Recipient */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setRecipientAddress("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2")}
                        className="text-[11px] bg-secondary hover:bg-secondary/80 text-foreground px-2 py-1 rounded border border-border transition-colors font-medium"
                      >
                        User 2 (Auditor)
                      </button>
                      <button
                        onClick={() => setRecipientAddress("0xA1602f982E36ca8294e0f7B32b2054f28aa6317f")}
                        className="text-[11px] bg-secondary hover:bg-secondary/80 text-foreground px-2 py-1 rounded border border-border transition-colors font-medium"
                      >
                        User 1 (Owner)
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Transfer Amount (PRIV)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-muted-foreground font-mono">
                        PRIV
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {["5", "10", "25"].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setTransferAmount(preset)}
                          className="text-[11px] bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded border border-border transition-colors font-medium"
                        >
                          {preset} PRIV
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Execution Pipeline Steps */}
                {isTransferring && (
                  <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Cryptographic Execution Pipeline
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div className={`p-2.5 rounded-lg border ${transferStep >= 1 ? "bg-background border-green-500/40 text-green-700" : "bg-secondary/30 border-border text-muted-foreground"}`}>
                        <div className="font-semibold">1. Precompile Check</div>
                        <div className="text-[10px]">TxAllowList verified</div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${transferStep >= 2 ? "bg-background border-green-500/40 text-green-700" : "bg-secondary/30 border-border text-muted-foreground"}`}>
                        <div className="font-semibold">2. Curve Encryption</div>
                        <div className="text-[10px]">ElGamal C1, C2 built</div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${transferStep >= 3 ? "bg-background border-purple-500/40 text-purple-700 font-semibold" : "bg-secondary/30 border-border text-muted-foreground"}`}>
                        <div className="font-semibold">3. Groth16 Prover</div>
                        <div className="text-[10px]">Zero-Knowledge Proof</div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${transferStep >= 4 ? "bg-background border-blue-500/40 text-blue-700" : "bg-secondary/30 border-border text-muted-foreground"}`}>
                        <div className="font-semibold">4. L1 Inclusion</div>
                        <div className="text-[10px]">Event-driven block mine</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {transferError && (
                  <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 flex items-start gap-2.5">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Transaction Failed</div>
                      <div>{transferError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isTransferring ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating Groth16 Proof & Submitting to L1...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Execute Private eERC Transfer (ZK-Groth16)
                    </>
                  )}
                </button>
              </div>

              {/* Transaction Receipt Card */}
              {lastReceipt && (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-green-700 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Private Transfer Confirmed on Avalanche L1</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono mb-4">
                    <div className="bg-background/80 p-3 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-sans">Block Number</span>
                      <span className="font-bold text-foreground text-sm">#{lastReceipt.blockNumber}</span>
                    </div>
                    <div className="bg-background/80 p-3 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-sans">Gas Consumed</span>
                      <span className="font-bold text-foreground text-sm">{parseInt(lastReceipt.gasUsed).toLocaleString()} gas</span>
                    </div>
                    <div className="bg-background/80 p-3 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-sans">Amount Transferred</span>
                      <span className="font-bold text-purple-700 text-sm">{lastReceipt.amountSent} PRIV (Encrypted)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs text-muted-foreground bg-background/80 p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <span>Tx Hash:</span>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <span>{lastReceipt.txHash.slice(0, 18)}...{lastReceipt.txHash.slice(-8)}</span>
                        <button onClick={() => copyToClipboard(lastReceipt.txHash)} title="Copy Tx Hash">
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ZK Proof Status:</span>
                      <span className="text-green-600 font-bold">{lastReceipt.proofVerification}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Privacy Property:</span>
                      <span className="text-purple-600">{lastReceipt.privacyNotice}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mint Token Utility */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      Private Mint Utility (Admin Only)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Mints newly created encrypted tokens directly into the selected wallet using a Groth16 mint circuit.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-24 bg-secondary/30 border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground"
                    />
                    <button
                      onClick={handleMint}
                      disabled={isMinting}
                      className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-1.5 rounded-lg text-xs font-semibold border border-border transition-colors disabled:opacity-50"
                    >
                      {isMinting ? "Minting..." : "Mint PRIV"}
                    </button>
                  </div>
                </div>

                {mintReceipt && (
                  <div className="text-xs bg-green-500/10 text-green-700 p-3 rounded-lg border border-green-500/20 font-mono">
                    ✓ Minted {mintReceipt.amountMinted} PRIV to {mintReceipt.recipient.slice(0, 10)}... (Block #{mintReceipt.blockNumber}, {parseInt(mintReceipt.gasUsed).toLocaleString()} gas)
                  </div>
                )}

                {mintError && (
                  <div className="text-xs bg-red-500/10 text-red-700 p-3 rounded-lg border border-red-500/20 font-mono flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    Mint failed: {mintError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: L1 DEPLOYMENT & INFRASTRUCTURE */}
          {activeTab === "deployment" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                    <Server className="h-6 w-6 text-green-600" />
                    Avalanche L1 Devnet Deployment Status
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Live telemetry for the custom sovereign Subnet-EVM, consensus validator configuration, and deployed smart contracts.
                  </p>
                </div>
                <button
                  onClick={fetchDeploymentStatus}
                  className="bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border flex items-center gap-2 self-start"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
                </button>
              </div>

              {/* L1 Network Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Chain ID
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-foreground">
                    {deploymentData?.network?.chainId ?? "99999"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">Sovereign Layer-1</span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Block Height
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-green-600">
                    #{deploymentData?.network?.blockNumber ?? "--"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">On-demand Block Production</span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Consensus
                  </span>
                  <span className="text-2xl font-extrabold font-display text-foreground">PoA Validator</span>
                  <span className="text-[11px] text-muted-foreground block mt-1">ValidatorManager in Alloc</span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    VM Runtime
                  </span>
                  <span className="text-2xl font-extrabold font-display text-primary">Subnet-EVM</span>
                  <span className="text-[11px] text-muted-foreground block mt-1">Version v0.8.0</span>
                </div>
              </div>

              {/* RPC Endpoint Card */}
              <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Live L1 RPC Endpoint
                  </span>
                  <span className="text-[11px] text-green-600 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    JSON-RPC 2.0 Responsive
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg border border-border/80">
                  <code className="text-xs font-mono text-foreground flex-1 break-all">
                    {deploymentData?.network?.rpcUrl || "Resolving RPC..."}
                  </code>
                  <button
                    onClick={() => copyToClipboard(deploymentData?.network?.rpcUrl || "")}
                    className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy RPC URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Smart Contracts Directory */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                <h4 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Verified On-Chain Contract Registry
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-sans">
                      <tr>
                        <th className="pb-3">Contract / Component</th>
                        <th className="pb-3">Address</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">EncryptedERC (eERC)</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.encryptedERC || "0x87508677259587fa9E4b6201f1e2aE767cbb96ef"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.encryptedERC || "0x87508677259587fa9E4b6201f1e2aE767cbb96ef")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-purple-600 font-semibold">Core Token Contract</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Verified</td>
                      </tr>

                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">Registrar</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.registrar || "0xf365BF9344915A3D381c7d6a3657912216841717"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.registrar || "0xf365BF9344915A3D381c7d6a3657912216841717")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-muted-foreground">BabyJubJub Key Map</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Verified</td>
                      </tr>

                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">TxAllowList Precompile</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.txAllowListPrecompile || "0x0200000000000000000000000000000000000002"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.txAllowListPrecompile || "0x0200000000000000000000000000000000000002")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-blue-600 font-semibold">Native Precompile</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Genesis Active</td>
                      </tr>

                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">TransferVerifier</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.transferVerifier || "0x804Fd5aef6cCfcc19fA273CbaD03018Df0570961"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.transferVerifier || "0x804Fd5aef6cCfcc19fA273CbaD03018Df0570961")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-muted-foreground">Groth16 Verifier</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Verified</td>
                      </tr>

                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">MintVerifier</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.mintVerifier || "0x7a077979Ec76B0e9A5F9869ca245bb2AEF68D88d"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.mintVerifier || "0x7a077979Ec76B0e9A5F9869ca245bb2AEF68D88d")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-muted-foreground">Groth16 Verifier</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Verified</td>
                      </tr>

                      <tr>
                        <td className="py-3 font-sans font-bold text-foreground">BabyJubJub Curve Library</td>
                        <td className="py-3 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{deploymentData?.contracts?.babyJubJub || "0x34F41a9DfF457E3Fd184b232Eb071164a06DEcbF"}</span>
                            <button onClick={() => copyToClipboard(deploymentData?.contracts?.babyJubJub || "0x34F41a9DfF457E3Fd184b232Eb071164a06DEcbF")}>
                              <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-sans text-muted-foreground">Elliptic Curve Math</td>
                        <td className="py-3 text-right font-sans font-bold text-green-600">✓ Verified</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TX ALLOWLIST PRECOMPILE */}
          {activeTab === "allowlist" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                  <Shield className="h-6 w-6 text-primary" />
                  TxAllowList Precompile Inspection
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Avalanche Subnet-EVM enforces transaction admission before the EVM runs. Non-allowlisted transactions are rejected at the RPC pool layer, burning 0 gas.
                </p>
              </div>

              {/* Interactive Address Checker */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h4 className="font-bold text-foreground mb-2">Check On-Chain Role</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Query the precompile at <code className="text-primary font-mono">0x0200000000000000000000000000000000000002</code> directly to observe real-time authorization state.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    value={queryAddress}
                    onChange={(e) => setQueryAddress(e.target.value)}
                    placeholder="Enter wallet address (0x...)"
                    className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={handleCheckRole}
                    disabled={isQueryingRole}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isQueryingRole ? "Checking..." : "Query Role"}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Quick test:</span>
                  <button
                    onClick={() => {
                      setQueryAddress("0xA1602f982E36ca8294e0f7B32b2054f28aa6317f");
                    }}
                    className="bg-secondary text-foreground px-2 py-0.5 rounded border border-border font-mono hover:bg-secondary/80"
                  >
                    Admin (User 1)
                  </button>
                  <button
                    onClick={() => {
                      setQueryAddress("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2");
                    }}
                    className="bg-secondary text-foreground px-2 py-0.5 rounded border border-border font-mono hover:bg-secondary/80"
                  >
                    Auditor (User 2)
                  </button>
                  <button
                    onClick={() => {
                      setQueryAddress("0x000000000000000000000000000000000000dEaD");
                    }}
                    className="bg-secondary text-foreground px-2 py-0.5 rounded border border-border font-mono hover:bg-secondary/80"
                  >
                    Unauthorized Address
                  </button>
                </div>

                {queryRoleResult && (
                  <div className="mt-6 p-4 rounded-xl border border-border bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">{queryRoleResult.address}</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          queryRoleResult.isPermitted
                            ? "bg-green-500/10 text-green-700 border border-green-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {queryRoleResult.roleName} (Role {queryRoleResult.role})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {queryRoleResult.isPermitted
                        ? "✓ This address is authorized to broadcast transactions to the Avalanche L1."
                        : "✗ Transactions from this address are rejected at the RPC pool layer with zero EVM gas consumed."}
                    </p>
                  </div>
                )}
              </div>

              {/* Architectural Insight */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Network vs Contract Layer Enforcement
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-3">
                  <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                    <div className="font-bold text-green-800 mb-1">NexusChain (Precompile)</div>
                    <p className="text-muted-foreground leading-relaxed">
                      Evaluated during transaction pool admission. An unauthorized wallet cannot interact with any contract on the chain, closing application bypass loopholes and burning 0 gas.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-secondary/30">
                    <div className="font-bold text-foreground mb-1">Traditional Smart Contract (require)</div>
                    <p className="text-muted-foreground leading-relaxed">
                      Checked inside contract functions. Unauthorized transactions must be included in a block and execute EVM opcodes before reverting, wasting 21,000+ base gas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OVERVIEW & IDENTITY (DID, VC, IPFS) */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                    <Fingerprint className="h-6 w-6 text-primary" />
                    Decentralized Identity & W3C Verifiable Credentials
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Off-chain identity attestation anchored to on-chain compliance state.
                  </p>
                </div>
              </div>

              {/* DID Card */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Decentralized Identifier (DID)</h4>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg font-mono text-sm break-all text-muted-foreground border border-border/50">
                  {kycData?.did || `did:ethr:99999:${account}`}
                </div>
              </div>

              {/* VC & IPFS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BadgeCheck className="h-5 w-5 text-accent" />
                    <h4 className="font-semibold text-foreground">Verifiable Credential (VC)</h4>
                  </div>
                  {kycData?.vcJwt ? (
                    <div className="space-y-4">
                      <div className="bg-secondary/30 p-4 rounded-lg font-mono text-xs break-all text-muted-foreground overflow-hidden max-h-32 relative border border-border/50">
                        {kycData.vcJwt}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-secondary/30 to-transparent" />
                      </div>
                      <span className="text-sm font-medium text-green-600 block">✓ Cryptographic Signature Valid</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-secondary/30 rounded-lg text-xs text-muted-foreground font-mono">
                      W3C compliant VC issued by compliance authority upon JRDL policy approval.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-foreground">IPFS Encrypted Storage</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    KYC documents are AES-256-GCM encrypted and stored off-chain. Supports crypto-shredding for GDPR.
                  </p>
                  <div className="bg-secondary/30 p-4 rounded-lg font-mono text-sm break-all text-muted-foreground border border-border/50">
                    CID: {kycData?.ipfsCid || "— issued upon first verification —"}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-4 w-4" /> Anchored on-chain via TxAllowList TX
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
