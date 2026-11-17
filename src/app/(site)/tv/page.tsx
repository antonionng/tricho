import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mic, PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Pill, Section, SectionHeader } from "@/components/site/primitives";
import { PageHero } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { images, img } from "@/content/images";
import { listRecordings, liveSessionWhen, nextLiveSession, RECORDING_KIND_LABEL, recordingDate, recordingImage } from "@/lib/recordings";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Trichollective TV: masterclass and case round recordings",
  description:
    "Trichollective TV: recordings of the live masterclasses and case rounds, for members, and the podcast. See what each session covered and watch on the platform.",
  path: "/tv",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Trichollective TV", path: "/tv" },
];

export default async function TvPage() {
  const [recordings, next] = await Promise.all([listRecordings(24), nextLiveSession()]);
  return (
    <>
      <PageHero
        eyebrow="Trichollective TV"
        title="Every live masterclass and case round,"
        fade="recorded for the members who could not be there."
        lede={
          <p>
            Members meet online every month for a specialist masterclass and a case round. The recordings stay on Trichollective TV
            afterwards, so a session you missed is still there when you have an hour. Pick one below to see what it covered.
          </p>
        }
        crumbs={crumbs}
      />

      <Section>
        <Container>
          <div className="mb-10">
            <SectionHeader eyebrow="Recordings" title="Watch again." body="Newest first. Each one plays on the event page in the members' area." />
          </div>
          {recordings.length === 0 ? (
            <p className="text-ink-2">The first recordings will appear here shortly after each live session.</p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recordings.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/events/${r.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-3xl border border-rule bg-card p-6 transition-colors hover:border-ink"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink text-paper">
                      <Image
                        src={img(images[recordingImage(r.kind)], 900)}
                        alt={images[recordingImage(r.kind)].alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                        className="mag-bw object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <PlayCircle className="h-12 w-12 stroke-[1.25] drop-shadow transition-transform group-hover:scale-105" aria-hidden />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Pill>{RECORDING_KIND_LABEL[r.kind] ?? "Session"}</Pill>
                      <Pill tone="ink">Recording</Pill>
                    </div>
                    <h2 className="text-xl font-semibold leading-snug tracking-tight">{r.title}</h2>
                    <p className="text-[14px] text-muted-foreground">
                      {recordingDate(r.startsAt)}
                      {r.presenters ? `, with ${r.presenters}` : ""}
                    </p>
                    <p className="line-clamp-3 text-[15px] leading-relaxed text-ink-2">{r.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-medium">
                      What it covered <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {next && (
        <Section tone="paper-2">
          <Container>
            <div className="grid gap-8 rounded-3xl border border-rule bg-card p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
              <div className="flex flex-col gap-3 lg:col-span-8">
                <p className="label text-muted-foreground">Next live session</p>
                <h2 className="display text-3xl md:text-4xl">{next.title}</h2>
                <p className="flex flex-wrap items-center gap-x-3 text-[15px] text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="h-4 w-4" aria-hidden /> {RECORDING_KIND_LABEL[next.kind] ?? "Live session"}, online
                  </span>
                  <span>{liveSessionWhen(next.startsAt)} UK time</span>
                  {next.presenters && <span>With {next.presenters}</span>}
                </p>
                <p className="max-w-2xl leading-relaxed text-ink-2">{next.summary}</p>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-4">
                <Button asChild size="lg">
                  <Link href={`/events/${next.slug}`}>
                    See the session <ArrowRight />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">Members join live for free, and the recording lands here afterwards.</p>
              </div>
            </div>
          </Container>
        </Section>
      )}

      <Section>
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-2 lg:col-span-5">
              <Image src={img(images.community, 1100)} alt={images.community.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="mag-bw object-cover" />
            </div>
            <div className="flex flex-col gap-5 lg:col-span-7">
              <p className="label text-muted-foreground">The podcast</p>
              <h2 className="display text-4xl md:text-5xl">
                Conversations from the community,
                <br />
                <span className="text-fade">to listen to between sessions.</span>
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-ink-2">
                Members and specialists talk about the work: the cases, the clinics and the questions that come up in practice. Every episode is
                free to listen to.
              </p>
              <div>
                <Button asChild size="lg" variant="outline">
                  <Link href="/podcast">
                    <Mic /> Listen to the podcast <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="flex flex-col gap-5 lg:col-span-8">
              <p className="label text-paper/60">Membership</p>
              <h2 className="display text-4xl md:text-5xl">
                The recordings are part of membership,
                <br />
                <span className="opacity-60">together with the live sessions they come from.</span>
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-paper/80">
                Join and the recordings play on the platform straight away, alongside the monthly masterclass and case round, the community
                and your place in the directory.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button asChild size="lg" variant="paper">
                <Link href="/pricing">
                  Become a member to watch <ArrowRight />
                </Link>
              </Button>
              <Link href={`/login?next=${encodeURIComponent("/members/events")}`} className="text-sm text-paper/70 underline underline-offset-4">
                Already a member? Sign in to watch.
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <SignupPanel
            eyebrow="Next time"
            title="Hear about the next live session first."
            body="Members are told about every masterclass and case round before anyone else. Leave your email and we'll keep you posted too."
            source="tv"
          />
        </Container>
      </Section>

      <JsonLd data={[breadcrumbLd(crumbs)]} />
    </>
  );
}
