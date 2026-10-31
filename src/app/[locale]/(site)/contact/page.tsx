import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Biz } from "@/components/legal/LegalPage";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { return { title: (await params).locale === "fa" ? "تماس با ما" : "Contact" }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const fa = locale === "fa";
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="text-3xl font-black sm:text-5xl">{fa ? "تماس با ما" : "Contact us"}</h1>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {([[fa ? "ایمیل" : "Email", "email"], [fa ? "تلفن" : "Phone", "phone"], [fa ? "نشانی" : "Address", "address"], [fa ? "نام حقوقی" : "Legal name", "entityName"]] as const).map(([l, f]) => (
          <div key={f} className="rounded-2xl p-4 ring-1 ring-line"><dt className="text-sm text-slate-strong">{l}</dt><dd className="mt-1 font-semibold"><Biz field={f} /></dd></div>
        ))}
      </dl>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/free-audit" className="inline-flex min-h-12 items-center rounded-full bg-meta px-5 font-semibold text-white">{fa ? "درخواست بررسی رایگان تبلیغات" : "Request a free ad review"}</Link>
        <Link href="/free-meta-ads-guide" className="inline-flex min-h-12 items-center rounded-full px-5 font-semibold ring-1 ring-line">{fa ? "شروع یادگیری" : "Start learning"}</Link>
      </div>
    </div>
  );
}
