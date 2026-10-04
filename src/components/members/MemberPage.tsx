import { cn } from "@/lib/utils";

/** Standard padding and width for every member page. */
export function MemberPage({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10",
        size === "default" && "max-w-5xl",
        size === "narrow" && "max-w-2xl",
        size === "wide" && "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  label,
  title,
  lede,
  action,
  className,
}: {
  label?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-3">
        {label && <p className="label text-muted-foreground">{label}</p>}
        <h1 className="display text-[2.5rem] sm:text-5xl">{title}</h1>
        {lede && <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionLabel({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="label text-muted-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return <Tag className={cn("rounded-2xl border border-rule bg-card", className)}>{children}</Tag>;
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-rule bg-card/60 px-6 py-10 text-center", className)}>
      <p className="font-medium text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-input bg-paper px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-ink focus-visible:ring-2 focus-visible:ring-ink/15";
