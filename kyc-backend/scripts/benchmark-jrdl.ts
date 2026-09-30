/**
 * Benchmark: JRDL off-chain policy evaluation latency.
 *
 * Runs the real JrdlService from kyc-backend, unmodified, over a matrix of
 * compliant and non-compliant attribute sets. Latency is reported in
 * microseconds because a single evaluation is far too fast to resolve in whole
 * milliseconds on a wall clock.
 *
 * The engine throws on violation, so each iteration is wrapped to record
 * whether the call decided ALLOW or DENY without distorting the timing.
 *
 * Usage:
 *   cd kyc-backend
 *   npx tsx scripts/benchmark-jrdl.ts     (or: npx ts-node scripts/benchmark-jrdl.ts)
 */

import { JrdlService, type UserAttributes } from "../src/services/jrdl.service";

interface Case {
  label: string;
  attributes: UserAttributes;
  expectAllowed: boolean;
}

const COMPLIANT: UserAttributes = {
  kycStatus: "APPROVED",
  jurisdiction: "US",
  amlRiskScore: 10,
  isSanctioned: false,
};

const cases: Case[] = [
  { label: "fully compliant", attributes: { ...COMPLIANT }, expectAllowed: true },
  {
    label: "KYC not approved",
    attributes: { ...COMPLIANT, kycStatus: "PENDING" },
    expectAllowed: false,
  },
  {
    label: "sanctioned",
    attributes: { ...COMPLIANT, isSanctioned: true },
    expectAllowed: false,
  },
  {
    label: "high AML risk (90)",
    attributes: { ...COMPLIANT, amlRiskScore: 90 },
    expectAllowed: false,
  },
  {
    label: "restricted jurisdiction (IR)",
    attributes: { ...COMPLIANT, jurisdiction: "IR" },
    expectAllowed: false,
  },
  {
    label: "geofence sentinel (RestrictedRegion)",
    attributes: { ...COMPLIANT, jurisdiction: "RestrictedRegion" },
    expectAllowed: false,
  },
];

const ITERATIONS = Number(process.env.JRDL_ITERATIONS || 100_000);

function stats(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min_us: +s[0].toFixed(4),
    median_us: +s[Math.floor(s.length / 2)].toFixed(4),
    mean_us: +(sum / s.length).toFixed(4),
    p95_us: +s[Math.floor(s.length * 0.95)].toFixed(4),
    max_us: +s[s.length - 1].toFixed(4),
  };
}

function main() {
  const service = new JrdlService();

  console.log(`\nJRDL policy evaluation benchmark`);
  console.log(`  iterations per case: ${ITERATIONS}\n`);

  // Warm up so the first timed case is not paying JIT cost.
  for (let i = 0; i < 10_000; i++) {
    try {
      service.evaluate(COMPLIANT);
    } catch {
      /* deny path */
    }
  }

  const rows: any[] = [];
  for (const c of cases) {
    const samples = new Array<number>(ITERATIONS);

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = process.hrtime.bigint();
      let allowed = true;
      try {
        service.evaluate(c.attributes);
      } catch {
        allowed = false;
      }
      const t1 = process.hrtime.bigint();
      samples[i] = Number(t1 - t0) / 1e3; // microseconds
    }

    const st = stats(samples);
    const observedAllowed = (() => {
      try {
        service.evaluate(c.attributes);
        return true;
      } catch {
        return false;
      }
    })();

    const consistent = observedAllowed === c.expectAllowed;
    rows.push({
      case: c.label,
      decision: observedAllowed ? "ALLOW" : "DENY",
      expected: c.expectAllowed ? "ALLOW" : "DENY",
      consistent,
      ...st,
      median_ms: +(st.median_us / 1000).toFixed(6),
    });

    console.log(
      `  ${c.label.padEnd(30)} ${observedAllowed ? "ALLOW" : "DENY "} ` +
        `median=${st.median_us}us mean=${st.mean_us}us p95=${st.p95_us}us ` +
        `${consistent ? "" : "  <-- UNEXPECTED DECISION"}`
    );
  }

  const compliant = rows.find((r) => r.case === "fully compliant")!;
  console.log(`\nSummary`);
  console.log(`  JRDL median latency (compliant path): ${compliant.median_us} us (${compliant.median_ms} ms)`);
  console.log(`  JRDL mean   latency (compliant path): ${compliant.mean_us} us`);
  console.log(`  All decisions matched expectation  : ${rows.every((r) => r.consistent)}`);
  console.log(`\nJSON:`);
  console.log(JSON.stringify({ iterations: ITERATIONS, cases: rows }, null, 2));
}

main();
