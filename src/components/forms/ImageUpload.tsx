"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A file field with an instant preview. Works inside an ordinary server-action
 * form: the file is sent with the form under `name`.
 */
export function ImageUpload({
  name,
  currentUrl,
  shape = "square",
  label,
  hint,
  accept = "image/png,image/jpeg,image/webp",
  removeName,
}: {
  name: string;
  currentUrl?: string | null;
  shape?: "square" | "circle" | "wide";
  label: string;
  hint?: string;
  accept?: string;
  /** When set, shows a "Remove" checkbox posted under this name. */
  removeName?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden border border-rule bg-paper-2 text-xs text-muted-foreground",
          shape === "circle" ? "h-20 w-20 rounded-full" : shape === "wide" ? "h-20 w-36 rounded-xl" : "h-20 w-20 rounded-xl"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className={cn("h-full w-full", shape === "circle" ? "object-cover" : "object-contain p-1")} />
        ) : (
          <span>None yet</span>
        )}
      </div>
      <div className="min-w-0 space-y-1 text-sm">
        <label className="inline-flex cursor-pointer items-center rounded-full border border-rule bg-card px-3.5 py-1.5 font-medium text-ink hover:bg-paper-2">
          {label}
          <input
            type="file"
            name={name}
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
              if (!file) return;
              objectUrl.current = URL.createObjectURL(file);
              setPreview(objectUrl.current);
              setFileName(file.name);
            }}
          />
        </label>
        {fileName && <p className="truncate text-xs text-ink-2">{fileName} will be saved when you submit.</p>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {removeName && currentUrl && (
          <label className="flex items-center gap-2 text-xs text-ink-2">
            <input type="checkbox" name={removeName} /> Remove the current image
          </label>
        )}
      </div>
    </div>
  );
}
