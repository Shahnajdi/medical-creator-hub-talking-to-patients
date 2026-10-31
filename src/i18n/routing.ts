import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  localePrefix: "as-needed",
  // Persian is the default for everyone; English is an explicit choice.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
export const dirOf = (l: string) => (l === "fa" ? "rtl" : "ltr");
