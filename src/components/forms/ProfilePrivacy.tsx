"use client";

import { useActionState, useTransition } from "react";
import { deleteMyAccount, downloadMyData } from "@/server/account-actions";

export function ProfilePrivacy({ t }: { t: { download: string; deleteTitle: string; deleteBody: string; password: string; deleteBtn: string; wrong: string; staff: string } }) {
  const [pending, start] = useTransition();
  const [state, action, deleting] = useActionState(deleteMyAccount, {});
  return (
    <div className="space-y-8">
      <button disabled={pending} onClick={() => start(async () => {
        const url = URL.createObjectURL(new Blob([await downloadMyData()], { type: "application/json" }));
        Object.assign(document.createElement("a"), { href: url, download: "najditech-my-data.json" }).click();
        URL.revokeObjectURL(url);
      })} className="min-h-12 rounded-full bg-midnight px-5 font-semibold text-white">{t.download}</button>
      <form action={action} className="space-y-3 rounded-2xl p-5 ring-1 ring-danger/40">
        <h2 className="font-bold">{t.deleteTitle}</h2>
        <p className="text-sm leading-7 text-slate-strong">{t.deleteBody}</p>
        <label className="block text-sm font-semibold">{t.password}<input name="password" type="password" required autoComplete="current-password" dir="ltr" className="mt-1.5 block min-h-12 w-full rounded-xl border border-line px-4" /></label>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error === "staff" ? t.staff : t.wrong}</p>}
        <button disabled={deleting} className="min-h-12 rounded-full bg-danger px-5 font-semibold text-white">{t.deleteBtn}</button>
      </form>
    </div>
  );
}
