import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, MessagesSquare } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall, ProfessionalUpsell } from "@/components/members/Paywall";
import { MemberPage, SectionLabel } from "@/components/members/MemberPage";
import { longDate } from "@/components/members/format";
import { TvCard } from "@/components/tv/TvCard";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { publishedTv } from "@/lib/tv-data";
import { TV_KIND_LABEL, TV_SHELF_LABEL, formatMinutes, tvEmbedUrl } from "@/lib/tv";

export const metadata = { title: "Trichollective TV" };

export default async function TvVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect(`/login?next=/members/tv/${slug}`);
  if (!ctx.allowed) {
    return <Paywall title="Trichollective TV" body="Recordings of every masterclass and case round, filmed podcasts and new videos are part of membership." />;
  }

  const video = await prisma.tvVideo.findFirst({
    where: { slug, published: true },
    include: {
      event: { select: { slug: true, title: true, published: true } },
      podcastEpisode: { select: { slug: true, status: true, transcriptStatus: true } },
      post: { select: { id: true, hiddenAt: true, _count: { select: { comments: { where: { hiddenAt: null } } } } } },
    },
  });
  if (!video) notFound();

  const back = (
    <Link href="/members/tv" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Trichollective TV
    </Link>
  );

  if (video.professionalOnly && !ctx.professional) {
    return (
      <MemberPage size="narrow">
        {back}
        <div className="mt-4">
          <ProfessionalUpsell
            title={`${video.title} is for Professional members.`}
            body="Case rounds and clinical recordings are kept to Professional members, who can also post in the Case Room."
          />
        </div>
      </MemberPage>
    );
  }

  const embed = tvEmbedUrl(video);
  const more = await publishedTv({ kind: video.kind, take: 3, exceptId: video.id });
  const paragraphs = video.summary
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const post = video.post && !video.post.hiddenAt ? video.post : null;
  const episode = video.podcastEpisode?.status === "published" ? video.podcastEpisode : null;

  return (
    <MemberPage>
      {back}

      <div className="mt-4 relative aspect-video overflow-hidden rounded-2xl bg-ink">
        {embed ? (
          <iframe
            src={embed}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-paper/80">
            This video can&apos;t be played just now. The team has been told.
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Pill>{TV_KIND_LABEL[video.kind]}</Pill>
            {video.professionalOnly && <Pill>Professional</Pill>}
          </div>
          <h1 className="display text-[2.2rem] leading-[1.04] sm:text-5xl">{video.title}</h1>
          <p className="text-[14px] text-muted-foreground">
            {[video.presenters && `Presented by ${video.presenters}`, `Recorded ${longDate(video.recordedAt)}`, formatMinutes(video.durationMin)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {paragraphs.length > 0 && (
            <div className="flex flex-col gap-4 text-[16px] leading-[1.7] text-ink-2">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-2">
          {post && (
            <Link
              href={`/members/community/${post.id}`}
              className="flex items-center gap-3 rounded-2xl border border-rule bg-card p-4 hover:border-ink/30"
            >
              <MessagesSquare className="h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
              <span className="text-[15px]">
                <span className="block font-medium text-ink">Talk about it in the community</span>
                <span className="block text-[13px] text-muted-foreground">
                  {post._count.comments === 0 ? "Be the first to reply" : `${post._count.comments} ${post._count.comments === 1 ? "reply" : "replies"} so far`}
                </span>
              </span>
            </Link>
          )}
          {video.event?.published && (
            <Link
              href={`/members/events/${video.event.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-rule bg-card p-4 hover:border-ink/30"
            >
              <CalendarDays className="h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
              <span className="text-[15px]">
                <span className="block font-medium text-ink">See the event</span>
                <span className="block text-[13px] text-muted-foreground">{video.event.title}</span>
              </span>
            </Link>
          )}
          {episode && (
            <Link href={`/podcast/${episode.slug}`} className="flex items-center gap-3 rounded-2xl border border-rule bg-card p-4 hover:border-ink/30">
              <FileText className="h-5 w-5 shrink-0 stroke-[1.5]" aria-hidden />
              <span className="text-[15px]">
                <span className="block font-medium text-ink">{episode.transcriptStatus === "ready" ? "Read the transcript" : "The episode page"}</span>
                <span className="block text-[13px] text-muted-foreground">Listen in your podcast app too</span>
              </span>
            </Link>
          )}
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mt-14">
          <SectionLabel
            action={
              <Link href={`/members/tv?shelf=${video.kind}`} className="text-sm text-ink underline underline-offset-4">
                See all
              </Link>
            }
          >
            More {TV_SHELF_LABEL[video.kind].toLowerCase()}
          </SectionLabel>
          <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((v) => (
              <li key={v.id}>
                <TvCard video={v} locked={v.professionalOnly && !ctx.professional} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </MemberPage>
  );
}
