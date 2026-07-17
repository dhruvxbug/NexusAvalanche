import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
	{
		question: "How does the L1 enforce regional rules?",
		answer:
			"The protocol integrates KYC checks, geofencing, and licensing requirements directly into the consensus layer. Validators that do not meet the criteria for a specific region cannot participate in that region's block production.",
	},
	{
		question: "What is eERC and why is it used?",
		answer:
			"eERC allows for encrypted, confidential payloads. Even though the network is a permissioned set of validators, eERC ensures that actual user data remains private and unreadable to the validators themselves.",
	},
	{
		question: "Can I run a node from anywhere?",
		answer:
			"No. Node deployment is strictly geofenced based on regulatory boundaries. You must complete KYC and provide proof of location to participate as a validator in a specific jurisdiction.",
	},
	{
		question: "Is this compatible with existing EVM tooling?",
		answer:
			"Yes, the Jurisdiction-Aware Chain maintains EVM compatibility while extending the protocol to handle compliance-specific precompiles and eERC transactions.",
	},
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-b border-border/50">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-muted-foreground"
			>
				<span className="font-display text-xl text-foreground md:text-2xl">
					{question}
				</span>
				<ChevronDown
					className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<p className="pb-6 pr-8 font-body text-muted-foreground">
							{answer}
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default function FAQ() {
	return (
		<section className="px-6 py-24 md:px-12 lg:px-20">
			<div className="mx-auto max-w-3xl">
				<div className="mb-12 text-center">
					<h2 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
						Frequently Asked Questions
					</h2>
				</div>
				<div className="divide-y divide-border/50 border-t border-border/50">
					{FAQS.map((faq) => (
						<FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
					))}
				</div>
			</div>
		</section>
	);
}
