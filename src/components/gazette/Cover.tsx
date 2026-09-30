import Image from "next/image";
import { img } from "@/content/images";
import { coverImage } from "./art";
import { editionLabel, pageTitle, type Edition } from "@/content/gazette";
import { gazetteFonts } from "./fonts";
import { cn } from "@/lib/utils";

/** Cover lines from the edition's features, newsstand style. */
export function coverLinesFor(edition: Edition, n = 3) {
  return edition.pages
    .filter((p) => p.kind === "article" || p.kind === "perspectives" || p.kind === "interactive")
    .slice(0, n)
    .map((p) => pageTitle(p));
}

/**
 * A4 magazine cover in black and white. Sized entirely in container units, so the
 * same markup works as a thumbnail in the archive and as a full page in the reader.
 */
export function Cover({
  edition,
  lines,
  priority,
  className,
  sizes = "(min-width:1024px) 22vw, 45vw",
}: {
  edition: Edition;
  lines?: string[];
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const image = coverImage(edition);
  const coverLines = lines ?? coverLinesFor(edition);
  const published = new Date(edition.published).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div
      className={cn(
        "mag relative aspect-[210/297] w-full overflow-hidden bg-[#111] text-white select-none [container-type:inline-size]",
        gazetteFonts,
        className
      )}
    >
      <Image
        src={img(image, 1400)}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="mag-bw object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/0 to-black/65" />

      {/* Dateline */}
      <div className="absolute inset-x-[5cqw] top-[3.4cqw] flex justify-between mag-caps text-[1.55cqw] tracking-[0.3em] text-white/85">
        <span>{editionLabel(edition)}</span>
        <span>{published}</span>
        <span>Trichollective</span>
      </div>

      {/* Masthead */}
      <p
        className="mag-didone absolute inset-x-0 top-[5.2cqw] text-center font-medium uppercase leading-[0.8] tracking-[-0.02em] text-white"
        style={{ fontSize: "12.6cqw" }}
      >
        Trichozette
      </p>

      {/* Cover lines, left */}
      <div className="absolute left-[5cqw] top-[42%] flex w-[46cqw] flex-col gap-[3.2cqw]">
        {coverLines.map((l, i) => (
          <div key={l}>
            {i === 0 && <span className="mb-[0.8cqw] block h-px w-[7cqw] bg-white/80" />}
            <p className="mag-caps text-[1.7cqw] text-white/80">{i === 0 ? "Inside" : "Plus"}</p>
            <p className="mag-didone mt-[0.6cqw] text-[3.6cqw] italic leading-[1.08]">{l}</p>
          </div>
        ))}
      </div>

      {/* Feature line */}
      <div className="absolute inset-x-[5cqw] bottom-[5cqw]">
        <p className="mag-caps text-[1.7cqw] text-white/80">{edition.theme}</p>
        <p className="mag-didone mt-[1.2cqw] text-[9.4cqw] font-medium leading-[0.9] tracking-[-0.02em]">{edition.title}</p>
        <p className="mag-didone mt-[1.4cqw] text-[4cqw] italic leading-[1.05] text-white/85">{edition.fade}</p>
      </div>
    </div>
  );
}
