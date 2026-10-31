import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { TrackerLoader } from "@/components/consent/TrackerLoader";

/** Public site chrome. Trackers are only mounted here (never in /admin) and only load after consent. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <Footer />
      <CookieConsent />
      <TrackerLoader ga4Id={process.env.GA4_MEASUREMENT_ID || undefined} pixelId={process.env.META_PIXEL_ID || undefined} />
    </>
  );
}
