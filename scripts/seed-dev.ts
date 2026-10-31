import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, schema, closeDb } from "../src/db";

/**
 * DEVELOPMENT DEMO DATA ONLY. Refuses to run unless APP_ENV is development/test.
 * Everything created is clearly labelled "[DEV DEMO]" and must never reach production.
 */
async function main() {
  if (!["development", "test"].includes(process.env.APP_ENV ?? "")) throw new Error("seed-dev only runs with APP_ENV=development or test");
  const storage = path.resolve(process.env.STORAGE_DIR ?? "./storage");
  await mkdir(storage, { recursive: true });
  // Minimal valid PDF so the training funnel can be exercised locally.
  await writeFile(path.join(storage, "dev-roadmap.pdf"), "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
  await db().insert(schema.resources).values({ slug: "dev-roadmap", funnel: "training", titleFa: "[DEV DEMO] نقشه راه", titleEn: "[DEV DEMO] Roadmap", descriptionFa: "فقط برای توسعه", descriptionEn: "Development only", storageKey: "dev-roadmap.pdf", status: "published" }).onConflictDoNothing();
  const [course] = await db().insert(schema.courses).values({ slug: "dev-demo-course", titleFa: "[DEV DEMO] دوره آزمایشی", titleEn: "[DEV DEMO] Demo course", summaryFa: "داده آزمایشی توسعه", summaryEn: "Development demo data", status: "published" }).onConflictDoNothing().returning();
  if (course) {
    const [mod] = await db().insert(schema.courseModules).values({ courseId: course.id, titleFa: "بخش ۱", titleEn: "Module 1", position: 0 }).returning();
    await db().insert(schema.lessons).values({ moduleId: mod!.id, type: "text", titleFa: "درس ۱", titleEn: "Lesson 1", bodyFa: "متن آزمایشی", bodyEn: "Demo text", position: 0 });
    const [product] = await db().insert(schema.products).values({ slug: "dev-demo-course", type: "course", nameFa: "[DEV DEMO] دوره آزمایشی", nameEn: "[DEV DEMO] Demo course", descriptionFa: "فقط توسعه", descriptionEn: "Development only", courseId: course.id, status: "published" }).returning();
    await db().insert(schema.productPrices).values([{ productId: product!.id, currency: "USD", amountMinor: 1000 }, { productId: product!.id, currency: "TRY", amountMinor: 30000 }]);
  }
  console.log("Dev demo data seeded.");
}
main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(closeDb);
