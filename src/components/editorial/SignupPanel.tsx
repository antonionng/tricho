import { NewsletterForm } from "@/components/site/NewsletterForm";
import { cn } from "@/lib/utils";

/**
 * An honest empty state or register-interest block: what is coming, and a
 * newsletter sign-up so the reader hears first.
 */
export function SignupPanel({
  eyebrow,
  title,
  body,
  source,
  cta = "Keep me posted",
  note = "One email a month at most. Unsubscribe at any time.",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  source: string;
  cta?: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-3xl border border-rule bg-card p-7 sm:p-10",
        className
      )}
    >
      {eyebrow && (
        <div className="flex flex-col gap-3">
          <p className="label text-muted-foreground">{eyebrow}</p>
          <span className="rule-short text-mute" aria-hidden />
        </div>
      )}
      <h2 className="display text-3xl sm:text-4xl">{title}</h2>
      {body && <div className="text-[16px] leading-relaxed text-ink-2 max-w-xl">{body}</div>}
      <div className="flex flex-col gap-3 max-w-md">
        <NewsletterForm source={source} cta={cta} />
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}
