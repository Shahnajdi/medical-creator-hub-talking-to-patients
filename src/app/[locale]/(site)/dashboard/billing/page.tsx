import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { userGuard } from "@/lib/auth/guard";
import { formatMoney } from "@/lib/payments/types";
import { CancelSubscriptionButton } from "@/components/forms/CancelSubscriptionButton";

export default async function Billing({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  const user = await userGuard(locale, "/dashboard/billing");
  const fa = locale === "fa";
  const df = new Intl.DateTimeFormat(fa ? "fa-IR" : "en-GB", { dateStyle: "medium" });
  const [orders, subs] = await Promise.all([
    db().select({ id: schema.orders.id, total: schema.orders.totalMinor, currency: schema.orders.currency, status: schema.orders.status, createdAt: schema.orders.createdAt, nameFa: schema.products.nameFa, nameEn: schema.products.nameEn }).from(schema.orders).innerJoin(schema.products, eq(schema.products.id, schema.orders.productId)).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)),
    db().select({ id: schema.subscriptions.id, status: schema.subscriptions.status, end: schema.subscriptions.currentPeriodEnd, cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd, nameFa: schema.products.nameFa, nameEn: schema.products.nameEn }).from(schema.subscriptions).innerJoin(schema.products, eq(schema.products.id, schema.subscriptions.productId)).where(eq(schema.subscriptions.userId, user.id)),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">{fa ? "پرداخت و اشتراک" : "Billing"}</h1>
      <section>
        <h2 className="mb-3 font-bold">{fa ? "اشتراک‌ها" : "Subscriptions"}</h2>
        {subs.length === 0 ? <p className="text-slate-strong">{fa ? "اشتراک فعالی ندارید." : "You have no subscriptions."}</p> : (
          <ul className="space-y-3">{subs.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ring-1 ring-line">
              <div>
                <p className="font-semibold">{fa ? s.nameFa : s.nameEn}</p>
                <p className="text-sm text-slate-strong">
                  {s.cancelAtPeriodEnd
                    ? (fa ? `لغو شده — دسترسی تا ${df.format(s.end)} و بدون تمدید` : `Cancelled — access until ${df.format(s.end)}, will not renew`)
                    : (fa ? `تمدید خودکار در ${df.format(s.end)}` : `Renews automatically on ${df.format(s.end)}`)}
                </p>
              </div>
              {s.status === "active" && !s.cancelAtPeriodEnd && <CancelSubscriptionButton id={s.id} label={fa ? "لغو اشتراک" : "Cancel subscription"} done={fa ? "لغو شد" : "Cancelled"} />}
            </li>
          ))}</ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-bold">{fa ? "سفارش‌ها" : "Orders"}</h2>
        {orders.length === 0 ? <p className="text-slate-strong">{fa ? "هنوز سفارشی ندارید." : "No orders yet."}</p> : (
          <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">{orders.map((o) => (
            <li key={o.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><span>{fa ? o.nameFa : o.nameEn}</span><span className="ltr-nums">{formatMoney(o.total, o.currency, locale)}</span><span>{o.status}</span><span>{df.format(o.createdAt)}</span></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
