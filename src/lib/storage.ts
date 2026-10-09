import "server-only";
import { prisma } from "@/lib/prisma";
import {
  checkUpload,
  extensionFor,
  fileUrl,
  IMAGE_SIZES,
  MAX_VIDEO_BYTES,
  sniffVideo,
  storagePath,
  VIDEO_TYPES,
  videoExtension,
  type FileKind,
} from "@/lib/files";

export { fileUrl };

type Sharp = typeof import("sharp");
let sharpLoader: Promise<Sharp | null> | null = null;

/**
 * Load the image library only when an image is uploaded. If it can't load on
 * the server, uploads are kept as they are rather than taking the page down.
 */
function loadSharp(): Promise<Sharp | null> {
  sharpLoader ??= import("sharp")
    .then((m) => ((m as unknown as { default?: Sharp }).default ?? (m as unknown as Sharp)))
    .catch((error) => {
      console.error("[storage] image processing is unavailable, so the original file is kept", error);
      return null;
    });
  return sharpLoader;
}

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

  const sharp = kind === "document" && contentType === "application/pdf" ? null : await loadSharp();
  try {
    if (sharp && kind !== "document") {
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
    } else if (sharp && contentType !== "application/pdf") {
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
  } catch (error) {
    // A file that can't be processed is kept as uploaded; it has already passed the type check.
    console.error("[storage] couldn't process the image, so the original file is kept", error);
    data = Buffer.from(raw);
    contentType = check.contentType;
    width = null;
    height = null;
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

export type VideoUploadTicket = { ok: true; path: string; uploadUrl: string } | { ok: false; message: string };

/**
 * A one-time link the browser uploads a video to directly, since videos are too large for a server action.
 * The video only counts once `registerVideoUpload` has checked what arrived.
 */
export async function createVideoUpload(opts: { contentType: string; size: number }): Promise<VideoUploadTicket> {
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, message: "Video uploads aren't available just now. Photos still work." };
  if (!(VIDEO_TYPES as readonly string[]).includes(opts.contentType)) {
    return { ok: false, message: "Please choose an MP4, MOV or WebM video." };
  }
  if (opts.size <= 0) return { ok: false, message: "The video was empty. Please choose it again." };
  if (opts.size > MAX_VIDEO_BYTES) {
    return { ok: false, message: `Videos can be up to ${MAX_VIDEO_BYTES / 1024 / 1024}MB. Please trim it or choose a shorter one.` };
  }
  await ensureBucket(cfg, PUBLIC_BUCKET, true);
  const path = storagePath("video", videoExtension(opts.contentType));
  const res = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${PUBLIC_BUCKET}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, "Content-Type": "application/json" },
    body: "{}",
  });
  const body = res.ok ? ((await res.json()) as { url?: string }) : null;
  if (!body?.url) {
    console.error("[storage] couldn't create a video upload link", res.status, res.ok ? "" : await res.text());
    return { ok: false, message: "The video couldn't be uploaded just now. Please try again in a moment." };
  }
  return { ok: true, path, uploadUrl: `${cfg.url}/storage/v1${body.url}` };
}

/** Checks a video the browser uploaded really is one and within the limit, then records it. Anything else is removed. */
export async function registerVideoUpload(opts: { path: string; ownerId: string; name?: string | null }): Promise<UploadResult> {
  const cfg = supabaseConfig();
  const failed = { ok: false as const, message: "The video didn't arrive. Please try uploading it again." };
  if (!cfg || !/^video\/\d{4}\/\d{2}\/[a-z0-9]+\.(mp4|mov|webm)$/.test(opts.path)) return failed;

  const already = await prisma.storedFile.findFirst({ where: { bucket: PUBLIC_BUCKET, path: opts.path }, select: { id: true } });
  if (already) return failed;

  const res = await fetch(`${cfg.url}/storage/v1/object/${PUBLIC_BUCKET}/${opts.path}`, {
    headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, Range: "bytes=0-15" },
  });
  if (!res.ok) return failed;
  const head = new Uint8Array(await res.arrayBuffer()).slice(0, 16);
  const size = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? 0);
  const contentType = sniffVideo(head);
  const remove = () =>
    fetch(`${cfg.url}/storage/v1/object/${PUBLIC_BUCKET}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.key}`, apikey: cfg.key, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [opts.path] }),
    }).catch(() => null);
  if (!contentType) {
    await remove();
    return { ok: false, message: "That file isn't a video we can play. Please choose an MP4, MOV or WebM." };
  }
  if (size > MAX_VIDEO_BYTES) {
    await remove();
    return { ok: false, message: `Videos can be up to ${MAX_VIDEO_BYTES / 1024 / 1024}MB. Please trim it or choose a shorter one.` };
  }

  const row = await prisma.storedFile.create({
    data: {
      kind: "video",
      driver: "supabase",
      bucket: PUBLIC_BUCKET,
      path: opts.path,
      contentType,
      size,
      name: opts.name?.slice(0, 200) || null,
      isPublic: true,
      ownerId: opts.ownerId,
    },
    select: { id: true, driver: true, bucket: true, path: true, isPublic: true },
  });
  return { ok: true, file: { id: row.id, url: fileUrl(row) } };
}
