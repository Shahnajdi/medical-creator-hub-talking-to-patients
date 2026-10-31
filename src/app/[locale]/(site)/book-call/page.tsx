import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { SimplePage } from "@/components/ui/SimplePage";

export const dynamic = "force-dynamic";

/**
 * Online self-booking is pending (see docs/ROADMAP.md). If an external booking
 * link is configured (settings key "booking.url"), we link to it; otherwise we
 * say so honestly and route the visitor to the review form.
 */
export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const row = await db().query.settings.findFirst({ where: (s, { eq }) => eq(s.key, "booking.url") });
  const url = typeof row?.value === "string" && row.value.startsWith("https://") ? row.value : null;
  const fa = locale === "fa";
  return url ? (
    <SimplePage title={fa ? "رزرو جلسه آشنایی" : "Book a discovery call"} lead={fa ? "زمان مناسب را انتخاب کنید. ساعت‌ها به وقت محلی شما نمایش داده می‌شوند." : "Pick a time that suits you. Times are shown in your local time zone."}>
      <a href={url} rel="noopener noreferrer" target="_blank" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-meta px-6 font-semibold text-white">{fa ? "انتخاب زمان" : "Choose a time"}</a>
    </SimplePage>
  ) : (
    <SimplePage title={fa ? "رزرو جلسه آشنایی" : "Book a discovery call"} lead={fa ? "رزرو آنلاین به‌زودی فعال می‌شود. فعلاً فرم بررسی رایگان را پر کنید تا تیم ما برای هماهنگی زمان جلسه با شما تماس بگیرد." : "Online booking is coming soon. For now, fill in the free review form and our team will contact you to arrange a time."} cta={{ href: "/free-audit", label: fa ? "فرم بررسی رایگان" : "Free review form" }} />
  );
}
