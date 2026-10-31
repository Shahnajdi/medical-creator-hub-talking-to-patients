import { cn } from "@/lib/cn";

export function Section({ id, eyebrow, title, children, dark, className, lead }: { id?: string; eyebrow?: string; title?: string; lead?: string; children: React.ReactNode; dark?: boolean; className?: string }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn(dark ? "on-dark bg-ink text-white" : "", "py-16 sm:py-24", className)}>
      <div className="container-x">
        {(eyebrow || title) && (
          <div className="mb-10 max-w-2xl">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 id={headingId} className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h2>}
            {lead && <p className={cn("mt-4 leading-8", dark ? "text-white/80" : "text-slate-strong")}>{lead}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
