import type { Edition, Page } from "@/content/gazette/types";
import { BroughtBy } from "./Partners";
import { SeasonOverlay } from "./Season";

const RED = "#9b1b2a";

/** In a Christmas edition, the letter, the interactive pages and the closing page wear Christmas red. */
export function isFestive(edition: Edition, page: Page) {
  return edition.season === "christmas" && (page.kind === "letter" || page.kind === "interactive" || page.kind === "cta");
}

/** A fine red rule with a star between two diamonds. */
export function ChristmasRule() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-3 bg-[#fbfaf7] px-5 pt-16">
      <span className="h-px w-full max-w-[220px]" style={{ background: RED }} />
      <svg viewBox="0 0 64 24" className="h-6 w-16 shrink-0" fill="none" stroke={RED} strokeWidth="1.2">
        <path d="M6 12l4-8 4 8-4 8zM50 12l4-8 4 8-4 8zM32 2l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" />
      </svg>
      <span className="h-px w-full max-w-[220px]" style={{ background: RED }} />
    </div>
  );
}

/** A red, snowy greetings band, with the wordmark and the edition's supporter. */
export function ChristmasBand({ edition }: { edition: Edition }) {
  return (
    <section className="relative overflow-hidden px-5 py-20 text-center text-white sm:py-24" style={{ background: RED }}>
      <SeasonOverlay season="christmas" />
      <div className="relative mx-auto max-w-3xl">
        <p className="mag-caps text-[10px] text-white/75">The Christmas edition</p>
        <p className="mag-didone mt-4 text-[clamp(34px,6vw,64px)] italic leading-[1.05]">Happy Christmas from all of us</p>
        <p className="mt-6 text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-none tracking-[-0.06em]">
          <span className="text-white">Tricho</span>
          <span className="text-white/55">llective.</span>
        </p>
        {edition.supportedBy && (
          <div className="mt-10 flex justify-center [&_a]:items-center">
            <BroughtBy by={edition.supportedBy} light />
          </div>
        )}
      </div>
    </section>
  );
}
