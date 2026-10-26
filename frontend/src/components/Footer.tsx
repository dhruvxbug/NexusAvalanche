import { useState } from "react";
import { ArrowRight, Github, Check } from "lucide-react";
import { Button } from "./ui/button";

function NewsletterForm() {
	const [email, setEmail] = useState("");
	const [subscribed, setSubscribed] = useState(false);

	if (subscribed) {
		return (
			<div className="flex items-center gap-2 font-body text-sm text-muted-foreground">
				<Check className="h-4 w-4 text-green-600" />
				You're on the list. We'll be in touch.
			</div>
		);
	}

	return (
		<form
			className="relative flex items-center"
			onSubmit={(e) => {
				e.preventDefault();
				if (email.trim()) setSubscribed(true);
			}}
		>
			<input
				type="email"
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-body"
			/>
			<Button
				type="submit"
				size="sm"
				className="absolute right-1 h-7 rounded-sm px-2 bg-primary text-primary-foreground"
			>
				<ArrowRight className="h-3 w-3" />
			</Button>
		</form>
	);
}

export default function Footer() {
	return (
		<footer className="w-full bg-background border-t border-border mt-24">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
					
					<div className="lg:col-span-1">
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault();
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
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
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Product</h4>
						<ul className="space-y-3">
							<li><a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
							<li><a href="#how-it-works" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
							<li><a href="#faq" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
						</ul>
					</div>

					<div>
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Protocol Stack</h4>
						<ul className="space-y-3">
							<li><a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Native Compliance Precompiles</a></li>
							<li><a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">eERC Confidential Payments</a></li>
							<li><a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">DID &amp; Verifiable Credentials</a></li>
							<li><a href="#features" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Cross-Chain Identity (CCIP)</a></li>
						</ul>
					</div>

					<div>
						<h4 className="font-body text-sm font-semibold text-foreground mb-4">Stay Updated</h4>
						<NewsletterForm />
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
						<a
							href="https://github.com/dhruvxbug/NexusAvalanche"
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<Github className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
