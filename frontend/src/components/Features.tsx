import { motion } from "framer-motion";
import { ShieldCheck, Globe, Lock } from "lucide-react";

const features = [
	{
		title: "Built-in Compliance",
		description:
			"KYC checks and license requirements enforced directly at the protocol level. Validators must meet strict regional criteria.",
		icon: ShieldCheck,
	},
	{
		title: "Geofencing",
		description:
			"Node and validator routing restricted by geographical jurisdiction to ensure data never leaves permitted borders.",
		icon: Globe,
	},
	{
		title: "eERC Privacy",
		description:
			"Confidential data payload transmission that stays completely private, even within the permissioned validator set.",
		icon: Lock,
	},
];

export default function Features() {
	return (
		<section className="relative px-6 py-24 md:px-12 lg:px-20 border-t border-border/40">
			<div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
			<div className="relative z-10 mx-auto max-w-6xl">
				<div className="text-center">
					<h2 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
						Protocol-Level Rules
					</h2>
					<p className="mt-4 text-base text-muted-foreground md:text-lg">
						The ultimate foundation for compliance-bound use cases.
					</p>
				</div>

				<div className="mt-16 grid gap-8 md:grid-cols-3">
					{features.map((feature, i) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: i * 0.1 }}
								className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm transition-all hover:border-border hover:bg-secondary/20 hover:shadow-lg"
							>
								<div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
									<Icon className="h-6 w-6" />
								</div>
								<h3 className="mb-3 font-display text-2xl text-foreground">
									{feature.title}
								</h3>
								<p className="font-body text-sm leading-relaxed text-muted-foreground">
									{feature.description}
								</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
