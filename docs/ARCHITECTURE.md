# Architecture

## Stack and decisions

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript strict | SSR for SEO/speed, server actions for forms, one deployable |
| Styling | Tailwind CSS v4 with design tokens in `src/app/globals.css` | Consistent system, no runtime CSS-in-JS |
| UI primitives | Hand-written, accessible components (native `<details>`, `<dialog>`-free banner, labelled fields) | shadcn/ui CLI needs network codegen; native elements give keyboard/a11y for free. shadcn can be added later without conflicts |
| Motion | CSS animations + a tiny rAF tween (`NavPill`) | Framer Motion / GSAP would add ~40–70 KB; everything stops under `prefers-reduced-motion` |
| i18n | `next-intl`, `fa` default at `/`, `en` at `/en`, `localeDetection: false` | Persian is always the default; English is an explicit choice. `dir`/`lang` are set per locale |
| Fonts | Vazirmatn + Inter, self-hosted via `@fontsource-variable` (OFL-1.1) | No request to Google Fonts (GDPR), correct Persian glyphs |
| DB | PostgreSQL + Drizzle ORM, SQL migrations in `drizzle/` | Typed, parameterised queries, reviewable migrations |
| Validation | Zod schemas shared by client and server (`src/lib/crm/forms.ts`) | The server is authoritative; the client only gives fast feedback |
| Auth | Own implementation: scrypt hashes, random 256-bit session tokens stored **hashed** in DB, httpOnly cookies | Credentials + DB sessions without Auth.js beta constraints. RBAC matrix in `src/lib/auth/rbac.ts` |
| Jobs | Postgres-backed queue (`jobs` table, `FOR UPDATE SKIP LOCKED`), idempotency keys, exponential backoff, dead-letter | No Redis needed. Swap for a dedicated queue at higher volume |
| Email | Adapter (`log` for development, `resend` for production) | Provider can change without touching business logic |
| Payments | Provider interface + `bank_transfer` + dev-only `mock`. Hosted checkout only | The real Turkish/international PSP depends on merchant approval |
| Analytics | First-party `tracking_events` + GA4/Meta Pixel loaded **only after consent** | Consistent `eventId` for browser/server deduplication |

## Data model (`src/db/schema.ts`)

- **Identity:** users (role enum), sessions, password_reset_tokens
- **CRM:** contacts (unique normalised email/phone), companies, leads (type, answers, score, qualification), pipelines/pipeline_stages (seeded), opportunities, activities (timeline), tasks, appointments (partial unique index prevents double booking), availability_rules, conversations/messages
- **Consent and privacy:** consent_records (purpose, granted, document version, source, hashed IP, withdrawal), suppressions (keyed hash), privacy_requests
- **Automation:** automation_workflows (JSON steps, enable/pause), jobs, message_log (frequency caps)
- **Content:** media_assets (**license + source required**, `ai_generated`), resources, resource_downloads, testimonials (**permission status + evidence**), case_studies (**client_permission + verification note**), blog_posts (`ai_assisted`), faqs, settings
- **LMS:** courses, course_modules (drip `unlock_after_days`), lessons, enrollments, lesson_progress, certificates
- **Commerce:** products (refund window, billing interval), product_prices (per currency, DB check on supported currencies), orders, payments, payment_webhook_events (idempotency), subscriptions, invoices
- **Ops:** tracking_events, audit_logs, rate_limits

Reference data (pipelines, stages, default settings, default workflows) is created by `src/db/bootstrap.ts` on every migrate. Demo data lives only in `scripts/seed-dev.ts`.

## User journeys

**Agency funnel (`/free-audit`):** 3-step form → server validation, rate limiting and honeypot → in one transaction: upsert contact (dedupe on normalised email/phone, row-locked), company, scored lead, *agency* opportunity at `new` (one open opportunity per pipeline), consent records (terms, privacy notice, age; marketing only if ticked), activity, tracking event, `workflow.run` job → `/thank-you` → booking.

**Training funnel (`/free-meta-ads-guide`):** the form is only shown if a published resource file exists (we never collect data for something we can't deliver). Contact + *training* opportunity + consents → signed, expiring download link on the thank-you page and by email (transactional). The follow-up lesson is **marketing** and is only sent with consent.

**Checkout:** logged-in only → price read from the DB (the client sends only slug + currency) → country eligibility check → hosted provider / bank-transfer instructions → order becomes `paid` **only** via a signature-verified, idempotent webhook with an amount/currency match → `order.fulfil` job → enrollment / subscription.

**Privacy:** `/privacy-request` → email verification → admin queue with 30-day due date → JSON export or erasure (orders retained but unlinked; suppression hash kept). Logged-in users can also self-serve export and deletion in `/dashboard/profile`.

## Automation rules

`sendTemplatedEmail` enforces, for marketing: recorded and non-withdrawn consent, the suppression list, a postal address present, quiet hours in the recipient's time zone (deferral, not drop), a weekly frequency cap, an unsubscribe link and RFC 8058 one-click headers. Pausing a workflow skips its pending steps.
