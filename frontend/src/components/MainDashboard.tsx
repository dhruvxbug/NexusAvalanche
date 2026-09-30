import { useState, useEffect } from "react";
import {
	ArrowLeftRight,
	BadgeCheck,
	Bell,
	ChevronDown,
	ChevronRight,
	Home,
	type LucideIcon,
	Search,
	Settings,
	Shield,
	Lock,
	FileKey,
	UserCheck,
    Fingerprint,
    Database,
    Link as LinkIcon
} from "lucide-react";

interface NavItem {
	icon: LucideIcon;
	label: string;
	active?: boolean;
	badge?: string;
	chevron?: boolean;
}

const NAV_ITEMS: NavItem[] = [
	{ icon: Home, label: "Overview", active: true },
	{ icon: Shield, label: "Tx Allowlist" },
	{ icon: Lock, label: "eERC Assets" },
	{ icon: FileKey, label: "Deployer Access", chevron: true },
];

const WORKFLOW_ITEMS: NavItem[] = [
	{ icon: UserCheck, label: "KYC Verifications" },
	{ icon: ArrowLeftRight, label: "Encrypted Transfers" },
	{ icon: Settings, label: "Chain Config" },
];

const CHART_CURVE =
	"M0 124 C60 116, 100 80, 170 88 C240 96, 280 128, 350 112 C420 96, 450 48, 520 56 C590 64, 630 100, 690 76 C730 52, 770 32, 800 24";

function SidebarLink({ icon: Icon, label, active, badge, chevron }: NavItem) {
	return (
		<button
			className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
				active
					? "bg-secondary font-medium text-foreground"
					: "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
			}`}
		>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="truncate">{label}</span>
			{badge && (
				<span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground border border-border">
					{badge}
				</span>
			)}
			{chevron && <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-50" />}
		</button>
	);
}

function TopBar({ account }: { account: string }) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 bg-background">
			<div className="flex shrink-0 items-center gap-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-primary-foreground text-lg">
					N
				</div>
				<span className="font-semibold text-foreground text-lg tracking-tight font-display">NexusChain</span>
				<ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
			</div>

			<div className="hidden max-w-[400px] flex-1 items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-muted-foreground sm:flex border border-border/50">
				<Search className="h-4 w-4 shrink-0" />
				<input 
					type="text"
					placeholder="Search addresses, blocks..."
					className="flex-1 bg-transparent outline-none text-sm font-body text-foreground placeholder:text-muted-foreground"
				/>
				<span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">
					⌘K
				</span>
			</div>

			<div className="flex shrink-0 items-center gap-4">
				<span className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 font-medium text-green-600 text-xs flex items-center gap-1.5">
					<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
					Network Active
				</span>
				<Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border text-xs font-semibold text-foreground font-mono">
					{account.slice(2, 4).toUpperCase()}
				</div>
			</div>
		</div>
	);
}

function Sidebar() {
	return (
		<aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-border p-4 md:flex bg-background font-body">
			<div className="space-y-1">
				{NAV_ITEMS.map((item) => (
					<SidebarLink key={item.label} {...item} />
				))}
			</div>
			
			<div className="mt-8">
				<p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Compliance Tools
				</p>
				<div className="space-y-1">
					{WORKFLOW_ITEMS.map((item) => (
						<SidebarLink key={item.label} {...item} />
					))}
				</div>
			</div>
		</aside>
	);
}

// `account` remains part of the public prop type and is still passed by the
// parent, but this panel derives everything it renders from `kycData`.
function MainContent({ kycData }: { account: string, kycData: any }) {
    const isWhitelisted = kycData?.isWhitelisted;
    const did = kycData?.did || "Pending DID Issue...";
    const vcJwt = kycData?.vcJwt;
    const ipfsCid = kycData?.ipfsCid || "No Encrypted Payload Found";
    
    const [vcValid, setVcValid] = useState<boolean | null>(null);

    const verifyVc = async () => {
        if (!vcJwt) return;
        try {
            const response = await fetch(`http://localhost:3001/api/kyc/vc/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vcJwt })
            });
            const data = await response.json();
            setVcValid(data.isValid);
        } catch (error) {
            console.error(error);
        }
    };

	return (
		<div className="flex-1 bg-secondary/10 p-6 md:p-8 overflow-y-auto">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-xl font-bold text-foreground font-display tracking-tight">Compliance & Identity Overview</h3>
				
				<div className="flex items-center gap-2">
					<span className={`rounded-full px-3 py-1 text-xs font-semibold ${isWhitelisted ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
						{isWhitelisted ? 'Whitelist: ACTIVE' : 'Whitelist: INACTIVE'}
					</span>
				</div>
			</div>

            {/* Compliance Identity Panel */}
			<div className="flex flex-col gap-6 mb-8">
                <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Fingerprint className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Decentralized Identifier (DID)</h4>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-lg font-mono text-sm break-all text-muted-foreground border border-border/50">
                        {did}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BadgeCheck className="h-5 w-5 text-accent" />
                            <h4 className="font-semibold text-foreground">Verifiable Credential (VC)</h4>
                        </div>
                        {vcJwt ? (
                            <div className="space-y-4">
                                <div className="bg-secondary/30 p-4 rounded-lg font-mono text-xs break-all text-muted-foreground overflow-hidden max-h-32 relative border border-border/50">
                                    {vcJwt}
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-secondary/30 to-transparent" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={verifyVc} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                                        Verify Cryptographic Signature
                                    </button>
                                    {vcValid !== null && (
                                        <span className={`text-sm font-medium ${vcValid ? 'text-green-600' : 'text-red-600'}`}>
                                            {vcValid ? '✓ Signature Valid' : '✗ Invalid Signature'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">No Verifiable Credential issued yet.</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-blue-500" />
                            <h4 className="font-semibold text-foreground">IPFS Encrypted Storage</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Your KYC documents are encrypted via AES-256-GCM and stored off-chain.
                        </p>
                        <div className="bg-secondary/30 p-4 rounded-lg font-mono text-sm break-all text-muted-foreground border border-border/50">
                            CID: {ipfsCid}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <LinkIcon className="h-4 w-4" /> Anchored on-chain via TxAllowList TX
                        </div>
                    </div>
                </div>
			</div>

            {/* Financial Overview Mock */}
			<div className="flex flex-col xl:flex-row gap-6">
                <div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">Active Wallet Balance (eERC)</span>
                        <Lock className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-display">
                        [ Encrypted ]
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">ElGamal / Groth16</span>
                    </div>
                    <svg
                        viewBox="0 0 800 160"
                        preserveAspectRatio="none"
                        className="mt-6 h-32 w-full text-purple-500/30"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id="balance-fill-main" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={`${CHART_CURVE} L800 160 L0 160 Z`} fill="url(#balance-fill-main)" />
                        <path
                            d={CHART_CURVE}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
			</div>

		</div>
	);
}

export default function MainDashboard({ account }: { account: string }) {
    const [kycData, setKycData] = useState<any>(null);

    useEffect(() => {
        if (!account) return;
        fetch(`http://localhost:3001/api/kyc/status/${account}`)
            .then(res => res.json())
            .then(data => setKycData(data))
            .catch(console.error);
    }, [account]);

	return (
		<div className="flex flex-col h-[800px] max-h-[85vh] w-full overflow-hidden rounded-2xl border border-border bg-background text-base shadow-sm font-body">
			<TopBar account={account} />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<MainContent account={account} kycData={kycData} />
			</div>
		</div>
	);
}
