import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * Upload policy for CMS media. Files are accepted only when the declared type
 * is on the allow-list, the size is within the limit, AND the file's magic
 * bytes match the declared type (so a renamed .html/.svg/.exe is rejected).
 * SVG is deliberately NOT allowed (it can carry script). Stored under a random
 * name outside the web root; never served with a user-controlled filename.
 */
export const UPLOAD_RULES = {
  "image/jpeg": { maxBytes: 5 * 1024 * 1024, ext: "jpg", magic: [[0xff, 0xd8, 0xff]] },
  "image/png": { maxBytes: 5 * 1024 * 1024, ext: "png", magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { maxBytes: 5 * 1024 * 1024, ext: "webp", magic: [[0x52, 0x49, 0x46, 0x46]] },
  "application/pdf": { maxBytes: 20 * 1024 * 1024, ext: "pdf", magic: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
  "video/mp4": { maxBytes: 200 * 1024 * 1024, ext: "mp4", magic: [] as number[][] }, // checked via ftyp box below
} as const;
export type AllowedMime = keyof typeof UPLOAD_RULES;

export type UploadCheck = { ok: true; mime: AllowedMime; ext: string } | { ok: false; reason: "type_not_allowed" | "too_large" | "empty" | "content_mismatch" };

export function validateUpload(declaredType: string, bytes: Uint8Array): UploadCheck {
  if (!(declaredType in UPLOAD_RULES)) return { ok: false, reason: "type_not_allowed" };
  const mime = declaredType as AllowedMime;
  const rule = UPLOAD_RULES[mime];
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > rule.maxBytes) return { ok: false, reason: "too_large" };
  const startsWith = (sig: readonly number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  let matches = rule.magic.some((sig) => startsWith(sig));
  if (mime === "image/webp") matches = matches && startsWith([0x57, 0x45, 0x42, 0x50], 8);
  if (mime === "video/mp4") matches = startsWith([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  return matches ? { ok: true, mime, ext: rule.ext } : { ok: false, reason: "content_mismatch" };
}

export async function storeUpload(declaredType: string, bytes: Uint8Array) {
  const check = validateUpload(declaredType, bytes);
  if (!check.ok) return check;
  const key = `media/${randomUUID()}.${check.ext}`;
  const root = path.resolve(env().STORAGE_DIR);
  await mkdir(path.join(root, "media"), { recursive: true });
  await writeFile(path.join(root, key), bytes, { mode: 0o640 });
  return { ok: true as const, key, mime: check.mime, size: bytes.length };
}
