import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { business } from "@/lib/legal/config";
import { CookieSettingsButton } from "@/components/consent/CookieConsent";

export async function Footer() {
  const t = await getTranslations("footer");
  const legal = [
    ["/privacy", "privacy"],
    ["/terms", "terms"],
    ["/cookies", "cookies"],
    ["/refund-policy", "refund"],
    ["/subprocessors", "subprocessors"],
    ["/imprint", "imprint"],
    ["/copyright", "copyright"],
    ["/accessibility", "accessibility"],
    ["/ai-disclosure", "ai"],
  ] as const;
  return (
    <footer className="on-dark bg-ink text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-latin text-lg font-bold text-white">Najdi<span className="text-lime">Tech</span></p>
          <p className="text-sm leading-7">{t("tagline")}</p>
          <address className="space-y-1 text-sm not-italic leading-7">
            {business.entityName && <div>{business.entityName}</div>}
            {business.address && <div>{business.address}</div>}
            {business.email && (
              <div>
                <a className="underline" href={`mailto:${business.email}`}>{business.email}</a>
              </div>
            )}
          </address>
        </div>
        <nav aria-label={t("legal")} className="md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-white">{t("legal")}</h2>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {legal.map(([href, key]) => (
              <li key={href}><Link href={href} className="hover:text-white hover:underline">{t(key)}</Link></li>
            ))}
            <li><Link href="/privacy-request" className="hover:text-white hover:underline">{t("privacyRequest")}</Link></li>
            <li><CookieSettingsButton label={t("cookieSettings")} /></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs leading-6 text-white/70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {business.entityName ?? business.brand}. {t("rights")}</p>
          <p>{t("noGuarantee")}</p>
        </div>
      </div>
    </footer>
  );
}
