import type postgres from "postgres";
import { DEFAULT_SCORING } from "@/lib/crm/scoring-config";
import { DEFAULT_RETENTION } from "@/lib/privacy/retention-config";

/**
 * Reference data required in EVERY environment (pipelines, stages, default
 * settings, default workflows). Idempotent. This is NOT demo data — demo data
 * lives in scripts/seed-dev.ts and refuses to run in production.
 */
const AGENCY_STAGES: [string, string, string, boolean?, boolean?][] = [
  ["new", "لید جدید", "New lead"],
  ["contact_attempted", "تلاش برای تماس", "Contact attempted"],
  ["qualified", "واجد شرایط", "Qualified"],
  ["discovery_scheduled", "جلسه آشنایی رزرو شد", "Discovery scheduled"],
  ["discovery_completed", "جلسه آشنایی انجام شد", "Discovery completed"],
  ["proposal_sent", "پیشنهاد ارسال شد", "Proposal sent"],
  ["negotiation", "مذاکره", "Negotiation"],
  ["won", "موفق", "Won", true],
  ["lost", "از دست رفته", "Lost", false, true],
  ["nurture", "پیگیری بلندمدت", "Nurture"],
];

const TRAINING_STAGES: [string, string, string, boolean?, boolean?][] = [
  ["new", "لید آموزشی جدید", "New training lead"],
  ["resource_delivered", "منبع ارسال شد", "Resource delivered"],
  ["engaged", "درگیر شده", "Engaged"],
  ["interested", "علاقه‌مند", "Interested"],
  ["enrollment_offered", "پیشنهاد ثبت‌نام", "Enrollment offered"],
  ["checkout_started", "شروع پرداخت", "Checkout started"],
  ["enrolled", "ثبت‌نام شد", "Enrolled", true],
  ["not_interested", "علاقه‌مند نیست", "Not interested", false, true],
  ["nurture", "پیگیری بلندمدت", "Nurture"],
];

export async function bootstrapReferenceData(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    for (const [key, fa, en, stages] of [
      ["agency", "فروش خدمات تبلیغات", "Agency sales", AGENCY_STAGES],
      ["training", "فروش آموزش", "Training sales", TRAINING_STAGES],
    ] as const) {
      const [p] = await tx`
        INSERT INTO pipelines (key, name_fa, name_en) VALUES (${key}, ${fa}, ${en})
        ON CONFLICT (key) DO UPDATE SET name_fa = EXCLUDED.name_fa
        RETURNING id`;
      let pos = 0;
      for (const [skey, sfa, sen, won, lost] of stages) {
        await tx`
          INSERT INTO pipeline_stages (pipeline_id, key, name_fa, name_en, position, is_won, is_lost)
          VALUES (${p!.id}, ${skey}, ${sfa}, ${sen}, ${pos++}, ${won ?? false}, ${lost ?? false})
          ON CONFLICT (pipeline_id, key) DO NOTHING`;
      }
    }

    const defaults: Record<string, unknown> = {
      "crm.scoring": DEFAULT_SCORING,
      "privacy.retention": DEFAULT_RETENTION,
      "messaging.limits": { marketingPerWeek: 2, quietHoursStart: 21, quietHoursEnd: 9 },
      // Payment eligibility: countries where checkout is offered. Empty list = all countries
      // EXCEPT those in `blockedCountries`. Must be set according to your PSP terms and legal review.
      "payments.eligibility": { blockedCountries: ["IR"], inquiryOnlyMessage: true },
    };
    for (const [key, value] of Object.entries(defaults)) {
      await tx`INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb) ON CONFLICT (key) DO NOTHING`;
    }

    const workflows = [
      {
        key: "agency_lead_created",
        name: "Agency lead — confirmation & sales task",
        trigger: "lead.created.agency",
        steps: [
          { type: "send_email", template: "agency_lead_confirmation", category: "transactional" },
          { type: "create_task", title: "Contact new agency lead", dueInHours: 24, priority: "high" },
        ],
      },
      {
        key: "training_lead_created",
        name: "Training lead — deliver guide",
        trigger: "lead.created.training",
        steps: [
          { type: "send_email", template: "training_resource_delivery", category: "transactional" },
          { type: "send_email", template: "training_beginner_lesson", category: "marketing", delayMinutes: 60 * 24 * 2 },
        ],
      },
    ];
    for (const w of workflows) {
      await tx`
        INSERT INTO automation_workflows (key, name, trigger_event, steps)
        VALUES (${w.key}, ${w.name}, ${w.trigger}, ${JSON.stringify(w.steps)}::jsonb)
        ON CONFLICT (key) DO NOTHING`;
    }
  });
}
