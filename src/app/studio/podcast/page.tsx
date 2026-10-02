import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Field, Notice, PageHeader, Section, Tag, dateOnly, fieldClass, NoAccess } from "@/components/studio/ui";
import { formatDuration } from "@/lib/podcast-feed";
import { studioPage } from "../_lib/guard";
import { createEpisodeAction, syncFeedAction } from "./actions";
import { STATUS_LABEL, STATUS_TONE, TRANSCRIPT_LABEL } from "./labels";

export const dynamic = "force-dynamic";

export default async function PodcastStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const staff = await studioPage("/studio/podcast", "podcast.view");
  if (!staff) return <NoAccess what="the podcast" />;
  const sp = await searchParams;
  const canEdit = staff.perms.has("podcast.edit");
  const feedUrl = process.env.PODCAST_FEED_URL?.trim();

  const episodes = await prisma.podcastEpisode.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Podcast"
        intro="Plan each conversation, bring in the audio from your podcast host, add the transcript and show notes, then publish the episode page. Apple Podcasts and Spotify get the audio from your host's feed."
        actions={
          canEdit &&
          feedUrl && (
            <form action={syncFeedAction}>
              <SubmitButton variant="outline" pendingLabel="Checking the feed…">
                Sync from host
              </SubmitButton>
            </form>
          )
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {canEdit && !feedUrl && (
        <Card className="space-y-2 text-sm text-ink-2">
          <p className="font-medium text-ink">Connect your podcast host to bring episodes in automatically.</p>
          <p>
            Copy the RSS feed address from Buzzsprout, Transistor or Spotify for Creators and add it to the site settings as
            PODCAST_FEED_URL. A Sync from host button will then appear here, and each new episode on your host will arrive as a
            draft with its audio file and length filled in.
          </p>
        </Card>
      )}

      <Section title="Episodes" intro="Drafts stay private until you publish them from the episode's Publish tab.">
        {episodes.length === 0 ? (
          <Empty>There are no episodes yet. Plan the first one below, or sync from your podcast host once it is connected.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {episodes.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-ink">
                    {e.number ? `${e.number}. ` : ""}
                    {e.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      e.guestName,
                      formatDuration(e.durationSec),
                      e.publishedAt ? `Published ${dateOnly(e.publishedAt)}` : `Started ${dateOnly(e.createdAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Tag tone={e.transcriptStatus === "ready" ? "positive" : e.transcriptStatus === "failed" ? "danger" : "default"}>
                    {TRANSCRIPT_LABEL[e.transcriptStatus] ?? e.transcriptStatus}
                  </Tag>
                  <Tag tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Tag>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/studio/podcast/${e.id}`}>Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {canEdit && (
        <Section
          title="Plan a new episode"
          intro="Tell us who you are talking to and what about, and you will get interview questions and a running order to work from."
        >
          <form action={createEpisodeAction} className="space-y-4 rounded-3xl border border-rule bg-card p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Guest's name">
                <input name="guestName" required maxLength={120} className={fieldClass} />
              </Field>
              <Field label="Guest's role" hint="For example Consultant Trichologist, or Head spa owner in Leeds.">
                <input name="guestRole" maxLength={200} className={fieldClass} />
              </Field>
            </div>
            <Field label="Topic" hint="What the conversation is mainly about.">
              <input name="topic" maxLength={200} className={fieldClass} />
            </Field>
            <Field label="Notes" hint="Optional. Anything the questions should cover or avoid.">
              <textarea name="notes" rows={4} maxLength={4000} className={fieldClass} />
            </Field>
            <SubmitButton pendingLabel="Writing the plan…">Plan the episode</SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}
