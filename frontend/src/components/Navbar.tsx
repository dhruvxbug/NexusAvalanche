import { Globe, ExternalLink, Building2, ShieldCheck } from "lucide-react";
import { useExplorer } from "../lib/explorer";

const NAV_LINKS = [
	{ label: "Features", href: "#features" },
	{ label: "How It Works", href: "#how-it-works" },
	{ label: "FAQ", href: "#faq" },
];

export default function Navbar({
	account,
	setAccount,
	connectWallet,
	connectDemo = () => {},
	currentRole = "transactor",
	onRoleChange = () => {},
}: {
	account: string | null;
	setAccount: (acct: string | null) => void;
	connectWallet: () => void;
	connectDemo?: (role: "transactor" | "auditor") => void;
	currentRole?: "transactor" | "auditor";
	onRoleChange?: (role: "transactor" | "auditor") => void;
}) {
	const { activePreset, getExplorerAddressUrl, getExplorerHomeUrl } = useExplorer();

	return (
		<header className="w-full bg-background border-b border-border sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					
					{/* Logo */}
					<div className="flex-shrink-0">
						<a
							href="#"
							onClick={() => setAccount(null)}
							className="text-xl font-display font-bold text-foreground tracking-tight flex items-center gap-2"
						>
							<div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
								<span className="text-primary-foreground text-xs leading-none">N</span>
							</div>
							NexusChain
						</a>
					</div>

					{/* Navigation Links */}
					<nav className="hidden md:flex space-x-8 items-center">
						{NAV_LINKS.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors font-body"
							>
								{link.label}
							</a>
						))}
						{/* Direct Avalanche Explorer Nav Link */}
						<a
							href={getExplorerHomeUrl()}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors font-body inline-flex items-center gap-1"
							title={`Open ${activePreset.name} in a new tab`}
						>
							<span>Avalanche Explorer</span>
							<ExternalLink className="h-3 w-3 text-muted-foreground" />
						</a>
					</nav>

					{/* Wallet Actions & Role Switcher */}
					<div className="flex items-center gap-3">
						{/* Explorer Link Button (Mobile / Quick access) */}
						<a
							href={getExplorerHomeUrl()}
							target="_blank"
							rel="noopener noreferrer"
							className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-colors"
							title={`Open ${activePreset.name}`}
						>
							<Globe className="h-3.5 w-3.5" />
							<span>{activePreset.shortName}</span>
							<ExternalLink className="h-3 w-3" />
						</a>

						{account ? (
							<div className="flex items-center gap-2.5">
								{/* Interactive Role Switcher in Navbar */}
								<div className="hidden sm:flex items-center rounded-lg border border-border bg-secondary/50 p-1 text-xs">
									<button
										onClick={() => onRoleChange("transactor")}
										className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
											currentRole === "transactor"
												? "bg-primary text-primary-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
										title="Switch to Enterprise Transactor (User 1)"
									>
										<Building2 className="h-3 w-3" />
										<span>Transactor</span>
									</button>
									<button
										onClick={() => onRoleChange("auditor")}
										className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
											currentRole === "auditor"
												? "bg-emerald-600 text-white shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
										title="Switch to Regulatory Auditor (User 2)"
									>
										<ShieldCheck className="h-3 w-3" />
										<span>Auditor</span>
									</button>
								</div>

								<a
									href={getExplorerAddressUrl(account)}
									target="_blank"
									rel="noopener noreferrer"
									title={`View account ${account} on ${activePreset.shortName}`}
									className="hidden md:flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md border border-border transition-colors group"
								>
									<span className={`w-2 h-2 rounded-full ${currentRole === "auditor" ? "bg-emerald-500" : "bg-green-500"}`}></span>
									<span className="text-xs font-mono text-foreground font-medium group-hover:text-primary transition-colors">
										{`${account.slice(0, 6)}...${account.slice(-4)}`}
									</span>
									<ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
								</a>
								<button 
									onClick={() => setAccount(null)}
									className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors font-body px-2 py-1"
								>
									Disconnect
								</button>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<button 
									onClick={() => connectDemo("transactor")} 
									className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md text-xs font-semibold border border-border transition-colors font-body shadow-sm flex items-center gap-1.5"
								>
									<Building2 className="h-3.5 w-3.5 text-primary" />
									<span>Transactor</span>
								</button>
								<button 
									onClick={() => connectDemo("auditor")} 
									className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors font-body shadow-sm flex items-center gap-1.5"
								>
									<ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
									<span>Auditor</span>
								</button>
								<button 
									onClick={connectWallet} 
									className="bg-primary text-primary-foreground px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 transition-colors font-body shadow-sm"
								>
									Connect
								</button>
							</div>
						)}
					</div>

				</div>
			</div>
		</header>
	);
}
