import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function SimplePage({ title, lead, items, cta, children }: { title: string; lead?: string; items?: readonly string[]; cta?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="container-x max-w-3xl py-14 sm:py-20">
      <h1 className="text-3xl font-black leading-tight sm:text-5xl sm:leading-tight">{title}</h1>
      {lead && <p className="mt-5 text-lg leading-9 text-slate-strong">{lead}</p>}
      {items && <ul className="mt-8 space-y-3">{items.map((i) => <li key={i} className="flex gap-3 leading-8"><CheckCircle2 aria-hidden className="mt-1.5 size-5 shrink-0 text-meta" />{i}</li>)}</ul>}
      {children}
      {cta && <Link href={cta.href} className="mt-10 inline-flex min-h-12 items-center rounded-full bg-meta px-6 font-semibold text-white hover:bg-brand-700">{cta.label}</Link>}
    </div>
  );
}
