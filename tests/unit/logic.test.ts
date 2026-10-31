import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone, normalizeUrl, toLatinDigits } from "@/lib/crm/normalize";
import { scoreAgencyLead } from "@/lib/crm/scoring";
import { DEFAULT_SCORING } from "@/lib/crm/scoring-config";
import { agencyLeadSchema, trainingLeadSchema } from "@/lib/crm/forms";
import { renderEmail } from "@/lib/email/templates";
import { inQuietHours, localHour } from "@/lib/email/messaging";
import { csvCell } from "@/lib/csv";
import { can, ROLES } from "@/lib/auth/rbac";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signDownload, verifyDownload } from "@/lib/resources";
import { unsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

describe("normalisation", () => {
  it("converts Persian and Arabic digits", () => {
    expect(toLatinDigits("۰۹۱۲٣٤")).toBe("091234");
  });
  it("normalises emails and phones", () => {
    expect(normalizeEmail("  Ali@Example.COM ")).toBe("ali@example.com");
    expect(normalizePhone("+1 (416) 555-0100")).toBe("+14165550100");
    expect(normalizePhone("00۴۹ ۱۵۱ ۲۳۴۵۶۷۸۹")).toBe("+4915123456789");
    expect(normalizePhone("12")).toBeNull();
  });
  it("only accepts http(s) URLs", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("lead scoring", () => {
  it("scores high-intent leads high and never by nationality", () => {
    const hi = scoreAgencyLead({ budget: "over_5000", adStatus: "agency", objective: "leads", website: "https://x.com", country: "CA" }, DEFAULT_SCORING);
    expect(hi.qualification).toBe("high");
    const low = scoreAgencyLead({ budget: "none", adStatus: "never", objective: "unsure" }, DEFAULT_SCORING);
    expect(low.qualification).toBe("not_qualified");
    // same answers, different country of residence: only served-market bonus differs, no penalty
    const ir = scoreAgencyLead({ budget: "1500_5000", adStatus: "self_managed", objective: "sales", country: "IR" }, DEFAULT_SCORING);
    const other = scoreAgencyLead({ budget: "1500_5000", adStatus: "self_managed", objective: "sales", country: "OTHER" }, DEFAULT_SCORING);
    expect(ir.score).toBe(other.score);
  });
});

describe("form schemas", () => {
  const base = { fullName: "Sara Ahmadi", email: "sara@example.com", country: "CA", acceptTerms: true, ageConfirm: true };
  it("requires terms acceptance and age confirmation", () => {
    expect(trainingLeadSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
    expect(trainingLeadSchema.safeParse({ ...base, ageConfirm: false }).success).toBe(false);
  });
  it("marketing consent is separate and defaults to false", () => {
    const r = trainingLeadSchema.parse(base);
    expect(r.marketingEmail).toBe(false);
    expect(r.marketingWhatsapp).toBe(false);
  });
  it("requires at least one contact channel", () => {
    expect(trainingLeadSchema.safeParse({ ...base, email: undefined }).success).toBe(false);
    expect(trainingLeadSchema.safeParse({ ...base, email: undefined, whatsapp: "+1 416 555 0100" }).success).toBe(true);
  });
  it("rejects honeypot submissions", () => {
    expect(trainingLeadSchema.safeParse({ ...base, hp: "bot" }).success).toBe(false);
  });
  it("agency preferred channel must match a provided detail", () => {
    const a = { ...base, businessName: "Clinic", industry: "health", adStatus: "never", objective: "leads", budget: "none", preferredContact: "whatsapp" };
    expect(agencyLeadSchema.safeParse(a).success).toBe(false);
    expect(agencyLeadSchema.safeParse({ ...a, preferredContact: "email" }).success).toBe(true);
  });
});

describe("emails", () => {
  it("marketing emails carry an unsubscribe link and postal address", () => {
    const m = renderEmail("training_beginner_lesson", "fa", { name: "سارا" }, { marketing: true, unsubscribeUrl: "https://x/unsub" });
    expect(m.text).toContain("https://x/unsub");
    expect(m.html).toContain("https://x/unsub");
    expect(m.text).toContain("Test Street 1");
  });
  it("escapes HTML in variables", () => {
    const m = renderEmail("agency_lead_confirmation", "en", { name: "<script>alert(1)</script>" }, { marketing: false });
    expect(m.html).not.toContain("<script>");
  });
  it("quiet hours wrap midnight", () => {
    expect(inQuietHours(22, 21, 9)).toBe(true);
    expect(inQuietHours(3, 21, 9)).toBe(true);
    expect(inQuietHours(12, 21, 9)).toBe(false);
    expect(localHour(new Date("2026-01-01T12:00:00Z"), "Asia/Tehran")).toBe(15);
  });
});

describe("security helpers", () => {
  it("neutralises CSV formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+1 416")).toBe(`"'+1 416"`);
    expect(csvCell("normal")).toBe(`"normal"`);
  });
  it("RBAC: customers have no admin access; agents cannot export or manage privacy", () => {
    expect(can("student", "admin.access")).toBe(false);
    expect(can("agency_customer", "admin.access")).toBe(false);
    expect(can("sales_agent", "crm.export")).toBe(false);
    expect(can("sales_agent", "crm.read_all")).toBe(false);
    expect(can("marketing_manager", "privacy.manage")).toBe(false);
    expect(can("admin", "team.manage")).toBe(false);
    expect(ROLES.every((r) => can("super_admin", "admin.access") || r)).toBe(true);
  });
  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h).not.toContain("correct");
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("wrong password!!", h)).toBe(false);
  });
  it("signed download links reject tampering and expiry", () => {
    const tok = signDownload("res1", "contact1");
    expect(verifyDownload(tok)).toEqual({ resourceId: "res1", contactId: "contact1" });
    expect(verifyDownload(tok.replace("contact1", "contact2"))).toBeNull();
    expect(verifyDownload(tok, Date.now() + 31 * 86400_000)).toBeNull();
  });
  it("unsubscribe tokens are signed", () => {
    const t = unsubscribeToken("abc");
    expect(verifyUnsubscribeToken(t)).toBe("abc");
    expect(verifyUnsubscribeToken("other." + t.split(".")[1])).toBeNull();
  });
});

import { clientIpFrom } from "@/lib/request-meta";
describe("client IP", () => {
  it("ignores spoofed leftmost X-Forwarded-For entries", () => {
    expect(clientIpFrom("6.6.6.6, 203.0.113.9", null, 1)).toBe("203.0.113.9");
    expect(clientIpFrom("6.6.6.6, 198.51.100.1, 10.0.0.2", null, 2)).toBe("198.51.100.1");
    expect(clientIpFrom(null, "192.0.2.7")).toBe("192.0.2.7");
  });
});
