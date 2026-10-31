"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { COUNTRIES } from "@/lib/crm/forms";
import { startCheckoutAction } from "@/server/checkout-actions";
import { track } from "@/lib/tracking/consent-state";

type Price = { currency: string; label: string; taxInclusive: boolean };
type T = Record<"currency" | "country" | "billingName" | "method" | "pay" | "taxIncl" | "taxExcl" | "renewal" | "refund" | "noHidden" | "total" | "renewalAck" | "error" | "blocked", string>;

export function CheckoutForm({ product, prices, providers, interval, t, blocked }: { product: string; prices: Price[]; providers: { id: string; label: string }[]; interval: string; t: T; blocked: string[] }) {
  const locale = useLocale() as "fa" | "en";
  const f = useTranslations("forms");
  const [currency, setCurrency] = useState(prices[0]?.currency ?? "");
  const [provider, setProvider] = useState(providers[0]?.id ?? "");
  const [country, setCountry] = useState("");
  const [billingName, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [renewalAck, setRenewalAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const price = prices.find((p) => p.currency === currency);
  const isBlocked = country && blocked.includes(country);
  const recurring = interval !== "one_time";

  return (
    <form className="space-y-5" onSubmit={(e) => {
      e.preventDefault();
      setError(null);
      start(async () => {
        track("checkout_started", { product });
        const r = await startCheckoutAction(locale, { product, currency, provider, billingName, country, acceptTerms: terms, acknowledgeRenewal: renewalAck });
        if (r.ok) window.location.assign(r.redirect);
        else setError(r.error);
      });
    }}>
      <label className="block text-sm font-semibold">{t.billingName}<input required value={billingName} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 block min-h-12 w-full rounded-xl border border-line px-4" /></label>
      <label className="block text-sm font-semibold">{t.country}
        <select required value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1.5 block min-h-12 w-full rounded-xl border border-line px-4">
          <option value="">{f("select")}</option>{COUNTRIES.map((c) => <option key={c} value={c}>{f(`options.country.${c}` as never)}</option>)}
        </select>
      </label>
      {isBlocked ? (
        <p role="status" className="rounded-xl bg-mist p-4 leading-8">{t.blocked} <Link href="/contact" className="text-brand-700 underline">{locale === "fa" ? "تماس با ما" : "Contact us"}</Link></p>
      ) : (
        <>
          <fieldset><legend className="text-sm font-semibold">{t.currency}</legend>
            <div className="mt-2 flex flex-wrap gap-2">{prices.map((p) => (
              <label key={p.currency} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 has-[:checked]:border-meta"><input type="radio" name="currency" checked={currency === p.currency} onChange={() => setCurrency(p.currency)} className="accent-meta" />{p.currency}</label>
            ))}</div>
          </fieldset>
          <fieldset><legend className="text-sm font-semibold">{t.method}</legend>
            <div className="mt-2 grid gap-2">{providers.map((p) => (
              <label key={p.id} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 has-[:checked]:border-meta"><input type="radio" name="provider" checked={provider === p.id} onChange={() => setProvider(p.id)} className="accent-meta" />{p.label}</label>
            ))}</div>
          </fieldset>
          {price && (
            <div className="rounded-2xl bg-mist p-4 text-sm leading-7">
              <p className="flex justify-between text-base font-bold"><span>{t.total}</span><span className="ltr-nums">{price.label}</span></p>
              <p>{price.taxInclusive ? t.taxIncl : t.taxExcl}</p>
              <p>{t.noHidden}</p>
              <p>{t.refund}</p>
              {recurring && <p className="mt-2 font-semibold">{t.renewal}</p>}
            </div>
          )}
          <label className="flex gap-3 text-sm leading-7"><input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 size-5 shrink-0 accent-meta" />
            <span>{f.rich("acceptTerms", { privacy: (c) => <Link href="/privacy" target="_blank" className="text-brand-700 underline">{c}</Link>, terms: (c) => <Link href="/terms" target="_blank" className="text-brand-700 underline">{c}</Link> })}</span></label>
          {recurring && <label className="flex gap-3 text-sm leading-7"><input type="checkbox" required checked={renewalAck} onChange={(e) => setRenewalAck(e.target.checked)} className="mt-1 size-5 shrink-0 accent-meta" /><span>{t.renewalAck}</span></label>}
          {error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t.error}</p>}
          <button disabled={pending || !price || !provider} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{t.pay}{price ? ` — ${price.label}` : ""}</button>
        </>
      )}
    </form>
  );
}
