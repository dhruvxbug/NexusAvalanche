import { useState } from "react";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { ComplianceDashboard } from "./components/ComplianceDashboard";

export default function App() {
	const [account, setAccount] = useState<string | null>(null);

	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-accent/30">
			<Navbar account={account} setAccount={setAccount} />
			<main className="flex-1">
				{account ? (
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
						<ComplianceDashboard account={account} />
					</div>
				) : (
					<>
						<Hero />
						<Features />
						<HowItWorks />
						<FAQ />
					</>
				)}
			</main>
			<Footer />
		</div>
	);
}
