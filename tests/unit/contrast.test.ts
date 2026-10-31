import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const token = (name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`token ${name} missing`);
  return m[1]!;
};
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

/** Every text/background pair used in the UI must meet WCAG AA (4.5:1 for body text). */
const PAIRS: [string, string][] = [
  ["midnight", "paper"], ["slate-strong", "paper"], ["slate-strong", "mist"], ["slate", "paper"], ["brand-700", "paper"], ["brand-700", "mist"],
  ["paper", "meta"], ["paper", "brand-700"], ["paper", "ink"], ["paper", "midnight"], ["lime", "ink"], ["ink", "lime"], ["danger", "paper"], ["success", "paper"], ["paper", "danger"], ["paper", "success"],
];

describe("colour contrast (WCAG AA)", () => {
  for (const [fg, bg] of PAIRS) {
    it(`${fg} on ${bg} >= 4.5:1`, () => expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5));
  }
});
