"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const inputCls =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-midnight placeholder:text-slate focus:border-meta focus:outline-none focus:ring-2 focus:ring-meta/30 aria-[invalid=true]:border-danger";

type Base = { label: string; name: string; error?: string; hint?: string; optionalLabel?: string; required?: boolean };

export function TextField({ label, name, error, hint, optionalLabel, required, value, onChange, type = "text", dir, autoComplete, inputMode }: Base & {
  value: string; onChange: (v: string) => void; type?: string; dir?: "ltr" | "rtl"; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {!required && optionalLabel && <span className="font-normal text-slate-strong">({optionalLabel})</span>}
      </label>
      <input id={id} name={name} type={type} dir={dir} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} inputMode={inputMode}
        aria-invalid={Boolean(error)} aria-describedby={describedBy} aria-required={required} className={cn(inputCls, dir === "ltr" && "text-left")} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-strong">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function SelectField({ label, name, error, required, value, onChange, options, placeholder }: Base & {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-required={required}
        aria-describedby={error ? `${id}-err` : undefined} className={inputCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function RadioGroup({ label, name, error, value, onChange, options }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm leading-6 has-[:checked]:border-meta has-[:checked]:bg-meta/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-meta", error ? "border-danger" : "border-line")}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="size-4 accent-meta" />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}

export function Checkbox({ checked, onChange, children, error, name }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; error?: string; name: string }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input id={id} name={name} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} className="mt-1 size-5 shrink-0 accent-meta" />
        <label htmlFor={id} className="text-sm leading-7">{children}</label>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="ms-8 mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
