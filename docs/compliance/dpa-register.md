# DPA register

Every vendor that processes personal data for NajdiTech needs a signed Data Processing Agreement (GDPR Art. 28 / KVKK) and, for transfers outside the EU/Türkiye, an appropriate safeguard (e.g. SCCs). `npm run check:launch` fails while any row says `PENDING`.

Replace `PENDING` with `SIGNED <date>` (and link where the signed copy is stored) once done. Remove rows for vendors you don't use. Add a row before enabling any new vendor.

| Vendor | Purpose | Data | Transfer safeguard | Status |
| --- | --- | --- | --- | --- |
| Hosting provider (choose) | App + DB hosting | All | Depends on region | PENDING |
| Resend | Email delivery | Name, email, message content | SCCs (US) | PENDING |
| Google (GA4) | Analytics, consent-gated | Pseudonymous usage data | SCCs / EU-US DPF | PENDING |
| Meta Platforms (Pixel/CAPI) | Ad measurement, consent-gated | Pseudonymous events | SCCs / EU-US DPF | PENDING |
| Payment provider (choose) | Payments | Billing name, email, country, amount | Depends on PSP | PENDING |
| Anthropic (only if AI enabled) | AI assistant | Conversation text | SCCs (US); confirm no-training terms | PENDING |
