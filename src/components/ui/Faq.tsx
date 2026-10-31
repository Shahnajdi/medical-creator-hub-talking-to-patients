import type { FaqItem } from "@/content/home";

/** Native <details> — keyboard and screen-reader accessible with no JS. */
export function Faq({ groups }: { groups: Record<string, { label: string; items: FaqItem[] }> }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {Object.entries(groups).map(([key, g]) => (
        <div key={key}>
          <h3 className="mb-3 text-lg font-bold">{g.label}</h3>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {g.items.map((it) => (
              <details key={it.q} className="group p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold leading-7">
                  {it.q}
                  <span aria-hidden className="mt-1 text-meta transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 leading-8 text-slate-strong">{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
