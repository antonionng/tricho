import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { Avatar } from "@/components/members/Avatar";
import { Card, fieldClass } from "@/components/members/MemberPage";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shortDate } from "@/components/members/format";
import { BUSINESS_SEATS } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import type { SeatWithPhoto } from "@/lib/business-team";
import { addSeat, removeSeat, saveSeatProfile } from "./actions";

/** The five Professional seats, shared by the portal page and the setup's team step. */
export function TeamSeats({
  seats,
  business,
  returnTo,
}: {
  seats: SeatWithPhoto[];
  business: boolean;
  returnTo?: "setup";
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-[15px] leading-relaxed text-ink-2">
        Give up to {BUSINESS_SEATS} people on your team Professional membership, paid for by your plan. They sign in with the
        email you add here. Add a name, role and photo to introduce them in &ldquo;Meet the team&rdquo; on your business page.
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
            <li key={seat.id}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={seat.name || seat.email} src={seat.photoUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{seat.name || seat.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {seat.name ? `${seat.role ? `${seat.role} · ` : ""}${seat.email}` : `Added ${shortDate(seat.createdAt)}`}
                    </p>
                  </div>
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
              </div>
              <details className="group border-t border-rule/60 px-4 pb-1">
                <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                  {seat.name ? "Edit how they appear on your page" : "Introduce them on your page"}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <form action={saveSeatProfile} className="flex flex-col gap-4 pb-4 pt-1">
                  <input type="hidden" name="id" value={seat.id} />
                  {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
                  <ImageUpload
                    name="photo"
                    currentUrl={seat.photoUrl}
                    shape="circle"
                    label={seat.photoUrl ? "Change photo" : "Add a photo"}
                    hint="A clear head-and-shoulders photo works best. JPG, PNG or WebP, up to 8MB."
                    removeName="removePhoto"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium">Name</span>
                      <input name="name" maxLength={80} defaultValue={seat.name ?? ""} placeholder="Their full name" className={cn(fieldClass, "h-11")} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium">Role</span>
                      <input name="role" maxLength={80} defaultValue={seat.role ?? ""} placeholder="For example, Senior trichologist" className={cn(fieldClass, "h-11")} />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">About them</span>
                    <textarea
                      name="bio"
                      rows={3}
                      maxLength={600}
                      defaultValue={seat.bio ?? ""}
                      placeholder="Two or three sentences on their training, what they specialise in and who they help."
                      className={cn(fieldClass, "py-3")}
                    />
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" name="showOnPage" defaultChecked={seat.showOnPage} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
                    <span className="text-[15px]">Show them in &ldquo;Meet the team&rdquo; on our business page.</span>
                  </label>
                  <SubmitButton pending="Saving…" className="self-start">
                    Save their details
                  </SubmitButton>
                </form>
              </details>
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
