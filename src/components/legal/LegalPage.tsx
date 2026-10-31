import { getTranslations } from "next-intl/server";
import { business } from "@/lib/legal/config";

export async function LegalPage({ title, version, children }: { title: string; version?: string; children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <article className="container-x max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
      {version && <p className="mt-3 text-sm text-slate-strong">{t("lastUpdated")}: <span className="ltr-nums">{version}</span></p>}
      <div className="prose-legal mt-8">{children}</div>
    </article>
  );
}

/** Renders a business detail, or an explicit "not provided" notice — never invented data. */
export async function Biz({ field }: { field: keyof typeof business }) {
  const t = await getTranslations("common");
  const v = business[field];
  if (v) return field.toLowerCase().includes("email") ? <a href={`mailto:${v}`}>{v}</a> : <>{v}</>;
  return <em className="text-danger" data-missing-business-field={field}>[{t("notProvided")}]</em>;
}
