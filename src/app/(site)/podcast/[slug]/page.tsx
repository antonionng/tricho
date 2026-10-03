import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Container, Section } from "@/components/site/primitives";
import { PageHero } from "@/components/editorial/PageHero";
import { EpisodePlayer } from "@/components/podcast/EpisodePlayer";
import { getMemberContext } from "@/lib/member";
import { episodeImage, isoDuration, publishedEpisode } from "@/lib/podcast";
import { formatDuration, keyMomentsOf, parseTimestamp, transcriptParagraphs } from "@/lib/podcast-feed";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { shortName } from "@/lib/names";

/** Non-members see this many transcript paragraphs before the invitation to join. */
const PREVIEW_PARAGRAPHS = 3;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await publishedEpisode((await params).slug);
  if (!e) return {};
  const cover = episodeImage(e.coverImageKey);
  return pageMetadata({
    title: `${e.title.replace(/[,.]$/, "")}: the ${site.name} podcast`,
    description: e.summary || `A conversation from the ${site.name} podcast${e.guestName ? ` with ${e.guestName}` : ""}.`,
    path: `/podcast/${e.slug}`,
    og: {
      title: e.title,
      sub: e.fade || undefined,
      eyebrow: e.number ? `Podcast, episode ${e.number}` : "Podcast",
      img: cover.src,
      variant: "photo",
    },
    type: "article",
    published: e.publishedAt?.toISOString(),
  });
}

/** Paragraphs of plain text; lines starting "## " become subheadings. */
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-5 text-[17px] leading-[1.7] text-ink-2">
      {transcriptParagraphs(text).map((p, i) =>
        p.startsWith("## ") ? (
          <h3 key={i} className="display pt-4 text-2xl text-ink">
            {p.slice(3)}
          </h3>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        )
      )}
    </div>
  );
}

/** One transcript paragraph, with its leading [mm:ss] marker shown as a timestamp anchor. */
function TranscriptParagraph({ text }: { text: string }) {
  const m = /^\[((?:\d+:)?\d{1,3}:\d{2})\]\s*/.exec(text);
  const t = m ? parseTimestamp(m[1]) : null;
  const body = m ? text.slice(m[0].length) : text;
  const speaker = /^([^:\n]{1,40}):\s/.exec(body);
  return (
    <p id={t !== null ? `t-${t}` : undefined} className="scroll-mt-24 text-[16px] leading-[1.7] text-ink-2">
      {m && <span className="mr-3 text-[13px] tabular-nums text-muted-foreground">{m[1]}</span>}
      {speaker ? (
        <>
          <span className="font-medium text-ink">{speaker[1]}:</span> {body.slice(speaker[0].length)}
        </>
      ) : (
        body
      )}
    </p>
  );
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const episode = await publishedEpisode(slug);
  if (!episode) notFound();

  const ctx = await getMemberContext();
  const member = ctx.allowed;
  const cover = episodeImage(episode.coverImageKey);
  const moments = keyMomentsOf(episode.keyMoments);
  const paragraphs = transcriptParagraphs(episode.transcript);
  const locked = episode.membersOnly && !member;
  // Members-only transcript paragraphs never leave the server for non-members.
  const visible = locked ? paragraphs.slice(0, PREVIEW_PARAGRAPHS) : paragraphs;
  const path = `/podcast/${episode.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Podcast", path: "/podcast" },
    { name: episode.title.replace(/[,.]$/, ""), path },
  ];
  const meta = [
    episode.number ? `Episode ${episode.number}` : null,
    formatDuration(episode.durationSec),
    episode.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }),
  ].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={episode.guestName ? `The podcast, with ${episode.guestName}` : "The podcast"}
        title={episode.title}
        fade={episode.fade || undefined}
        lede={episode.summary ? <p>{episode.summary}</p> : undefined}
        image={cover}
        imageClassName="mag-bw object-top"
        crumbs={crumbs}
      >
        {meta.length > 0 && <p className="label text-muted-foreground">{meta.join(" · ")}</p>}
      </PageHero>

      <Section>
        <Container size="narrow" className="space-y-16">
          <EpisodePlayer
            title={episode.title}
            audioUrl={episode.audioUrl}
            embedUrl={episode.embedUrl}
            moments={moments}
            transcriptAnchors={!locked && paragraphs.length > 0}
          />

          {episode.showNotes.trim() && (
            <section className="space-y-6">
              <h2 className="display text-3xl sm:text-4xl">Show notes</h2>
              <Prose text={episode.showNotes} />
            </section>
          )}

          {episode.quotes.length > 0 && (
            <section aria-label="From the conversation" className="space-y-8 border-y border-rule py-12">
              {episode.quotes.map((q) => (
                <blockquote key={q} className="display text-2xl leading-snug sm:text-3xl">
                  <p>&ldquo;{q}&rdquo;</p>
                </blockquote>
              ))}
            </section>
          )}

          {episode.guestName && (
            <section className="space-y-4">
              <h2 className="display text-3xl sm:text-4xl">About the guest</h2>
              <p className="text-[17px] font-medium text-ink">
                {episode.guestName}
                {episode.guestRole && <span className="font-normal text-ink-2">, {episode.guestRole}</span>}
              </p>
              {episode.guestBio && <Prose text={episode.guestBio} />}
              {episode.guestUserId && member && (
                <Link
                  href={`/members/people/${episode.guestUserId}`}
                  className="inline-flex items-center gap-2 text-[15px] text-ink underline underline-offset-4"
                >
                  See {shortName(episode.guestName, "the guest")}&apos;s member profile <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </section>
          )}

          {paragraphs.length > 0 && (
            <section id="transcript" className="scroll-mt-20 space-y-6">
              <h2 className="display text-3xl sm:text-4xl">Transcript</h2>
              <div className="space-y-5">
                {visible.map((p, i) => (
                  <TranscriptParagraph key={i} text={p} />
                ))}
              </div>
              {locked && paragraphs.length > visible.length && (
                <div className="relative">
                  <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-paper" />
                  <div className="space-y-5 rounded-3xl border border-rule bg-card p-7 sm:p-10">
                    <p className="label flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" aria-hidden /> Members only
                    </p>
                    <h3 className="display text-3xl">Members can read the full transcript of every episode.</h3>
                    <p className="text-[16px] leading-relaxed text-ink-2">
                      Membership gives you every transcript, so you can read instead of listen and find a moment again quickly,
                      alongside Trichozette and the community of practitioners behind the podcast.
                    </p>
                    <div className="flex flex-wrap items-center gap-6">
                      <Link
                        href="/founding"
                        className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-paper transition-opacity hover:opacity-90"
                      >
                        Become a founding member <ArrowRight className="h-4 w-4" />
                      </Link>
                      {!ctx.session && (
                        <Link href={`/login?next=${encodeURIComponent(path)}`} className="text-[15px] underline underline-offset-4">
                          Sign in
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          <p className="border-t border-rule pt-8 text-[15px] leading-relaxed text-ink-2">
            Our guests share their own experience. Nothing on the podcast is medical advice, and if you are worried about your hair
            or scalp, please speak to your GP or a qualified practitioner.
          </p>

          <Link href="/podcast" className="inline-flex items-center gap-2 text-[15px] text-ink underline underline-offset-4">
            All episodes <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </Section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "PodcastEpisode",
            name: [episode.title.replace(/[,.]$/, ""), episode.fade].filter(Boolean).join(", "),
            description: episode.summary,
            url: absoluteUrl(path),
            ...(episode.publishedAt ? { datePublished: episode.publishedAt.toISOString() } : {}),
            ...(episode.number ? { episodeNumber: episode.number } : {}),
            ...(isoDuration(episode.durationSec) ? { timeRequired: isoDuration(episode.durationSec) } : {}),
            image: cover.src,
            ...(episode.audioUrl
              ? { associatedMedia: { "@type": "MediaObject", contentUrl: episode.audioUrl, encodingFormat: "audio/mpeg" } }
              : {}),
            ...(episode.guestName ? { actor: { "@type": "Person", name: episode.guestName } } : {}),
            partOfSeries: { "@type": "PodcastSeries", name: `The ${site.name} podcast`, url: absoluteUrl("/podcast") },
            isAccessibleForFree: !episode.membersOnly,
            ...(episode.membersOnly && paragraphs.length
              ? { hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: "#transcript" } }
              : {}),
          },
          breadcrumbLd(crumbs),
        ]}
      />
    </>
  );
}
