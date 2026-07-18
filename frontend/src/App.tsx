import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { ComplianceDashboard } from "./components/ComplianceDashboard";

export default function App() {
	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-accent/30">
			<Navbar />
			<main className="flex-1">
				<Hero />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
					<ComplianceDashboard />
				</div>
				<Features />
				<HowItWorks />
				<FAQ />
			</main>
			<Footer />
		</div>
	);
}
