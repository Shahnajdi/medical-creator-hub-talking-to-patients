import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SimplePage } from "@/components/ui/SimplePage";
import { homeContent } from "@/content/home";

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { return { title: (await params).locale === "fa" ? "درباره ما" : "About" }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const f = homeContent[locale].founder;
  return (
    <SimplePage title={locale === "fa" ? "درباره NajdiTech" : "About NajdiTech"} cta={{ href: "/contact", label: locale === "fa" ? "تماس با ما" : "Contact us" }}>
      <h2 className="mt-8 text-xl font-bold">{f.title}</h2>
      {f.body.map((p) => <p key={p} className="mt-4 leading-9 text-slate-strong">{p}</p>)}
    </SimplePage>
  );
}
