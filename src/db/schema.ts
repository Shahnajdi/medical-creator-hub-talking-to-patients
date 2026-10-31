import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export type Utm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
};

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_agent",
  "marketing_manager",
  "instructor",
  "student",
  "agency_customer",
]);
export const leadTypeEnum = pgEnum("lead_type", ["agency", "training"]);
export const qualificationEnum = pgEnum("qualification", ["high", "medium", "nurture", "not_qualified"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["open", "won", "lost"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "done", "cancelled"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["booked", "cancelled", "completed", "no_show"]);
export const consentPurposeEnum = pgEnum("consent_purpose", [
  "terms",
  "privacy_notice",
  "age_confirmation",
  "marketing_email",
  "marketing_whatsapp",
  "analytics_cookies",
  "marketing_cookies",
]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "running", "succeeded", "failed", "dead", "cancelled"]);
export const messageCategoryEnum = pgEnum("message_category", ["transactional", "marketing"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "published", "archived"]);
export const productTypeEnum = pgEnum("product_type", ["course", "live_training", "coaching", "workshop", "service"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["one_time", "month", "year"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "awaiting_transfer",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "cancelled", "expired"]);
export const privacyRequestTypeEnum = pgEnum("privacy_request_type", ["access", "deletion", "correction", "objection"]);
export const privacyRequestStatusEnum = pgEnum("privacy_request_status", [
  "unverified",
  "pending",
  "in_progress",
  "completed",
  "rejected",
]);
export const permissionStatusEnum = pgEnum("permission_status", ["none", "requested", "granted", "revoked"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["active", "completed", "revoked", "expired"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "exercise", "quiz", "live"]);

// ---------------------------------------------------------------------------
// Identity & access
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: roleEnum("role").notNull().default("student"),
    locale: text("locale").notNull().default("fa"),
    timezone: text("timezone").notNull().default("UTC"),
    contactId: uuid("contact_id").references((): AnyPgColumn => contacts.id, { onDelete: "set null" }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------
export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    fullName: text("full_name").notNull(),
    email: text("email"),
    emailNormalized: text("email_normalized"),
    phone: text("phone"),
    phoneNormalized: text("phone_normalized"),
    whatsapp: text("whatsapp"),
    country: text("country"),
    preferredLanguage: text("preferred_language").notNull().default("fa"),
    timezone: text("timezone"),
    instagramUrl: text("instagram_url"),
    source: text("source"),
    utm: jsonb("utm").$type<Utm>(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("contacts_email_uq").on(t.emailNormalized),
    uniqueIndex("contacts_phone_uq").on(t.phoneNormalized),
    index("contacts_last_activity_idx").on(t.lastActivityAt),
    check("contacts_has_channel", sql`${t.emailNormalized} IS NOT NULL OR ${t.phoneNormalized} IS NOT NULL`),
  ],
);

export const companies = pgTable("companies", {
  id: id(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  country: text("country"),
  businessSize: text("business_size"),
  ownerContactId: uuid("owner_contact_id").references(() => contacts.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const leads = pgTable(
  "leads",
  {
    id: id(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    type: leadTypeEnum("type").notNull(),
    source: text("source"),
    answers: jsonb("answers").$type<Record<string, string | undefined>>().notNull().default({}),
    score: integer("score").notNull().default(0),
    qualification: qualificationEnum("qualification").notNull().default("nurture"),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("leads_contact_idx").on(t.contactId), index("leads_type_created_idx").on(t.type, t.createdAt)],
);

export const pipelines = pgTable("pipelines", {
  id: id(),
  key: leadTypeEnum("key").notNull().unique(),
  nameFa: text("name_fa").notNull(),
  nameEn: text("name_en").notNull(),
});

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: id(),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    nameFa: text("name_fa").notNull(),
    nameEn: text("name_en").notNull(),
    position: integer("position").notNull(),
    isWon: boolean("is_won").notNull().default(false),
    isLost: boolean("is_lost").notNull().default(false),
  },
  (t) => [uniqueIndex("pipeline_stage_key_uq").on(t.pipelineId, t.key)],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: id(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    title: text("title").notNull(),
    estimatedValueMinor: bigint("estimated_value_minor", { mode: "number" }),
    currency: text("currency"),
    expectedCloseDate: date("expected_close_date"),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    status: opportunityStatusEnum("status").notNull().default("open"),
    lostReason: text("lost_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("opp_pipeline_stage_idx").on(t.pipelineId, t.stageId), index("opp_contact_idx").on(t.contactId)],
);

export const activities = pgTable(
  "activities",
  {
    id: id(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("activities_contact_idx").on(t.contactId, t.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    priority: priorityEnum("priority").notNull().default("normal"),
    status: taskStatusEnum("status").notNull().default("open"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("tasks_assignee_status_idx").on(t.assignedUserId, t.status)],
);

export const availabilityRules = pgTable("availability_rules", {
  id: id(),
  staffUserId: uuid("staff_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0 = Sunday
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  timezone: text("timezone").notNull(),
  slotMinutes: integer("slot_minutes").notNull().default(30),
});

export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    staffUserId: uuid("staff_user_id")
      .notNull()
      .references(() => users.id),
    kind: leadTypeEnum("kind").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    meetingLink: text("meeting_link"),
    status: appointmentStatusEnum("status").notNull().default("booked"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // Prevents double booking of the same staff slot at the database level.
    uniqueIndex("appointments_staff_slot_uq")
      .on(t.staffUserId, t.startsAt)
      .where(sql`${t.status} = 'booked'`),
  ],
);

export const conversations = pgTable("conversations", {
  id: id(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("open"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  aiSummary: text("ai_summary"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const messages = pgTable("messages", {
  id: id(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // inbound | outbound
  author: text("author").notNull(), // contact | staff | ai
  body: text("body").notNull(),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Consent & privacy
// ---------------------------------------------------------------------------
export const consentRecords = pgTable(
  "consent_records",
  {
    id: id(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** Anonymous visitor id (cookie consent before a contact exists). */
    visitorId: text("visitor_id"),
    purpose: consentPurposeEnum("purpose").notNull(),
    granted: boolean("granted").notNull(),
    documentVersion: text("document_version").notNull(),
    source: text("source").notNull(),
    locale: text("locale"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => [index("consent_contact_purpose_idx").on(t.contactId, t.purpose, t.createdAt)],
);

/** Hashes of addresses that must never receive marketing (survives contact deletion). */
export const suppressions = pgTable(
  "suppressions",
  {
    hash: text("hash").notNull(),
    channel: text("channel").notNull(), // email | whatsapp
    reason: text("reason").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.hash, t.channel] })],
);

export const privacyRequests = pgTable("privacy_requests", {
  id: id(),
  type: privacyRequestTypeEnum("type").notNull(),
  email: text("email").notNull(),
  details: text("details"),
  locale: text("locale").notNull().default("fa"),
  status: privacyRequestStatusEnum("status").notNull().default("unverified"),
  verificationTokenHash: text("verification_token_hash"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }),
  resolutionNote: text("resolution_note"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Automation & messaging
// ---------------------------------------------------------------------------
export const automationWorkflows = pgTable("automation_workflows", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  triggerEvent: text("trigger_event").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  steps: jsonb("steps").$type<WorkflowStep[]>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type WorkflowStep =
  | { type: "send_email"; template: string; category: "transactional" | "marketing"; delayMinutes?: number }
  | { type: "create_task"; title: string; dueInHours: number; priority?: "low" | "normal" | "high" | "urgent" }
  | { type: "add_tag"; tag: string }
  | { type: "notify_admin"; message: string };

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("jobs_idem_uq").on(t.idempotencyKey), index("jobs_status_run_idx").on(t.status, t.runAt)],
);

export const messageLog = pgTable(
  "message_log",
  {
    id: id(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    template: text("template").notNull(),
    category: messageCategoryEnum("category").notNull(),
    status: text("status").notNull(),
    providerRef: text("provider_ref"),
    createdAt: createdAt(),
  },
  (t) => [index("message_log_contact_idx").on(t.contactId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Content (CMS)
// ---------------------------------------------------------------------------
export const mediaAssets = pgTable("media_assets", {
  id: id(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  altFa: text("alt_fa").notNull(),
  altEn: text("alt_en").notNull(),
  /** License or permission under which the asset is used — required. */
  license: text("license").notNull(),
  source: text("source").notNull(),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdAt: createdAt(),
});

export const resources = pgTable("resources", {
  id: id(),
  slug: text("slug").notNull().unique(),
  funnel: leadTypeEnum("funnel").notNull(),
  titleFa: text("title_fa").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionFa: text("description_fa").notNull(),
  descriptionEn: text("description_en").notNull(),
  storageKey: text("storage_key"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const resourceDownloads = pgTable("resource_downloads", {
  id: id(),
  resourceId: uuid("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const testimonials = pgTable("testimonials", {
  id: id(),
  authorName: text("author_name"),
  business: text("business"),
  country: text("country"),
  quoteFa: text("quote_fa"),
  quoteEn: text("quote_en"),
  videoUrl: text("video_url"),
  /** Publication requires explicit permission recorded with evidence. */
  permissionStatus: permissionStatusEnum("permission_status").notNull().default("none"),
  permissionEvidence: text("permission_evidence"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: createdAt(),
});

export const caseStudies = pgTable("case_studies", {
  id: id(),
  slug: text("slug").notNull().unique(),
  titleFa: text("title_fa").notNull(),
  titleEn: text("title_en").notNull(),
  industry: text("industry").notNull(),
  challengeFa: text("challenge_fa").notNull(),
  challengeEn: text("challenge_en").notNull(),
  strategyFa: text("strategy_fa").notNull(),
  strategyEn: text("strategy_en").notNull(),
  outcomesFa: text("outcomes_fa").notNull(),
  outcomesEn: text("outcomes_en").notNull(),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  metrics: jsonb("metrics").$type<{ labelFa: string; labelEn: string; value: string }[]>().notNull().default([]),
  clientPermission: boolean("client_permission").notNull().default(false),
  /** Where the numbers come from (e.g. ad account export), for internal verification. */
  verificationNote: text("verification_note"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const blogPosts = pgTable("blog_posts", {
  id: id(),
  slug: text("slug").notNull(),
  locale: text("locale").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  coverAssetId: uuid("cover_asset_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  aiAssisted: boolean("ai_assisted").notNull().default(false),
  status: contentStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("blog_slug_locale_uq").on(t.slug, t.locale)]);

export const faqs = pgTable("faqs", {
  id: id(),
  category: text("category").notNull(), // agency | training | payment | scheduling | international
  questionFa: text("question_fa").notNull(),
  answerFa: text("answer_fa").notNull(),
  questionEn: text("question_en").notNull(),
  answerEn: text("answer_en").notNull(),
  position: integer("position").notNull().default(0),
  status: contentStatusEnum("status").notNull().default("draft"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});

// ---------------------------------------------------------------------------
// LMS
// ---------------------------------------------------------------------------
export const courses = pgTable("courses", {
  id: id(),
  slug: text("slug").notNull().unique(),
  titleFa: text("title_fa").notNull(),
  titleEn: text("title_en").notNull(),
  summaryFa: text("summary_fa").notNull(),
  summaryEn: text("summary_en").notNull(),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const courseModules = pgTable("course_modules", {
  id: id(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  titleFa: text("title_fa").notNull(),
  titleEn: text("title_en").notNull(),
  position: integer("position").notNull(),
  /** Drip: days after enrollment before the module unlocks. */
  unlockAfterDays: integer("unlock_after_days").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: id(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => courseModules.id, { onDelete: "cascade" }),
  type: lessonTypeEnum("type").notNull(),
  titleFa: text("title_fa").notNull(),
  titleEn: text("title_en").notNull(),
  bodyFa: text("body_fa"),
  bodyEn: text("body_en"),
  videoUrl: text("video_url"),
  position: integer("position").notNull(),
  isPreview: boolean("is_preview").notNull().default(false),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    orderId: uuid("order_id"),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("enrollment_user_course_uq").on(t.userId, t.courseId)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.enrollmentId, t.lessonId] })],
);

export const certificates = pgTable("certificates", {
  id: id(),
  code: text("code").notNull().unique(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  studentName: text("student_name").notNull(),
  courseTitle: text("course_title").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------
export const products = pgTable("products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  type: productTypeEnum("type").notNull(),
  nameFa: text("name_fa").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionFa: text("description_fa").notNull(),
  descriptionEn: text("description_en").notNull(),
  billingInterval: billingIntervalEnum("billing_interval").notNull().default("one_time"),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  /** Refund window in days shown at checkout; must match the refund policy. */
  refundWindowDays: integer("refund_window_days").notNull().default(14),
  capacity: integer("capacity"),
  status: contentStatusEnum("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const productPrices = pgTable(
  "product_prices",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    /** Tax/VAT included in amount? Displayed at checkout so there are no hidden fees. */
    taxInclusive: boolean("tax_inclusive").notNull().default(true),
    active: boolean("active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("product_price_currency_uq").on(t.productId, t.currency),
    check("price_positive", sql`${t.amountMinor} >= 0`),
    check("currency_supported", sql`${t.currency} IN ('TRY','USD','EUR','GBP','AUD')`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    priceId: uuid("price_id")
      .notNull()
      .references(() => productPrices.id),
    currency: text("currency").notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref"),
    termsVersion: text("terms_version").notNull(),
    billingName: text("billing_name").notNull(),
    billingEmail: text("billing_email").notNull(),
    billingCountry: text("billing_country").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId), uniqueIndex("orders_provider_ref_uq").on(t.provider, t.providerRef)],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(), // succeeded | failed | refunded
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("payments_provider_id_uq").on(t.provider, t.providerPaymentId)],
);

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: id(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("webhook_event_uq").on(t.provider, t.eventId)],
);

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  orderId: uuid("order_id").references(() => orders.id),
  provider: text("provider").notNull(),
  providerSubscriptionId: text("provider_subscription_id"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const invoices = pgTable("invoices", {
  id: id(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  number: text("number").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Tracking, audit, rate limiting
// ---------------------------------------------------------------------------
export const trackingEvents = pgTable(
  "tracking_events",
  {
    id: id(),
    eventId: text("event_id").notNull(),
    name: text("name").notNull(),
    visitorId: text("visitor_id"),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    path: text("path"),
    utm: jsonb("utm").$type<Utm>(),
    country: text("country"),
    properties: jsonb("properties").$type<Record<string, string | number | boolean>>(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("tracking_event_id_uq").on(t.eventId), index("tracking_name_created_idx").on(t.name, t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_entity_idx").on(t.entityType, t.entityId)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
