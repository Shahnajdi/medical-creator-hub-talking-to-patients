/** Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII digits. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = toLatinDigits(email).trim().toLowerCase();
  return e.length ? e : null;
}

/**
 * Normalises a phone number to digits with a leading "+" when an international
 * prefix was given ("00" is treated as "+"). We do not guess country codes —
 * the form asks for an international number.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = toLatinDigits(phone).trim();
  const plus = p.startsWith("+") || p.startsWith("00");
  p = p.replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.length < 7 || p.length > 15) return null;
  return plus ? `+${p}` : p;
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  try {
    const parsed = new URL(withScheme);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
