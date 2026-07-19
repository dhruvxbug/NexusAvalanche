import { ethers } from "ethers";

const NAV_LINKS = ["Features", "How It Works", "FAQ", "Docs"];

export default function Navbar({ account, setAccount }: { account: string | null; setAccount: (acct: string | null) => void }) {
	const connectWallet = async () => {
		if ((window as any).ethereum) {
			try {
				const provider = new ethers.BrowserProvider((window as any).ethereum);
				const accounts = await provider.send("eth_requestAccounts", []);
				setAccount(accounts[0]);
			} catch (err) {
				console.error("User denied account access");
			}
		} else {
			alert("Please install MetaMask!");
		}
	};

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
					<nav className="hidden md:flex space-x-8">
						{NAV_LINKS.map((link) => (
							<a
								key={link}
								href="#"
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors font-body"
							>
								{link}
							</a>
						))}
					</nav>

					{/* Wallet Actions */}
					<div className="flex items-center">
						{account ? (
							<div className="flex items-center gap-4">
								<div className="hidden sm:flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md border border-border">
									<span className="w-2 h-2 rounded-full bg-green-500"></span>
									<span className="text-sm font-mono text-foreground font-medium">
										{`${account.slice(0, 6)}...${account.slice(-4)}`}
									</span>
								</div>
								<button 
									onClick={() => setAccount(null)}
									className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors font-body"
								>
									Disconnect
								</button>
							</div>
						) : (
							<button 
								onClick={connectWallet} 
								className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors font-body shadow-sm"
							>
								Connect Wallet
							</button>
						)}
					</div>

				</div>
			</div>
		</header>
	);
}
