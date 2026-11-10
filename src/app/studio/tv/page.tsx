import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, Empty, NoAccess, Notice, PageHeader, Section, Tag, dateOnly } from "@/components/studio/ui";
import { TV_KIND_LABEL, formatMinutes } from "@/lib/tv";
import { studioPage } from "../_lib/guard";
import { TvVideoForm } from "./TvVideoForm";
import { formChoices } from "./_data";

export const dynamic = "force-dynamic";

export default async function TvStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; tone?: string; new?: string }>;
}) {
  const staff = await studioPage("/studio/tv", "tv.view");
  if (!staff) return <NoAccess what="Trichollective TV" />;
  const sp = await searchParams;
  const canEdit = staff.perms.has("tv.edit");

  const [videos, unrecorded, choices] = await Promise.all([
    prisma.tvVideo.findMany({
      orderBy: [{ recordedAt: "desc" }],
      take: 300,
      include: { event: { select: { title: true } } },
    }),
    // Past masterclasses and case rounds that members were promised a recording of.
    prisma.event.findMany({
      where: { published: true, kind: { in: ["masterclass", "case_round"] }, startsAt: { lt: new Date() }, recording: null },
      orderBy: { startsAt: "desc" },
      take: 6,
      select: { id: true, title: true, startsAt: true },
    }),
    canEdit ? formChoices() : null,
  ]);
  const showForm = canEdit && (sp.new === "1" || videos.length === 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Trichollective TV"
        intro="The members' library of masterclass and case round recordings, filmed podcasts and other videos. Upload each video to Vimeo or YouTube, add its link here and publish it. Publishing shares it in the community once."
        actions={
          canEdit &&
          !showForm && (
            <Button asChild>
              <Link href="/studio/tv?new=1">
                <Plus /> Add a video
              </Link>
            </Button>
          )
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {canEdit && unrecorded.length > 0 && (
        <Card className="space-y-2 text-sm text-ink-2">
          <p className="font-medium text-ink">These past sessions don&apos;t have a recording on TV yet.</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {unrecorded.map((e) => (
              <li key={e.id}>
                {e.title}, {dateOnly(e.startsAt)}
              </li>
            ))}
          </ul>
          <p>Add a video and choose the session under From the event, and the rest is filled in for you.</p>
        </Card>
      )}

      {showForm && choices && (
        <Section title="Add a video" intro="Saved as a draft until you publish it.">
          <TvVideoForm video={null} events={choices.events} episodes={choices.episodes} />
        </Section>
      )}

      <Section title="Videos">
        {videos.length === 0 ? (
          <Empty>There are no videos yet. Add the first one above.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {videos.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-ink">{v.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[TV_KIND_LABEL[v.kind], dateOnly(v.recordedAt), formatMinutes(v.durationMin), v.event && `From ${v.event.title}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {v.professionalOnly && <Tag>Professional</Tag>}
                  {v.postId && <Tag>Shared</Tag>}
                  <Tag tone={v.published ? "positive" : "default"}>{v.published ? "Live" : "Draft"}</Tag>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/studio/tv/${v.id}`}>Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
