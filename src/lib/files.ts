/**
 * Pure helpers for uploads, shared by the storage module, forms and tests.
 */

export type FileKind = "logo" | "avatar" | "photo" | "cover" | "document";

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"] as const;

/** Largest file accepted before processing. Server actions allow 10MB (next.config.ts). */
export const MAX_UPLOAD_BYTES: Record<FileKind, number> = {
  logo: 5 * 1024 * 1024,
  avatar: 8 * 1024 * 1024,
  photo: 8 * 1024 * 1024,
  cover: 8 * 1024 * 1024,
  document: 9 * 1024 * 1024,
};

/** How images are resized on upload. Logos, gallery photos and covers keep their shape; avatars are cropped square. */
export const IMAGE_SIZES: Record<Exclude<FileKind, "document">, { width: number; height: number; fit: "inside" | "cover" }> = {
  logo: { width: 800, height: 800, fit: "inside" },
  avatar: { width: 640, height: 640, fit: "cover" },
  photo: { width: 1600, height: 1600, fit: "inside" },
  cover: { width: 2400, height: 1200, fit: "inside" },
};

/** The real type of a file, from its first bytes, so a renamed file can't pass as an image. */
export function sniffType(bytes: Uint8Array): (typeof DOCUMENT_TYPES)[number] | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  if (String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  return null;
}

export type UploadCheck =
  | { ok: true; contentType: (typeof DOCUMENT_TYPES)[number] }
  | { ok: false; message: string };

/** Whether an upload is acceptable for its purpose, with a message a member can act on. */
export function checkUpload(kind: FileKind, bytes: Uint8Array): UploadCheck {
  if (bytes.length === 0) return { ok: false, message: "The file was empty. Please choose it again." };
  const limit = MAX_UPLOAD_BYTES[kind];
  if (bytes.length > limit) {
    return { ok: false, message: `That file is larger than ${Math.round(limit / 1024 / 1024)}MB. Please choose a smaller one.` };
  }
  const type = sniffType(bytes);
  const allowed: readonly string[] = kind === "document" ? DOCUMENT_TYPES : IMAGE_TYPES;
  if (!type || !allowed.includes(type)) {
    return {
      ok: false,
      message:
        kind === "document"
          ? "Please upload a PDF, or a photo of the document as a JPEG, PNG or WebP."
          : "Please upload a JPEG, PNG or WebP image.",
    };
  }
  return { ok: true, contentType: type };
}

/** A safe storage path: kind/yyyy/mm/random.ext */
export function storagePath(kind: FileKind, ext: string, now = new Date(), random = Math.random().toString(36).slice(2, 12)) {
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${kind}/${now.getUTCFullYear()}/${mm}/${random}.${ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin"}`;
}

export function extensionFor(contentType: string) {
  return (
    { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" } as Record<string, string>
  )[contentType] ?? "bin";
}

/** Where a stored file can be fetched from. Public Supabase files load straight from Supabase. */
export function fileUrl(
  file: { id: string; driver: string; bucket: string; path: string; isPublic: boolean },
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
) {
  if (file.driver === "supabase" && file.isPublic && supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${file.bucket}/${file.path}`;
  }
  return `/api/files/${file.id}`;
}
