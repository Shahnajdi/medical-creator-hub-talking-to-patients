/** Client-side consent state, stored in a first-party cookie (no third-party storage). */
export const CONSENT_COOKIE = "nt_consent";
export const CONSENT_VERSION = "2026-10-31";

export type ConsentState = { v: string; analytics: boolean; marketing: boolean; id: string; ts: number };

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const s = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as ConsentState;
    return s.v === CONSENT_VERSION ? s : null; // re-ask when the policy changes
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean, marketing: boolean): ConsentState {
  const prev = readConsent();
  const state: ConsentState = { v: CONSENT_VERSION, analytics, marketing, id: prev?.id ?? crypto.randomUUID(), ts: Date.now() };
  const maxAge = 180 * 86400; // re-confirm every 6 months
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("nt:consent", { detail: state }));
  // Proof of consent (server records the choice with the policy version).
  fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state), keepalive: true }).catch(() => {});
  return state;
}

export function newEventId() {
  return crypto.randomUUID();
}

/** First-party event tracking. Sends nothing unless analytics consent was given. */
export function track(name: string, properties: Record<string, string | number | boolean> = {}, eventId = newEventId()) {
  const c = readConsent();
  if (!c?.analytics) return eventId;
  const body = JSON.stringify({ name, eventId, visitorId: c.id, path: location.pathname, properties, utm: readUtm() });
  navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" })) ||
    fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
  w.gtag?.("event", name, properties);
  if (c.marketing) w.fbq?.("trackCustom", name, properties, { eventID: eventId });
  return eventId;
}

const UTM_KEY = "nt_utm";
/** UTM params are kept in sessionStorage only (cleared when the tab closes). */
export function captureUtm() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(location.search);
  const utm = {
    source: p.get("utm_source") ?? undefined,
    medium: p.get("utm_medium") ?? undefined,
    campaign: p.get("utm_campaign") ?? undefined,
    content: p.get("utm_content") ?? undefined,
    term: p.get("utm_term") ?? undefined,
  };
  try {
    if (Object.values(utm).some(Boolean) || !sessionStorage.getItem(UTM_KEY)) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify({ ...utm, referrer: document.referrer || undefined, landingPage: location.pathname }));
    }
  } catch {}
}

export function readUtm(): Record<string, string | undefined> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}");
  } catch {
    return {};
  }
}
