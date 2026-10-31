# NajdiTech Digital Growth Platform

A Persian-first (فارسی, RTL) / English platform for NajdiTech: brand website, two separate lead funnels (agency clients and Meta Ads training), a CRM with pipelines, consent-aware automation, an LMS foundation, a modular payments layer and an admin panel.

> **Status:** the foundation, phases 1–3 (website, funnels, CRM) and core parts of phases 4–5 (automation, LMS, payments) are implemented and tested. Several integrations still need real credentials or business decisions. See [docs/ROADMAP.md](docs/ROADMAP.md). **Nothing is live, and no real payment provider is connected.**

## Documentation

| Doc | What it covers |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, technical decisions, data model, user journeys |
| [docs/SECURITY-REPORT.md](docs/SECURITY-REPORT.md) | Security review: findings, fixes, tests, residual risks |
| [docs/compliance/COMPLIANCE.md](docs/compliance/COMPLIANCE.md) | Legal/privacy checklist: what the code does vs. what *you* must still do |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment, backups, monitoring |
| [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) | Day-to-day use of the admin panel |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Known limitations and remaining work |

## Local setup

Requirements: Node 22+, PostgreSQL 16.

```bash
npm ci
```

```bash
cp .env.example .env
```

Edit `.env`: set `DATABASE_URL`, a random `APP_SECRET` (`openssl rand -base64 48`) and, for local work, `APP_ENV=development`, `PAYMENT_PROVIDERS=bank_transfer,mock` and `MOCK_PAYMENT_WEBHOOK_SECRET`.

```bash
npm run db:migrate
```

```bash
npm run create-admin -- you@example.com "Your Name"
```

```bash
npm run db:seed
```

(`db:seed` is optional. It adds clearly labelled `[DEV DEMO]` content and refuses to run unless `APP_ENV` is development or test.)

```bash
npm run dev
```

Background jobs (emails, workflow steps, fulfilment, daily retention):

```bash
npm run worker
```

## Quality gates

```bash
npm run lint && npm run typecheck && npm test
```

```bash
npm run build && npx playwright test
```

```bash
npm run licenses
```

```bash
npm run check:launch
```

`check:launch` **fails until** legal business details, a lawyer review, signed DPAs, HTTPS, a real email provider and other launch requirements are in place.
