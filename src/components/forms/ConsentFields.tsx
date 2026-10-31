"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Checkbox } from "./Fields";

export type ConsentValues = { acceptTerms: boolean; ageConfirm: boolean; marketingEmail: boolean; marketingWhatsapp: boolean };

/**
 * Required: terms + privacy notice acknowledgement, age confirmation.
 * Optional and UNTICKED by default: separate marketing consent per channel.
 */
export function ConsentFields({ v, set, errors, showWhatsapp }: { v: ConsentValues; set: (p: Partial<ConsentValues>) => void; errors: Record<string, string | undefined>; showWhatsapp: boolean }) {
  const t = useTranslations("forms");
  const err = (k: string) => (errors[k] ? t(`errors.${errors[k]}` as never) : undefined);
  return (
    <div className="space-y-3 rounded-2xl bg-mist p-4">
      <Checkbox name="acceptTerms" checked={v.acceptTerms} onChange={(c) => set({ acceptTerms: c })} error={err("acceptTerms")}>
        {t.rich("acceptTerms", {
          privacy: (chunks) => <Link href="/privacy" target="_blank" className="text-brand-700 underline">{chunks}</Link>,
          terms: (chunks) => <Link href="/terms" target="_blank" className="text-brand-700 underline">{chunks}</Link>,
        })}
      </Checkbox>
      <Checkbox name="ageConfirm" checked={v.ageConfirm} onChange={(c) => set({ ageConfirm: c })} error={err("ageConfirm")}>{t("ageConfirm")}</Checkbox>
      <Checkbox name="marketingEmail" checked={v.marketingEmail} onChange={(c) => set({ marketingEmail: c })}>{t("marketingEmail")}</Checkbox>
      {showWhatsapp && <Checkbox name="marketingWhatsapp" checked={v.marketingWhatsapp} onChange={(c) => set({ marketingWhatsapp: c })}>{t("marketingWhatsapp")}</Checkbox>}
      <p className="text-xs leading-6 text-slate-strong">{t("privacyNote")}</p>
    </div>
  );
}
