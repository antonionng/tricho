"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = {
  signedIn: boolean;
  member: boolean;
  open: boolean;
  amountPence: number;
  priceType: "member" | "guest" | "free";
  enrolled: boolean;
};

const pounds = (pence: number) => `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}`;

/**
 * The enrol button on a course page. It asks the server what this visitor
 * would pay, so members see the member price and anyone already enrolled goes
 * straight to the course.
 */
export function EnrolButton({ slug, memberPriceGBP, priceGBP }: { slug: string; memberPriceGBP: number; priceGBP: number }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCancelled(new URLSearchParams(window.location.search).get("checkout") === "cancelled");
    fetch(`/api/courses/${slug}/checkout`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setState)
      .catch(() => setFailed(true));
  }, [slug]);

  async function enrol() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}/checkout`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "We could not start the payment. Please try again in a moment.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (failed) {
    return (
      <p className="rounded-xl bg-paper-2 px-4 py-3 text-[14px] leading-relaxed">
        We couldn&apos;t load enrolment just now. Please refresh the page in a moment, or write to us if it keeps happening.
      </p>
    );
  }

  if (!state) {
    return <div className="h-11 w-full animate-pulse rounded-full bg-paper-2" aria-label="Loading" />;
  }

  if (state.enrolled) {
    return (
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/members/courses/${slug}`}>
            Go to your course <ArrowRight />
          </Link>
        </Button>
        <p className="text-[13px] text-muted-foreground">You have a place on this course. Pick up where you left off.</p>
      </div>
    );
  }

  if (!state.signedIn) {
    const next = encodeURIComponent(`/courses/${slug}#enrol`);
    return (
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/login?next=${next}`}>
            Sign in to enrol <ArrowRight />
          </Link>
        </Button>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Your place, progress and certificate are kept in your account. If you don&apos;t have one yet, signing in with your email creates it.{" "}
          {memberPriceGBP < priceGBP && (
            <>
              Members pay {memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`}.{" "}
              <Link href="/pricing" className="underline underline-offset-4">
                See membership
              </Link>
              .
            </>
          )}
        </p>
      </div>
    );
  }

  const label = state.amountPence === 0 ? "Enrol for free" : `Enrol for ${pounds(state.amountPence)}`;
  return (
    <div className="flex flex-col gap-3">
      {cancelled && <p className="rounded-xl bg-paper-2 px-4 py-3 text-[14px]">Your payment wasn&apos;t completed, so nothing has been charged. You can try again whenever you&apos;re ready.</p>}
      <Button type="button" size="lg" className="w-full" onClick={enrol} disabled={busy} aria-busy={busy}>
        {busy ? "Just a moment…" : label} {!busy && <ArrowRight />}
      </Button>
      {error && <p className="text-[14px] text-destructive">{error}</p>}
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {state.priceType === "free"
          ? "Included with your membership. Your place starts straight away."
          : state.member
            ? "You're paying the member price. Pay securely with Stripe, and your place starts straight away."
            : (
              <>
                Pay securely with Stripe, and your place starts straight away.{" "}
                {memberPriceGBP < priceGBP && (
                  <>
                    Members pay {memberPriceGBP === 0 ? "nothing" : `£${memberPriceGBP}`}.{" "}
                    <Link href="/pricing" className="underline underline-offset-4">
                      See membership
                    </Link>
                    .
                  </>
                )}
              </>
            )}
      </p>
    </div>
  );
}
