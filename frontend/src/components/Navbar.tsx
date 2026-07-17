import { Button } from "./ui/button";

const NAV_LINKS = ["Features", "How It Works", "FAQ", "Docs"];

export default function Navbar() {
	return (
		<header className="relative z-20 flex items-center justify-between px-6 py-5 font-body md:px-12 lg:px-20">
			<a
				href="#"
				className="text-xl font-semibold tracking-tight text-foreground"
			>
				✦ NexusChain
			</a>

			<div className="flex items-center gap-8">
				<nav className="hidden items-center gap-8 md:flex" aria-label="Main">
					{NAV_LINKS.map((link) => (
						<a
							key={link}
							href="#"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{link}
						</a>
					))}
				</nav>
				<Button className="rounded-full px-5 text-sm font-medium">
					Build Now
				</Button>
			</div>
		</header>
	);
}
