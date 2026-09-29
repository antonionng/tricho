import Link from "next/link";
import { Button } from "@/components/ui/button";
import { flagshipTier } from "@/config/subscriptions";

export function Paywall({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center space-y-6 rounded-2xl border border-border/50 bg-card p-10 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Members only
        </p>
        <h1 className="tricho-title text-3xl">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">
          {body} Included with membership at £{flagshipTier.price}/month.
        </p>
        <Button asChild className="rounded-2xl h-11 px-8">
          <Link href="/join">Become a member</Link>
        </Button>
      </div>
    </div>
  );
}
