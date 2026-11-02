import { Award } from "lucide-react";
import { site } from "@/config/site";
import { longDate } from "@/components/members/format";
import { cn } from "@/lib/utils";

/**
 * An issued certificate of completion, in the same design as the sample on
 * each course page. Prints cleanly on a single A4 page.
 */
export function CertificateCard({
  reference,
  holderName,
  courseTitle,
  hours,
  issuedAt,
  reviewer,
  withdrawn,
  className,
}: {
  reference: string;
  holderName: string;
  courseTitle: string;
  hours: number;
  issuedAt: Date;
  reviewer?: string | null;
  withdrawn?: boolean;
  className?: string;
}) {
  const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div
      className={cn(
        "certificate relative overflow-hidden rounded-3xl border border-rule bg-card p-2 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.35)] print:rounded-none print:border-0 print:shadow-none",
        className
      )}
    >
      <div className="flex flex-col gap-9 rounded-[22px] border border-rule/80 px-6 py-9 sm:px-12 sm:py-14">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="display text-2xl tracking-[-0.03em]">{site.name}</p>
            <p className="label text-muted-foreground">Certificate of completion</p>
          </div>
          <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full border", withdrawn ? "border-destructive/40 text-destructive" : "border-ink")}>
            <Award className="h-7 w-7 stroke-[1.3]" aria-hidden />
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-muted-foreground">This is to confirm that</p>
          <p className="display text-4xl leading-[1.05] sm:text-5xl">{holderName}</p>
          <p className="text-[14px] text-muted-foreground">has completed the online course</p>
          <p className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{courseTitle}</p>
        </div>

        <span className="rule-short text-mute" aria-hidden />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[14px]">
          <div>
            <dt className="label text-muted-foreground">Study time</dt>
            <dd className="mt-1">{hours} hours</dd>
          </div>
          <div>
            <dt className="label text-muted-foreground">Completed</dt>
            <dd className="mt-1">{longDate(issuedAt)}</dd>
          </div>
          {reviewer && (
            <div className="col-span-2">
              <dt className="label text-muted-foreground">Course reviewed by</dt>
              <dd className="mt-1">{reviewer}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="label text-muted-foreground">Check this certificate</dt>
            <dd className="mt-1 break-all font-mono text-[13px] text-ink-2">
              {host}/certificates/{reference}
            </dd>
          </div>
        </dl>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          A certificate of completion for continuing professional development. It is not an accredited qualification.
        </p>
      </div>
      {withdrawn && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
          <span className="-rotate-6 rounded-full border-2 border-destructive px-6 py-2 text-xl font-semibold uppercase tracking-[0.12em] text-destructive">
            Withdrawn
          </span>
        </div>
      )}
    </div>
  );
}
