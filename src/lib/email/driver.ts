import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function deliverEmail(msg: OutgoingEmail): Promise<{ providerRef: string | null }> {
  const e = env();
  if (e.EMAIL_DRIVER === "log") {
    // Development driver: never sends; logs without the body to avoid leaking content.
    logger.info("email.log_driver", { to: msg.to, subject: msg.subject, headers: msg.headers });
    if (process.env.EMAIL_LOG_BODY === "true") console.log(msg.text);
    return { providerRef: null };
  }
  if (!e.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: e.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text, headers: msg.headers }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { id?: string };
  return { providerRef: body.id ?? null };
}
