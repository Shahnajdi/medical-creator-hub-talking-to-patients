# Admin guide

Log in at `/login` with a staff account (created with `npm run create-admin`).

- **Overview (`/admin`)**: last-30-day metrics from the live database. Revenue is shown **per currency** (never summed across currencies). "Automation failures" counts dead jobs; investigate any non-zero value.
- **Leads (`/admin/leads`)**: search and filter by type and priority; open a contact; export CSV (sales manager and above; every export is audited). Sales agents see only contacts assigned to them.
- **Contact page**: unified activity timeline, current consent status per purpose (with document version), notes.
- **Pipelines (`/admin/pipelines`)**: agency and training boards. Drag cards, or use the stage menu on each card (keyboard friendly). Moving to Won/Lost updates the opportunity status. Every move is audited.
- **Privacy requests (`/admin/privacy`)**: only email-verified requests appear. Each has a due date (30 days; overdue shown in red). Download the JSON export to send to the person, or erase (deletion requests only). Mark completed or rejected with a note.
- **Audit log (`/admin/audit-logs`)**: security-relevant events are highlighted in red.

## Content rules (to stay compliant)

- Publish a testimonial only with written permission; record where the permission is stored.
- Publish a case study only with `client_permission` and a `verification_note` pointing to the source data (e.g. an ad-account export).
- Every uploaded image/video needs its licence and source recorded, plus Persian and English alt text.
- Tick `ai_assisted` on any blog post drafted with AI.
- Don't add countdown timers, fake scarcity, or result/income guarantees.

## Settings (database, `settings` table)

| Key | Purpose |
| --- | --- |
| `crm.scoring` | Lead-scoring points and thresholds |
| `privacy.retention` | Retention periods in days |
| `messaging.limits` | Marketing frequency cap and quiet hours |
| `payments.eligibility` | Countries where online checkout is not offered |
| `payments.bankTransfer` | `{ "fa": "…", "en": "…" }` bank details; enables the bank-transfer option |
| `home.founderVideo` | `{ "url", "poster", "transcriptFa", "transcriptEn" }` |
| `booking.url` | External https booking link until native booking ships |
