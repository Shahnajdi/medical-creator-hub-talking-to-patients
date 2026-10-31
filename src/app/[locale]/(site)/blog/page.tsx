import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { publishedBlogPosts } from "@/lib/content";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { return { title: (await params).locale === "fa" ? "مقالات" : "Blog" }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const t = await getTranslations("common");
  const posts = await publishedBlogPosts(locale);
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="text-3xl font-black sm:text-5xl">{locale === "fa" ? "مقالات" : "Blog"}</h1>
      {posts.length === 0 ? <p className="mt-8 text-slate-strong">{t("empty")}</p> : (
        <ul className="mt-10 space-y-6">{posts.map((p) => (
          <li key={p.id}><Link href={`/blog/${p.slug}`} className="block rounded-2xl p-5 ring-1 ring-line hover:ring-meta"><h2 className="text-xl font-bold">{p.title}</h2><p className="mt-2 leading-8 text-slate-strong">{p.excerpt}</p>{p.aiAssisted && <p className="mt-2 text-xs font-semibold text-brand-700">{t("aiAssisted")}</p>}</Link></li>
        ))}</ul>
      )}
    </div>
  );
}
