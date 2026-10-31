import { readFileSync } from "node:fs";

/**
 * Lists the licence of every installed production dependency (transitively)
 * and fails on licences that need legal review (copyleft / unknown).
 */
const lock = JSON.parse(readFileSync("package-lock.json", "utf8")) as { packages: Record<string, { license?: string; dev?: boolean; devOptional?: boolean }> };
const ALLOWED = new Set(["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "OFL-1.1", "BlueOak-1.0.0", "Unlicense", "CC0-1.0", "Python-2.0", "CC-BY-4.0"]);
/** Weak copyleft: acceptable for a hosted (not distributed), unmodified, dynamically linked use — listed for the record. */
const NOTICE = new Set(["LGPL-3.0-or-later", "MPL-2.0"]);
const notices: string[] = [];
const counts = new Map<string, number>();
const review: string[] = [];
for (const [p, meta] of Object.entries(lock.packages)) {
  if (!p || meta.dev || meta.devOptional) continue;
  const lic = meta.license ?? "UNKNOWN";
  counts.set(lic, (counts.get(lic) ?? 0) + 1);
  const name = p.replace(/^node_modules\//, "");
  const clean = lic.replace(/[()]/g, "");
  // "A OR B": any one acceptable; "A AND B": every part must be acceptable.
  const accept = (set: Set<string>) => (clean.includes(" OR ") ? clean.split(" OR ").some((l) => set.has(l.trim())) : clean.split(" AND ").every((l) => set.has(l.trim())));
  const both = new Set([...ALLOWED, ...NOTICE]);
  if (accept(ALLOWED)) continue;
  if (accept(both)) notices.push(`${name}: ${lic}`);
  else review.push(`${name}: ${lic}`);
}
console.log("Production dependency licences:");
for (const [l, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`  ${l}: ${n}`);
if (notices.length) console.log("\nWeak-copyleft (notice only; obligations apply if you distribute or modify them):\n  " + notices.join("\n  "));
if (review.length) { console.error("\nNeeds review:\n  " + review.join("\n  ")); process.exit(1); }
console.log("\nAll production dependency licences are on the allow-list.");
