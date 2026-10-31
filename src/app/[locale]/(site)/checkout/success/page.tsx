import type { Metadata } from "next";
import { z } from "zod";
import { db } from "@/db";
import { userGuard } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/payments/types";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false } };

/** Shows the order's REAL status from the database; it never marks anything as paid. */
export default async function Success({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ order?: string }> }) {
  const { locale } = await params;
  const user = await userGuard(locale, "/checkout/success");
  const id = z.string().uuid().safeParse((await searchParams).order);
  const order = id.success ? await db().query.orders.findFirst({ where: (o, { and, eq }) => and(eq(o.id, id.data), eq(o.userId, user.id)) }) : null;
  const fa = locale === "fa";
  const bank = order?.status === "awaiting_transfer" ? await db().query.settings.findFirst({ where: (s, { eq }) => eq(s.key, "payments.bankTransfer") }) : null;
  const msg = !order ? (fa ? "سفارش پیدا نشد." : "Order not found.")
    : order.status === "paid" ? (fa ? "پرداخت تأیید شد. دسترسی شما فعال است." : "Payment confirmed. Your access is active.")
    : order.status === "awaiting_transfer" ? (fa ? "سفارش ثبت شد. پس از دریافت و تأیید انتقال بانکی توسط تیم ما، دسترسی فعال می‌شود." : "Order placed. Access is activated once our team receives and confirms your bank transfer.")
    : order.status === "failed" ? (fa ? "پرداخت ناموفق بود و مبلغی دریافت نشد." : "Payment failed and you were not charged.")
    : (fa ? "در انتظار تأیید پرداخت از سوی درگاه. این صفحه را چند لحظه دیگر تازه کنید." : "Waiting for the payment provider to confirm. Refresh this page in a moment.");
  return (
    <div className="container-x max-w-xl py-20">
      <h1 className="text-2xl font-black">{fa ? "وضعیت سفارش" : "Order status"}</h1>
      <p role="status" className="mt-4 text-lg leading-9">{msg}</p>
      {order && <p className="mt-2 text-sm text-slate-strong ltr-nums">{formatMoney(order.totalMinor, order.currency, locale)}</p>}
      {bank && <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-mist p-4 text-sm leading-7">{(bank.value as Record<string, string>)[locale]}{"\n"}{fa ? "شرح واریز" : "Reference"}: {order!.id.slice(0, 8).toUpperCase()}</pre>}
      <Link href="/dashboard" className="mt-8 inline-block text-brand-700 underline">{fa ? "رفتن به داشبورد" : "Go to dashboard"}</Link>
    </div>
  );
}
