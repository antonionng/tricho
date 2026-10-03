import Link from "next/link";
import { X } from "lucide-react";
import type { BusinessSeat } from "@prisma/client";
import { Card, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shortDate } from "@/components/members/format";
import { BUSINESS_SEATS } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { addSeat, removeSeat } from "./actions";

/** The five Professional seats, shared by the portal page and the setup's team step. */
export function TeamSeats({
  seats,
  business,
  returnTo,
}: {
  seats: BusinessSeat[];
  business: boolean;
  returnTo?: "setup";
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-[15px] leading-relaxed text-ink-2">
        Give up to {BUSINESS_SEATS} people on your team Professional membership, paid for by your plan. They sign in with the
        email you add here.
      </p>
      {!business && (
        <p className="mt-3 text-sm text-destructive">
          Seats only work while your Business plan is active.{" "}
          <Link href="/members/billing" className="underline underline-offset-4">
            Check your plan
          </Link>
          .
        </p>
      )}

      {seats.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-rule rounded-xl border border-rule">
          {seats.map((seat) => (
            <li key={seat.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px]">{seat.email}</p>
                <p className="text-xs text-muted-foreground">Added {shortDate(seat.createdAt)}</p>
              </div>
              <form action={removeSeat}>
                <input type="hidden" name="id" value={seat.id} />
                {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-rule px-3 text-sm hover:border-ink/40"
                  aria-label={`Remove ${seat.email}`}
                >
                  <X className="h-4 w-4" /> Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {seats.length < BUSINESS_SEATS && (
        <form action={addSeat} className="mt-5 flex flex-col gap-2 sm:flex-row">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <input
            type="email"
            name="email"
            required
            maxLength={160}
            placeholder="colleague@yourbusiness.com"
            aria-label="Team member's email"
            className={cn(fieldClass, "h-12 flex-1")}
          />
          <SubmitButton pending="Adding…">Add to my team</SubmitButton>
        </form>
      )}
    </Card>
  );
}
