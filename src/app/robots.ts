import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/en/admin", "/dashboard", "/en/dashboard", "/api/", "/checkout", "/en/checkout", "/thank-you", "/en/thank-you"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
