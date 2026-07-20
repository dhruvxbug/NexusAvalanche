import { useState } from "react";
import { ethers } from "ethers";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import { ComplianceDashboard } from "./components/ComplianceDashboard";
import MainDashboard from "./components/MainDashboard";

export default function App() {
	const [account, setAccount] = useState<string | null>(null);
	const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);

	const connectWallet = async () => {
		if ((window as any).ethereum) {
			try {
				const provider = new ethers.BrowserProvider((window as any).ethereum);
				const accounts = await provider.send("eth_requestAccounts", []);
				const addr = accounts[0];
				setAccount(addr);
				
				// Reset whitelist state on new connection
				setIsWhitelisted(false);
			} catch (err) {
				console.error("User denied account access");
			}
		} else {
			alert("Please install MetaMask!");
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-accent/30">
			<Navbar account={account} setAccount={setAccount} connectWallet={connectWallet} />
			<main className="flex-1">
				{account ? (
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
						{isWhitelisted ? (
							<MainDashboard account={account} />
						) : (
							<ComplianceDashboard account={account} onVerify={() => setIsWhitelisted(true)} />
						)}
					</div>
				) : (
					<>
						<Hero connectWallet={connectWallet} />
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
