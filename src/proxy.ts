import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED = /^\/(?:en\/)?(admin|dashboard)(\/|$)/;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
/** Endpoints called by third parties (signature-verified instead of origin-checked). */
const CSRF_EXEMPT = [/^\/api\/webhooks\//, /^\/api\/unsubscribe$/];

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production (behind a TLS-terminating proxy).
  // Only when the app is configured for an https origin (local `next start` stays on http).
  if (process.env.APP_URL?.startsWith("https://") && req.headers.get("x-forwarded-proto") === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/")) {
    // CSRF: state-changing API calls must come from our own origin.
    if (!SAFE_METHODS.has(req.method) && !CSRF_EXEMPT.some((r) => r.test(pathname))) {
      if (!sameOrigin(req)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // Coarse gate: no session cookie → login. Real authorisation (role/permission)
  // is checked server-side in every admin/dashboard page and action.
  if (PROTECTED.test(pathname) && !req.cookies.get("nt_session")) {
    const isEn = pathname.startsWith("/en/");
    const url = req.nextUrl.clone();
    url.pathname = isEn ? "/en/login" : "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return intl(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
