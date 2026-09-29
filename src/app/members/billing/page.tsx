import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getMemberContext } from "@/lib/member";
import { flagshipTier } from "@/config/subscriptions";

export default async function BillingPage() {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");

  const end = ctx.membership.currentPeriodEnd;

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Billing</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your plan</h1>
      </header>

      <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {ctx.membership.isActive
                ? ctx.membership.tierName || "Membership"
                : ctx.unlocked
                  ? "Local unlock (dev)"
                  : "No active subscription"}
            </p>
            <p className="text-sm text-muted-foreground">
              {ctx.membership.isActive && end
                ? `Renews or ends ${end.toLocaleDateString("en-GB")}`
                : `Membership is £${flagshipTier.price}/month`}
            </p>
          </div>
        </div>

        {ctx.membership.isActive ? (
          <form action="/api/billing/portal" method="POST">
            <Button type="submit" className="rounded-full w-full h-11">
              Manage billing in Stripe
            </Button>
          </form>
        ) : (
          <Button asChild className="rounded-full w-full h-11">
            <Link href="/join">Start membership</Link>
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Free directory listings are separate.{" "}
        <Link href="/directory/list" className="text-primary hover:underline">
          List without joining
        </Link>
      </p>
    </div>
  );
}
