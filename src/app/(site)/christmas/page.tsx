import Image from "next/image";
import Link from "next/link";
import { Container, Section } from "@/components/site/primitives";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { AdventCalendar } from "@/components/advent/AdventCalendar";
import { Countdown } from "@/components/advent/Countdown";
import { Snow } from "@/components/advent/Snow";
import { images, img } from "@/content/images";
import { ADVENT_DAYS, ADVENT_NAME } from "@/content/advent";
import { doorDate, doorDateLabel, openDoorCount, publicDoors } from "@/lib/advent";
import { claimedDoors } from "@/lib/advent-server";
import { getMemberContext } from "@/lib/member";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "12 Days of Christmas: a gift a day for hair and scalp professionals",
  description:
    "From 12 to 23 December, Trichollective opens one door a day with an offer from a brand we trust, something to learn or a little help for the year ahead.",
  path: "/christmas",
  og: { title: "12 Days of Christmas,", sub: "a gift a day from 12 December.", eyebrow: "Trichollective", img: images.headSpa.src, variant: "photo" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: ADVENT_NAME, path: "/christmas" },
];

const STEPS = [
  { n: "1", title: "Open the door", body: "A new door opens every morning at midnight UK time, and every door you have opened stays open." },
  { n: "2", title: "Claim your gift", body: "Sign in or create a free account, press Claim and your code appears straight away." },
  { n: "3", title: "Use it with the brand", body: "We email you a copy of the code and how to use it, so it is there when you are ready." },
];

export default async function ChristmasPage({ searchParams }: { searchParams: Promise<{ day?: string; door?: string; utm_source?: string }> }) {
  const [params, ctx] = await Promise.all([searchParams, getMemberContext()]);
  const userId = ctx.session?.user?.id ?? null;

  // Staff (and local development) can look ahead with ?day=N to check a door before it opens.
  const canPreview = ctx.isAdmin || process.env.NODE_ENV !== "production";
  const preview = canPreview && params.day ? Math.max(0, Math.min(ADVENT_DAYS, Number.parseInt(params.day, 10) || 0)) : null;
  const openCount = preview ?? openDoorCount();
  const doors = publicDoors(openCount, await claimedDoors(userId));

  const first = doorDateLabel(1, "long");
  const last = doorDateLabel(ADVENT_DAYS, "long");
  const before = openCount === 0;
  const finished = openCount >= ADVENT_DAYS;
  // December is GMT, so midnight in the UK is midnight UTC.
  const nextOpens = finished ? null : `${doorDate(openCount + 1)}T00:00:00Z`;
  const initialDoor = Number.parseInt(params.door ?? "", 10) || null;
  const source = (params.utm_source ?? "").slice(0, 40) || (initialDoor ? "link" : "site");

  return (
    <>
      <section className="advent-scene">
        <Snow className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
        <Container>
          <div className="grid gap-10 pb-12 pt-16 md:pt-24 lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <p className="label text-[color:var(--gold-2)]">Trichollective · {ADVENT_NAME}</p>
              <h1 className="display text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
                Twelve days of gifts
                <br />
                <span className="advent-gold">for the people who look after hair and scalps.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-paper/80">
                One door opens every morning from {first} to {last}. Behind each one is an offer from a brand we trust, something to learn or a
                little help for the year ahead, and every gift is free to claim with a Trichollective account.
              </p>
              {preview !== null && (
                <p className="inline-flex w-fit rounded-full border border-[color:var(--gold)]/50 px-4 py-2 text-sm text-[color:var(--gold-2)]">
                  Staff preview: this is the calendar as it will look on day {preview}.
                </p>
              )}
            </div>
            <div className="lg:col-span-4 lg:justify-self-end">
              {nextOpens ? (
                <Countdown until={nextOpens} label={before ? "The first door opens in" : "The next door opens in"} />
              ) : (
                <p className="label text-[color:var(--gold-2)]">Every door is open until the new year.</p>
              )}
            </div>
          </div>

          <div className="pb-20 md:pb-28">
            <AdventCalendar doors={doors} signedIn={!!userId} initialDoor={initialDoor} source={source} />
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="mb-10 flex flex-col gap-3">
            <p className="label text-muted-foreground">How it works</p>
            <h2 className="display text-4xl md:text-5xl">Claiming a gift takes less than a minute.</h2>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col gap-3 rounded-3xl border border-rule bg-card p-6 sm:p-7">
                <span className="display text-5xl text-mute">{s.n}</span>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
          {!userId && (
            <p className="mt-8 text-[15px] text-ink-2">
              <Link href={`/signup?next=${encodeURIComponent("/christmas")}`} className="font-medium text-ink underline underline-offset-4">
                Create your free account
              </Link>{" "}
              now, so you are ready when the first door opens.
            </p>
          )}
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-3 lg:col-span-5">
              <Image src={img(images.headSpa, 1100)} alt={images.headSpa.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="mag-bw object-cover" />
            </div>
            <div className="lg:col-span-7">
              <SignupPanel
                eyebrow="Every morning"
                title="Get each gift in your inbox the morning it opens."
                body="We will email you once a day from 12 to 23 December with that morning's door, then go back to one email a month at most."
                source="christmas"
                cta="Send me the gifts"
                note="Unsubscribe at any time. We never share your email."
              />
            </div>
          </div>
        </Container>
      </Section>

      <JsonLd data={[breadcrumbLd(crumbs)]} />
    </>
  );
}
