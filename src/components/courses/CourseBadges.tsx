import Link from "next/link";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

export type CourseBadge = { id: string; courseTitle: string; hours: number; issuedAt: Date };

/**
 * "Completed" badges for courses a member has finished, each linked to the
 * public certificate so anyone can check it. Members choose which to show.
 */
export function CourseBadges({ badges, className }: { badges: CourseBadge[]; className?: string }) {
  if (!badges.length) return null;
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {badges.map((b) => (
        <li key={b.id}>
          <Link
            href={`/certificates/${b.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-rule bg-card px-4 py-3 transition-colors hover:border-ink/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <Award className="h-4 w-4 stroke-[1.6]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Course completed</span>
              <span className="block text-[15px] font-semibold leading-snug">{b.courseTitle}</span>
              <span className="block text-[13px] text-muted-foreground">
                {b.hours} hours CPD · {b.issuedAt.getFullYear()} · Check certificate
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
