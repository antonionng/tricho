import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * A sample certificate of completion, drawn in the brand style. Every field
 * that would be personal is a placeholder, and the card is marked as a sample.
 */
export function CertificatePreview({
  courseTitle,
  hours,
  className,
}: {
  courseTitle: string;
  hours: number;
  className?: string;
}) {
  const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-rule bg-card p-2 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.35)]"
        aria-label="Sample certificate of completion"
      >
        <div className="flex flex-col gap-8 rounded-[22px] border border-rule/80 px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="display text-xl tracking-[-0.03em]">{site.name}</p>
              <p className="label text-muted-foreground">Certificate of completion</p>
            </div>
            <span className="rounded-full border border-rule px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Sample
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-muted-foreground">This is to confirm that</p>
            <p className="display text-3xl sm:text-4xl text-mute">Your name</p>
            <p className="text-[13px] text-muted-foreground">has completed</p>
            <p className="text-lg font-semibold leading-snug tracking-tight text-ink">{courseTitle}</p>
          </div>

          <span className="rule-short text-mute" aria-hidden />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div>
              <dt className="label text-muted-foreground">Study time</dt>
              <dd className="mt-1 text-ink">{hours} hours</dd>
            </div>
            <div>
              <dt className="label text-muted-foreground">Completed</dt>
              <dd className="mt-1 text-ink">Date of completion</dd>
            </div>
            <div className="col-span-2">
              <dt className="label text-muted-foreground">Course reviewed by</dt>
              <dd className="mt-1 text-ink">A named, qualified practitioner</dd>
            </div>
            <div className="col-span-2">
              <dt className="label text-muted-foreground">Check this certificate</dt>
              <dd className="mt-1 break-all font-mono text-[12px] text-ink-2">
                {host}/certificates/your-reference
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <figcaption className="text-[13px] text-muted-foreground">
        A sample for illustration. Yours will carry your name, the date and a unique reference.
      </figcaption>
    </figure>
  );
}
