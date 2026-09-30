import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  size = "default",
}: {
  className?: string;
  children: React.ReactNode;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-10",
        size === "default" && "max-w-7xl",
        size === "narrow" && "max-w-3xl",
        size === "wide" && "max-w-[1440px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  className,
  children,
  tone = "paper",
  id,
}: {
  className?: string;
  children: React.ReactNode;
  tone?: "paper" | "paper-2" | "ink";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 md:py-28 scroll-mt-20",
        tone === "paper-2" && "bg-paper-2",
        tone === "ink" && "bg-ink text-paper",
        className
      )}
    >
      {children}
    </section>
  );
}

/** Small tracked capitals with the poster's short rule. */
export function Eyebrow({
  children,
  className,
  rule = false,
}: {
  children: React.ReactNode;
  className?: string;
  rule?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="label text-current opacity-70">{children}</p>
      {rule && <span className="rule-short opacity-60" aria-hidden />}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  fade,
  body,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  /** Second line in the grey fade. */
  fade?: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 max-w-3xl",
        align === "center" && "mx-auto items-center text-center",
        className
      )}
    >
      {eyebrow && <p className="label opacity-70">{eyebrow}</p>}
      <Tag
        className={cn(
          "display",
          Tag === "h1" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl lg:text-[3.5rem]"
        )}
      >
        {title}
        {fade && (
          <>
            <br />
            <span className="text-fade">{fade}</span>
          </>
        )}
      </Tag>
      {body && <div className="lede max-w-2xl">{body}</div>}
    </header>
  );
}

export function ArrowLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const Icon = external ? ArrowUpRight : ArrowRight;
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-[15px] font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink/40",
        className
      )}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
      <Icon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Pill({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "ink" | "positive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        tone === "default" && "bg-paper-2 text-ink-2 border border-rule",
        tone === "ink" && "bg-ink text-paper",
        tone === "positive" && "bg-positive/10 text-positive",
        className
      )}
    >
      {children}
    </span>
  );
}
