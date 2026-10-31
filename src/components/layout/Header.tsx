"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { NavPill } from "./NavPill";

const ITEMS = [
  { href: "/services", key: "services" },
  { href: "/training", key: "training" },
  { href: "/case-studies", key: "caseStudies" },
  { href: "/resources", key: "resources" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  // The menu is "open for" a given path, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenFor((typeof v === "function" ? v(open) : v) ? pathname : null);
  const active = ITEMS.findIndex((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <header className="on-dark sticky top-0 z-40 border-b border-white/10 bg-ink/90 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/75">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-latin text-lg font-bold tracking-tight" aria-label="NajdiTech — home">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-meta text-sm">N</span>
          <span>Najdi<span className="text-lime">Tech</span></span>
        </Link>

        <nav aria-label={t("menu")} className="hidden lg:block">
          <NavPill activeIndex={active} className="flex items-center gap-1">
            {ITEMS.map((i, idx) => (
              <Link
                key={i.href}
                href={i.href}
                data-pill-item
                aria-current={idx === active ? "page" : undefined}
                className="relative z-10 rounded-full px-4 py-2 text-sm text-white/85 transition-colors hover:text-white aria-[current=page]:text-white"
              >
                {t(i.key)}
              </Link>
            ))}
          </NavPill>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={pathname} locale={locale === "fa" ? "en" : "fa"} className="rounded-full px-3 py-2 text-sm text-white/85 hover:text-white" aria-label={t("languageLabel")} lang={locale === "fa" ? "en" : "fa"}>
            {t("language")}
          </Link>
          <Link href="/free-audit" className="hidden min-h-10 items-center rounded-full bg-lime px-4 text-sm font-semibold text-ink sm:inline-flex">
            {t("cta")}
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t("menu")} className="border-t border-white/10 lg:hidden">
          <ul className="container-x flex flex-col py-3">
            {ITEMS.map((i, idx) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={idx === active ? "page" : undefined} className="block rounded-lg px-3 py-3 text-base hover:bg-white/10 aria-[current=page]:text-lime">
                  {t(i.key)}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/free-audit" className="flex min-h-12 items-center justify-center rounded-full bg-lime font-semibold text-ink">
                {t("cta")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
