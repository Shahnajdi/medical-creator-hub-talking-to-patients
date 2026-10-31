"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AD_STATUS, AGENCY_STEPS, BUDGETS, CONTACT_METHODS, COUNTRIES, INDUSTRIES, OBJECTIVES, agencyLeadSchema } from "@/lib/crm/forms";
import { newEventId, readConsent, readUtm, track } from "@/lib/tracking/consent-state";
import { submitAgencyLeadAction } from "@/server/lead-actions";
import { RadioGroup, SelectField, TextField } from "./Fields";
import { ConsentFields } from "./ConsentFields";

type V = {
  fullName: string; email: string; whatsapp: string; country: string;
  businessName: string; industry: string; website: string; adStatus: string;
  objective: string; budget: string; preferredContact: string;
  acceptTerms: boolean; ageConfirm: boolean; marketingEmail: boolean; marketingWhatsapp: boolean; hp: string;
};

const initial: V = { fullName: "", email: "", whatsapp: "", country: "", businessName: "", industry: "", website: "", adStatus: "", objective: "", budget: "", preferredContact: "", acceptTerms: false, ageConfirm: false, marketingEmail: false, marketingWhatsapp: false, hp: "" };

export function AgencyLeadForm() {
  const t = useTranslations("forms");
  const locale = useLocale() as "fa" | "en";
  const router = useRouter();
  const [v, setV] = useState<V>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const started = useRef(false);
  const top = useRef<HTMLDivElement>(null);
  const set = (p: Partial<V>) => {
    if (!started.current) { started.current = true; track("lead_form_start", { funnel: "agency" }); }
    setV((o) => ({ ...o, ...p }));
  };
  const opt = <T extends string>(group: string, values: readonly T[]) => values.map((x) => ({ value: x, label: t(`options.${group}.${x}` as never) }));
  const err = (k: keyof V) => (errors[k] ? t(`errors.${errors[k]}` as never) : undefined);

  const payload = () => ({ ...v, email: v.email || undefined, whatsapp: v.whatsapp || undefined, website: v.website || undefined });

  function validate(fields: string[]) {
    const r = agencyLeadSchema.safeParse(payload());
    const next: Record<string, string> = {};
    if (!r.success) for (const i of r.error.issues) { const k = String(i.path[0]); if (fields.includes(k)) next[k] ??= i.message; }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function focusFirstError() {
    requestAnimationFrame(() => top.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
  }

  function nextStep() {
    if (validate(AGENCY_STEPS[step] as string[])) { setStep((s) => s + 1); requestAnimationFrame(() => top.current?.focus()); }
    else focusFirstError();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < AGENCY_STEPS.length - 1) return nextStep();
    if (!validate(AGENCY_STEPS.flat() as string[])) return focusFirstError();
    setFormError(null);
    const eventId = newEventId();
    start(async () => {
      const res = await submitAgencyLeadAction(locale, {
        ...payload(), eventId, visitorId: readConsent()?.analytics ? readConsent()?.id : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, utm: readUtm(),
      });
      if (res.ok) {
        track("lead_form_submit", { funnel: "agency" }, eventId);
        router.push({ pathname: "/thank-you", query: { funnel: "agency" } });
      } else if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        const firstStep = AGENCY_STEPS.findIndex((s) => s.some((f) => res.fieldErrors![f as string]));
        if (firstStep >= 0) setStep(firstStep);
        focusFirstError();
      } else {
        setFormError(res.formError ?? "server");
      }
    });
  }

  const total = AGENCY_STEPS.length;
  return (
    <form onSubmit={submit} noValidate className="space-y-6" aria-describedby="agency-step">
      <div ref={top} tabIndex={-1} className="outline-none">
        <p id="agency-step" className="text-sm font-semibold text-brand-700" aria-live="polite">{t("step", { current: step + 1, total })}</p>
        <div className="mt-2 h-1.5 rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-meta transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave empty<input tabIndex={-1} autoComplete="off" value={v.hp} onChange={(e) => set({ hp: e.target.value })} /></label>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <TextField required name="fullName" label={t("fullName")} value={v.fullName} onChange={(x) => set({ fullName: x })} error={err("fullName")} autoComplete="name" />
          <p className="text-sm text-slate-strong">{t("channelHint")}</p>
          <TextField name="email" type="email" dir="ltr" label={t("email")} optionalLabel={t("optional")} value={v.email} onChange={(x) => set({ email: x })} error={err("email")} autoComplete="email" inputMode="email" />
          <TextField name="whatsapp" type="tel" dir="ltr" label={t("whatsapp")} optionalLabel={t("optional")} hint={t("whatsappHint")} value={v.whatsapp} onChange={(x) => set({ whatsapp: x })} error={err("whatsapp")} autoComplete="tel" inputMode="tel" />
          <SelectField required name="country" label={t("country")} placeholder={t("select")} value={v.country} onChange={(x) => set({ country: x })} options={opt("country", COUNTRIES)} error={err("country")} />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <TextField required name="businessName" label={t("businessName")} value={v.businessName} onChange={(x) => set({ businessName: x })} error={err("businessName")} autoComplete="organization" />
          <SelectField required name="industry" label={t("industry")} placeholder={t("select")} value={v.industry} onChange={(x) => set({ industry: x })} options={opt("industry", INDUSTRIES)} error={err("industry")} />
          <TextField name="website" dir="ltr" label={t("website")} optionalLabel={t("optional")} value={v.website} onChange={(x) => set({ website: x })} error={err("website")} inputMode="url" />
          <RadioGroup name="adStatus" label={t("adStatus")} value={v.adStatus} onChange={(x) => set({ adStatus: x })} options={opt("adStatus", AD_STATUS)} error={err("adStatus")} />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          <RadioGroup name="objective" label={t("objective")} value={v.objective} onChange={(x) => set({ objective: x })} options={opt("objective", OBJECTIVES)} error={err("objective")} />
          <RadioGroup name="budget" label={t("budget")} value={v.budget} onChange={(x) => set({ budget: x })} options={opt("budget", BUDGETS)} error={err("budget")} />
          <RadioGroup name="preferredContact" label={t("preferredContact")} value={v.preferredContact} onChange={(x) => set({ preferredContact: x })} options={opt("preferredContact", CONTACT_METHODS)} error={err("preferredContact")} />
          <ConsentFields v={v} set={set} errors={errors} showWhatsapp={Boolean(v.whatsapp)} />
        </div>
      )}

      {formError && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t(`errors.${formError}` as never)}</p>}

      <div className="flex gap-3">
        {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="min-h-12 rounded-full px-5 font-semibold ring-1 ring-line">{t("back")}</button>}
        <button type="submit" disabled={pending} className="min-h-12 flex-1 rounded-full bg-meta px-5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {pending ? t("submitting") : step < total - 1 ? t("next") : t("submit")}
        </button>
      </div>
    </form>
  );
}
