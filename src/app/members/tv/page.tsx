import Link from "next/link";
import { redirect } from "next/navigation";
import { Headphones } from "lucide-react";
import type { TvKind } from "@prisma/client";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader, SectionLabel } from "@/components/members/MemberPage";
import { shortDate } from "@/components/members/format";
import { TvCard, TvCover } from "@/components/tv/TvCard";
import { getMemberContext } from "@/lib/member";
import { publishedEpisodes } from "@/lib/podcast";
import { formatDuration } from "@/lib/podcast-feed";
import { publishedTv } from "@/lib/tv-data";
import { TV_KIND_LABEL, TV_KINDS, TV_SHELF_LABEL, formatMinutes, isTvKind, tvHref } from "@/lib/tv";
import { cn } from "@/lib/utils";

export const metadata = { title: "Trichollective TV" };

const SHELF_PREVIEW = 6;

export default async function TvPage({ searchParams }: { searchParams: Promise<{ shelf?: string }> }) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/tv");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Trichollective TV"
        body="Recordings of every masterclass and case round, filmed podcasts and new videos are part of membership."
      />
    );
  }
  const { shelf: shelfParam } = await searchParams;
  const shelf: TvKind | null = isTvKind(shelfParam) ? shelfParam : null;

  const [videos, episodes] = await Promise.all([publishedTv(), !shelf || shelf === "podcast" ? publishedEpisodes() : []]);
  const locked = (v: { professionalOnly: boolean }) => v.professionalOnly && !ctx.professional;
  const shelves = TV_KINDS.filter((k) => !shelf || k === shelf).map((k) => ({ kind: k, videos: videos.filter((v) => v.kind === k) }));
  const latest = !shelf ? videos[0] : null;
  // Audio-only episodes sit on the podcast shelf too; filmed ones are already there as videos.
  const filmed = new Set(videos.map((v) => v.podcastEpisodeId).filter(Boolean));
  const audio = episodes.filter((e) => !filmed.has(e.id));

  return (
    <MemberPage size="wide">
      <PageHeader
        label="Trichollective TV"
        title="Watch and learn between clients"
        lede="Every masterclass and case round, recorded for members, with filmed podcasts and new videos from the community. New videos are shared in the community, so you can talk about them there."
      />

      <nav aria-label="Shelves" className="-mx-1 mb-8 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {[null, ...TV_KINDS].map((k) => (
          <Link
            key={k ?? "all"}
            href={k ? `/members/tv?shelf=${k}` : "/members/tv"}
            aria-current={shelf === k ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm transition-colors",
              shelf === k ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink/40 hover:text-ink"
            )}
          >
            {k ? TV_SHELF_LABEL[k] : "Everything"}
          </Link>
        ))}
      </nav>

      {videos.length === 0 && audio.length === 0 ? (
        <EmptyState
          title="The first recordings are on their way."
          body="Masterclass and case round recordings appear here soon after each session, and in the community when they arrive."
        />
      ) : (
        <div className="flex flex-col gap-12">
          {latest && (
            <Link href={tvHref(latest.slug)} className="group grid gap-5 rounded-3xl border border-rule bg-card p-4 sm:p-5 md:grid-cols-[3fr_2fr] md:items-center md:gap-8">
              <TvCover video={latest} locked={locked(latest)} />
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone="ink">Latest</Pill>
                  <Pill>{TV_KIND_LABEL[latest.kind]}</Pill>
                  {latest.professionalOnly && <Pill>Professional</Pill>}
                </div>
                <h2 className="display text-3xl leading-[1.05] group-hover:underline sm:text-4xl">{latest.title}</h2>
                <p className="text-[14px] text-muted-foreground">
                  {[latest.presenters, shortDate(latest.recordedAt), formatMinutes(latest.durationMin)].filter(Boolean).join(" · ")}
                </p>
                <span className="text-[15px] font-medium underline underline-offset-4">Watch now</span>
              </div>
            </Link>
          )}

          {shelves.map(({ kind, videos: list }) => {
            const shown = shelf ? list : list.slice(0, SHELF_PREVIEW);
            const audioHere = kind === "podcast" ? audio : [];
            if (shown.length === 0 && audioHere.length === 0) {
              return shelf ? (
                <EmptyState key={kind} title={`There are no ${TV_SHELF_LABEL[kind].toLowerCase()} yet.`} body="New ones are shared in the community when they arrive." />
              ) : null;
            }
            return (
              <section key={kind}>
                <SectionLabel
                  action={
                    !shelf && list.length > SHELF_PREVIEW ? (
                      <Link href={`/members/tv?shelf=${kind}`} className="text-sm text-ink underline underline-offset-4">
                        See all {list.length}
                      </Link>
                    ) : undefined
                  }
                >
                  {TV_SHELF_LABEL[kind]}
                </SectionLabel>
                {shown.length > 0 && (
                  <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((v) => (
                      <li key={v.id}>
                        <TvCard video={v} locked={locked(v)} />
                      </li>
                    ))}
                  </ul>
                )}
                {audioHere.length > 0 && (
                  <ul className={cn("divide-y divide-rule rounded-2xl border border-rule bg-card", shown.length > 0 && "mt-6")}>
                    {(shelf ? audioHere : audioHere.slice(0, SHELF_PREVIEW)).map((e) => (
                      <li key={e.id}>
                        <Link href={`/podcast/${e.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-paper-2">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-2">
                            <Headphones className="h-4 w-4 stroke-[1.6]" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-ink">
                              {e.number ? `${e.number}. ` : ""}
                              {e.title}
                            </span>
                            <span className="block text-[13px] text-muted-foreground">
                              {["Listen", e.guestName, formatDuration(e.durationSec), e.publishedAt && shortDate(e.publishedAt)].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </MemberPage>
  );
}
