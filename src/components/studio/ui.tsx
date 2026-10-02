import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  intro,
  actions,
}: {
  title: string;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-2">
        <h1 className="display text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="text-[15px] leading-relaxed text-ink-2">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  intro,
  children,
  className,
  actions,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/**
 * A figure with its label. The label sits on one line and the figure always
 * lines up across a row, however long the note underneath is.
 */
export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-rule bg-card p-4 sm:p-5">
      <p className="truncate text-[13px] font-medium text-muted-foreground" title={label}>
        {label}
      </p>
      <p className="display mt-2 text-3xl leading-none tabular-nums sm:text-[2.5rem]">{value}</p>
      {note && <p className="mt-3 line-clamp-3 text-xs leading-snug text-muted-foreground">{note}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-rule bg-card/60 p-6 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-rule bg-card p-5", className)}>{children}</div>;
}

export function Tag({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "ink" | "positive" | "warn" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none whitespace-nowrap",
        tone === "default" && "border border-rule bg-paper-2 text-ink-2",
        tone === "ink" && "bg-ink text-paper",
        tone === "positive" && "bg-positive/10 text-positive",
        tone === "warn" && "bg-amber-100 text-amber-900",
        tone === "danger" && "bg-destructive/10 text-destructive",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Notice({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "danger" }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "danger" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-positive/30 bg-positive/5 text-positive"
      )}
    >
      {children}
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("text-ink underline decoration-mute underline-offset-4 hover:decoration-ink", className)}>
      {children}
    </Link>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-[box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function dateTime(d: Date | null | undefined) {
  if (!d) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export function dateOnly(d: Date | null | undefined) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
}

/** Shown when someone on the team opens a part of Studio their role doesn't cover. */
export function NoAccess({ what = "this part of Studio" }: { what?: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="display text-4xl">Your role doesn&apos;t include {what}.</h1>
      <p className="text-[15px] leading-relaxed text-ink-2">
        Each person on the team sees the parts of Studio they look after. If you need access to this, ask an owner to change your
        role on the Team page.
      </p>
      <Link href="/studio" className="inline-block text-sm text-ink underline underline-offset-4">
        Back to the overview
      </Link>
    </div>
  );
}
