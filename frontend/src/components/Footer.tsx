import { ArrowRight, Twitter, Github, Disc } from "lucide-react";
import { Button } from "./ui/button";

export default function Footer() {
	return (
		<footer className="relative mt-24 border-t border-border/40 bg-background pt-16 md:pt-24">
			{/* Decorative gradient */}
			<div className="absolute left-1/2 top-0 h-[300px] w-full max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-accent/10 opacity-30 blur-[120px]" />

			<div className="mx-auto max-w-6xl px-6 md:px-12 lg:px-20">
				<div className="grid gap-16 md:grid-cols-2 lg:grid-cols-12">
					{/* Brand & Newsletter */}
					<div className="flex flex-col lg:col-span-5">
						<a
							href="#"
							className="text-2xl font-semibold tracking-tight text-foreground"
						>
							✦ NexusChain
						</a>
						<p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-muted-foreground">
							The first L1 enforcing validator and user rules by region for compliance-bound use cases. Secure, private, and regulatory-ready.
						</p>

						<div className="mt-8">
							<h4 className="mb-3 font-body text-sm font-medium text-foreground">Subscribe to updates</h4>
							<div className="relative flex max-w-md items-center">
								<input
									type="email"
									placeholder="Enter your email"
									className="w-full rounded-full border border-border bg-background/50 py-3 pl-4 pr-12 font-body text-sm text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
								/>
								<Button
									size="icon"
									className="absolute right-1 h-9 w-9 rounded-full"
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* Links Grid */}
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
						<div className="flex flex-col gap-4">
							<h4 className="font-body text-sm font-semibold text-foreground">Protocol</h4>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Documentation</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Whitepaper</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Explorer</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Validator Setup</a>
						</div>
						<div className="flex flex-col gap-4">
							<h4 className="font-body text-sm font-semibold text-foreground">Ecosystem</h4>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Grants</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Brand Assets</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Blog</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Careers</a>
						</div>
						<div className="flex flex-col gap-4">
							<h4 className="font-body text-sm font-semibold text-foreground">Legal</h4>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Privacy Policy</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Terms of Service</a>
							<a href="#" className="font-body text-sm text-muted-foreground transition-colors hover:text-accent">Cookie Policy</a>
						</div>
					</div>
				</div>

				<div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-border/40 py-8 md:flex-row">
					<div className="flex items-center gap-3">
						<span className="flex h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.8)]" />
						<span className="font-body text-xs font-medium text-muted-foreground">Testnet Operational</span>
					</div>

					<p className="font-body text-xs text-muted-foreground text-center">
						© {new Date().getFullYear()} NexusChain. All rights reserved.
					</p>

					<div className="flex items-center gap-4">
						<a href="#" aria-label="Twitter" className="text-muted-foreground transition-colors hover:text-foreground">
							<Twitter className="h-4 w-4" />
						</a>
						<a href="#" aria-label="Discord" className="text-muted-foreground transition-colors hover:text-foreground">
							<Disc className="h-4 w-4" />
						</a>
						<a href="#" aria-label="GitHub" className="text-muted-foreground transition-colors hover:text-foreground">
							<Github className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
