import { motion } from "framer-motion";
import { Network, Server, UserCheck, Key } from "lucide-react";

const steps = [
	{
		title: "Verify Identity",
		description: "Validators and users undergo mandatory KYC and licensing checks.",
		icon: UserCheck,
	},
	{
		title: "Determine Jurisdiction",
		description: "Nodes are routed strictly according to geographical compliance boundaries.",
		icon: Server,
	},
	{
		title: "Establish Consensus",
		description: "The L1 network enforces validator rules natively before blocks are proposed.",
		icon: Network,
	},
	{
		title: "Secure with eERC",
		description: "Sensitive payload data is encrypted and remains private within the set.",
		icon: Key,
	},
];

export default function HowItWorks() {
	return (
		<section className="px-6 py-24 md:px-12 lg:px-20 bg-secondary/5">
			<div className="mx-auto max-w-5xl">
				<div className="mb-16 text-center">
					<h2 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
						How the Chain Works
					</h2>
					<p className="mt-4 text-base text-muted-foreground md:text-lg">
						A seamless pipeline from compliance verification to private execution.
					</p>
				</div>

				<div className="relative">
					<div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/50 hidden md:block" />
					
					<div className="space-y-12 md:space-y-0">
						{steps.map((step, i) => {
							const Icon = step.icon;
							const isEven = i % 2 === 0;
							
							return (
								<motion.div
									key={step.title}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5, delay: i * 0.15 }}
									className={`relative flex flex-col md:flex-row items-center gap-8 ${
										isEven ? "md:flex-row" : "md:flex-row-reverse"
									}`}
								>
									<div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}>
										<h3 className="mb-2 font-display text-2xl text-foreground">
											{step.title}
										</h3>
										<p className="font-body text-muted-foreground">
											{step.description}
										</p>
									</div>

									<div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm">
										<Icon className="h-6 w-6 text-foreground" />
									</div>

									<div className="flex-1 hidden md:block" />
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
