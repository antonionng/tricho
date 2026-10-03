import { images, img } from "@/content/images";
import { IMAGE_KEYS } from "@/content/gazette/schema";
import { cn } from "@/lib/utils";

/** A grid of brand photographs to choose from, as radio buttons, folded away until opened. */
export function ImagePicker({
  name,
  value,
  optional = false,
  label = "Image",
}: {
  name: string;
  value?: string | null;
  optional?: boolean;
  label?: string;
}) {
  const current = value && value in images ? images[value as keyof typeof images] : null;
  return (
    <details className="group rounded-xl border border-rule bg-card">
      <summary className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img(current, 160)} alt="" className="h-10 w-14 rounded-md object-cover" />
        ) : (
          <span className="grid h-10 w-14 place-items-center rounded-md bg-paper-2 text-[10px] text-muted-foreground">None</span>
        )}
        <span className="font-medium text-ink">{label}</span>
        <span className="text-muted-foreground">{current ? current.alt : "No image chosen"}</span>
        <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Choose</span>
      </summary>
      <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto border-t border-rule p-3 sm:grid-cols-5">
        {optional && (
          <label className="flex cursor-pointer flex-col gap-1 text-[11px] text-muted-foreground">
            <input type="radio" name={name} value="" defaultChecked={!current} className="peer sr-only" />
            <span className="grid aspect-[4/3] place-items-center rounded-lg border border-rule bg-paper-2 peer-checked:ring-2 peer-checked:ring-ink">No image</span>
          </label>
        )}
        {IMAGE_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer flex-col gap-1 text-[11px] text-muted-foreground" title={images[key].alt}>
            <input type="radio" name={name} value={key} defaultChecked={value === key} className="peer sr-only" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img(images[key], 240)}
              alt={images[key].alt}
              loading="lazy"
              className={cn("aspect-[4/3] w-full rounded-lg object-cover peer-checked:ring-2 peer-checked:ring-ink peer-checked:ring-offset-2")}
            />
            <span className="truncate">{key}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
