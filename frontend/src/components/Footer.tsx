import { ArrowRight, Twitter, Github, Disc } from "lucide-react";
import { Button } from "./ui/button";

export default function Footer() {
	return (
		<footer className="w-full bg-background border-t border-border mt-24">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
					
					<div className="lg:col-span-1">
						<a
							href="#"
							className="text-xl font-display font-bold text-foreground tracking-tight flex items-center gap-2 mb-4"
						>
							<div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
								<span className="text-primary-foreground text-xs leading-none">N</span>
							</div>
							NexusChain
						</a>
						<p className="text-sm font-body text-muted-foreground leading-relaxed">
							The first L1 enforcing validator and user rules by region for compliance-bound use cases. Secure, private, and regulatory-ready.
						</p>
					</div>

					<div>
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Protocol</h4>
						<ul className="space-y-3">
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Whitepaper</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Explorer</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Validator Setup</a></li>
						</ul>
					</div>

					<div>
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Ecosystem</h4>
						<ul className="space-y-3">
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Grants</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Brand Assets</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
							<li><a href="#" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
						</ul>
					</div>

					<div>
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Stay Updated</h4>
						<div className="flex flex-col gap-3">
							<div className="relative flex items-center">
								<input
									type="email"
									placeholder="Enter your email"
									className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-body"
								/>
								<Button
									size="sm"
									className="absolute right-1 h-7 rounded-sm px-2 bg-primary text-primary-foreground"
								>
									<ArrowRight className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>

				</div>

				<div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-green-500"></span>
						<span className="font-body text-xs text-muted-foreground font-medium">Testnet Operational</span>
					</div>

					<p className="font-body text-xs text-muted-foreground">
						© {new Date().getFullYear()} NexusChain. All rights reserved.
					</p>

					<div className="flex items-center gap-4">
						<a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors">
							<Twitter className="h-4 w-4" />
						</a>
						<a href="#" aria-label="Discord" className="text-muted-foreground hover:text-foreground transition-colors">
							<Disc className="h-4 w-4" />
						</a>
						<a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition-colors">
							<Github className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
