import "server-only";
import { z } from "zod";

/**
 * Server-side environment configuration. Validated lazily so that `next build`
 * does not require production secrets. Never import this from client code —
 * the `server-only` import makes that a build error.
 */
const bool = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Deployment stage. Defaults to "production" — sandbox features require an explicit non-production value. */
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("production"),
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  /** Used to sign unsubscribe links, verification tokens and to hash IPs. >= 32 chars. */
  APP_SECRET: z.string().min(32),

  EMAIL_DRIVER: z.enum(["log", "resend"]).default("log"),
  EMAIL_FROM: z.string().default("NajdiTech <no-reply@localhost>"),
  RESEND_API_KEY: z.string().optional(),

  /** Comma-separated list of enabled payment providers: mock, bank_transfer */
  PAYMENT_PROVIDERS: z.string().default("bank_transfer"),
  MOCK_PAYMENT_WEBHOOK_SECRET: z.string().optional(),

  GA4_MEASUREMENT_ID: z.string().optional(),
  META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),

  AI_ENABLED: bool,
  ANTHROPIC_API_KEY: z.string().optional(),

  STORAGE_DIR: z.string().default("./storage"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const d = parsed.data;
  if (d.APP_ENV === "production") {
    const problems: string[] = [];
    if (d.PAYMENT_PROVIDERS.split(",").includes("mock")) problems.push("The mock payment provider must not be enabled in production.");
    if (!d.APP_URL.startsWith("https://")) problems.push("APP_URL must use https:// in production.");
    if (/dev-only|change-me|example/i.test(d.APP_SECRET)) problems.push("APP_SECRET looks like a placeholder; generate a random secret.");
    if (d.EMAIL_DRIVER === "log") problems.push("EMAIL_DRIVER=log would silently drop emails in production; configure a real provider.");
    if (d.EMAIL_DRIVER === "resend" && !d.RESEND_API_KEY) problems.push("RESEND_API_KEY is required when EMAIL_DRIVER=resend.");
    if (d.AI_ENABLED && !d.ANTHROPIC_API_KEY) problems.push("AI_ENABLED=true requires ANTHROPIC_API_KEY.");
    if (problems.length) throw new Error(`Unsafe production configuration:\n${problems.join("\n")}`);
  }
  cached = parsed.data;
  return cached;
}

/** For tests only. */
export function resetEnvCache() {
  cached = null;
}
