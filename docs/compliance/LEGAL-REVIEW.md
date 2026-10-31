# Lawyer review checklist

Before setting `LEGAL_REVIEW_COMPLETED=true`, have a qualified lawyer review and approve:

1. `/privacy`: legal bases, retention periods, transfer mechanisms, KVKK-specific disclosures (data controller registration with VERBİS if required), complaint authorities.
2. `/terms`: governing law and jurisdiction, liability cap, service description.
3. `/refund-policy`: refund windows; EU 14-day withdrawal right for digital content (requires express consent and acknowledgement to waive once access starts); Turkish distance-sales rules (Mesafeli Sözleşmeler Yönetmeliği), including whether a pre-information form and distance sales contract must be shown at checkout.
4. `/cookies`: cookie list matches the live site.
5. Marketing consent wording, and whether Türkiye's commercial electronic message rules (İYS registration) apply to your email/WhatsApp marketing.
6. Payment eligibility list (`payments.eligibility`) against sanctions rules and your PSP's terms.
7. Business identity shown on `/imprint`.

Legal text lives in `src/content/legal/*.tsx`. When a document changes materially, bump its date in `src/lib/legal/config.ts` (`LEGAL_VERSIONS`) so new acceptances record the new version.
