import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "lime" | "outlineDark";
const styles: Record<Variant, string> = {
  primary: "bg-meta text-white hover:bg-brand-700",
  secondary: "bg-white text-midnight ring-1 ring-line hover:ring-slate-soft",
  ghost: "text-midnight hover:bg-mist",
  lime: "bg-lime text-ink hover:brightness-95",
  outlineDark: "text-white ring-1 ring-white/30 hover:bg-white/10",
};
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, styles[variant], className)} {...props} />;
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, styles[variant], className)} {...props} />;
}
