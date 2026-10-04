import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { SubmitButton } from "@/components/members/SubmitButton";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";

export type ManagedPhoto = { id: string; url: string; caption: string | null };

/**
 * A gallery editor inside one ordinary form: add a photo, edit captions, move photos and remove
 * them. Each button posts the whole form with its own name and value, so it works without
 * JavaScript, and the server checks the limit whatever is shown here.
 */
export function PhotoManager({
  action,
  hidden = {},
  photos,
  limit,
  continueLabel,
  addHint = "A JPEG, PNG or WebP up to 8MB. Landscape photos of your space, team and work look best.",
}: {
  action: (form: FormData) => Promise<void>;
  hidden?: Record<string, string>;
  photos: ManagedPhoto[];
  limit: number;
  /** When set, shows a second button that saves and moves on (posted as intent=continue). */
  continueLabel?: string;
  addHint?: string;
}) {
  const full = photos.length >= limit;
  return (
    <form action={action} className="flex flex-col gap-6">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-rule bg-paper-2/50 p-4 sm:p-5">
        <p className="text-sm font-medium">
          {full ? `You are showing all ${limit} photos.` : `Add a photo (${photos.length} of ${limit} used)`}
        </p>
        {full ? (
          <p className="text-sm text-muted-foreground">Remove a photo below to make room for a new one.</p>
        ) : (
          <>
            <ImageUpload name="photo" shape="wide" label="Choose a photo" hint={addHint} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Caption (optional)</span>
              <input name="photoCaption" maxLength={140} placeholder="For example, our treatment room in Dublin" className={cn(fieldClass, "h-11")} />
            </label>
            <div>
              <SubmitButton pending="Uploading…">Add this photo</SubmitButton>
            </div>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? `Photo ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
              <input
                name={`caption:${p.id}`}
                defaultValue={p.caption ?? ""}
                maxLength={140}
                placeholder="Add a caption"
                aria-label={`Caption for photo ${i + 1}`}
                className={cn(fieldClass, "h-10 text-sm")}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  name="move"
                  value={`${p.id}:up`}
                  disabled={i === 0}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule hover:border-ink/40 disabled:opacity-30"
                  aria-label={`Move photo ${i + 1} earlier`}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  name="move"
                  value={`${p.id}:down`}
                  disabled={i === photos.length - 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule hover:border-ink/40 disabled:opacity-30"
                  aria-label={`Move photo ${i + 1} later`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <span className="ml-1 text-xs text-muted-foreground">{i === 0 ? "Shown first" : `Photo ${i + 1}`}</span>
                <button
                  type="submit"
                  name="remove"
                  value={p.id}
                  className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center">
        {photos.length > 0 && (
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full border border-rule px-6 text-[15px] font-medium hover:border-ink/40"
          >
            Save captions
          </button>
        )}
        {continueLabel && (
          <button
            type="submit"
            name="intent"
            value="continue"
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium text-paper hover:bg-ink/90"
          >
            {continueLabel}
          </button>
        )}
      </div>
    </form>
  );
}
