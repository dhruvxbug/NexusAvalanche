import {
	ArrowLeftRight,
	BadgeCheck,
	Bell,
	ChevronDown,
	ChevronRight,
	Home,
	type LucideIcon,
	MoreVertical,
	Plus,
	Search,
	Settings,
	Shield,
	Lock,
	FileKey,
	UserCheck
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
	{ icon: Shield, label: "Tx Allowlist", badge: "3 New" },
	{ icon: Lock, label: "eERC Assets" },
	{ icon: FileKey, label: "Deployer Access", chevron: true },
];

const WORKFLOW_ITEMS: NavItem[] = [
	{ icon: UserCheck, label: "KYC Verifications" },
	{ icon: ArrowLeftRight, label: "Encrypted Transfers" },
	{ icon: Settings, label: "Chain Config" },
];

const QUICK_ACTIONS = [
	"Whitelist Address",
	"Issue eERC",
	"View Audit Log",
];

const ACCOUNTS: Array<[string, string]> = [
	["Private USDC (eERC)", "$12,450.00"],
	["Public AVAX", "1,250 AVAX"],
	["Compliance Bond", "$50,000.00"],
];

interface Transaction {
	date: string;
	description: string;
	amount: string;
	positive?: boolean;
	status: "Verified" | "Encrypted" | "Pending";
}

const TRANSACTIONS: Transaction[] = [
	{ date: "Just now", description: "Alice -> Bob (eERC)", amount: "Hidden", status: "Encrypted" },
	{
		date: "2m ago",
		description: "KYC Approval: 0x4a...f9",
		amount: "0.01 AVAX",
		positive: true,
		status: "Verified",
	},
	{
		date: "1h ago",
		description: "Treasury -> DAO (eERC)",
		amount: "Hidden",
		status: "Encrypted",
	},
	{
		date: "3h ago",
		description: "Deployer Access Granted",
		amount: "Authorized",
		status: "Verified",
	},
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
					Verified Status
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

function BalanceCard() {
	return (
		<div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm">
			<div className="flex items-center gap-2">
				<span className="font-medium text-foreground text-sm">Network TVL (eERC)</span>
				<BadgeCheck className="h-4 w-4 text-accent" />
			</div>
			<p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-display">
				$24,450,190<span className="text-lg text-muted-foreground font-body font-normal">.00</span>
			</p>
			<div className="mt-2 flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Encrypted Assets</span>
				<span className="text-sm font-medium text-success bg-success/10 px-2 py-0.5 rounded-md">ZK-Secured</span>
			</div>
			<svg
				viewBox="0 0 800 160"
				preserveAspectRatio="none"
				className="mt-6 h-32 w-full text-accent"
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
	);
}

function AccountsCard() {
	return (
		<div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-xl border border-border bg-background p-6 shadow-sm flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<span className="font-medium text-foreground text-sm">Active Assets</span>
				<div className="flex items-center gap-2 text-muted-foreground">
					<button className="p-1 hover:bg-secondary rounded-md transition-colors"><Plus className="h-4 w-4" /></button>
					<button className="p-1 hover:bg-secondary rounded-md transition-colors"><MoreVertical className="h-4 w-4" /></button>
				</div>
			</div>
			<div className="flex-1 flex flex-col justify-center gap-6">
				{ACCOUNTS.map(([name, amount]) => (
					<div
						key={name}
						className="flex items-center justify-between gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
					>
						<span className="text-muted-foreground text-sm font-medium">{name}</span>
						<span className="whitespace-nowrap font-bold text-foreground font-display text-lg">
							{amount}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function TransactionsTable() {
	return (
		<div className="mt-6 rounded-xl border border-border bg-background shadow-sm overflow-hidden">
			<div className="p-5 border-b border-border flex items-center justify-between bg-secondary/20">
				<h4 className="font-semibold text-foreground">Recent Network Activity</h4>
				<button className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
					View All <ChevronRight className="w-3 h-3" />
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-secondary/30">
						<tr className="text-left text-xs text-muted-foreground font-medium uppercase tracking-wider">
							<th className="px-6 py-4">Time</th>
							<th className="px-6 py-4">Action</th>
							<th className="px-6 py-4 text-right">Details</th>
							<th className="px-6 py-4 text-right">State</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{TRANSACTIONS.map((tx, idx) => (
							<tr key={idx} className="hover:bg-secondary/20 transition-colors">
								<td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{tx.date}</td>
								<td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
									{tx.description}
								</td>
								<td
									className={`px-6 py-4 text-right font-medium whitespace-nowrap ${
										tx.positive ? "text-success" : "text-foreground font-mono"
									}`}
								>
									{tx.amount}
								</td>
								<td className="px-6 py-4 text-right whitespace-nowrap">
									<span
										className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
											tx.status === "Pending"
												? "bg-warning/10 text-warning"
												: tx.status === "Encrypted" 
												? "bg-purple-500/10 text-purple-600"
												: "bg-success/10 text-success"
										}`}
									>
										{tx.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function MainContent() {
	return (
		<div className="flex-1 bg-secondary/10 p-6 md:p-8 overflow-y-auto">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-xl font-bold text-foreground font-display tracking-tight">Network Overview</h3>
				
				<div className="flex items-center gap-2">
					<span className="rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-semibold">
						Active Validators: 8
					</span>
					{QUICK_ACTIONS.map((action) => (
						<button
							key={action}
							className="rounded-full border border-border bg-background hover:bg-secondary transition-colors px-3 py-1 text-xs font-medium text-foreground shadow-sm"
						>
							{action}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col xl:flex-row gap-6">
				<BalanceCard />
				<AccountsCard />
			</div>

			<TransactionsTable />
		</div>
	);
}

export default function MainDashboard({ account }: { account: string }) {
	return (
		<div className="flex flex-col h-[800px] max-h-[85vh] w-full overflow-hidden rounded-2xl border border-border bg-background text-base shadow-sm font-body">
			<TopBar account={account} />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<MainContent />
			</div>
		</div>
	);
}
