"use client";

import { useActionState } from "react";
import Link from "next/link";
import { claimAdventGift, type ClaimState } from "./actions";

const RED = "#9b1b2a";
const field = "mt-1 h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-[15px] outline-none focus:border-black";

export function ClaimForm({ day }: { day: number }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimAdventGift, {});

  if (state.ok) {
    return (
      <div className="mt-8 rounded-[18px] bg-white p-7">
        <p className="label" style={{ color: RED }}>
          {day === 12 ? "You're in the draw" : "Claimed"}
        </p>
        <p className="mag-didone mt-2 text-[28px] leading-tight text-ink">
          {day === 12 ? "Good luck. We draw on 19 December." : "Thank you. We'll be in touch within two working days."}
        </p>
        <p className="mt-3 text-[15px] text-ink-2">We&apos;ve emailed you a confirmation.</p>
        <Link href="/trichozette/ready-for-2027#advent" className="mt-5 inline-block text-[14px] underline underline-offset-4">
          Back to the advent
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 rounded-[18px] bg-white p-7">
      <input type="hidden" name="day" value={day} />
      {day === 7 && (
        <>
          <label className="block text-[14px] text-ink">
            Your colleague&apos;s name
            <input name="colleague" required className={field} autoComplete="off" />
          </label>
          <label className="mt-4 block text-[14px] text-ink">
            Their email
            <input name="colleagueEmail" type="email" required className={field} autoComplete="off" />
          </label>
        </>
      )}
      {day === 10 && (
        <label className="block text-[14px] text-ink">
          Your clinic or salon
          <input name="business" required className={field} autoComplete="organization" />
        </label>
      )}
      {day !== 12 && (
        <label className="mt-4 block text-[14px] text-ink">
          Anything we should know <span className="text-ink-2">(optional)</span>
          <textarea name="note" rows={3} className="mt-1 w-full rounded-xl border border-black/15 bg-white p-3 text-[15px] outline-none focus:border-black" />
        </label>
      )}
      {day === 12 && (
        <p className="text-[15px] leading-relaxed text-ink-2">
          One entry per member. By entering you agree to the{" "}
          <Link href="/advent/terms" className="underline">
            prize draw terms
          </Link>
          .
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-4 text-[14px]" style={{ color: RED }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="mt-6 rounded-full px-6 py-3 text-[15px] font-semibold text-white disabled:opacity-60" style={{ background: RED }}>
        {pending ? "Sending…" : day === 12 ? "Enter the draw" : "Claim my gift"} &rarr;
      </button>
    </form>
  );
}
