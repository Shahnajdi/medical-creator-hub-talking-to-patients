# Known limitations and remaining work

Honest status of the master brief. ✅ done and tested · 🟡 partial · ⏳ not started.

## Done
✅ Foundation: Next.js 16, TypeScript, Tailwind, Postgres schema for all modules, migrations, env validation, Docker, CI
✅ Persian-first i18n with RTL/LTR, design system, accessible components, sliding nav pill
✅ Homepage (all 11 sections; case studies and testimonials appear only when real, permitted content exists)
✅ Agency funnel (3-step) and training funnel, with CRM writes, dedupe, scoring, consent, attribution
✅ CRM admin: overview, leads, CSV export, contact timeline, kanban pipelines, audit log
✅ Consent, cookie banner, tracker gating, unsubscribe, suppression, retention, privacy requests, legal pages
✅ Auth (login, register, reset), RBAC, row scoping for sales agents
✅ Automation engine core (event → workflow → steps; retries, idempotency, dead-letter, quiet hours, caps)
✅ Payments architecture: DB prices, eligibility, signed idempotent webhooks, dev sandbox, bank transfer, subscriptions cancel
✅ LMS core: enrollments, drip, progress, completion, student course player

## Partial / pending credentials
🟡 **Real payment gateway**: pending your merchant approval (Turkish PSP such as iyzico/PayTR, and/or an international PSP). Implement the `PaymentProvider` interface in `src/lib/payments/providers.ts`.
🟡 **Email**: Resend adapter written; needs an API key and verified sending domain (SPF/DKIM/DMARC). Not exercised against the live API.
🟡 **Bank transfer**: needs `payments.bankTransfer` setting, and an admin UI to mark transfers received (today: SQL update + audit).
🟡 **Booking**: schema and double-booking constraint exist; slot UI, Google Calendar/Meet integration and reminders are not built (`/book-call` links to an external scheduler if configured).
🟡 **Founder video and portrait**: placeholders until you provide real media.
🟡 **Meta Conversions API**: env reserved; server sender not implemented.

## Not started
⏳ Admin CMS editors (content, courses, products, testimonials, case studies, FAQs, media upload UI; the upload validator is ready)
⏳ Admin pages: companies, appointments, campaigns, students, payments, automations editor, settings UI, team management
⏳ Certificates PDF generation, quizzes and exercises, live-session scheduling, announcements
⏳ Advanced analytics (date/source/country filters, funnel charts, CAC with ad-spend import)
⏳ AI qualification assistant (Phase 6): optional by design; must keep the guardrails in `/ai-disclosure`
⏳ Staff MFA (TOTP), nonce-based CSP (see SECURITY-REPORT R1–R3)
⏳ WhatsApp messaging via an authorised BSP (templates and opt-in already modelled)
