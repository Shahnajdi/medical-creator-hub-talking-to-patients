import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { adminLabels } from "@/components/admin/labels";
import { logoutAction } from "@/server/auth-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: "Admin" };

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "fa";
  setRequestLocale(locale);
  const user = await getSessionUser();
  const L = adminLabels[locale];
  const nav = user
    ? ([
        ["/admin", L.overview, "analytics.read"],
        ["/admin/leads", L.leads, "admin.access"],
        ["/admin/pipelines", L.pipelines, "admin.access"],
        ["/admin/privacy", L.privacy, "privacy.manage"],
        ["/admin/audit-logs", L.audit, "audit.read"],
      ] as const).filter(([, , p]) => can(user.role, p))
    : [];
  return (
    <div className="min-h-dvh bg-mist lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="on-dark bg-ink p-4 text-white lg:min-h-dvh">
        <p className="font-latin text-lg font-bold">Najdi<span className="text-lime">Tech</span> <span className="text-sm font-normal text-white/70">{L.title}</span></p>
        <nav aria-label={L.title} className="mt-6">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {nav.map(([href, label]) => <li key={href}><Link href={href} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10">{label}</Link></li>)}
          </ul>
        </nav>
        {user && (
          <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
            <p className="text-white/70">{user.name} · {user.role}</p>
            <Link href="/" className="block underline">{L.site}</Link>
            <form action={logoutAction}><button className="underline">{L.logout}</button></form>
          </div>
        )}
      </aside>
      <main id="main" className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
