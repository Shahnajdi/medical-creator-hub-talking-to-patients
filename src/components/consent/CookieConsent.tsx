"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { readConsent, writeConsent } from "@/lib/tracking/consent-state";

/**
 * Consent banner. "Accept all" and "Reject all" have equal prominence, nothing
 * is pre-ticked, closing is not treated as consent, and trackers only load
 * after an explicit opt-in. Honors Global Privacy Control for advertising.
 */
export function CookieConsent() {
  const t = useTranslations("cookie");
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener("nt:open-consent", reopen);
    return () => window.removeEventListener("nt:open-consent", reopen);
  }, []);

  useEffect(() => {
    if (open) firstButton.current?.focus({ preventScroll: true });
  }, [open, custom]);

  if (!open) return null;
  const gpc = typeof navigator !== "undefined" && (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  const decide = (a: boolean, m: boolean) => {
    writeConsent(a, gpc ? false : m);
    setOpen(false);
  };

  return (
    <section
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
      data-testid="cookie-banner"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-5 text-midnight shadow-2xl">
        <h2 className="text-base font-bold">{t("title")}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-strong">
          {t("body")}{" "}
          <Link href="/cookies" className="text-brand-700 underline">{t("policy")}</Link>
        </p>

        {custom && (
          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">{t("customize")}</legend>
            <div className="flex items-start justify-between gap-4 rounded-xl bg-mist p-3">
              <div><p className="text-sm font-semibold">{t("necessary")}</p><p className="text-xs leading-6 text-slate-strong">{t("necessaryDesc")}</p></div>
              <span className="shrink-0 text-xs font-medium text-slate-strong">{t("always")}</span>
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl bg-mist p-3">
              <span><span className="block text-sm font-semibold">{t("analytics")}</span><span className="block text-xs leading-6 text-slate-strong">{t("analyticsDesc")}</span></span>
              <input type="checkbox" className="mt-1 size-5 shrink-0 accent-meta" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl bg-mist p-3">
              <span><span className="block text-sm font-semibold">{t("marketing")}</span><span className="block text-xs leading-6 text-slate-strong">{t("marketingDesc")}</span></span>
              <input type="checkbox" className="mt-1 size-5 shrink-0 accent-meta" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} disabled={gpc} />
            </label>
          </fieldset>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button ref={firstButton} type="button" onClick={() => decide(false, false)} className="min-h-11 rounded-full bg-midnight px-4 text-sm font-semibold text-white">
            {t("rejectAll")}
          </button>
          <button type="button" onClick={() => decide(true, true)} className="min-h-11 rounded-full bg-midnight px-4 text-sm font-semibold text-white">
            {t("acceptAll")}
          </button>
          {custom ? (
            <button type="button" onClick={() => decide(analytics, marketing)} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line">
              {t("save")}
            </button>
          ) : (
            <button type="button" onClick={() => setCustom(true)} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line">
              {t("customize")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" className="hover:text-white hover:underline" onClick={() => window.dispatchEvent(new Event("nt:open-consent"))}>
      {label}
    </button>
  );
}
