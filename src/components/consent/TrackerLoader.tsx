"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { captureUtm, readConsent, track, type ConsentState } from "@/lib/tracking/consent-state";

/**
 * Loads third-party trackers ONLY after the matching consent category is
 * granted. Before consent nothing is requested from Google or Meta. When
 * consent is withdrawn the page reloads so already-loaded scripts stop.
 */
export function TrackerLoader({ ga4Id, pixelId }: { ga4Id?: string; pixelId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    captureUtm();
    let loaded = { ga: false, pixel: false };
    const apply = (c: ConsentState | null) => {
      if (!c) return;
      if ((loaded.ga && !c.analytics) || (loaded.pixel && !c.marketing)) {
        window.location.reload();
        return;
      }
      if (c.analytics && ga4Id && !loaded.ga) {
        loadGa(ga4Id);
        loaded = { ...loaded, ga: true };
      }
      if (c.marketing && pixelId && !loaded.pixel) {
        loadPixel(pixelId);
        loaded = { ...loaded, pixel: true };
      }
    };
    apply(readConsent());
    const onConsent = (e: Event) => apply((e as CustomEvent<ConsentState>).detail);
    window.addEventListener("nt:consent", onConsent);
    return () => window.removeEventListener("nt:consent", onConsent);
  }, [ga4Id, pixelId]);

  useEffect(() => {
    track("page_view");
  }, [pathname]);

  return null;
}

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function loadGa(id: string) {
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", id, { anonymize_ip: true, send_page_view: true });
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function loadPixel(id: string) {
  type Fbq = ((...a: unknown[]) => void) & { queue: unknown[]; loaded: boolean; version: string; callMethod?: (...a: unknown[]) => void; push: unknown };
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  w.fbq = fbq;
  w._fbq = fbq;
  addScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", id);
  fbq("track", "PageView");
}
