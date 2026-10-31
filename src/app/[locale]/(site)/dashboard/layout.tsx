import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const nav = { fa: [["/dashboard", "داشبورد"], ["/dashboard/courses", "دوره‌های من"], ["/dashboard/billing", "پرداخت و اشتراک"], ["/dashboard/profile", "حساب و حریم خصوصی"]], en: [["/dashboard", "Dashboard"], ["/dashboard/courses", "My courses"], ["/dashboard/billing", "Billing"], ["/dashboard/profile", "Account & privacy"]] };

export default async function DashLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "fa";
  return (
    <div className="container-x grid gap-8 py-10 md:grid-cols-[13rem_1fr]">
      <nav aria-label="Dashboard"><ul className="flex flex-wrap gap-2 md:flex-col">{nav[locale].map(([h, l]) => <li key={h}><Link href={h!} className="block rounded-lg px-3 py-2 text-sm ring-1 ring-line hover:bg-mist">{l}</Link></li>)}</ul></nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
