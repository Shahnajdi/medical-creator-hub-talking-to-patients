"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction, registerAction, requestPasswordReset, resetPassword, type AuthResult } from "@/server/auth-actions";

const input = "mt-1.5 block min-h-12 w-full rounded-xl border border-line px-4 text-base font-normal";
const initial: AuthResult = { ok: false };

function Err({ error }: { error?: string }) {
  const t = useTranslations("auth");
  const f = useTranslations("forms.errors");
  if (!error) return null;
  const msg = error === "invalid" ? t("invalid") : error === "exists" ? t("exists") : error === "expired" ? t("resetInvalid") : error === "password" ? t("passwordHint") : error === "terms" ? f("terms_required") : error === "age" ? f("age_required") : error === "rate_limited" ? f("rate_limited") : f("server");
  return <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{msg}</p>;
}

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block text-sm font-semibold">{t("email")}<input name="email" type="email" required autoComplete="email" dir="ltr" className={input} /></label>
      <label className="block text-sm font-semibold">{t("password")}<input name="password" type="password" required autoComplete="current-password" dir="ltr" className={input} /></label>
      <Err error={state.error} />
      <button disabled={pending} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{t("submitLogin")}</button>
      <div className="flex justify-between text-sm"><Link href="/forgot-password" className="text-brand-700 underline">{t("forgot")}</Link><Link href="/register" className="text-brand-700 underline">{t("register")}</Link></div>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const f = useTranslations("forms");
  const locale = useLocale() as "fa" | "en";
  const [state, action, pending] = useActionState(registerAction.bind(null, locale), initial);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold">{t("name")}<input name="name" required autoComplete="name" className={input} /></label>
      <label className="block text-sm font-semibold">{t("email")}<input name="email" type="email" required autoComplete="email" dir="ltr" className={input} /></label>
      <label className="block text-sm font-semibold">{t("password")} <span className="font-normal text-slate-strong">({t("passwordHint")})</span><input name="password" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className={input} /></label>
      <div className="space-y-3 rounded-2xl bg-mist p-4 text-sm leading-7">
        <label className="flex gap-3"><input type="checkbox" name="acceptTerms" required className="mt-1 size-5 shrink-0 accent-meta" /><span>{f.rich("acceptTerms", { privacy: (c) => <Link href="/privacy" target="_blank" className="text-brand-700 underline">{c}</Link>, terms: (c) => <Link href="/terms" target="_blank" className="text-brand-700 underline">{c}</Link> })}</span></label>
        <label className="flex gap-3"><input type="checkbox" name="ageConfirm" required className="mt-1 size-5 shrink-0 accent-meta" /><span>{f("ageConfirm")}</span></label>
        <label className="flex gap-3"><input type="checkbox" name="marketingEmail" className="mt-1 size-5 shrink-0 accent-meta" /><span>{f("marketingEmail")}</span></label>
      </div>
      <Err error={state.error} />
      <button disabled={pending} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{t("submitRegister")}</button>
      <p className="text-sm">{t("haveAccount")} <Link href="/login" className="text-brand-700 underline">{t("login")}</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as "fa" | "en";
  const [state, action, pending] = useActionState(requestPasswordReset.bind(null, locale), initial);
  if (state.ok) return <p role="status" className="rounded-xl bg-success/10 p-4 leading-8 text-success">{t("resetSent")}</p>;
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold">{t("email")}<input name="email" type="email" required autoComplete="email" dir="ltr" className={input} /></label>
      <Err error={state.error} />
      <button disabled={pending} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{t("resetSend")}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState(resetPassword, initial);
  if (state.ok) return <p role="status" className="rounded-xl bg-success/10 p-4 text-success">{t("resetDone")} <Link href="/login" className="underline">{t("login")}</Link></p>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-semibold">{t("newPassword")} <span className="font-normal text-slate-strong">({t("passwordHint")})</span><input name="password" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className={input} /></label>
      <Err error={state.error} />
      <button disabled={pending} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{t("newPassword")}</button>
    </form>
  );
}
