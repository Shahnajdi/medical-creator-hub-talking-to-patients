import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";

/**
 * Pre-launch gate. Exits non-zero while anything legally or operationally
 * required is missing. Run in CI before deploying to production.
 */
const problems: string[] = [];
const req = (k: string, why: string) => { if (!process.env[k]) problems.push(`${k} is not set — ${why}`); };

req("NEXT_PUBLIC_LEGAL_ENTITY_NAME", "legal entity name shown in privacy policy, terms, imprint, emails");
req("NEXT_PUBLIC_LEGAL_ADDRESS", "postal address required in commercial emails and legal notices");
req("NEXT_PUBLIC_CONTACT_EMAIL", "business contact email");
req("NEXT_PUBLIC_PRIVACY_EMAIL", "privacy contact for data-subject requests");
req("NEXT_PUBLIC_HOSTING_PROVIDER", "hosting provider for the subprocessor list");
if (!/sslmode=(require|verify-full|verify-ca)/.test(process.env.DATABASE_URL ?? "") && process.env.DATABASE_TLS_NOT_REQUIRED !== "true")
  problems.push("DATABASE_URL should use sslmode=require (or set DATABASE_TLS_NOT_REQUIRED=true if the DB is only reachable on a private network)");
if (process.env.APP_ENV !== "production") problems.push("APP_ENV must be 'production' for a production deploy");
if (!process.env.APP_URL?.startsWith("https://")) problems.push("APP_URL must be https://");
if ((process.env.APP_SECRET ?? "").length < 32) problems.push("APP_SECRET must be at least 32 random characters");
if ((process.env.PAYMENT_PROVIDERS ?? "").includes("mock")) problems.push("Remove 'mock' from PAYMENT_PROVIDERS");
if (process.env.EMAIL_DRIVER !== "resend") problems.push("Configure a real EMAIL_DRIVER (log driver drops mail)");
if (process.env.LEGAL_REVIEW_COMPLETED !== "true") problems.push("LEGAL_REVIEW_COMPLETED=true must be set after a qualified lawyer reviews privacy policy, terms, refund policy and cookie policy (docs/compliance/LEGAL-REVIEW.md)");
const dpa = "docs/compliance/dpa-register.md";
if (!existsSync(dpa) || /\| *PENDING *\|/.test(readFileSync(dpa, "utf8"))) problems.push(`${dpa}: every active vendor needs a signed DPA (no PENDING rows)`);

if (problems.length) {
  console.error("LAUNCH CHECK FAILED:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("Launch check passed.");
