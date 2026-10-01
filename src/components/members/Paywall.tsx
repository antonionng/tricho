import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberPage } from "./MemberPage";

export function Paywall({
  title = "This is part of membership",
  body = "Choose a plan to join the conversation, come to gatherings and read Trichozette each month.",
  href = "/pricing",
  cta = "See membership plans",
}: {
  title?: string;
  body?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <MemberPage size="narrow">
      <div className="rounded-3xl border border-rule bg-card px-6 py-12 text-center sm:px-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-2">
          <Lock className="h-5 w-5 stroke-[1.6]" />
        </span>
        <p className="label mt-6 text-muted-foreground">Members only</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={href}>{cta}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/members/billing">Check your billing</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Already paid? It can take a minute for membership to show. Refresh this page, or{" "}
          <Link href="/members/profile" className="underline underline-offset-4">
            update your profile
          </Link>{" "}
          in the meantime.
        </p>
      </div>
    </MemberPage>
  );
}

/** A gentle upsell for Professional features. */
export function ProfessionalUpsell({
  title,
  body,
  points,
}: {
  title: string;
  body: string;
  points?: string[];
}) {
  return (
    <div className="rounded-3xl border border-rule bg-card p-6 sm:p-8">
      <p className="label text-muted-foreground">Professional</p>
      <h2 className="display mt-3 text-3xl">{title}</h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-2">{body}</p>
      {points && (
        <ul className="mt-5 grid gap-2 text-[15px] text-ink-2 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="lg" className="mt-7">
        <Link href="/pricing#professional">See Professional</Link>
      </Button>
    </div>
  );
}
