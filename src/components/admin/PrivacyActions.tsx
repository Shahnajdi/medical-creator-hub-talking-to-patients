"use client";

import { useState, useTransition } from "react";
import { eraseForRequest, exportForRequest, resolveRequest } from "@/server/admin-actions";

export function PrivacyActions({ id, type, labels }: { id: string; type: string; labels: { exportData: string; erase: string; eraseConfirm: string; complete: string; reject: string } }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const download = () => start(async () => {
    const json = await exportForRequest(id);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `data-export-${id}.json` });
    a.click();
    URL.revokeObjectURL(url);
  });
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={pending} onClick={download} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line">{labels.exportData}</button>
      {type === "deletion" && (
        <button disabled={pending} onClick={() => confirm(labels.eraseConfirm) && start(async () => { const r = await eraseForRequest(id); setMsg(JSON.stringify(r)); })} className="rounded-lg bg-danger px-3 py-1.5 text-sm text-white">{labels.erase}</button>
      )}
      <button disabled={pending} onClick={() => start(() => resolveRequest(id, "completed", ""))} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line">{labels.complete}</button>
      <button disabled={pending} onClick={() => start(() => resolveRequest(id, "rejected", ""))} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-line">{labels.reject}</button>
      {msg && <p role="status" className="text-xs text-success">{msg}</p>}
    </div>
  );
}
