# Deployment

## Topology

- **app**: Next.js standalone server (`node server.js`), stateless, scale horizontally
- **worker**: `scripts/worker.ts` (jobs + daily retention). Run at least one; multiple are safe (`SKIP LOCKED`)
- **PostgreSQL 16**: managed, with TLS, automated encrypted backups and point-in-time recovery
- **TLS-terminating reverse proxy / CDN** in front of `app`; set `TRUSTED_PROXY_HOPS` to the number of proxies
- **Storage**: `STORAGE_DIR` volume for resource PDFs and media (move to S3-compatible storage at scale)

## Steps

1. Provision Postgres with a dedicated least-privilege user and `sslmode=require`.
2. Create `.env` from `.env.example` (in a secrets manager, never in git). Set `APP_ENV=production`, an https `APP_URL`, a random `APP_SECRET`, `EMAIL_DRIVER=resend` and the legal identity variables.
3. Run `npm run check:launch` and resolve everything it reports.
4. Build and start:

```bash
docker compose build
```

```bash
docker compose up -d
```

5. Create the first admin:

```bash
docker compose run --rm app npx tsx --conditions=react-server scripts/create-admin.ts you@example.com "Your Name"
```

6. Verify `GET /api/health` returns `{"status":"ok"}`, then submit a test lead and confirm it appears in `/admin/leads`.

## Operations

- **Backups:** daily automated plus PITR; **test a restore quarterly**.
- **Monitoring:** ship stdout JSON logs to your log platform; alert on `level=error`, `security.*`, `/api/health` failures, and dead jobs (`select count(*) from jobs where status='dead'`).
- **Migrations:** `npm run db:generate` after schema changes, commit the SQL, and `docker compose run --rm migrate` on deploy.
- **Payment webhooks:** point the provider at `https://<domain>/api/webhooks/payments/<provider-id>`.
