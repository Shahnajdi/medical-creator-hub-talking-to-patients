"use client";

import { useOptimistic, useState, useTransition } from "react";
import { moveOpportunity } from "@/server/admin-actions";
import { Link } from "@/i18n/navigation";

type Stage = { id: string; name: string };
type Card = { id: string; title: string; name: string; country: string | null; stageId: string; contactId: string };

/**
 * Pipeline board. Drag-and-drop for pointer users AND a stage <select> on
 * every card so keyboard and screen-reader users can move cards too.
 */
export function Kanban({ stages, cards, moveLabel, errorLabel }: { stages: Stage[]; cards: Card[]; moveLabel: string; errorLabel: string }) {
  const [optimistic, apply] = useOptimistic(cards, (state, m: { id: string; stageId: string }) => state.map((c) => (c.id === m.id ? { ...c, stageId: m.stageId } : c)));
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const move = (id: string, stageId: string) =>
    start(async () => {
      apply({ id, stageId });
      try { await moveOpportunity(id, stageId); setError(null); } catch { setError(errorLabel); }
    });
  return (
    <>
      {error && <p role="alert" className="mb-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((s) => {
          const list = optimistic.filter((c) => c.stageId === s.id);
          return (
            <section key={s.id} aria-label={s.name}
              onDragOver={(e) => { e.preventDefault(); setDragOver(s.id); }} onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, s.id); }}
              className={`w-64 shrink-0 rounded-2xl p-3 ${dragOver === s.id ? "bg-meta/10 ring-2 ring-meta" : "bg-white ring-1 ring-line"}`}>
              <h2 className="mb-3 flex justify-between text-sm font-bold"><span>{s.name}</span><span className="text-slate-strong">{list.length}</span></h2>
              <ul className="space-y-2">
                {list.map((c) => (
                  <li key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} className="cursor-grab rounded-xl border border-line bg-mist p-3 text-sm">
                    <Link href={`/admin/contacts/${c.contactId}`} className="font-semibold text-brand-700 underline">{c.name}</Link>
                    <p className="text-xs text-slate-strong">{c.title} {c.country ? `· ${c.country}` : ""}</p>
                    <label className="mt-2 block text-xs">
                      <span className="sr-only">{moveLabel}</span>
                      <select value={c.stageId} onChange={(e) => move(c.id, e.target.value)} className="w-full rounded-lg border border-line bg-white p-1">
                        {stages.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
