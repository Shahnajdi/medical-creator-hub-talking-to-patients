import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { userGuard } from "@/lib/auth/guard";
import { enabledProviders } from "@/lib/payments/providers";
import { formatMoney } from "@/lib/payments/types";
import { getSetting } from "@/lib/settings";
import type { Eligibility } from "@/lib/payments/service";
import { CheckoutForm } from "@/components/forms/CheckoutForm";

export const metadata: Metadata = { robots: { index: false } };

const PROVIDER_LABELS: Record<string, { fa: string; en: string }> = {
  mock: { fa: "پرداخت آزمایشی (محیط توسعه — بدون پول واقعی)", en: "Sandbox payment (development — no real money)" },
  bank_transfer: { fa: "انتقال بانکی", en: "Bank transfer" },
};

export default async function Checkout({ params }: { params: Promise<{ locale: "fa" | "en"; product: string }> }) {
  const { locale, product: slug } = await params;
  await userGuard(locale, `/checkout/${slug}`);
  const product = await db().query.products.findFirst({ where: (p, { and, eq }) => and(eq(p.slug, slug), eq(p.status, "published")) });
  if (!product) notFound();
  const prices = await db().query.productPrices.findMany({ where: (pp, { and, eq }) => and(eq(pp.productId, product.id), eq(pp.active, true)) });
  const bank = await db().query.settings.findFirst({ where: (s, { eq }) => eq(s.key, "payments.bankTransfer") });
  // Only offer methods that are actually configured.
  const providers = enabledProviders().filter((p) => p.id !== "bank_transfer" || bank).map((p) => ({ id: p.id, label: PROVIDER_LABELS[p.id]?.[locale] ?? p.id }));
  const eligibility = await getSetting<Eligibility>("payments.eligibility");
  const fa = locale === "fa";
  const intervalText = product.billingInterval === "month" ? (fa ? "ماهانه" : "monthly") : (fa ? "سالانه" : "yearly");
  const t = {
    currency: fa ? "ارز پرداخت" : "Currency", country: fa ? "کشور محل اقامت" : "Country of residence", billingName: fa ? "نام صاحب صورتحساب" : "Billing name", method: fa ? "روش پرداخت" : "Payment method", pay: fa ? "پرداخت" : "Pay", total: fa ? "مبلغ نهایی" : "Total",
    taxIncl: fa ? "مالیات در این مبلغ لحاظ شده است." : "Tax is included in this amount.", taxExcl: fa ? "مالیات بر اساس کشور شما در صفحه پرداخت محاسبه و پیش از تأیید نمایش داده می‌شود." : "Tax is calculated for your country on the payment page and shown before you confirm.",
    noHidden: fa ? "هیچ هزینه دیگری از طرف ما اضافه نمی‌شود." : "We add no other fees.",
    refund: fa ? `امکان درخواست بازپرداخت کامل تا ${product.refundWindowDays} روز پس از خرید.` : `Full refund available on request within ${product.refundWindowDays} days of purchase.`,
    renewal: fa ? `این یک اشتراک ${intervalText} است و تا زمانی که لغو نکنید، با همین مبلغ به‌صورت خودکار تمدید می‌شود. لغو در هر زمان با یک کلیک از داشبورد امکان‌پذیر است.` : `This is a ${intervalText} subscription that renews automatically at this price until you cancel. Cancel anytime with one click from your dashboard.`,
    renewalAck: fa ? "متوجه هستم که این اشتراک به‌صورت خودکار تمدید می‌شود و می‌توانم هر زمان آن را لغو کنم." : "I understand this subscription renews automatically and that I can cancel anytime.",
    error: fa ? "شروع پرداخت ممکن نشد و هیچ مبلغی کسر نشد. لطفاً دوباره تلاش کنید." : "Checkout could not start and you were not charged. Please try again.",
    blocked: fa ? "در حال حاضر امکان پرداخت آنلاین برای کشور شما فراهم نیست. برای بررسی گزینه‌های دیگر با ما تماس بگیرید." : "Online payment is not currently available for your country. Please contact us to discuss options.",
  };
  return (
    <div className="container-x grid max-w-4xl gap-8 py-12 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-black">{fa ? product.nameFa : product.nameEn}</h1>
        <p className="mt-3 leading-8 text-slate-strong">{fa ? product.descriptionFa : product.descriptionEn}</p>
      </div>
      {prices.length && providers.length ? (
        <CheckoutForm product={product.slug} interval={product.billingInterval} t={t} blocked={eligibility.blockedCountries}
          prices={prices.map((p) => ({ currency: p.currency, taxInclusive: p.taxInclusive, label: formatMoney(p.amountMinor, p.currency, locale) }))} providers={providers} />
      ) : <p className="rounded-xl bg-mist p-4">{fa ? "پرداخت آنلاین برای این محصول هنوز فعال نشده است." : "Online payment is not yet available for this product."}</p>}
    </div>
  );
}
