"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { COUNTRIES, trainingLeadSchema } from "@/lib/crm/forms";
import { newEventId, readConsent, readUtm, track } from "@/lib/tracking/consent-state";
import { submitTrainingLeadAction } from "@/server/lead-actions";
import { SelectField, TextField } from "./Fields";
import { ConsentFields } from "./ConsentFields";

export function TrainingLeadForm({ submitLabel }: { submitLabel: string }) {
  const t = useTranslations("forms");
  const locale = useLocale() as "fa" | "en";
  const router = useRouter();
  const [v, setV] = useState({ fullName: "", email: "", whatsapp: "", country: "", acceptTerms: false, ageConfirm: false, marketingEmail: false, marketingWhatsapp: false, hp: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (p: Partial<typeof v>) => {
    if (!started.current) { started.current = true; track("lead_form_start", { funnel: "training" }); }
    setV((o) => ({ ...o, ...p }));
  };
  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}` as never) : undefined);
  const payload = () => ({ ...v, email: v.email || undefined, whatsapp: v.whatsapp || undefined });
  const focusErr = () => requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = trainingLeadSchema.safeParse(payload());
    if (!r.success) {
      const next: Record<string, string> = {};
      for (const i of r.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return focusErr();
    }
    setErrors({});
    setFormError(null);
    const eventId = newEventId();
    start(async () => {
      const res = await submitTrainingLeadAction(locale, { ...payload(), eventId, visitorId: readConsent()?.analytics ? readConsent()?.id : undefined, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, utm: readUtm() });
      if (res.ok) {
        track("lead_form_submit", { funnel: "training" }, eventId);
        router.push({ pathname: "/thank-you", query: { funnel: "training", dl: res.downloadToken ?? "" } });
      } else if (res.fieldErrors) { setErrors(res.fieldErrors); focusErr(); }
      else setFormError(res.formError ?? "server");
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave empty<input tabIndex={-1} autoComplete="off" value={v.hp} onChange={(e) => set({ hp: e.target.value })} /></label>
      </div>
      <TextField required name="fullName" label={t("fullName")} value={v.fullName} onChange={(x) => set({ fullName: x })} error={err("fullName")} autoComplete="name" />
      <p className="text-sm text-slate-strong">{t("channelHint")}</p>
      <TextField name="email" type="email" dir="ltr" label={t("email")} optionalLabel={t("optional")} value={v.email} onChange={(x) => set({ email: x })} error={err("email")} autoComplete="email" inputMode="email" />
      <TextField name="whatsapp" type="tel" dir="ltr" label={t("whatsapp")} optionalLabel={t("optional")} hint={t("whatsappHint")} value={v.whatsapp} onChange={(x) => set({ whatsapp: x })} error={err("whatsapp")} autoComplete="tel" inputMode="tel" />
      <SelectField required name="country" label={t("country")} placeholder={t("select")} value={v.country} onChange={(x) => set({ country: x })} options={COUNTRIES.map((c) => ({ value: c, label: t(`options.country.${c}` as never) }))} error={err("country")} />
      <ConsentFields v={v} set={set} errors={errors} showWhatsapp={Boolean(v.whatsapp)} />
      {formError && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{t(`errors.${formError}` as never)}</p>}
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-meta px-5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {pending ? t("submitting") : submitLabel}
      </button>
    </form>
  );
}
