import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendTemplatedEmail } from "@/lib/email/messaging";
import type { TemplateKey } from "@/lib/email/templates";
import { fulfilOrder } from "@/lib/payments/service";
import { signDownload } from "@/lib/resources";
import { backoffMs, claimJobs, enqueue, type ClaimedJob } from "./queue";

type Handler = (job: ClaimedJob) => Promise<{ retryAt?: Date } | void>;

const handlers: Record<string, Handler> = {
  "workflow.run": async (job) => {
    const p = job.payload as { event: string; contactId: string; leadId?: string; resourceId?: string };
    const workflows = await db().query.automationWorkflows.findMany({
      where: (w, { and, eq }) => and(eq(w.triggerEvent, p.event), eq(w.enabled, true)),
    });
    for (const wf of workflows) {
      let index = 0;
      for (const step of wf.steps) {
        const runAt = new Date(Date.now() + ("delayMinutes" in step && step.delayMinutes ? step.delayMinutes * 60_000 : 0));
        await enqueue(db(), {
          type: "workflow.step",
          payload: { ...p, workflowId: wf.id, step, category: step.type === "send_email" ? step.category : undefined },
          idempotencyKey: `${job.idempotencyKey}:${wf.key}:${index++}`,
          runAt,
        });
      }
    }
  },
  "workflow.step": async (job) => {
    const p = job.payload as { contactId: string; leadId?: string; resourceId?: string; workflowId: string; step: schema.WorkflowStep };
    const wf = await db().query.automationWorkflows.findFirst({ where: (w, { eq }) => eq(w.id, p.workflowId) });
    if (!wf?.enabled) return; // paused workflows skip pending steps
    const s = p.step;
    const base = env().APP_URL;
    if (s.type === "send_email") {
      const r = await sendTemplatedEmail({
        contactId: p.contactId,
        template: s.template as TemplateKey,
        category: s.category,
        vars: {
          bookUrl: `${base}/book-call`,
          trainingUrl: `${base}/training`,
          downloadUrl: p.resourceId ? `${base}/api/resources/download?token=${encodeURIComponent(signDownload(p.resourceId, p.contactId))}` : undefined,
        },
      });
      if (r.status === "deferred") return { retryAt: r.until };
      logger.info("workflow.email", { template: s.template, result: r.status, reason: "reason" in r ? r.reason : undefined });
    } else if (s.type === "create_task") {
      const contact = await db().query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, p.contactId) });
      await db().insert(schema.tasks).values({
        title: s.title,
        contactId: p.contactId,
        assignedUserId: contact?.ownerUserId ?? null,
        dueAt: new Date(Date.now() + s.dueInHours * 3600_000),
        priority: s.priority ?? "normal",
      });
    } else if (s.type === "add_tag") {
      await db()
        .update(schema.contacts)
        .set({ tags: sql`(SELECT array_agg(DISTINCT t) FROM unnest(${schema.contacts.tags} || ARRAY[${s.tag}]::text[]) t)` })
        .where(eq(schema.contacts.id, p.contactId));
    } else if (s.type === "notify_admin") {
      logger.info("workflow.notify_admin", { message: s.message, contactId: p.contactId });
    }
  },
  "order.fulfil": async (job) => {
    await fulfilOrder((job.payload as { orderId: string }).orderId);
  },
};

/** Processes one batch of due jobs. Returns number processed. */
export async function runJobsOnce(limit = 10): Promise<number> {
  const conn = db();
  const jobs = await claimJobs(conn, limit);
  for (const job of jobs) {
    const handler = handlers[job.type];
    try {
      if (!handler) throw new Error(`No handler for ${job.type}`);
      const res = await handler(job);
      if (res && res.retryAt) {
        // Deferral (e.g. quiet hours) does not consume an attempt.
        await conn.update(schema.jobs).set({ status: "pending", runAt: res.retryAt, attempts: job.attempts - 1, lockedAt: null }).where(eq(schema.jobs.id, job.id));
      } else {
        await conn.update(schema.jobs).set({ status: "succeeded", completedAt: new Date(), lockedAt: null }).where(eq(schema.jobs.id, job.id));
      }
    } catch (err) {
      const dead = job.attempts >= job.maxAttempts;
      const message = err instanceof Error ? err.message : String(err);
      logger.error("job.failed", { jobId: job.id, type: job.type, attempts: job.attempts, dead, error: message });
      await conn
        .update(schema.jobs)
        .set({ status: dead ? "dead" : "pending", lastError: message.slice(0, 1000), runAt: new Date(Date.now() + backoffMs(job.attempts)), lockedAt: null })
        .where(eq(schema.jobs.id, job.id));
    }
  }
  return jobs.length;
}
