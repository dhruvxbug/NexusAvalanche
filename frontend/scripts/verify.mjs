/**
 * CLI verification for the Nexora automation hero.
 * Run: node scripts/verify.mjs (expects `vite preview` serving dist, default port 4173)
 */
import { chromium } from "playwright";

const BASE_URL = process.env.VERIFY_URL ?? "http://localhost:4173";
let failures = 0;

function check(name, condition, detail = "") {
	const ok = Boolean(condition);
	if (!ok) failures += 1;
	console.log(
		`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : ` — ${detail}`}`,
	);
	return ok;
}

const browser = await chromium.launch();

// ---------- Desktop (1440x900) ----------
const desktop = await browser.newPage({
	viewport: { width: 1440, height: 900 },
});
const pageErrors = [];
desktop.on("pageerror", (err) => pageErrors.push(err.message));
await desktop.goto(BASE_URL, { waitUntil: "networkidle" });
await desktop.waitForTimeout(1800); // let all framer-motion entrances settle

check(
	"No uncaught page errors",
	pageErrors.length === 0,
	pageErrors.join("; "),
);

// Page layout: exactly 100vh, no scroll
check(
	"Body does not scroll (height <= viewport)",
	await desktop.evaluate(
		() => document.body.scrollHeight <= window.innerHeight,
	),
);
const rootDiv = desktop.locator("#root > div");
check(
	"Page wrapper is h-screen + overflow-hidden",
	await rootDiv.evaluate((el) => {
		const s = getComputedStyle(el);
		return (
			el.getBoundingClientRect().height === window.innerHeight &&
			s.overflow === "hidden" &&
			s.display === "flex" &&
			s.flexDirection === "column"
		);
	}),
);

// Background video
const video = desktop.locator("video");
check("Video element present", (await video.count()) === 1);
check(
	"Video src is the CloudFront mp4",
	(await video.getAttribute("src"))?.includes("d8j0ntlcm91z4.cloudfront.net"),
);
check(
	"Video autoplay/muted/loop/playsinline",
	await video.evaluate((v) => v.autoplay && v.muted && v.loop && v.playsInline),
);
check(
	"Video covers hero (absolute, object-cover, z-0)",
	await video.evaluate((v) => {
		const s = getComputedStyle(v);
		return (
			s.position === "absolute" && s.objectFit === "cover" && s.zIndex === "0"
		);
	}),
);

// Design tokens
const vars = await desktop.evaluate(() => {
	const s = getComputedStyle(document.documentElement);
	const get = (n) => s.getPropertyValue(n).trim();
	return {
		background: get("--background"),
		foreground: get("--foreground"),
		accent: get("--accent"),
		border: get("--border"),
		ring: get("--ring"),
		radius: get("--radius"),
		display: get("--font-display"),
		body: get("--font-body"),
		shadow: get("--shadow-dashboard"),
	};
});
check("--background token", vars.background === "0 0% 100%");
check("--foreground token", vars.foreground === "210 14% 17%");
check("--accent token (indigo)", vars.accent === "239 84% 67%");
check("--border token", vars.border === "0 0% 90%");
check("--ring token", vars.ring === "239 84% 67%");
check("--radius token", ["0.5rem", ".5rem"].includes(vars.radius), vars.radius);
check(
	"--font-display = Instrument Serif",
	vars.display.includes("Instrument Serif"),
);
check("--font-body = Inter", vars.body.includes("Inter"));
check("--shadow-dashboard token", vars.shadow.includes("0 25px 80px -12px"));

// Google Fonts actually loaded
const fontsLoaded = await desktop.evaluate(async () => {
	await document.fonts.ready;
	return {
		serif: document.fonts.check("16px 'Instrument Serif'"),
		serifItalic: document.fonts.check("italic 16px 'Instrument Serif'"),
		inter: document.fonts.check("16px 'Inter'"),
	};
});
check("Instrument Serif loaded", fontsLoaded.serif);
check("Instrument Serif Italic loaded", fontsLoaded.serifItalic);
check("Inter loaded", fontsLoaded.inter);

// Navbar
check(
	'Logo "✦ Nexora" visible',
	await desktop.locator("header a", { hasText: "✦ Nexora" }).isVisible(),
);
for (const link of ["Home", "Pricing", "About", "Contact"]) {
	check(
		`Nav link "${link}" visible`,
		await desktop.locator(`header nav a:has-text("${link}")`).isVisible(),
	);
}
const navCta = desktop.locator("header button", { hasText: "Get Started" });
check("Navbar CTA pill visible", await navCta.isVisible());
check(
	"Navbar CTA fully rounded",
	(await navCta.evaluate((b) => getComputedStyle(b).borderRadius)) === "9999px",
);

// 1. Badge
const badge = desktop.locator("section >> text=Now with GPT-5 support");
check("Badge text present", await badge.isVisible());

// 2. Headline
const h1 = desktop.locator("h1");
const h1Text = (await h1.innerText()).replace(/\s+/g, " ").trim();
check(
	'H1 reads "The Future of Smarter Automation"',
	h1Text === "The Future of Smarter Automation",
	h1Text,
);
check(
	"H1 font is Instrument Serif",
	(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).includes(
		"Instrument Serif",
	),
);
check(
	"H1 is 5rem on lg screens",
	(await h1.evaluate((el) => getComputedStyle(el).fontSize)) === "80px",
);
check(
	'"Smarter" rendered in italic <em>',
	await h1
		.locator("em", { hasText: "Smarter" })
		.evaluate((el) => getComputedStyle(el).fontStyle === "italic"),
);
check(
	"H1 settled at opacity 1",
	(await h1.evaluate((el) => getComputedStyle(el).opacity)) === "1",
);

// 3. Subheadline
check(
	"Subheadline copy present",
	await desktop
		.locator("p", { hasText: "Automate your busywork with intelligent agents" })
		.isVisible(),
);

// 4. CTA buttons
const demoBtn = desktop.locator("section button", { hasText: "Book a demo" });
check('"Book a demo" button visible', await demoBtn.isVisible());
check(
	'"Book a demo" fully rounded + primary bg',
	await demoBtn.evaluate((b) => {
		const s = getComputedStyle(b);
		const [r, g, bl] = s.backgroundColor.match(/\d+/g).map(Number);
		return s.borderRadius === "9999px" && r < 60 && g < 60 && bl < 60;
	}),
);
const playBtn = desktop.locator(
	'section button[aria-label="Watch product video"]',
);
check(
	"Play button is 44x44 circle with Play icon",
	await playBtn.evaluate((b) => {
		const r = b.getBoundingClientRect();
		return (
			r.width === 44 &&
			r.height === 44 &&
			getComputedStyle(b).borderRadius === "9999px" &&
			b.querySelector("svg") !== null
		);
	}),
);

// 5. Dashboard preview
const glass = desktop.locator('section div[style*="rgba(255, 255, 255, 0.4)"]');
check(
	"Frosted glass wrapper with rgba bg + dashboard shadow",
	(await glass.count()) === 1 &&
		(await glass.evaluate(
			(el) =>
				el.style.boxShadow.includes("var(--shadow-dashboard)") ||
				getComputedStyle(el).boxShadow.includes("0 25px 80px"),
		)),
);
check(
	"Dashboard is clipped by viewport bottom (overflows)",
	await glass.evaluate(
		(el) => el.getBoundingClientRect().bottom > window.innerHeight,
	),
);

for (const text of [
	"Move Money",
	"Welcome, Jane",
	"Mercury Balance",
	"Last 30 Days",
	"Accounts",
	"Recent Transactions",
	"Trake rutes",
	"Workflows",
	"Customize",
]) {
	check(
		`Dashboard text "${text}" rendered`,
		(await desktop.locator(`section :text("${text}")`).count()) >= 1,
	);
}
check(
	"Balance amount $8,450,190.32 (split cents)",
	(
		await desktop.locator("section p", { hasText: "$8,450,190" }).innerText()
	).includes(".32"),
);
for (const amount of [
	"$98,125.50",
	"$6,750,200.00",
	"$1,592,864.82",
	"-$5,200",
	"+$125,000",
	"-$85,450",
	"-$1,200",
]) {
	check(
		`Amount "${amount}" rendered`,
		(await desktop.locator(`section :text("${amount}")`).count()) >= 1,
	);
}
check(
	"1 Pending + 3 Completed status pills",
	(await desktop.locator('section :text-is("Pending")').count()) === 1 &&
		(await desktop.locator('section :text-is("Completed")').count()) === 3,
);

// SVG chart
const chart = desktop.locator('section svg[viewBox="0 0 400 80"]');
check("Hand-crafted SVG chart present", (await chart.count()) === 1);
check(
	"Chart has gradient fill + 1.5 stroke cubic Bézier",
	await chart.evaluate((svg) => {
		const paths = [...svg.querySelectorAll("path")];
		const hasGradient =
			svg.querySelector("linearGradient") !== null &&
			paths.some((p) => p.getAttribute("fill")?.includes("url(#"));
		const stroke = paths.find((p) => p.getAttribute("stroke-width") === "1.5");
		return hasGradient && stroke?.getAttribute("d").includes("C");
	}),
);

// Quick action pills
const sendPill = desktop.locator("section span", { hasText: /^Send$/ }).first();
check(
	'"Send" pill uses accent bg',
	await sendPill.evaluate((el) => {
		const [r, g, b] = getComputedStyle(el)
			.backgroundColor.match(/\d+/g)
			.map(Number);
		return b > 200 && b - r > 80 && b - g > 80; // indigo: strongly blue-dominant
	}),
);

await desktop.screenshot({ path: "screenshots/desktop.png" });

// ---------- Mobile (390x844) ----------
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
const mobileErrors = [];
mobile.on("pageerror", (err) => mobileErrors.push(err.message));
await mobile.goto(BASE_URL, { waitUntil: "networkidle" });
await mobile.waitForTimeout(1800);

check(
	"Mobile: no uncaught page errors",
	mobileErrors.length === 0,
	mobileErrors.join("; "),
);
check(
	"Mobile: nav links hidden",
	!(await mobile.locator("header nav").isVisible()),
);
check(
	"Mobile: navbar CTA still visible",
	await mobile.locator("header button", { hasText: "Get Started" }).isVisible(),
);
check(
	"Mobile: H1 drops to text-5xl (48px)",
	(await mobile
		.locator("h1")
		.evaluate((el) => getComputedStyle(el).fontSize)) === "48px",
);
check(
	"Mobile: dashboard sidebar hidden",
	!(await mobile.locator("aside").isVisible()),
);
check(
	"Mobile: no scroll",
	await mobile.evaluate(() => document.body.scrollHeight <= window.innerHeight),
);

await mobile.screenshot({ path: "screenshots/mobile.png" });

await browser.close();

console.log(
	failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
