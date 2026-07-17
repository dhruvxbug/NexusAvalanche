import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-accent/30">
			<Navbar />
			<main className="flex-1">
				<Hero />
				<Features />
				<HowItWorks />
				<FAQ />
			</main>
			<Footer />
		</div>
	);
}
