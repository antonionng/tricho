import Link from "next/link";
import { gazetteFonts } from "@/components/gazette/fonts";

export const metadata = { title: "Advent prize draw terms" };

/** DRAFT for Antonio and Karley to approve before 12 December 2026. */
export default function AdventTermsPage() {
  return (
    <div className={`mag bg-paper ${gazetteFonts}`}>
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10 text-[15px] leading-relaxed text-ink-2 sm:px-8 sm:pt-16">
        <Link href="/trichozette/ready-for-2027#advent" className="label">
          &larr; Back to the advent
        </Link>
        <h1 className="mag-didone mt-8 text-[40px] leading-[1.08] text-ink">Advent prize draw terms</h1>
        <ol className="mt-6 list-decimal space-y-3 pl-5">
          <li>The promoter is Trichollective (trichollective.net).</li>
          <li>The prize is one year of Trichollective Professional membership, or a year added to the winner&apos;s current membership. There is one prize and no cash alternative.</li>
          <li>The draw is open to anyone aged 18 or over with a Trichollective account, living in the UK or Ireland, except the Trichollective team and their families.</li>
          <li>To enter, open door 12 of the Trichozette advent and press &ldquo;Enter the draw&rdquo; between 00:00 UK time on 12 December 2026 and 23:59 UK time on 18 December 2026. No purchase is necessary. One entry per person.</li>
          <li>The winner is chosen at random from all valid entries on 19 December 2026 and told by email by 21 December 2026. If they don&apos;t reply within 14 days, another winner may be drawn.</li>
          <li>We use entrants&apos; details only to run the draw and contact the winner. We may share the winner&apos;s first name and town on request.</li>
          <li>These terms are governed by the law of England and Wales.</li>
        </ol>
      </div>
    </div>
  );
}
