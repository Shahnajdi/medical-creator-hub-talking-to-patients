import type { MetadataRoute } from "next";

const PATHS = ["", "/about", "/services", "/services/meta-ads", "/services/lead-generation", "/services/crm-automation", "/training", "/courses", "/resources", "/case-studies", "/blog", "/contact", "/free-audit", "/free-meta-ads-guide", "/privacy", "/terms", "/cookies", "/refund-policy", "/subprocessors", "/imprint", "/accessibility", "/ai-disclosure", "/copyright"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return PATHS.map((p) => ({
    url: `${base}${p || "/"}`,
    alternates: { languages: { fa: `${base}${p || "/"}`, en: `${base}/en${p}` } },
  }));
}
