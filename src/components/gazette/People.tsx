"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Page, Person } from "@/content/gazette";
import { Kicker } from "./Prose";
import { Rise } from "./Parallax";

export function initials(name: string) {
  const words = name.replace(/^(Dr|Prof(essor)?)\.?\s+/i, "").replace(/[“”"].*?[“”"]\s*/g, "").split(/\s+/);
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function Card({ person, n }: { person: Person; n: number }) {
  return (
    <article className="flex h-full gap-5 border-t border-black py-7 sm:gap-6">
      <div aria-hidden className="mag-didone grid h-16 w-16 shrink-0 place-items-center rounded-full border border-black text-[24px] italic sm:h-20 sm:w-20 sm:text-[30px]">
        {initials(person.name)}
      </div>
      <div className="min-w-0">
        <p className="mag-caps text-[9px] text-black/50">
          {String(n).padStart(2, "0")}
          {person.place ? ` · ${person.place}` : ""}
        </p>
        <h3 className="mag-didone mt-2 text-[30px] leading-[1.02] sm:text-[34px]">{person.name}</h3>
        <p className="mag-serif mt-1.5 text-[15px] italic leading-snug text-black/70">
          {person.role}
          {person.org ? `, ${person.org}` : ""}
        </p>
        {person.highlight && <p className="mag-caps mt-3 inline-block bg-black px-2 py-1 text-[8.5px] text-white">{person.highlight}</p>}
        <p className="mag-serif mt-4 text-[16.5px] leading-[1.6] text-black/85">{person.note}</p>
        {person.href && (
          <Link href={person.href} className="mag-caps mt-4 inline-flex items-center gap-1.5 text-[9px] underline underline-offset-4">
            Visit their page <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  );
}

/** Speakers and contributors: monograms until headshots arrive, so nobody's photograph is guessed. */
export function People({ page, index }: { page: Extract<Page, { kind: "people" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Rise className="max-w-4xl">
          <Kicker>{page.kicker}</Kicker>
          <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[80px]">{page.title}</h2>
          <p className="mag-didone mt-6 text-[22px] italic leading-[1.3] text-black/75">{page.intro}</p>
        </Rise>
        <div className="mt-14 grid gap-x-14 border-b border-black md:grid-cols-2">
          {page.people.map((p, i) => (
            <Rise key={p.name} delay={(i % 2) * 80}>
              <Card person={p} n={i + 1} />
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
