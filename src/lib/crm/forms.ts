import { z } from "zod";
import { normalizeEmail, normalizePhone, normalizeUrl } from "./normalize";

/**
 * Form schemas shared by the client (instant validation) and the server
 * (authoritative validation). Error messages are i18n keys under "forms.errors".
 * Data minimisation: only fields needed to respond and qualify are collected.
 */
export const COUNTRIES = ["US", "CA", "GB", "AU", "DE", "TR", "NL", "SE", "FR", "AE", "IR", "OTHER"] as const;
export const AD_STATUS = ["never", "paused", "self_managed", "agency"] as const;
export const OBJECTIVES = ["leads", "sales", "bookings", "awareness", "unsure"] as const;
export const BUDGETS = ["none", "under_500", "500_1500", "1500_5000", "over_5000"] as const;
export const CONTACT_METHODS = ["email", "whatsapp"] as const;
export const INDUSTRIES = [
  "beauty",
  "health",
  "real_estate",
  "restaurant",
  "retail",
  "education",
  "professional_services",
  "construction",
  "automotive",
  "other",
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "too_long")
    .optional()
    .transform((v) => (v ? v : undefined));

const contactFields = {
  fullName: z.string().trim().min(2, "name_required").max(120, "too_long"),
  email: optionalText(254).refine((v) => !v || z.email().safeParse(normalizeEmail(v)).success, "email_invalid"),
  whatsapp: optionalText(32).refine((v) => !v || normalizePhone(v) !== null, "phone_invalid"),
  country: z.enum(COUNTRIES, { error: "country_required" }),
};

const consentFields = {
  acceptTerms: z.literal(true, { error: "terms_required" }),
  ageConfirm: z.literal(true, { error: "age_required" }),
  marketingEmail: z.boolean().default(false),
  marketingWhatsapp: z.boolean().default(false),
};

const meta = {
  /** Honeypot — must be empty. */
  hp: z.string().max(0, "spam").optional(),
  eventId: z.string().max(64).optional(),
  visitorId: z.string().max(64).optional(),
  timezone: optionalText(64),
  utm: z
    .object({
      source: optionalText(200),
      medium: optionalText(200),
      campaign: optionalText(200),
      content: optionalText(200),
      term: optionalText(200),
      referrer: optionalText(500),
      landingPage: optionalText(500),
    })
    .partial()
    .optional(),
};

const needsChannel = (d: { email?: string; whatsapp?: string }) => Boolean(d.email || d.whatsapp);

export const agencyLeadSchema = z
  .object({
    ...contactFields,
    businessName: z.string().trim().min(2, "business_required").max(160, "too_long"),
    industry: z.enum(INDUSTRIES, { error: "industry_required" }),
    website: optionalText(300).refine((v) => !v || normalizeUrl(v) !== null, "url_invalid"),
    adStatus: z.enum(AD_STATUS, { error: "choice_required" }),
    objective: z.enum(OBJECTIVES, { error: "choice_required" }),
    budget: z.enum(BUDGETS, { error: "choice_required" }),
    preferredContact: z.enum(CONTACT_METHODS, { error: "choice_required" }),
    ...consentFields,
    ...meta,
  })
  .refine(needsChannel, { message: "channel_required", path: ["email"] })
  .refine((d) => (d.preferredContact === "email" ? Boolean(d.email) : Boolean(d.whatsapp)), {
    message: "preferred_channel_missing",
    path: ["preferredContact"],
  });

export const trainingLeadSchema = z
  .object({ ...contactFields, ...consentFields, ...meta })
  .refine(needsChannel, { message: "channel_required", path: ["email"] });

export type AgencyLeadInput = z.input<typeof agencyLeadSchema>;
export type TrainingLeadInput = z.input<typeof trainingLeadSchema>;

/** Fields validated per step in the multi-step agency form. */
export const AGENCY_STEPS: (keyof z.input<typeof agencyLeadSchema>)[][] = [
  ["fullName", "email", "whatsapp", "country"],
  ["businessName", "industry", "website", "adStatus"],
  ["objective", "budget", "preferredContact", "acceptTerms", "ageConfirm"],
];
