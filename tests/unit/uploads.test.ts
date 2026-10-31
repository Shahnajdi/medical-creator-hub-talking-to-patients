import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/uploads";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const pdf = new TextEncoder().encode("%PDF-1.7\n...");

describe("upload validation", () => {
  it("accepts allowed types whose content matches", () => {
    expect(validateUpload("image/png", png)).toMatchObject({ ok: true, ext: "png" });
    expect(validateUpload("application/pdf", pdf)).toMatchObject({ ok: true, ext: "pdf" });
  });
  it("rejects disallowed types including SVG and HTML", () => {
    expect(validateUpload("image/svg+xml", new TextEncoder().encode("<svg onload=alert(1)>"))).toEqual({ ok: false, reason: "type_not_allowed" });
    expect(validateUpload("text/html", new TextEncoder().encode("<script>"))).toEqual({ ok: false, reason: "type_not_allowed" });
  });
  it("rejects content that does not match the declared type", () => {
    expect(validateUpload("image/png", new TextEncoder().encode("<html><script>alert(1)</script>"))).toEqual({ ok: false, reason: "content_mismatch" });
  });
  it("enforces size limits", () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(png);
    expect(validateUpload("image/png", big)).toEqual({ ok: false, reason: "too_large" });
    expect(validateUpload("image/png", new Uint8Array())).toEqual({ ok: false, reason: "empty" });
  });
});
