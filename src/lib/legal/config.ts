/**
 * Legal identity and document versions.
 *
 * Business details come from NEXT_PUBLIC_LEGAL_* environment variables so they
 * are never invented in code. `npm run check:launch` fails while any required
 * value is missing. Until then, pages show a clearly marked "not yet provided"
 * notice instead of fake details.
 */
export const business = {
  brand: "NajdiTech",
  founder: "Shahin Najdi",
  entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || null,
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || null,
  registration: process.env.NEXT_PUBLIC_LEGAL_REGISTRATION || null,
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID || null,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || null,
  dmcaAgent: process.env.NEXT_PUBLIC_DMCA_AGENT || null,
};

export const REQUIRED_BUSINESS_FIELDS = ["entityName", "address", "email", "privacyEmail"] as const;

/**
 * Bump a version whenever the corresponding document changes materially.
 * Consent/acceptance records store the version that was shown.
 */
export const LEGAL_VERSIONS = {
  privacy: "2026-10-31",
  terms: "2026-10-31",
  cookies: "2026-10-31",
  refund: "2026-10-31",
  marketing: "2026-10-31",
} as const;

/** Minimum age to use forms, accounts and checkout. */
export const MIN_AGE = 18;

/** Default statutory response window for privacy requests (GDPR: 1 month, KVKK: 30 days). */
export const PRIVACY_REQUEST_SLA_DAYS = 30;

export type Subprocessor = {
  name: string;
  purpose: { fa: string; en: string };
  location: string;
  active: boolean;
};

/**
 * Subprocessors are listed from actual configuration: a vendor is marked
 * active only when the corresponding integration is configured. Keep this
 * list in sync with signed DPAs (see docs/compliance/dpa-register.md).
 */
export function subprocessors(): Subprocessor[] {
  return [
    {
      name: process.env.NEXT_PUBLIC_HOSTING_PROVIDER || "Hosting provider (to be confirmed)",
      purpose: { fa: "میزبانی وب‌سایت و پایگاه داده", en: "Website and database hosting" },
      location: process.env.NEXT_PUBLIC_HOSTING_REGION || "—",
      active: Boolean(process.env.NEXT_PUBLIC_HOSTING_PROVIDER),
    },
    {
      name: "Resend",
      purpose: { fa: "ارسال ایمیل‌های تراکنشی و بازاریابی (با رضایت)", en: "Transactional and consented marketing email" },
      location: "United States",
      active: process.env.EMAIL_DRIVER === "resend",
    },
    {
      name: "Google Analytics 4 (Google LLC / Google Ireland)",
      purpose: { fa: "تحلیل آماری بازدید — فقط پس از رضایت", en: "Web analytics — only after consent" },
      location: "United States / EU",
      active: Boolean(process.env.GA4_MEASUREMENT_ID),
    },
    {
      name: "Meta Platforms (Pixel / Conversions API)",
      purpose: { fa: "اندازه‌گیری تبلیغات — فقط پس از رضایت", en: "Advertising measurement — only after consent" },
      location: "United States / Ireland",
      active: Boolean(process.env.META_PIXEL_ID),
    },
    {
      name: "Anthropic",
      purpose: {
        fa: "دستیار هوش مصنوعی اختیاری — داده‌ها برای آموزش مدل استفاده نمی‌شوند",
        en: "Optional AI assistant — data is not used for model training",
      },
      location: "United States",
      active: process.env.AI_ENABLED === "true" && Boolean(process.env.ANTHROPIC_API_KEY),
    },
  ];
}
