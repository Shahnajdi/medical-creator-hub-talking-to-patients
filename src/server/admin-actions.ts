"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { contactScope } from "@/lib/crm/queries";
import { erasePersonalData, exportPersonalData } from "@/lib/privacy/requests";

const uuid = z.string().uuid();

async function assertContactAccess(user: Awaited<ReturnType<typeof requirePermission>>, contactId: string) {
  const [row] = await db().select({ id: schema.contacts.id }).from(schema.contacts).where(and(eq(schema.contacts.id, contactId), contactScope(user)));
  if (!row) throw new Error("not_found");
}

export async function moveOpportunity(opportunityId: string, stageId: string) {
  const user = await requirePermission("crm.write");
  uuid.parse(opportunityId); uuid.parse(stageId);
  await db().transaction(async (tx) => {
    const [opp] = await tx.select().from(schema.opportunities).where(eq(schema.opportunities.id, opportunityId)).for("update");
    if (!opp) throw new Error("not_found");
    await assertContactAccess(user, opp.contactId);
    const stage = await tx.query.pipelineStages.findFirst({ where: (s, { and, eq }) => and(eq(s.id, stageId), eq(s.pipelineId, opp.pipelineId)) });
    if (!stage) throw new Error("invalid_stage"); // cannot move across pipelines
    const status = stage.isWon ? "won" : stage.isLost ? "lost" : "open";
    await tx.update(schema.opportunities).set({ stageId, status }).where(eq(schema.opportunities.id, opportunityId));
    await tx.insert(schema.activities).values({ contactId: opp.contactId, type: "stage_changed", description: `${stage.key}`, userId: user.id, metadata: { from: opp.stageId, to: stageId } });
    await audit(tx, { actorUserId: user.id, action: "opportunity.stage_changed", entityType: "opportunity", entityId: opportunityId, data: { from: opp.stageId, to: stageId } });
  });
  revalidatePath("/[locale]/admin/pipelines", "page");
}

export async function addNote(contactId: string, form: FormData) {
  const user = await requirePermission("crm.write");
  uuid.parse(contactId);
  const text = z.string().trim().min(1).max(5000).parse(form.get("note"));
  await assertContactAccess(user, contactId);
  await db().insert(schema.activities).values({ contactId, type: "note", description: text, userId: user.id });
  await db().update(schema.contacts).set({ lastActivityAt: new Date() }).where(eq(schema.contacts.id, contactId));
  revalidatePath("/[locale]/admin/contacts/[id]", "page");
}

export async function exportForRequest(requestId: string) {
  const user = await requirePermission("privacy.manage");
  const req = await db().query.privacyRequests.findFirst({ where: (r, { eq }) => eq(r.id, uuid.parse(requestId)) });
  if (!req || req.status === "unverified") throw new Error("not_verified");
  const data = await exportPersonalData(req.email);
  await audit(db(), { actorUserId: user.id, action: "privacy.export", entityType: "privacy_request", entityId: req.id });
  return JSON.stringify(data, null, 2);
}

export async function eraseForRequest(requestId: string) {
  const user = await requirePermission("privacy.manage");
  const req = await db().query.privacyRequests.findFirst({ where: (r, { eq }) => eq(r.id, uuid.parse(requestId)) });
  if (!req || req.type !== "deletion" || req.status === "unverified") throw new Error("not_allowed");
  const result = await erasePersonalData(req.email, user.id, req.id);
  await db().update(schema.privacyRequests).set({ status: "completed", completedAt: new Date(), handledBy: user.id, resolutionNote: `erased contacts=${result.contacts} accounts=${result.accounts}` }).where(eq(schema.privacyRequests.id, req.id));
  revalidatePath("/[locale]/admin/privacy", "page");
  return result;
}

export async function resolveRequest(requestId: string, status: "completed" | "rejected", note: string) {
  const user = await requirePermission("privacy.manage");
  await db().update(schema.privacyRequests).set({ status, completedAt: new Date(), handledBy: user.id, resolutionNote: z.string().max(1000).parse(note) }).where(eq(schema.privacyRequests.id, uuid.parse(requestId)));
  await audit(db(), { actorUserId: user.id, action: `privacy.${status}`, entityType: "privacy_request", entityId: requestId });
  revalidatePath("/[locale]/admin/privacy", "page");
}
