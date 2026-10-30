import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Coins,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Link as LinkIcon,
  Lock,
  RefreshCw,
  Send,
  Server,
  Settings2,
  Shield,
  Sparkles,
  XCircle,
  Check,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import { useExplorer } from "../lib/explorer";
import ExplorerSelectorModal from "./ExplorerSelectorModal";
import ZKPrivacyExplorer from "./ZKPrivacyExplorer";
import AuditorCockpit from "./AuditorCockpit";

interface MainDashboardProps {
  account: string;
  currentRole?: "transactor" | "auditor";
  onRoleChange?: (role: "transactor" | "auditor") => void;
}

export default function MainDashboard({ account, currentRole = "transactor", onRoleChange }: MainDashboardProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<"jurisdictionChain" | "fuji">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nexus_demo_network");
      if (saved === "fuji" || saved === "jurisdictionChain") return saved;
    }
    return "jurisdictionChain";
  });
  const [activeRole, setActiveRole] = useState<"transactor" | "auditor">(
    currentRole || (account?.toLowerCase() === "0xdd277e775eac72ba469cd9dce30921974d8f4ed2" ? "auditor" : "transactor")
  );

  useEffect(() => {
    if (currentRole) {
      setActiveRole(currentRole);
      setSelectedWalletId(currentRole === "auditor" ? 2 : 1);
    }
  }, [currentRole]);

  const [activeTab, setActiveTab] = useState<"overview" | "deployment" | "payments" | "allowlist" | "explorer">("payments");
  const [kycData, setKycData] = useState<any>(null);
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number>(currentRole === "auditor" ? 2 : 1);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [showCleartext, setShowCleartext] = useState<boolean>(true);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const {
    activePreset,
    selectExplorer,
    getExplorerAddressUrl,
    getExplorerTxUrl,
    getExplorerBlockUrl,
    getExplorerHomeUrl,
  } = useExplorer();

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

  // Network Switcher Handler
  const handleNetworkChange = (network: "jurisdictionChain" | "fuji") => {
    setSelectedNetwork(network);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexus_demo_network", network);
    }
    if (network === "fuji") {
      selectExplorer("fuji");
    }
    fetchDeploymentStatus(network);
    fetchBalance(selectedWalletId, network);
  };

  // Fetch Deployment Status
  const fetchDeploymentStatus = async (networkToFetch = selectedNetwork) => {
    try {
      const res = await fetch(apiUrl(`/api/eerc/status?network=${networkToFetch}`));
      const data = await res.json();
      if (data.success) {
        setDeploymentData(data);
      }
    } catch (err) {
      console.error("Failed to fetch deployment status", err);
    }
  };

  useEffect(() => {
    fetchDeploymentStatus(selectedNetwork);
    const interval = setInterval(() => fetchDeploymentStatus(selectedNetwork), 30000);
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  // Fetch selected wallet balance
  const fetchBalance = async (walletId: number, networkToFetch = selectedNetwork) => {
    setIsBalanceLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/eerc/balance/${walletId}?network=${networkToFetch}`));
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
    fetchBalance(selectedWalletId, selectedNetwork);
  }, [selectedWalletId, selectedNetwork]);

  // Execute Transfer
  const handleTransfer = async () => {
    if (!recipientAddress || !transferAmount) return;
    setIsTransferring(true);
    setTransferError(null);
    setLastReceipt(null);
    setTransferStep(1); // 1. Precompile / access check

    try {
      setTimeout(() => setTransferStep(2), 600); // 2. BabyJubJub curve encryption
      setTimeout(() => setTransferStep(3), 1400); // 3. Groth16 ZK proof generation
      setTimeout(() => setTransferStep(4), 2800); // 4. Avalanche submission

      const res = await fetch(apiUrl(`/api/eerc/transfer`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderWallet: selectedWalletId,
          receiverAddress: recipientAddress.trim(),
          amount: transferAmount,
          network: selectedNetwork,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Transfer failed");
      }

      setTransferStep(5); // 5. Confirmed & Groth16 Verified
      setLastReceipt(data);
      // Refresh current wallet balance & deployment status
      fetchBalance(selectedWalletId, selectedNetwork);
      fetchDeploymentStatus(selectedNetwork);
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
          network: selectedNetwork,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Mint failed");
      setMintReceipt(data);
      fetchBalance(selectedWalletId, selectedNetwork);
      fetchDeploymentStatus(selectedNetwork);
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
      const res = await fetch(apiUrl(`/api/eerc/allowlist/${queryAddress.trim()}?network=${selectedNetwork}`));
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
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Smart contracts directory data (dynamically adjusted for active network)
  const contractsList = selectedNetwork === "fuji"
    ? [
        {
          name: "EncryptedERC (eERC)",
          address: deploymentData?.contracts?.encryptedERC || "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe",
          type: "Core Token Contract (Fuji C-Chain)",
          badgeClass: "text-purple-600 font-semibold",
          description: "Confidential token contract with encrypted ElGamal balances and auditor decryption on Avalanche Fuji Testnet",
        },
        {
          name: "Registrar",
          address: deploymentData?.contracts?.registrar || "0x147B6b01fe1d085e44F953dfC34BE04536E7dF4c",
          type: "BabyJubJub Key Registry",
          badgeClass: "text-muted-foreground",
          description: "On-chain registry mapping EVM addresses to cryptographic BabyJubJub public keys",
        },
        {
          name: "TransferVerifier",
          address: deploymentData?.contracts?.transferVerifier || "0xF8aDEa2619F25f45d1ab0483a66A23dCCe3fCb9E",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Cryptographic pairing verifier proving private transfer solvency on Fuji without disclosing balances",
        },
        {
          name: "MintVerifier",
          address: deploymentData?.contracts?.mintVerifier || "0xF80E15600f7fd3Ae9967Cc8d88D8244D2569eE25",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Zero-knowledge circuit verifier validating new private token issuance on Fuji",
        },
        {
          name: "RegistrationVerifier",
          address: deploymentData?.contracts?.registrationVerifier || "0x3c479cA0063c08eb4C00e705170b473A9CA25668",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Proves knowledge of the private BabyJubJub key during user onboarding",
        },
        {
          name: "BabyJubJub Curve Library",
          address: deploymentData?.contracts?.babyJubJub || "0x0F27C1FbE7fE5Dc4e2fd0EF513C60c1Ce01DBf9f",
          type: "Elliptic Curve Math",
          badgeClass: "text-muted-foreground",
          description: "Native twisted Edwards elliptic curve library optimized for SNARK pairings",
        },
      ]
    : [
        {
          name: "EncryptedERC (eERC)",
          address: deploymentData?.contracts?.encryptedERC || "0x87508677259587fa9E4b6201f1e2aE767cbb96ef",
          type: "Core Token Contract",
          badgeClass: "text-purple-600 font-semibold",
          description: "Confidential token contract with encrypted ElGamal balances and auditor decryption capability",
        },
        {
          name: "Registrar",
          address: deploymentData?.contracts?.registrar || "0xf365BF9344915A3D381c7d6a3657912216841717",
          type: "BabyJubJub Key Registry",
          badgeClass: "text-muted-foreground",
          description: "On-chain registry mapping EVM addresses to cryptographic BabyJubJub public keys",
        },
        {
          name: "TxAllowList Precompile",
          address: deploymentData?.contracts?.txAllowListPrecompile || "0x0200000000000000000000000000000000000002",
          type: "Native Subnet Precompile",
          badgeClass: "text-blue-600 font-semibold",
          description: "Precompile at block 0 enforcing zero-gas transaction admission before EVM execution",
        },
        {
          name: "TransferVerifier",
          address: deploymentData?.contracts?.transferVerifier || "0x804Fd5aef6cCfcc19fA273CbaD03018Df0570961",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Cryptographic pairing verifier proving private transfer solvency without disclosing balances",
        },
        {
          name: "MintVerifier",
          address: deploymentData?.contracts?.mintVerifier || "0x7a077979Ec76B0e9A5F9869ca245bb2AEF68D88d",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Zero-knowledge circuit verifier validating new private token issuance",
        },
        {
          name: "RegistrationVerifier",
          address: deploymentData?.contracts?.registrationVerifier || "0x51Ecf3a1eC981440DEB78e1bC9D86e9d6B1a6Fe5",
          type: "Groth16 ZK Verifier",
          badgeClass: "text-muted-foreground",
          description: "Proves knowledge of the private BabyJubJub key during user onboarding",
        },
        {
          name: "BabyJubJub Curve Library",
          address: deploymentData?.contracts?.babyJubJub || "0x34F41a9DfF457E3Fd184b232Eb071164a06DEcbF",
          type: "Elliptic Curve Math",
          badgeClass: "text-muted-foreground",
          description: "Native twisted Edwards elliptic curve library optimized for SNARK pairings",
        },
      ];

  return (
    <div className="flex flex-col min-h-[850px] w-full overflow-hidden rounded-2xl border border-border bg-background text-base shadow-lg font-body">
      {/* Explorer Configuration Modal */}
      <ExplorerSelectorModal
        isOpen={isExplorerModalOpen}
        onClose={() => setIsExplorerModalOpen(false)}
      />

      {/* TopBar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 bg-background/95 backdrop-blur">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-primary-foreground text-lg shadow-sm">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-lg tracking-tight font-display">
                {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet" : "NexusChain Sovereign L1"}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                selectedNetwork === "fuji"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : "bg-green-500/10 text-green-600 border-green-500/20"
              }`}>
                Chain ID {selectedNetwork === "fuji" ? "43113" : "99999"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {selectedNetwork === "fuji"
                ? "Public Avalanche C-Chain Testnet · Verified on Ava Labs Explorer"
                : "Subnet-EVM with Native TxAllowList Precompile & eERC Privacy"}
            </p>
          </div>
        </div>

        {/* Network Environment Toggle */}
        <div className="flex items-center bg-secondary/80 p-1 rounded-xl border border-border shadow-sm">
          <button
            onClick={() => handleNetworkChange("jurisdictionChain")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedNetwork === "jurisdictionChain"
                ? "bg-green-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${selectedNetwork === "jurisdictionChain" ? "bg-white animate-pulse" : "bg-green-500"}`} />
            <span>🟢 Sovereign L1 (Devnet)</span>
          </button>
          <button
            onClick={() => handleNetworkChange("fuji")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedNetwork === "fuji"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>🌐 Fuji Testnet (Public Web)</span>
          </button>
        </div>

        {/* Role Persona Switcher Pill */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl border border-border shadow-sm">
          <span className="text-xs font-semibold px-2 text-muted-foreground hidden lg:inline">Active Persona:</span>
          <button
            onClick={() => {
              setActiveRole("transactor");
              setSelectedWalletId(1);
              setRecipientAddress("0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2");
              onRoleChange?.("transactor");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeRole === "transactor"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>🏢 Enterprise Transactor</span>
          </button>
          <button
            onClick={() => {
              setActiveRole("auditor");
              setSelectedWalletId(2);
              setRecipientAddress("0xA1602f982E36ca8294e0f7B32b2054f28aa6317f");
              onRoleChange?.("auditor");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeRole === "auditor"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>🛡️ Regulatory Auditor</span>
          </button>
        </div>

        {/* Right Header: Explorer Link & Status */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Direct Avalanche Explorer Button with Selector */}
          <div className="flex items-center rounded-xl border border-primary/30 bg-primary/10 overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
            <a
              href={getExplorerHomeUrl(selectedNetwork)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${selectedNetwork === "fuji" ? "Official Avalanche Fuji Explorer" : activePreset.name} in a new tab`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-primary hover:bg-primary/20 font-semibold text-xs transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => setIsExplorerModalOpen(true)}
              title="Change Avalanche Explorer or configure custom URL"
              className="px-2 py-1.5 border-l border-primary/20 text-primary hover:bg-primary/20 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 font-medium text-green-600 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {selectedNetwork === "fuji" ? "Fuji Live" : "L1 Live"} (Block #{deploymentData?.network?.blockNumber ?? "--"})
          </span>
          <button
            onClick={() => {
              fetchDeploymentStatus(selectedNetwork);
              fetchBalance(selectedWalletId, selectedNetwork);
            }}
            title="Refresh network status"
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role Banner / Context */}
      <div
        className={`px-6 py-3 border-b text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          activeRole === "auditor"
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-primary/5 border-primary/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              activeRole === "auditor" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
            }`}
          >
            {activeRole === "auditor" ? <ShieldCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                {activeRole === "auditor"
                  ? "Regulatory Compliance & ZK Audit Cockpit"
                  : "Enterprise Treasury & Confidential Payments Portal"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  activeRole === "auditor"
                    ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-700 border border-blue-500/30"
                }`}
              >
                {activeRole === "auditor" ? "Role: Protocol Auditor (User 2)" : "Role: Enterprise Transactor (User 1)"}
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              {activeRole === "auditor"
                ? "Authorized regulatory access: View on-chain ZK proofs, decrypt audit payloads via protocol key, and enforce Sovereign L1 allowlists."
                : "Transact with private zero-knowledge encryption, view client-side decrypted ElGamal balance, and mint confidential tokens."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-muted-foreground">Active Address:</span>
          <span className="font-mono text-foreground font-semibold bg-background px-2.5 py-1 rounded-md border border-border">
            {activeRole === "auditor" ? "0xDD277E...4eD2 (Auditor)" : "0xA1602f...317f (Treasury/Admin)"}
          </span>
        </div>
      </div>

      {activeRole === "auditor" ? (
        <div className="flex-1 bg-secondary/10 p-6 md:p-8 overflow-y-auto">
          <AuditorCockpit
            network={selectedNetwork}
            deploymentData={deploymentData}
            onSwitchRole={(r) => {
              setActiveRole(r);
              setSelectedWalletId(r === "auditor" ? 2 : 1);
              onRoleChange?.(r);
            }}
            onNetworkChange={(net) => handleNetworkChange(net)}
          />
        </div>
      ) : (
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

          {/* ZK Privacy Explorer Tab */}
          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              activeTab === "explorer"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <EyeOff className="h-4 w-4 shrink-0" />
            <span className="truncate">ZK Privacy Explorer</span>
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "explorer" ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              }`}
            >
              Live Records
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
            <span className="truncate">{selectedNetwork === "fuji" ? "Fuji Deployment" : "L1 Devnet Status"}</span>
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
            {selectedNetwork === "fuji" && (
              <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                L1 only
              </span>
            )}
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

          {/* Quick Explorer Launcher in Sidebar */}
          <div className="mt-auto rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground shadow-sm space-y-2">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>Avalanche Explorer</span>
              </div>
              <button
                onClick={() => setIsExplorerModalOpen(true)}
                className="text-[10px] text-primary hover:underline"
              >
                Config
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Active: <strong className="text-foreground">{activePreset.shortName}</strong>
            </p>
            <a
              href={getExplorerHomeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Launch Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-secondary/10 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: eERC ENCRYPTED PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                    <Lock className="h-6 w-6 text-purple-600" />
                    eERC Confidential Payments & Transfers
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Execute on-chain zero-knowledge transfers with ElGamal encryption, verified by Groth16 pairings on {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet" : "custom Subnet-EVM"}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Direct Contract Link Pill */}
                  <a
                    href={getExplorerAddressUrl(deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef"), selectedNetwork)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View eERC Token Contract on Avalanche Explorer"
                    className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Database className="h-3.5 w-3.5 text-primary" />
                    <span>eERC: {(deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37" : "0x87508677")).slice(0, 8)}...</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>

                  <button
                    onClick={() => setActiveTab("explorer")}
                    className="rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-600 flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>ZK Privacy Explorer</span>
                  </button>

                  <span className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Groth16 Active
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
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getExplorerAddressUrl(walletBalance?.address, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View ${walletBalance?.address} on ${selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}`}
                          className="font-mono font-medium text-foreground hover:text-primary transition-colors bg-secondary/50 hover:bg-secondary px-2 py-0.5 rounded border border-border/40 inline-flex items-center gap-1"
                        >
                          <span>{walletBalance?.address?.slice(0, 10)}...{walletBalance?.address?.slice(-8)}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(walletBalance?.address || "")}
                          title="Copy Wallet Address"
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedText === walletBalance?.address ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Authorization State:</span>
                      <span className="font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        {selectedNetwork === "fuji" ? "Permitted (Public Fuji Testnet)" : (walletBalance?.allowlistRoleName || "Permitted (Role 2)")}
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
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef"), selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded font-mono border border-border inline-flex items-center gap-1"
                        title="View contract state on explorer"
                      >
                        BabyJubJub Curve Points <ExternalLink className="h-2.5 w-2.5" />
                      </a>
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
                    <a
                      href={getExplorerAddressUrl(deploymentData?.auditor?.address || "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2", selectedNetwork)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 font-medium hover:underline inline-flex items-center gap-1"
                      title="View Auditor on Avalanche Explorer"
                    >
                      Auditor Decryptable <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Transfer Form & Visualizer */}
              <div className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">Send Private eERC Payment</h4>
                    <p className="text-xs text-muted-foreground">
                      Generates a client-side Groth16 zero-knowledge proof of balance solvency before submitting to {selectedNetwork === "fuji" ? "Avalanche Fuji C-Chain" : "Avalanche Sovereign L1"}.
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Recipient Address
                      </label>
                      {recipientAddress && (
                        <a
                          href={getExplorerAddressUrl(recipientAddress, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                          title="View recipient on Avalanche Explorer"
                        >
                          View on Explorer <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
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
                        <div className="font-semibold">4. {selectedNetwork === "fuji" ? "Fuji" : "L1"} Inclusion</div>
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
                      Generating Groth16 Proof & Submitting to {selectedNetwork === "fuji" ? "Fuji Testnet" : "L1"}...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Execute Private eERC Transfer on {selectedNetwork === "fuji" ? "Fuji" : "L1"} (ZK-Groth16)
                    </>
                  )}
                </button>
              </div>

              {/* Transaction Receipt Card with Direct Explorer Button */}
              {lastReceipt && (
                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 shadow-sm">
                  {/* Receipt Header with Direct Link Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-green-500/20">
                    <div className="flex items-center gap-2 text-green-700 font-semibold text-base">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Private Transfer Confirmed on {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet" : "Avalanche L1"}</span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setActiveTab("explorer")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs rounded-xl border border-border shadow-sm transition-all"
                      >
                        <EyeOff className="h-3.5 w-3.5 text-primary" />
                        <span>Inspect in ZK Privacy Explorer</span>
                      </button>

                      {/* Direct Button to open transaction in Avalanche Explorer */}
                      <a
                        href={getExplorerTxUrl(lastReceipt.txHash, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-md transition-all"
                      >
                        <span>View on {selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono mb-4">
                    <div className="bg-background/80 p-3 rounded-lg border border-border">
                      <span className="text-muted-foreground block text-[10px] font-sans">Block Number</span>
                      <a
                        href={getExplorerBlockUrl(lastReceipt.blockNumber, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-foreground text-sm hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        #{lastReceipt.blockNumber}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
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

                  <div className="space-y-2 font-mono text-xs text-muted-foreground bg-background/80 p-4 rounded-xl border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>Tx Hash:</span>
                      <div className="flex items-center gap-2 text-foreground">
                        <a
                          href={getExplorerTxUrl(lastReceipt.txHash, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all font-medium inline-flex items-center gap-1"
                        >
                          {lastReceipt.txHash}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(lastReceipt.txHash)}
                          title="Copy Tx Hash"
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {copiedText === lastReceipt.txHash ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Sender:</span>
                      <a
                        href={getExplorerAddressUrl(lastReceipt.sender, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {lastReceipt.sender.slice(0, 10)}...{lastReceipt.sender.slice(-8)}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Receiver:</span>
                      <a
                        href={getExplorerAddressUrl(lastReceipt.receiver, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {lastReceipt.receiver.slice(0, 10)}...{lastReceipt.receiver.slice(-8)}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>eERC Token Contract:</span>
                      <a
                        href={getExplorerAddressUrl(deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef"), selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        {(deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef")).slice(0, 10)}...
                        <ExternalLink className="h-3 w-3 text-purple-600" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      Private Mint Utility ({selectedNetwork === "fuji" ? "Fuji C-Chain" : "Admin Only"})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Mints newly created encrypted tokens directly into the selected wallet using a Groth16 mint circuit on {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet" : "Sovereign L1"}.
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
                      {isMinting ? "Minting..." : `Mint PRIV on ${selectedNetwork === "fuji" ? "Fuji" : "L1"}`}
                    </button>
                  </div>
                </div>

                {/* Mint Receipt with Direct Explorer Links */}
                {mintReceipt && (
                  <div className="mt-4 p-4 rounded-xl border border-green-500/30 bg-green-500/5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-green-500/20">
                      <div className="flex items-center gap-2 text-green-700 font-semibold text-xs">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Mint Succeeded: {mintReceipt.amountMinted} PRIV Minted to {mintReceipt.recipient.slice(0, 10)}...</span>
                      </div>
                      {mintReceipt.txHash && (
                        <a
                          href={getExplorerTxUrl(mintReceipt.txHash, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg transition-all shadow-sm self-start sm:self-auto"
                        >
                          <span>View Mint Tx on {selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="bg-background/80 p-2.5 rounded-lg border border-border">
                        <span className="text-muted-foreground block text-[10px] font-sans">Block Number</span>
                        <a
                          href={getExplorerBlockUrl(mintReceipt.blockNumber, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          #{mintReceipt.blockNumber} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </div>
                      <div className="bg-background/80 p-2.5 rounded-lg border border-border">
                        <span className="text-muted-foreground block text-[10px] font-sans">Recipient</span>
                        <a
                          href={getExplorerAddressUrl(mintReceipt.recipient, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-foreground hover:text-primary transition-colors inline-flex items-center gap-1 truncate block"
                        >
                          {mintReceipt.recipient.slice(0, 8)}...{mintReceipt.recipient.slice(-6)}
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </a>
                      </div>
                      <div className="bg-background/80 p-2.5 rounded-lg border border-border">
                        <span className="text-muted-foreground block text-[10px] font-sans">Gas Used</span>
                        <span className="font-bold text-foreground">{parseInt(mintReceipt.gasUsed || "0").toLocaleString()} gas</span>
                      </div>
                    </div>

                    {mintReceipt.txHash && (
                      <div className="flex items-center justify-between text-xs font-mono bg-background/80 p-2.5 rounded-lg border border-border">
                        <span className="text-muted-foreground">Tx Hash:</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={getExplorerTxUrl(mintReceipt.txHash, selectedNetwork)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>{mintReceipt.txHash.slice(0, 16)}...{mintReceipt.txHash.slice(-8)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(mintReceipt.txHash)}
                            title="Copy Tx Hash"
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                          >
                            {copiedText === mintReceipt.txHash ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mintError && (
                  <div className="text-xs bg-red-500/10 text-red-700 p-3 rounded-lg border border-red-500/20 font-mono flex items-center gap-2 mt-4">
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    Mint failed: {mintError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ZK PRIVACY EXPLORER */}
          {activeTab === "explorer" && (
            <div className="max-w-5xl mx-auto">
              <ZKPrivacyExplorer
                network={selectedNetwork}
                contractAddress={deploymentData?.contracts?.encryptedERC || (selectedNetwork === "fuji" ? "0xbC4E7b37F956f5fC8EB90138cbF11E9f1731a4fe" : "0x87508677259587fa9E4b6201f1e2aE767cbb96ef")}
                blockNumber={deploymentData?.network?.blockNumber}
                onRefreshParent={() => {
                  fetchBalance(selectedWalletId, selectedNetwork);
                  fetchDeploymentStatus(selectedNetwork);
                }}
              />
            </div>
          )}

          {/* TAB 2: L1 DEPLOYMENT & INFRASTRUCTURE */}
          {activeTab === "deployment" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground font-display tracking-tight flex items-center gap-2.5">
                    <Server className="h-6 w-6 text-green-600" />
                    {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet Deployment Status" : "Avalanche L1 Devnet Deployment Status"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Live telemetry for {selectedNetwork === "fuji" ? "Avalanche Fuji C-Chain (Chain ID 43113), consensus validator configuration, and deployed confidential contracts." : "the custom sovereign Subnet-EVM, consensus validator configuration, and deployed smart contracts."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExplorerModalOpen(true)}
                    className="bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border flex items-center gap-2"
                  >
                    <Globe className="h-3.5 w-3.5 text-primary" /> Explorer Config
                  </button>
                  <button
                    onClick={() => fetchDeploymentStatus(selectedNetwork)}
                    className="bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border flex items-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
                  </button>
                </div>
              </div>

              {/* Network Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Chain ID
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-foreground">
                    {deploymentData?.network?.chainId ?? (selectedNetwork === "fuji" ? "43113" : "99999")}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    {selectedNetwork === "fuji" ? "Public Testnet (Fuji)" : "Sovereign Layer-1"}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Block Height
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-green-600">
                    #{deploymentData?.network?.blockNumber ?? "--"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    {selectedNetwork === "fuji" ? "Sub-second Finality" : "On-demand Block Production"}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Consensus
                  </span>
                  <span className="text-2xl font-extrabold font-display text-foreground">
                    {selectedNetwork === "fuji" ? "Snowman ++" : "PoA Validator"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    {selectedNetwork === "fuji" ? "Avalanche Primary Network" : "ValidatorManager in Alloc"}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    VM Runtime
                  </span>
                  <span className="text-2xl font-extrabold font-display text-primary">
                    {selectedNetwork === "fuji" ? "Coreth (EVM)" : "Subnet-EVM"}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    {selectedNetwork === "fuji" ? "Avalanche C-Chain v0.13+" : "Version v0.8.0"}
                  </span>
                </div>
              </div>

              {/* RPC and Explorer Endpoint Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Live RPC Endpoint */}
                <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {selectedNetwork === "fuji" ? "Fuji Public RPC Endpoint" : "Live L1 RPC Endpoint"}
                    </span>
                    <span className="text-[11px] text-green-600 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                      JSON-RPC 2.0 Responsive
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg border border-border/80">
                    <code className="text-xs font-mono text-foreground flex-1 break-all">
                      {deploymentData?.network?.rpcUrl || (selectedNetwork === "fuji" ? "https://api.avax-test.network/ext/bc/C/rpc" : "Resolving RPC...")}
                    </code>
                    <button
                      onClick={() => copyToClipboard(deploymentData?.network?.rpcUrl || (selectedNetwork === "fuji" ? "https://api.avax-test.network/ext/bc/C/rpc" : ""))}
                      className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy RPC URL"
                    >
                      {copiedText === (deploymentData?.network?.rpcUrl || "https://api.avax-test.network/ext/bc/C/rpc") ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Avalanche Explorer Endpoint */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Active Avalanche Explorer
                    </span>
                    <button
                      onClick={() => setIsExplorerModalOpen(true)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Settings2 className="h-3 w-3" /> Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-background/80 p-3 rounded-lg border border-primary/20">
                    <div className="overflow-hidden pr-2">
                      <span className="text-xs font-bold text-foreground block">
                        {selectedNetwork === "fuji" ? "Avalanche Fuji Testnet Explorer" : activePreset.name}
                      </span>
                      <code className="text-[11px] font-mono text-muted-foreground truncate block">
                        {selectedNetwork === "fuji" ? "https://explorer-test.avax.network" : activePreset.baseUrl}
                      </code>
                    </div>
                    <a
                      href={getExplorerHomeUrl(selectedNetwork)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 shrink-0"
                    >
                      <span>Launch</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Verified Smart Contracts Directory */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      Verified On-Chain Contract Registry ({selectedNetwork === "fuji" ? "Fuji C-Chain" : "Sovereign L1"})
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct explorer links to inspect smart contract bytecode, transactions, and state on {selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}.
                    </p>
                  </div>
                  <a
                    href={getExplorerHomeUrl(selectedNetwork)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Open Explorer Home</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-sans">
                      <tr>
                        <th className="pb-3">Contract / Component</th>
                        <th className="pb-3">Address</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3 text-right">Explorer Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {contractsList.map((contract) => (
                        <tr key={contract.name} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 font-sans font-bold text-foreground">
                            <div>{contract.name}</div>
                            <div className="text-[10px] text-muted-foreground font-normal hidden lg:block">
                              {contract.description}
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={getExplorerAddressUrl(contract.address, selectedNetwork)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${contract.address} on ${selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}`}
                                className="hover:text-primary transition-colors hover:underline"
                              >
                                {contract.address}
                              </a>
                              <button
                                onClick={() => copyToClipboard(contract.address)}
                                title="Copy contract address"
                                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedText === contract.address ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className={`py-3 font-sans ${contract.badgeClass}`}>{contract.type}</td>
                          <td className="py-3 text-right font-sans">
                            <a
                              href={getExplorerAddressUrl(contract.address, selectedNetwork)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all shadow-sm"
                              title={`View ${contract.name} on ${selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}`}
                            >
                              <span>View Contract</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
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

              {/* If Fuji, display notification explaining Precompile vs Public C-Chain */}
              {selectedNetwork === "fuji" && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-foreground text-sm">
                        Sovereign Subnet-EVM Precompile Feature
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        The TxAllowList Precompile (at <code className="font-mono text-foreground font-semibold">0x0200...0002</code>) is a custom genesis-level Subnet-EVM precompile. It intercepts and drops unauthorized transactions at the mempool layer with zero gas consumed. On public Avalanche Fuji C-Chain, transactions execute with standard EVM admission.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNetworkChange("jurisdictionChain")}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-md transition-all shrink-0"
                  >
                    Switch to Sovereign L1
                  </button>
                </div>
              )}

              {/* Interactive Address Checker */}
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <h4 className="font-bold text-foreground mb-2">Check On-Chain Role</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Query the precompile at{" "}
                  <a
                    href={getExplorerAddressUrl("0x0200000000000000000000000000000000000002", selectedNetwork)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-mono hover:underline inline-flex items-center gap-1 font-semibold"
                    title="View Precompile on Avalanche Explorer"
                  >
                    0x0200000000000000000000000000000000000002
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  directly to observe real-time authorization state.
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

                <div className="flex flex-wrap items-center gap-2 text-xs">
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
                  <div className="mt-6 p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={getExplorerAddressUrl(queryRoleResult.address, selectedNetwork)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-mono hover:underline inline-flex items-center gap-1 font-semibold"
                          title="View on Avalanche Explorer"
                        >
                          {queryRoleResult.address}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          onClick={() => copyToClipboard(queryRoleResult.address)}
                          title="Copy Address"
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                        >
                          {copiedText === queryRoleResult.address ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md self-start sm:self-auto ${
                          queryRoleResult.isPermitted
                            ? "bg-green-500/10 text-green-700 border border-green-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {queryRoleResult.roleName} (Role {queryRoleResult.role})
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {queryRoleResult.isPermitted
                        ? `✓ This address is authorized to broadcast transactions to ${selectedNetwork === "fuji" ? "Avalanche Fuji Testnet" : "Avalanche Sovereign L1"}.`
                        : "✗ Transactions from this address are rejected at the RPC pool layer with zero EVM gas consumed."}
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={getExplorerAddressUrl(queryRoleResult.address, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors"
                      >
                        <span>Inspect Address on {selectedNetwork === "fuji" ? "Fuji Explorer" : activePreset.shortName}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
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
                    <div className="font-bold text-green-800 mb-1">NexusChain Subnet-EVM (Precompile)</div>
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
                <a
                  href={getExplorerAddressUrl(account, selectedNetwork)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                >
                  <span>View Account on Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* DID Card */}
              <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Decentralized Identifier (DID)</h4>
                  </div>
                  <a
                    href={getExplorerAddressUrl(account, selectedNetwork)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg font-mono text-sm break-all text-muted-foreground border border-border/50">
                  {kycData?.did || `did:ethr:${selectedNetwork === "fuji" ? "43113" : "99999"}:${account}`}
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
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-4 w-4" />
                    <span>Anchored on-chain via:</span>
                    {kycData?.txHash ? (
                      <a
                        href={getExplorerTxUrl(kycData.txHash, selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono inline-flex items-center gap-1 font-semibold"
                        title="View Whitelist Transaction on Avalanche Explorer"
                      >
                        <span>{kycData.txHash.slice(0, 10)}...{kycData.txHash.slice(-8)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <a
                        href={getExplorerAddressUrl("0x0200000000000000000000000000000000000002", selectedNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono inline-flex items-center gap-1 font-semibold"
                      >
                        <span>TxAllowList Precompile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )}
  </div>
);
}
