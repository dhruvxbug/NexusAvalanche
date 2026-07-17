export default function Footer() {
	return (
		<footer className="border-t border-border/50 bg-background/50 px-6 py-12 md:px-12 lg:px-20">
			<div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 md:flex-row md:items-end">
				<div>
					<a
						href="#"
						className="text-xl font-semibold tracking-tight text-foreground"
					>
						✦ NexusChain
					</a>
					<p className="mt-4 max-w-xs font-body text-sm text-muted-foreground">
						The first L1 enforcing validator and user rules by region for compliance-bound use cases.
					</p>
				</div>
				
				<div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
					<div className="flex flex-col gap-3">
						<h4 className="font-semibold text-foreground">Protocol</h4>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Whitepaper</a>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explorer</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-semibold text-foreground">Community</h4>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</a>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
					</div>
					<div className="flex flex-col gap-3">
						<h4 className="font-semibold text-foreground">Legal</h4>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
						<a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
					</div>
				</div>
			</div>
			
			<div className="mx-auto mt-12 max-w-6xl border-t border-border/50 pt-8 text-center md:text-left">
				<p className="text-xs text-muted-foreground">
					© {new Date().getFullYear()} NexusChain. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
