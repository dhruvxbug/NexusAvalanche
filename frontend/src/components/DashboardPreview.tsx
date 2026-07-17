import {
	ArrowLeftRight,
	ArrowUpRight,
	BadgeCheck,
	Bell,
	ChevronDown,
	ChevronRight,
	CreditCard,
	Home,
	Landmark,
	ListChecks,
	type LucideIcon,
	MoreVertical,
	Plus,
	Route,
	Search,
	Send,
	Settings,
	Wallet,
} from "lucide-react";

interface NavItem {
	icon: LucideIcon;
	label: string;
	active?: boolean;
	badge?: string;
	chevron?: boolean;
}

const NAV_ITEMS: NavItem[] = [
	{ icon: Home, label: "Home", active: true },
	{ icon: ListChecks, label: "Tasks", badge: "10" },
	{ icon: ArrowLeftRight, label: "Transactions" },
	{ icon: ArrowUpRight, label: "Payments", chevron: true },
	{ icon: CreditCard, label: "Cards" },
	{ icon: Landmark, label: "Capital" },
	{ icon: Wallet, label: "Accounts", chevron: true },
];

const WORKFLOW_ITEMS: NavItem[] = [
	{ icon: Route, label: "Trake rutes" },
	{ icon: Send, label: "Payments" },
	{ icon: Bell, label: "Notifications" },
	{ icon: Settings, label: "Settings" },
];

const QUICK_ACTIONS = [
	"Request",
	"Transfer",
	"Deposit",
	"Pay Bill",
	"Create Invoice",
];

const ACCOUNTS: Array<[string, string]> = [
	["Credit", "$98,125.50"],
	["Treasury", "$6,750,200.00"],
	["Operations", "$1,592,864.82"],
];

interface Transaction {
	date: string;
	description: string;
	amount: string;
	positive?: boolean;
	status: "Pending" | "Completed";
}

const TRANSACTIONS: Transaction[] = [
	{ date: "Jun 10", description: "AWS", amount: "-$5,200", status: "Pending" },
	{
		date: "Jun 09",
		description: "Client Payment",
		amount: "+$125,000",
		positive: true,
		status: "Completed",
	},
	{
		date: "Jun 08",
		description: "Payroll",
		amount: "-$85,450",
		status: "Completed",
	},
	{
		date: "Jun 06",
		description: "Office Supplies",
		amount: "-$1,200",
		status: "Completed",
	},
];

const CHART_CURVE =
	"M0 62 C30 58, 50 40, 85 44 C120 48, 140 64, 175 56 C210 48, 225 24, 260 28 C295 32, 315 50, 345 38 C365 26, 385 16, 400 12";

function SidebarLink({ icon: Icon, label, active, badge, chevron }: NavItem) {
	return (
		<div
			className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
				active
					? "bg-secondary font-medium text-foreground"
					: "text-muted-foreground"
			}`}
		>
			<Icon className="h-3 w-3 shrink-0" />
			<span className="truncate">{label}</span>
			{badge && (
				<span className="ml-auto rounded-full bg-secondary px-1.5 py-px text-[9px] font-medium text-secondary-foreground">
					{badge}
				</span>
			)}
			{chevron && <ChevronRight className="ml-auto h-3 w-3 shrink-0" />}
		</div>
	);
}

function TopBar() {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-border px-3 py-2">
			<div className="flex shrink-0 items-center gap-1.5">
				<div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary font-display text-primary-foreground">
					N
				</div>
				<span className="font-medium text-foreground">Nexora</span>
				<ChevronDown className="h-3 w-3 text-muted-foreground" />
			</div>

			<div className="hidden max-w-[260px] flex-1 items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-muted-foreground sm:flex">
				<Search className="h-3 w-3 shrink-0" />
				<span className="flex-1">Search</span>
				<span className="rounded border border-border bg-background px-1 text-[9px]">
					⌘K
				</span>
			</div>

			<div className="flex shrink-0 items-center gap-2.5">
				<span className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground">
					Move Money
				</span>
				<Bell className="h-3.5 w-3.5 text-muted-foreground" />
				<div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[9px] font-semibold text-accent">
					JB
				</div>
			</div>
		</div>
	);
}

function Sidebar() {
	return (
		<aside className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-border p-2 md:flex">
			{NAV_ITEMS.map((item) => (
				<SidebarLink key={item.label} {...item} />
			))}
			<p className="mt-3 px-2 pb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
				Workflows
			</p>
			{WORKFLOW_ITEMS.map((item) => (
				<SidebarLink key={item.label} {...item} />
			))}
		</aside>
	);
}

function BalanceCard() {
	return (
		<div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-lg border border-border bg-background p-3">
			<div className="flex items-center gap-1">
				<span className="font-medium text-foreground">Mercury Balance</span>
				<BadgeCheck className="h-3 w-3 text-accent" />
			</div>
			<p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
				$8,450,190<span className="text-xs text-muted-foreground">.32</span>
			</p>
			<div className="mt-1 flex items-center gap-3">
				<span className="text-muted-foreground">Last 30 Days</span>
				<span className="font-medium text-success">+$1.8M</span>
				<span className="font-medium text-destructive">-$900K</span>
			</div>
			<svg
				viewBox="0 0 400 80"
				preserveAspectRatio="none"
				className="mt-2 h-20 w-full text-accent"
				aria-hidden="true"
			>
				<defs>
					<linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
						<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
					</linearGradient>
				</defs>
				<path d={`${CHART_CURVE} L400 80 L0 80 Z`} fill="url(#balance-fill)" />
				<path
					d={CHART_CURVE}
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</svg>
		</div>
	);
}

function AccountsCard() {
	return (
		<div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-lg border border-border bg-background p-3">
			<div className="flex items-center justify-between">
				<span className="font-medium text-foreground">Accounts</span>
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<Plus className="h-3 w-3" />
					<MoreVertical className="h-3 w-3" />
				</div>
			</div>
			<div className="mt-1">
				{ACCOUNTS.map(([name, amount]) => (
					<div
						key={name}
						className="flex items-center justify-between gap-2 py-3 text-xs"
					>
						<span className="text-muted-foreground">{name}</span>
						<span className="whitespace-nowrap font-medium text-foreground">
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
		<div className="mt-3 rounded-lg border border-border bg-background p-3">
			<h4 className="font-medium text-foreground">Recent Transactions</h4>
			<table className="mt-2 w-full">
				<thead>
					<tr className="text-left text-[10px] text-muted-foreground">
						<th className="py-1 font-normal">Date</th>
						<th className="py-1 font-normal">Description</th>
						<th className="py-1 text-right font-normal">Amount</th>
						<th className="py-1 text-right font-normal">Status</th>
					</tr>
				</thead>
				<tbody>
					{TRANSACTIONS.map((tx) => (
						<tr key={tx.description}>
							<td className="py-1.5 text-muted-foreground">{tx.date}</td>
							<td className="py-1.5 font-medium text-foreground">
								{tx.description}
							</td>
							<td
								className={`py-1.5 text-right font-medium ${
									tx.positive ? "text-success" : "text-foreground"
								}`}
							>
								{tx.amount}
							</td>
							<td className="py-1.5 text-right">
								<span
									className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
										tx.status === "Pending"
											? "bg-warning/10 text-warning"
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
	);
}

function MainContent() {
	return (
		<div className="flex-1 bg-secondary/30 p-3 md:p-4">
			<h3 className="text-sm font-semibold text-foreground">Welcome, Jane</h3>

			<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
				<span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-accent-foreground">
					Send
				</span>
				{QUICK_ACTIONS.map((action) => (
					<span
						key={action}
						className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground"
					>
						{action}
					</span>
				))}
				<span className="ml-auto text-[10px] text-muted-foreground">
					Customize
				</span>
			</div>

			<div className="mt-3 flex gap-3">
				<BalanceCard />
				<AccountsCard />
			</div>

			<TransactionsTable />
		</div>
	);
}

export default function DashboardPreview() {
	return (
		<div className="select-none overflow-hidden rounded-xl border border-border/60 bg-background text-[11px] pointer-events-none">
			<TopBar />
			<div className="flex">
				<Sidebar />
				<MainContent />
			</div>
		</div>
	);
}
