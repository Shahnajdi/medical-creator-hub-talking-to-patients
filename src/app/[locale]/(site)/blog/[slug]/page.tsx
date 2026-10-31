import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Blog bodies are rendered as plain text paragraphs — no raw HTML injection (XSS-safe by construction). */
export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }) {
  const { locale, slug } = await params; setRequestLocale(locale);
  const post = await db().query.blogPosts.findFirst({ where: (b, { and, eq }) => and(eq(b.slug, slug), eq(b.locale, locale), eq(b.status, "published")) });
  if (!post) notFound();
  const t = await getTranslations("common");
  return (
    <article className="container-x max-w-3xl py-14">
      <h1 className="text-3xl font-black sm:text-4xl">{post.title}</h1>
      {post.aiAssisted && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-xs font-semibold"><Sparkles aria-hidden className="size-4" />{t("aiAssisted")}</p>}
      <div className="mt-8 space-y-5">{post.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-wrap leading-9">{p}</p>)}</div>
    </article>
  );
}
