import { readFile } from "node:fs/promises";
import path from "node:path";
import { db, schema } from "@/db";
import { env } from "@/lib/env";
import { verifyDownload } from "@/lib/resources";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const v = verifyDownload(token);
  if (!v) return new Response("Link invalid or expired", { status: 403 });
  const resource = await db().query.resources.findFirst({ where: (r, { and, eq }) => and(eq(r.id, v.resourceId), eq(r.status, "published")) });
  if (!resource?.storageKey) return new Response("Not found", { status: 404 });
  const root = path.resolve(env().STORAGE_DIR);
  const file = path.resolve(root, resource.storageKey);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 }); // path traversal guard
  const data = await readFile(file).catch(() => null);
  if (!data) return new Response("Not found", { status: 404 });
  await db().insert(schema.resourceDownloads).values({ resourceId: resource.id, contactId: v.contactId }).catch(() => {});
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resource.slug}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
