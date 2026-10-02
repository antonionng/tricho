import { describe, expect, it } from "vitest";
import { checkUpload, fileUrl, sniffType, storagePath } from "./files";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const pdf = new TextEncoder().encode("%PDF-1.7\n");
const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");

describe("sniffType", () => {
  it("recognises images and PDFs from their first bytes", () => {
    expect(sniffType(png)).toBe("image/png");
    expect(sniffType(jpeg)).toBe("image/jpeg");
    expect(sniffType(webp)).toBe("image/webp");
    expect(sniffType(pdf)).toBe("application/pdf");
    expect(sniffType(new TextEncoder().encode("<svg"))).toBeNull();
  });
});

describe("checkUpload", () => {
  it("accepts images for logos and photos, but not PDFs", () => {
    expect(checkUpload("logo", png).ok).toBe(true);
    expect(checkUpload("avatar", pdf).ok).toBe(false);
  });

  it("accepts PDFs and photos for documents", () => {
    expect(checkUpload("document", pdf).ok).toBe(true);
    expect(checkUpload("document", jpeg).ok).toBe(true);
  });

  it("refuses empty and oversized files with a clear message", () => {
    expect(checkUpload("logo", new Uint8Array())).toMatchObject({ ok: false });
    const big = new Uint8Array(6 * 1024 * 1024);
    big.set(png);
    const result = checkUpload("logo", big);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/larger than 5MB/);
  });
});

describe("storage paths and links", () => {
  it("builds a dated, unguessable path", () => {
    expect(storagePath("avatar", "webp", new Date("2026-10-04T00:00:00Z"), "abc123")).toBe("avatar/2026/10/abc123.webp");
  });

  it("links public Supabase files directly and everything else through the app", () => {
    const base = { id: "f1", bucket: "public-media", path: "logo/2026/10/x.webp" };
    expect(fileUrl({ ...base, driver: "supabase", isPublic: true }, "https://abc.supabase.co")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/public-media/logo/2026/10/x.webp"
    );
    expect(fileUrl({ ...base, driver: "supabase", isPublic: false }, "https://abc.supabase.co")).toBe("/api/files/f1");
    expect(fileUrl({ ...base, driver: "db", isPublic: true }, "https://abc.supabase.co")).toBe("/api/files/f1");
  });
});
