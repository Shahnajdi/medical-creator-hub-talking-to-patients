# Owner checklist: what's needed from Shahin to finish the platform

**Never paste passwords or API keys into chat.** Add them as environment variables / secrets in your hosting or cloud-environment settings, and tell me only that they're there.

Legend: 🔴 required before launch · 🟠 required to finish a feature · ⚪ optional

## 1. Business and legal identity
- [ ] 🔴 Legal entity name and type (e.g. şahıs şirketi / Ltd. Şti.)
- [ ] 🔴 Registered business address (shown in legal pages and marketing emails)
- [ ] 🔴 Tax number (vergi no) and trade registry / MERSIS number (if any)
- [ ] 🔴 Public contact email, privacy-request email, and phone (optional)
- [ ] 🔴 Domain name (e.g. najditech.com) and access to its DNS
- [ ] 🔴 Lawyer review of privacy, terms, refund and cookie pages (checklist: `docs/compliance/LEGAL-REVIEW.md`)
- [ ] 🔴 Lawyer's confirmation on: governing law, VERBİS (KVKK) registration, İYS registration for marketing messages in Türkiye, the Turkish distance-sales pre-information form, and which countries can't be offered checkout (sanctions)
- [ ] 🔴 Confirm these statements are true for your business (or tell me to change them): "fees are confirmed in writing before work starts", "support in Persian and English", "we never sell your data"
- [ ] 🔴 Refund terms: course refund window (default 14 days) and the agency-service refund rules
- [ ] 🔴 Retention periods OK? (inactive leads 2 years, analytics 13 months; your accountant confirms invoice retention)
- [ ] ⚪ DMCA designated agent registration (only needed if users will upload content and you want U.S. safe harbour)

## 2. Accounts and credentials (as secrets)
- [ ] 🔴 Hosting choice (decide, or ask me to recommend one for your budget) and a managed PostgreSQL database with backups
- [ ] 🔴 Email: a Resend account (or another provider), your domain verified (SPF/DKIM/DMARC), API key
- [ ] 🔴 Signed data-processing agreements with each vendor you use (`docs/compliance/dpa-register.md`)
- [ ] 🟠 Payment gateway: merchant approval and **sandbox** keys + webhook secret. Options to check eligibility for: a Turkish PSP (e.g. iyzico, PayTR) and/or a merchant-of-record for international course sales (e.g. Paddle, Lemon Squeezy). Stripe generally doesn't onboard Türkiye-based businesses.
- [ ] 🟠 Bank-transfer details (bank name, IBAN, account holder, SWIFT) in Persian and English wording
- [ ] 🟠 Booking: a Cal.com/Calendly link (quick option) **or** Google Workspace calendar + API credentials (native booking)
- [ ] 🟠 Video hosting for course lessons (e.g. Bunny Stream, Vimeo, Mux): an account and API key
- [ ] ⚪ GA4 Measurement ID, Meta Pixel ID, Meta Conversions API token
- [ ] ⚪ Error/alert monitoring: Sentry DSN (strongly recommended)
- [ ] ⚪ WhatsApp Business API provider (Meta-approved BSP) + approved message templates
- [ ] ⚪ Anthropic API key (only if you want the AI assistant)

## 3. Content
- [ ] 🔴 Founder photo(s) that you own (no stock photos pretending to be you)
- [ ] 🔴 Founder welcome video (short, vertical and horizontal) + Persian transcript (English optional)
- [ ] 🔴 The free "Meta Ads learning roadmap" PDF (the training funnel stays closed until it exists)
- [ ] 🔴 What the free audit actually delivers (call? written notes? how long?), so the page promises only what you'll do
- [ ] 🔴 Logo, favicon, and a social share image (or tell me to design a wordmark)
- [ ] 🔴 Your bio / About text (I've written a draft; correct it)
- [ ] 🟠 Course details for each course: title, audience, curriculum (modules → lessons), format (recorded/live/group), schedule and capacity, prices per currency (TRY/USD/EUR/GBP/AUD), one-time or subscription, refund window
- [ ] 🟠 Lesson content: videos, texts, downloadable files, exercises
- [ ] 🟠 Agency packages: do you want prices on the site, or "price after consultation"?
- [ ] 🟠 Nurture emails: approve or edit the follow-up email texts and how often they're sent
- [ ] ⚪ Case studies: real numbers + proof (ad-account export) + **written client permission**
- [ ] ⚪ Testimonials: text or video + **written permission** (name/business/country shown or anonymised)
- [ ] ⚪ Blog posts, FAQ edits, extra free resources
- [ ] ⚪ Native-Persian review of all site copy for tone

## 4. Team and sales process
- [ ] 🟠 Staff list: name, email, role (sales agent / sales manager / marketing / instructor / admin)
- [ ] 🟠 Who receives new agency leads, and how fast you promise to respond
- [ ] 🟠 Lead scoring: confirm budget tiers, served countries and priority thresholds
- [ ] 🟠 Booking availability: days, hours, your time zone, meeting length, buffer, meeting tool (Google Meet / Zoom)
- [ ] ⚪ Marketing limits: max emails per week (default 2), quiet hours (default 21:00–09:00 recipient time)

## 5. Decisions on what to build next (pick an order)
- [ ] Real payment gateway integration
- [ ] Native booking calendar + reminders
- [ ] Admin content editors (pages, FAQs, testimonials, case studies, media upload)
- [ ] Admin course builder + certificates
- [ ] Bank-transfer "mark as received" screen, payments/students admin pages
- [ ] Advanced analytics (filters, funnel charts, ad-spend/CAC)
- [ ] Staff two-factor login (recommended before adding a team)
- [ ] AI assistant (yes/no)
- [ ] WhatsApp automation (yes/no)

## 6. Access for me
- [ ] Allow these domains in the session's network settings if you still want me to review the four tools you linked: playwright.dev, mcpmarket.com, getdesign.md, agenticskills.io
- [ ] Tell me whether to open a pull request for the current branch
- [ ] Put sandbox credentials in the environment's secrets so I can build and test integrations (no live keys until launch)
