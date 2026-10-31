import { business } from "@/lib/legal/config";

export type Locale = "fa" | "en";
export type TemplateKey =
  | "agency_lead_confirmation"
  | "training_resource_delivery"
  | "training_beginner_lesson"
  | "privacy_request_verify"
  | "password_reset"
  | "order_confirmation";

type Rendered = { subject: string; text: string; html: string };

type Vars = Record<string, string | undefined>;

const copy: Record<TemplateKey, Record<Locale, (v: Vars) => { subject: string; body: string[]; cta?: { label: string; url: string } }>> = {
  agency_lead_confirmation: {
    fa: (v) => ({
      subject: "درخواست شما برای بررسی تبلیغات دریافت شد",
      body: [
        `${v.name} عزیز، سلام.`,
        "درخواست بررسی اولیه تبلیغات کسب‌وکارتان را دریافت کردیم. یکی از اعضای تیم NajdiTech اطلاعات شما را بررسی می‌کند و از طریق روش ارتباطی که انتخاب کردید با شما تماس می‌گیرد.",
        "اگر بخواهید، می‌توانید همین حالا یک جلسه آشنایی رزرو کنید.",
      ],
      cta: v.bookUrl ? { label: "رزرو جلسه آشنایی", url: v.bookUrl } : undefined,
    }),
    en: (v) => ({
      subject: "We received your ad review request",
      body: [
        `Hi ${v.name},`,
        "Thanks for requesting an initial review of your advertising. A member of the NajdiTech team will look at your details and contact you through the method you chose.",
        "If you like, you can book a discovery call now.",
      ],
      cta: v.bookUrl ? { label: "Book a discovery call", url: v.bookUrl } : undefined,
    }),
  },
  training_resource_delivery: {
    fa: (v) => ({
      subject: "نقشه راه یادگیری Meta Ads شما آماده است",
      body: [`${v.name} عزیز، سلام.`, "همان‌طور که درخواست کردید، لینک دریافت نقشه راه رایگان یادگیری Meta Ads در ادامه است."],
      cta: v.downloadUrl ? { label: "دریافت نقشه راه", url: v.downloadUrl } : undefined,
    }),
    en: (v) => ({
      subject: "Your Meta Ads learning roadmap",
      body: [`Hi ${v.name},`, "As requested, here is the link to your free Meta Ads learning roadmap."],
      cta: v.downloadUrl ? { label: "Get the roadmap", url: v.downloadUrl } : undefined,
    }),
  },
  training_beginner_lesson: {
    fa: (v) => ({
      subject: "اولین قدم در Meta Ads: هدف کمپین را درست انتخاب کن",
      body: [
        `${v.name} عزیز، سلام.`,
        "بیشتر کمپین‌های ناموفق از یک اشتباه ساده شروع می‌شوند: انتخاب هدف (Objective) اشتباه. قبل از ساخت اولین کمپین، مشخص کن دقیقاً چه اقدامی از مخاطب می‌خواهی — پیام، فرم، خرید یا بازدید از سایت — و هدف کمپین را بر همان اساس انتخاب کن.",
      ],
      cta: v.trainingUrl ? { label: "مشاهده دوره‌های آموزشی", url: v.trainingUrl } : undefined,
    }),
    en: (v) => ({
      subject: "Meta Ads step one: choose the right campaign objective",
      body: [
        `Hi ${v.name},`,
        "Many underperforming campaigns start with one simple mistake: the wrong objective. Before building your first campaign, decide exactly what you want people to do — message you, submit a form, buy, or visit your site — and choose the objective to match.",
      ],
      cta: v.trainingUrl ? { label: "See the training", url: v.trainingUrl } : undefined,
    }),
  },
  privacy_request_verify: {
    fa: (v) => ({
      subject: "تأیید درخواست حریم خصوصی",
      body: [
        "یک درخواست مربوط به داده‌های شخصی با این ایمیل ثبت شده است. برای تأیید اینکه این درخواست از طرف شماست، روی دکمه زیر بزنید. اگر شما این درخواست را ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.",
      ],
      cta: { label: "تأیید درخواست", url: v.verifyUrl ?? "" },
    }),
    en: (v) => ({
      subject: "Confirm your privacy request",
      body: [
        "A request about personal data was submitted with this email address. To confirm it was you, click the button below. If you did not make this request, you can ignore this email.",
      ],
      cta: { label: "Confirm request", url: v.verifyUrl ?? "" },
    }),
  },
  password_reset: {
    fa: (v) => ({
      subject: "بازیابی رمز عبور",
      body: ["برای انتخاب رمز عبور جدید روی دکمه زیر بزنید. این لینک یک ساعت معتبر است."],
      cta: { label: "انتخاب رمز جدید", url: v.resetUrl ?? "" },
    }),
    en: (v) => ({
      subject: "Reset your password",
      body: ["Click the button below to choose a new password. The link is valid for one hour."],
      cta: { label: "Choose a new password", url: v.resetUrl ?? "" },
    }),
  },
  order_confirmation: {
    fa: (v) => ({
      subject: `تأیید پرداخت سفارش ${v.orderRef ?? ""}`,
      body: [`پرداخت شما برای «${v.product}» به مبلغ ${v.amount} تأیید شد.`],
      cta: v.dashboardUrl ? { label: "ورود به داشبورد", url: v.dashboardUrl } : undefined,
    }),
    en: (v) => ({
      subject: `Payment confirmed for order ${v.orderRef ?? ""}`,
      body: [`Your payment of ${v.amount} for “${v.product}” has been confirmed.`],
      cta: v.dashboardUrl ? { label: "Go to dashboard", url: v.dashboardUrl } : undefined,
    }),
  },
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function renderEmail(
  key: TemplateKey,
  locale: Locale,
  vars: Vars,
  opts: { unsubscribeUrl?: string; marketing: boolean },
): Rendered {
  const c = copy[key][locale](vars);
  const dir = locale === "fa" ? "rtl" : "ltr";
  const footer: string[] = [];
  const entity = [business.entityName ?? business.brand, business.address].filter(Boolean).join(" — ");
  footer.push(entity);
  if (opts.marketing && opts.unsubscribeUrl) {
    footer.push(
      locale === "fa"
        ? "این ایمیل را چون با دریافت ایمیل‌های آموزشی و تبلیغاتی موافقت کرده‌اید دریافت می‌کنید."
        : "You are receiving this because you agreed to receive educational and promotional emails.",
    );
  }
  const unsubLabel = locale === "fa" ? "لغو اشتراک ایمیل‌ها" : "Unsubscribe";

  const text = [
    ...c.body,
    c.cta ? `${c.cta.label}: ${c.cta.url}` : "",
    "",
    "—",
    ...footer,
    opts.unsubscribeUrl ? `${unsubLabel}: ${opts.unsubscribeUrl}` : "",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  const html = `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:#F8FAFC;font-family:Vazirmatn,Tahoma,Arial,sans-serif;color:#0B1220">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;padding:32px;text-align:${dir === "rtl" ? "right" : "left"}">
<tr><td><p style="font-weight:700;font-size:18px;margin:0 0 16px">NajdiTech</p>
${c.body.map((p) => `<p style="font-size:15px;line-height:1.9;margin:0 0 12px">${esc(p)}</p>`).join("")}
${c.cta ? `<p style="margin:24px 0"><a href="${esc(c.cta.url)}" style="background:#0866FF;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(c.cta.label)}</a></p>` : ""}
<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
${footer.map((f) => `<p style="font-size:12px;color:#475569;margin:0 0 6px">${esc(f)}</p>`).join("")}
${opts.unsubscribeUrl ? `<p style="font-size:12px;margin:8px 0 0"><a href="${esc(opts.unsubscribeUrl)}" style="color:#1D4ED8">${unsubLabel}</a></p>` : ""}
</td></tr></table></td></tr></table></body></html>`;

  return { subject: c.subject, text, html };
}
