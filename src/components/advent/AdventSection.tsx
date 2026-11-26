"use client";

import Link from "next/link";
import type { Page } from "@/content/gazette";
import { Rise } from "@/components/gazette/Parallax";
import { AdventCalendar } from "./AdventCalendar";
import { Countdown } from "./Countdown";
import { Snow } from "./Snow";

const STEPS = [
  { n: "1", title: "Open the door", body: "A new door opens every morning at midnight UK time, and every door you have opened stays open." },
  { n: "2", title: "Claim your gift", body: "Sign in or create a free account, press Claim and your code appears straight away." },
  { n: "3", title: "Use it with the brand", body: "We email you a copy of the code and how to use it, so it is there when you are ready." },
];

/** The 12 Days of Christmas inside a Trichozette edition: a night scene, a countdown and the doors. */
export function AdventSection({ page, index, slug }: { page: Extract<Page, { kind: "advent" }>; index: number; slug: string }) {
  const live = page.live;
  const basePath = `/trichozette/${slug}`;
  return (
    <section id={`feature-${index}`} className="advent-scene scroll-mt-14 px-5 py-24 sm:px-10 md:py-32">
      {/* The anchor the daily emails and social posts link to. */}
      <span id="12-days" className="absolute -top-14" aria-hidden />
      <Snow className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <Rise className="flex flex-col gap-6 lg:col-span-8">
            <p className="mag-caps text-[10px] text-paper/70">{page.kicker}</p>
            <h2 className="mag-didone text-[46px] font-medium leading-[0.95] tracking-[-0.02em] sm:text-[72px]">
              {page.title}
            </h2>
            <p className="mag-serif max-w-2xl text-[19px] leading-[1.55] text-paper/80">{page.intro}</p>
            {live?.preview != null && (
              <p className="inline-flex w-fit border border-paper/50 px-4 py-2 text-sm text-paper">
                Staff preview: this is the calendar as it will look on day {live.preview}.
              </p>
            )}
          </Rise>
          {live && (
            <div className="lg:col-span-4 lg:justify-self-end">
              {live.nextOpens ? (
                <Countdown until={live.nextOpens} label={live.openCount === 0 ? "The first door opens in" : "The next door opens in"} />
              ) : (
                <p className="mag-caps text-[10px] text-[color:var(--gold-2)]">Every door is open until the new year.</p>
              )}
            </div>
          )}
        </div>

        {live && (
          <div className="mt-14">
            <AdventCalendar doors={live.doors} signedIn={live.signedIn} initialDoor={live.initialDoor} source={live.source} basePath={basePath} />
          </div>
        )}

        <ol className="mt-16 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex flex-col gap-3 border-t border-paper/40 pt-6">
              <span className="mag-didone text-[44px] italic leading-none text-paper">{s.n}</span>
              <h3 className="mag-didone text-[24px] leading-tight text-paper">{s.title}</h3>
              <p className="mag-serif text-[16px] leading-[1.55] text-paper/75">{s.body}</p>
            </li>
          ))}
        </ol>
        {live && !live.signedIn && (
          <p className="mt-8 text-[15px] text-paper/75">
            <Link href={`/signup?next=${encodeURIComponent(basePath)}`} className="font-medium text-[color:var(--gold-2)] underline underline-offset-4">
              Create your free account
            </Link>{" "}
            now, so you are ready when the first door opens.
          </p>
        )}
      </div>
    </section>
  );
}
