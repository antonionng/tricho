import "server-only";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import {
  checkUpload,
  extensionFor,
  fileUrl,
  IMAGE_SIZES,
  storagePath,
  type FileKind,
} from "@/lib/files";

export { fileUrl };

const PUBLIC_BUCKET = "public-media";
const PRIVATE_BUCKET = "private-documents";

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

/** True when uploads go to Supabase Storage rather than the database. */
export function usingSupabaseStorage() {
  return !!supabaseConfig();
}

const ensured = new Set<string>();

async function ensureBucket(cfg: { url: string; key: string }, bucket: string, isPublic: boolean) {
  if (ensured.has(bucket)) return;
  const res = await fetch(`${cfg.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: isPublic }),
  });
  // 409 / "already exists" is fine.
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    if (!/already exists|Duplicate/i.test(text)) throw new Error(`Couldn't prepare file storage: ${text}`);
  }
  ensured.add(bucket);
}

export type UploadResult = { ok: true; file: { id: string; url: string } } | { ok: false; message: string };

/**
 * Store an uploaded file. Images are resized and saved as WebP; documents are
 * kept as they are and are private unless stated otherwise.
 */
export async function storeUpload(opts: {
  kind: FileKind;
  file: File | null | undefined;
  ownerId?: string | null;
  isPublic?: boolean;
}): Promise<UploadResult | null> {
  const { kind, file } = opts;
  if (!file || typeof file === "string" || file.size === 0) return null;
  const raw = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(kind, raw);
  if (!check.ok) return check;

  let data: Buffer = Buffer.from(raw);
  let contentType: string = check.contentType;
  let width: number | null = null;
  let height: number | null = null;

  if (kind !== "document") {
    const size = IMAGE_SIZES[kind];
    const out = await sharp(raw, { failOn: "error" })
      .rotate()
      .resize({ width: size.width, height: size.height, fit: size.fit, withoutEnlargement: size.fit === "inside" })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    data = out.data;
    width = out.info.width;
    height = out.info.height;
    contentType = "image/webp";
  } else if (contentType !== "application/pdf") {
    // A photo of a document: re-encoding also strips location and camera details.
    const out = await sharp(raw)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    data = out.data;
    width = out.info.width;
    height = out.info.height;
    contentType = "image/jpeg";
  }

  const isPublic = opts.isPublic ?? kind !== "document";
  const bucket = isPublic ? PUBLIC_BUCKET : PRIVATE_BUCKET;
  const path = storagePath(kind, extensionFor(contentType));
  const cfg = supabaseConfig();

  if (cfg) {
    await ensureBucket(cfg, bucket, isPublic);
    const res = await fetch(`${cfg.url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        apikey: cfg.key,
        "Content-Type": contentType,
        "Cache-Control": "31536000",
        "x-upsert": "false",
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) {
      console.error("[storage] upload failed", res.status, await res.text());
      return { ok: false, message: "The file couldn't be saved just now. Please try again in a moment." };
    }
  }

  const row = await prisma.storedFile.create({
    data: {
      kind,
      driver: cfg ? "supabase" : "db",
      bucket,
      path,
      contentType,
      size: data.length,
      width,
      height,
      name: file.name?.slice(0, 200) || null,
      isPublic,
      data: cfg ? null : new Uint8Array(data),
      ownerId: opts.ownerId ?? null,
    },
    select: { id: true, driver: true, bucket: true, path: true, isPublic: true },
  });
  return { ok: true, file: { id: row.id, url: fileUrl(row) } };
}

/** A short-lived link to a private file in Supabase Storage. */
export async function signedUrl(file: { bucket: string; path: string }, seconds = 300) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/storage/v1/object/sign/${file.bucket}/${file.path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: seconds }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { signedURL?: string };
  return body.signedURL ? `${cfg.url}/storage/v1${body.signedURL}` : null;
}

/** Remove a stored file. Never throws: a missing file is already gone. */
export async function deleteStoredFile(id: string | null | undefined) {
  if (!id) return;
  const row = await prisma.storedFile.findUnique({ where: { id }, select: { driver: true, bucket: true, path: true } });
  if (!row) return;
  const cfg = supabaseConfig();
  if (row.driver === "supabase" && cfg) {
    await fetch(`${cfg.url}/storage/v1/object/${row.bucket}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [row.path] }),
    }).catch(() => null);
  }
  await prisma.storedFile.delete({ where: { id } }).catch(() => null);
}

/** URL for a file id, or null. For use when rendering profiles and logos. */
export async function urlForFile(id: string | null | undefined) {
  if (!id) return null;
  const row = await prisma.storedFile.findUnique({ where: { id }, select: { id: true, driver: true, bucket: true, path: true, isPublic: true } });
  return row ? fileUrl(row) : null;
}
