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
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
	const [account, setAccount] = useState<string | null>(null);
	const [isWhitelisted, setIsWhitelisted] = useState<boolean>(true);

	const [currentRole, setCurrentRole] = useState<"transactor" | "auditor">("transactor");

	const connectWallet = async () => {
		if ((window as any).ethereum) {
			try {
				const provider = new ethers.BrowserProvider((window as any).ethereum);
				const accounts = await provider.send("eth_requestAccounts", []);
				const addr = accounts[0];
				setAccount(addr);
				setIsWhitelisted(true);
			} catch (err) {
				console.error("User denied account access");
			}
		} else {
			// Fallback to demo account if metamask is not present
			connectDemo("transactor");
		}
	};

	const connectDemo = (role: "transactor" | "auditor" = "transactor") => {
		const demoAddr =
			role === "transactor"
				? "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f"
				: "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2";
		setCurrentRole(role);
		setAccount(demoAddr);
		setIsWhitelisted(true);
	};

	const handleRoleChange = (newRole: "transactor" | "auditor") => {
		setCurrentRole(newRole);
		setAccount(
			newRole === "transactor"
				? "0xA1602f982E36ca8294e0f7B32b2054f28aa6317f"
				: "0xDD277E775eaC72bA469Cd9dcE30921974d8f4eD2"
		);
	};

	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-accent/30">
			<Navbar
				account={account}
				setAccount={setAccount}
				connectWallet={connectWallet}
				connectDemo={connectDemo}
				currentRole={currentRole}
				onRoleChange={handleRoleChange}
			/>
			<main className="flex-1">
				{account ? (
					<ErrorBoundary>
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-12">
							{isWhitelisted ? (
								<MainDashboard
									account={account}
									currentRole={currentRole}
									onRoleChange={handleRoleChange}
								/>
							) : (
								<ComplianceDashboard account={account} onVerify={() => setIsWhitelisted(true)} />
							)}
						</div>
					</ErrorBoundary>
				) : (
					<>
						<Hero connectWallet={connectWallet} connectDemo={connectDemo} />
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
