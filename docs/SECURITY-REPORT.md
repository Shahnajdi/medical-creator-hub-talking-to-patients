# Security review: findings and fixes

Scope: the whole repository as of this commit (Next.js app, server actions, API routes, DB schema, scripts, git history, dependencies). Method: code review against each requested control, automated tests (unit, Postgres integration, Playwright against a production build), dependency/licence audits, a git-history secret scan and HTTP probes of a running production build.

**Bottom line:** every control you listed is either implemented and tested, or listed below as a remaining risk or an action only you can take. Software alone cannot make an app "unhackable". These controls substantially reduce risk; they don't remove it.

## Control-by-control

| # | Control | Status | Where / evidence |
| --- | --- | --- | --- |
| 1 | Proper authentication | ✅ | `src/lib/auth/*`. scrypt (N=2¹⁵), 256-bit random session tokens stored **SHA-256 hashed**, 14-day expiry, disabled-user check, constant-time login with dummy hash (no user enumeration by timing) |
| 2 | Hide API keys | ✅ | All secrets are server-only env (`src/lib/env.ts` imports `server-only`; the build fails if a client imports it). Scan of `.next/static` found no secrets. `.env` is git-ignored |
| 3 | Secure the database | ✅ / 🟡 | Parameterised Drizzle queries; FKs, unique and check constraints; least data stored (hashed IPs, no card data). **You:** use a managed Postgres with a least-privilege user, TLS (`sslmode=require`, enforced by `check:launch`), encrypted backups |
| 4 | Enforce HTTPS | ✅ | `proxy.ts` 308-redirects http→https when `APP_URL` is https; HSTS (2 years); `env()` refuses non-https `APP_URL` in production |
| 5 | Hash passwords | ✅ | scrypt + per-user salt, NFKC normalised; test `hashes and verifies passwords` |
| 6 | Server-side form validation | ✅ | Every server action / route parses input with Zod (`input: unknown`); client validation is cosmetic only |
| 7 | XSS protection | ✅ / 🟡 | React escaping everywhere; **zero** `dangerouslySetInnerHTML`/`eval`; blog bodies rendered as text; email templates HTML-escape variables (tested); SVG/HTML uploads rejected; strict CSP (`object-src 'none'`, `frame-ancestors 'none'`, allow-listed hosts). Residual: CSP still allows `'unsafe-inline'` scripts (see R1) |
| 8 | Log and monitor suspicious activity | ✅ / 🟡 | Structured JSON logs with masked emails: `security.login_failed`, `security.login_rate_limited`, `security.rate_limited`, `security.honeypot`, `security.webhook_signature_invalid`, `security.payment_amount_mismatch`. Audit log for logins, failed logins, stage changes, exports, erasures, payments, password resets. **You:** ship logs to an alerting tool (Sentry/Datadog/Grafana); not connected |
| 9 | Lock down admin routes | ✅ | Proxy gate (no session → login) **plus** server-side `pageGuard(permission)` on every admin page and `requirePermission` in every admin action/route. Unauthorised roles get **404** (doesn't reveal admin URLs). Sales agents are row-scoped to their own contacts (tested). Self-registration always creates `student`; staff can only be created by `npm run create-admin` |
| 10 | Parameterised queries | ✅ | Drizzle only; no `sql.raw`/`unsafe` in app code. Test: `' OR 1=1; DROP TABLE…` search returns 0 rows and the table survives; `%`/`_` wildcards escaped |
| 11 | Check environment variables | ✅ | Zod schema; production refuses: mock payments, non-https URL, placeholder secret, `log` email driver, AI enabled without key. `check:launch` adds legal and ops checks |
| 12 | Rate limiting | ✅ | Postgres fixed-window limiter (multi-instance safe): login (IP and email), register, password reset, lead forms (IP and email), privacy requests, checkout, tracking, consent. Test: blocks after limit |
| 13 | Restrict core settings | ✅ / 🟡 | Core settings (payment eligibility, scoring, retention, messaging limits) live in the DB `settings` table and **can't be changed from the web at all yet**; there is no settings UI. The permission `settings.manage` (admin+) and `team.manage` (super_admin only) are defined for when the UI is added (`setSetting` records `updated_by`). Staff roles can only be granted via the CLI |
| 14 | Security headers | ✅ | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy; `X-Powered-By` removed (e2e verified) |
| 15 | Secure session cookies | ✅ | `httpOnly`, `SameSite=Lax`, `Secure` in production, path `/`, explicit expiry; logout deletes the server-side session; password reset revokes **all** sessions |
| 16 | CSRF protection | ✅ | Server actions: Next.js built-in Origin/Host check + SameSite cookies. API routes: `proxy.ts` rejects state-changing requests without a same-origin `Origin` (e2e: cross-site POST → 403). Webhooks/one-click unsubscribe are exempt but **signature/token-authenticated** |
| 17 | Password reset links expire | ✅ | 1 hour, single use (atomic `UPDATE … WHERE used_at IS NULL AND expires_at > now()`), stored hashed, one active token per user, same response whether or not the account exists |
| 18 | Restrict upload types and sizes | ✅ | `src/lib/uploads.ts`: allow-list (JPEG/PNG/WebP 5 MB, PDF 20 MB, MP4 200 MB), **magic-byte check** (renamed HTML rejected), SVG banned, random server-side filenames, stored outside the web root. Download route has a path-traversal guard. Note: the admin upload *UI* is not built yet (roadmap); the validator is ready and tested |
| 19 | Verify prices and payments | ✅ | Price always from DB; webhook signature verified before parsing; idempotent via unique `(provider,event_id)`; amount **and** currency must match or the order is not paid (tested); success page only *reads* status; mock provider is impossible to enable in production |
| 20 | Disable production debug mode | ✅ | `next start` production build (no stack traces to clients, no source maps), `poweredByHeader: false`, dev-only sandbox page 404s in production, logger suppresses non-error output in tests |
| 21 | Update vulnerable dependencies | ✅ | All packages at current versions. `npm audit --omit=dev`: **0 vulnerabilities**. Dev-only advisories: esbuild (inside drizzle-kit) and minimatch (inside eslint), both moderate and not reachable in production. npm's "fix" would downgrade to ancient majors, so they're tracked, not "fixed" |
| 22 | Remove unused packages | ✅ | Removed `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| 23 | Check for exposed files | ✅ | Probed a running build: `/.env`, `/.git/config`, `/.git/HEAD`, `/package.json`, `/next.config.ts`, migrations, source, `storage/`, traversal attempt: all **404**. Docker image excludes `.env`/`.git` |
| 24 | Scan git history for leaked secrets | ✅ | All commits scanned for AWS/GitHub/Slack/Stripe/Resend/Anthropic/Meta/Google key patterns, private keys, `*_KEY=`/`SECRET=` assignments, and committed `.env` files: **none found** |
| 25 | Revoke and replace compromised keys | ✅ (n/a) | No keys were ever committed, so nothing needs revoking. The local `.env` holds only dev placeholders, and production refuses placeholder secrets. **If you have ever pasted real keys elsewhere (chat, screenshots, other repos), rotate them anyway** |
| 26 | Thorough security review | ✅ | This document |
| 27 | Test the protections | ✅ | 51 unit/integration tests and 17 Playwright e2e tests, all passing (see below) |

## Issues found during the review and fixed

1. **Cookie banner stole keyboard focus** on page load, skipping past the "skip to content" link. Found by the e2e keyboard test. Fixed: focus only moves when the user reopens settings.
2. **Spoofable client IP** for rate limiting: the leftmost `X-Forwarded-For` value is attacker-controlled. Fixed: `TRUSTED_PROXY_HOPS` picks the entry added by your own proxy (unit-tested).
3. **HTTPS redirect looped on local `next start`**. Fixed: the redirect only applies when `APP_URL` is https.
4. **Production could start with insecure config** (mock payments, log email driver, placeholder secret). Fixed: `env()` refuses to start in production with any of these.
5. **CSV export formula injection** (a lead named `=HYPERLINK(...)` executes in Excel). Fixed: `csvCell` prefixes dangerous leading characters (tested).
6. **Open redirect** via `?next=` after login. Fixed: only same-site relative paths are accepted (`//evil.com` rejected).
7. **Account deletion CSRF / shoulder-surfing**. Fixed: self-service deletion requires the current password; admin accounts can't self-delete.
8. **Licence audit treated `A AND B` as OK when only one part was allowed.** Fixed to require all parts; LGPL (`sharp`'s libvips) reported separately.
9. Eight lint errors (effect-driven state updates, impure render) fixed; lint is clean.

## Test evidence

- `npm test`: 51 passed. Covers dedupe, pipeline routing, consent recording, marketing blocked without consent, unsubscribe and suppression, quiet hours, frequency cap, job idempotency and dead-letter, webhook forgery/mismatch/duplicate, DB-sourced prices, country eligibility, subscription ownership, export and erasure, retention, agent row-scoping, rate limit, SQL injection, CSV injection, upload validation, token tampering/expiry, RBAC matrix, WCAG contrast.
- `npx playwright test` (desktop and mobile): 17 passed, 1 skipped (the keyboard test is desktop-only by design). Covers RTL/LTR, no trackers before consent, trackers after accept, equal-weight reject/accept buttons, full agency funnel submission, consent checkbox enforcement, admin/dashboard lockout, security headers, CSRF 403, forged webhook 401, skip link, alt text and labels.

## Residual risks and recommendations (prioritised)

- **R1 (medium): CSP allows inline scripts.** Next.js needs either `'unsafe-inline'` or per-request nonces, and nonces force every page to render dynamically. Recommendation: switch to a nonce-based CSP in `proxy.ts` once the static/dynamic split is final.
- **R2 (medium): no MFA for staff.** Add TOTP for `admin`/`super_admin` before inviting a team.
- **R3 (medium): no external alerting.** Logs are structured, but nothing pages you on `security.*` events. Connect Sentry/Datadog and alert on login-failure spikes, webhook-signature failures and dead jobs.
- **R4 (low): login lockout can be abused** to block a specific email for 15 minutes (per-email limit). Acceptable trade-off; revisit if it happens.
- **R5 (low): dev-tool advisories** (esbuild via drizzle-kit, minimatch via eslint). Re-check on each upgrade.
- **R6: infrastructure is yours to secure.** Firewall the DB, encrypted backups with restore drills, OS patching, WAF/CDN (e.g. Cloudflare) for DDoS, and a secrets manager instead of `.env` files.
- **R7: periodic external testing.** Commission an independent penetration test before handling significant payment volume.
