"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { submitPrivacyRequest } from "@/server/privacy-actions";

const c = {
  fa: { type: "نوع درخواست", access: "دریافت نسخه‌ای از داده‌هایم", deletion: "حذف داده‌هایم", correction: "اصلاح داده‌هایم", objection: "اعتراض به پردازش / توقف پیام‌ها", email: "ایمیلی که با آن با ما در ارتباط بوده‌اید", details: "توضیحات (اختیاری)", submit: "ثبت درخواست", sending: "در حال ارسال…", done: "اگر این ایمیل معتبر باشد، لینک تأیید برایش ارسال شد. برای تکمیل درخواست، روی لینک داخل ایمیل بزنید.", invalid: "لطفاً ایمیل معتبر وارد کنید.", rate_limited: "تعداد درخواست‌ها زیاد بوده است. کمی بعد تلاش کنید.", server: "ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید." },
  en: { type: "Request type", access: "Get a copy of my data", deletion: "Delete my data", correction: "Correct my data", objection: "Object to processing / stop messages", email: "The email you used with us", details: "Details (optional)", submit: "Submit request", sending: "Sending…", done: "If this email is valid, we've sent it a confirmation link. Click the link in the email to complete your request.", invalid: "Please enter a valid email.", rate_limited: "Too many requests. Please try again later.", server: "Something went wrong. Please try again." },
};

export function PrivacyRequestForm() {
  const locale = useLocale() as "fa" | "en";
  const t = c[locale];
  const [type, setType] = useState("access");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "done" | string>("idle");
  const [pending, start] = useTransition();
  if (state === "done") return <p role="status" className="rounded-xl bg-success/10 p-4 leading-8 text-success">{t.done}</p>;
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await submitPrivacyRequest(locale, { type, email, details: details || undefined }); setState(r.ok ? "done" : (r.error ?? "server")); }); }}>
      <fieldset>
        <legend className="text-sm font-semibold">{t.type}</legend>
        <div className="mt-2 grid gap-2">
          {(["access", "deletion", "correction", "objection"] as const).map((k) => (
            <label key={k} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-4 has-[:checked]:border-meta">
              <input type="radio" name="type" value={k} checked={type === k} onChange={() => setType(k)} className="size-4 accent-meta" />{t[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-semibold">{t.email}
        <input required type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1.5 block min-h-12 w-full rounded-xl border border-line px-4 text-base font-normal" />
      </label>
      <label className="block text-sm font-semibold">{t.details}
        <textarea value={details} maxLength={2000} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-1.5 block w-full rounded-xl border border-line p-3 text-base font-normal" />
      </label>
      {state !== "idle" && <p role="alert" className="text-sm text-danger">{t[state as "invalid"] ?? t.server}</p>}
      <button disabled={pending} className="min-h-12 w-full rounded-full bg-meta font-semibold text-white disabled:opacity-60">{pending ? t.sending : t.submit}</button>
    </form>
  );
}
