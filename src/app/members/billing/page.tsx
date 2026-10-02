import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { longDate } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { subscriptionTiers, tierById } from "@/config/subscriptions";

export const metadata = { title: "Plan and billing" };

export default async function BillingPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/billing");

  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { isFounding: true, stripeCustomerId: true },
  });
  const active = ctx.membership.isActive;
  const tier = tierById(ctx.membership.tierId ?? ctx.plan);
  const end = ctx.membership.currentPeriodEnd;
  const upgrade = active && tier?.id === "community" ? tierById("professional") : undefined;

  return (
    <MemberPage size="narrow">
      <PageHeader label="Billing" title="Your plan" />

      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {active ? <Pill tone="positive">Active</Pill> : <Pill>No active membership</Pill>}
          {user?.isFounding && <Pill tone="ink">Founding member</Pill>}
          {ctx.unlocked && !active && <Pill>Local development unlock</Pill>}
        </div>
        <h2 className="display mt-4 text-4xl">{active ? (tier?.name ?? "Membership") : "Not a member yet"}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          {active
            ? ctx.membership.via
              ? `Your Professional membership is provided by ${ctx.membership.via}.`
              : end
              ? `Your membership renews or ends on ${longDate(end)}.`
              : "Your membership is active."
            : `Membership starts at £${Math.min(...subscriptionTiers.map((t) => t.price))} a month. Founding members keep their price for life.`}
        </p>
        {active && tier && <p className="mt-2 text-sm text-muted-foreground">{tier.summary}</p>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {active || user?.stripeCustomerId ? (
            <form action="/api/billing/portal" method="POST">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Manage billing
              </Button>
            </form>
          ) : null}
          {!active && (
            <Button asChild size="lg">
              <Link href="/pricing">See membership plans</Link>
            </Button>
          )}
        </div>
        {(active || user?.stripeCustomerId) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Opens Stripe, where you can update your card, download invoices or cancel.
          </p>
        )}
      </Card>

      {upgrade && (
        <section className="mt-8">
          <SectionLabel>Professional</SectionLabel>
          <Card className="p-5 sm:p-6">
            <p className="text-[15px] leading-relaxed text-ink-2">{upgrade.summary}</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-2">
              {upgrade.features.slice(1, 5).map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="mt-5">
              <Link href="/pricing#professional">Compare plans</Link>
            </Button>
          </Card>
        </section>
      )}

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        Free founding listings in the directory are separate from membership.{" "}
        <Link href="/directory/list" className="underline underline-offset-4">
          List without joining
        </Link>
        .
      </p>
    </MemberPage>
  );
}
