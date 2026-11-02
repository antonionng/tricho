"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { discardPostMedia, finishVideoUpload, startVideoUpload, uploadPostImage } from "@/app/members/community/actions";
import { MAX_POST_MEDIA, MAX_UPLOAD_BYTES, MAX_VIDEO_BYTES } from "@/lib/files";

type Item = {
  key: string;
  type: "image" | "video";
  preview: string;
  status: "uploading" | "done" | "failed";
  progress: number;
  id?: string;
  error?: string;
};

const ACCEPT = "image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm";

/** Some browsers leave a video's type blank, so fall back to its extension. */
function videoType(file: File) {
  if (file.type.startsWith("video/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : ext === "mp4" || ext === "m4v" ? "video/mp4" : "";
}

function isVideo(file: File) {
  return file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(file.name);
}

/** Sends a video straight to storage, reporting progress as it goes. */
function putWithProgress(url: string, file: File, contentType: string, onProgress: (n: number) => void) {
  return new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

/**
 * Photos and videos for a post. Each file uploads as soon as it is chosen, and the
 * form sends their ids under "media". Tells the form when an upload is still running.
 */
export function MediaPicker({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useRef<string[]>([]);
  const busy = items.some((i) => i.status === "uploading");

  useEffect(() => onBusyChange?.(busy), [busy, onBusyChange]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const update = (key: string, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  async function upload(file: File, key: string) {
    if (isVideo(file)) {
      if (file.size > MAX_VIDEO_BYTES) {
        return update(key, { status: "failed", error: `Videos can be up to ${MAX_VIDEO_BYTES / 1024 / 1024}MB.` });
      }
      const contentType = videoType(file);
      const ticket = await startVideoUpload(contentType, file.size).catch(() => null);
      if (!ticket?.ok) return update(key, { status: "failed", error: ticket?.message ?? "The video couldn't be uploaded." });
      const sent = await putWithProgress(ticket.uploadUrl, file, contentType, (progress) => update(key, { progress }));
      if (!sent) return update(key, { status: "failed", error: "The upload stopped. Please try again." });
      const done = await finishVideoUpload(ticket.path, file.name).catch(() => null);
      if (!done?.ok) return update(key, { status: "failed", error: done?.error ?? "The video couldn't be saved." });
      return update(key, { status: "done", id: done.id, progress: 1 });
    }

    if (file.size > MAX_UPLOAD_BYTES.photo) {
      return update(key, { status: "failed", error: `Photos can be up to ${MAX_UPLOAD_BYTES.photo / 1024 / 1024}MB.` });
    }
    const form = new FormData();
    form.set("file", file);
    const done = await uploadPostImage(form).catch(() => null);
    if (!done?.ok) return update(key, { status: "failed", error: done?.error ?? "The photo couldn't be uploaded." });
    update(key, { status: "done", id: done.id, progress: 1 });
  }

  function choose(files: FileList | null) {
    if (!files) return;
    const room = MAX_POST_MEDIA - items.length;
    const chosen = [...files].slice(0, Math.max(0, room));
    const added = chosen.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      const item: Item = {
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: isVideo(file) ? "video" : "image",
        preview,
        status: "uploading",
        progress: 0,
      };
      return { file, item };
    });
    setItems((list) => [...list, ...added.map((a) => a.item)]);
    for (const { file, item } of added) void upload(file, item.key);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(item: Item) {
    setItems((list) => list.filter((i) => i.key !== item.key));
    if (item.id) void discardPostMedia(item.id);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.key} className="relative aspect-square overflow-hidden rounded-xl border border-rule bg-paper-2">
              {item.type === "video" ? (
                <video src={item.preview} muted playsInline className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
              )}
              {item.status === "uploading" && (
                <div className="absolute inset-0 grid place-items-center bg-ink/40 text-xs font-medium text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {item.type === "video" ? `${Math.round(item.progress * 100)}%` : "Adding"}
                  </span>
                </div>
              )}
              {item.status === "failed" && (
                <div className="absolute inset-0 grid place-items-center bg-ink/70 p-2 text-center text-[11px] leading-snug text-white" role="alert">
                  {item.error}
                </div>
              )}
              {item.id && <input type="hidden" name="media" value={item.id} />}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label="Remove"
                className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-white hover:bg-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < MAX_POST_MEDIA && (
        <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-ink-2 hover:bg-paper-2 focus-within:outline-2 focus-within:outline-ink">
          <ImagePlus className="h-4 w-4 stroke-[1.6]" />
          Add photos or a video
          <input ref={inputRef} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => choose(e.target.files)} />
        </label>
      )}
    </div>
  );
}
