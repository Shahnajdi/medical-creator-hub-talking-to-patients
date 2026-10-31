import { notFound } from "next/navigation";
import { z } from "zod";
import { pageGuard } from "@/lib/auth/guard";
import { getContactForUser } from "@/lib/crm/queries";
import { adminLabels } from "@/components/admin/labels";
import { addNote } from "@/server/admin-actions";

export default async function ContactPage({ params }: { params: Promise<{ locale: "fa" | "en"; id: string }> }) {
  const { locale, id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await pageGuard("admin.access", locale, `/admin/contacts/${id}`);
  const data = await getContactForUser(user, id);
  if (!data) notFound();
  const { contact, activities, consents, opps, leads } = data;
  const L = adminLabels[locale];
  const df = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: user.timezone });
  // Effective consent per purpose = latest non-withdrawn record.
  const latest = new Map<string, (typeof consents)[number]>();
  for (const c of consents) if (!latest.has(c.purpose)) latest.set(c.purpose, c);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <header className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h1 className="text-2xl font-black">{contact.fullName}</h1>
          <p className="mt-1 text-sm text-slate-strong" dir="ltr">{[contact.email, contact.whatsapp].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 text-sm">{contact.country} · {contact.tags.join(", ")}</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">{opps.map((o) => <li key={o.id} className="rounded-full bg-mist px-3 py-1">{L[o.pipeline]} — {locale === "fa" ? o.stageFa : o.stageEn}</li>)}</ul>
          {leads[0] && <p className="mt-2 text-sm">{L.score}: {leads[0].score} · {L[leads[0].qualification]}</p>}
        </header>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">{L.addNote}</h2>
          <form action={addNote.bind(null, contact.id)} className="mt-3 space-y-2">
            <label className="sr-only" htmlFor="note">{L.addNote}</label>
            <textarea id="note" name="note" required maxLength={5000} rows={3} className="w-full rounded-xl border border-line p-3" />
            <button className="min-h-11 rounded-xl bg-meta px-4 font-semibold text-white">{L.save}</button>
          </form>
        </section>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">{L.timeline}</h2>
          <ol className="mt-4 space-y-4 border-s-2 border-line ps-4">
            {activities.map((a) => (
              <li key={a.id}>
                <p className="text-xs text-slate-strong">{df.format(a.createdAt)} · {a.type}</p>
                <p className="whitespace-pre-wrap leading-7">{a.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <aside className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <h2 className="font-bold">{L.consents}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[...latest.values()].map((c) => (
            <li key={c.id} className="flex justify-between gap-2">
              <span>{c.purpose}</span>
              <span className={c.granted && !c.withdrawnAt ? "text-success" : "text-slate-strong"}>{c.withdrawnAt ? L.withdrawn : c.granted ? L.granted : L.denied} · v{c.documentVersion}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
