import { db } from "@/db";
import { withdrawMarketing } from "@/lib/consent";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/** RFC 8058 one-click unsubscribe (POST from mail clients). No login needed. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const contactId = verifyUnsubscribeToken(token);
  if (!contactId) return new Response("invalid", { status: 400 });
  await withdrawMarketing(db(), contactId, "unsubscribe:one_click");
  return new Response("unsubscribed", { status: 200 });
}
