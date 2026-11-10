import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { NoAccess, Notice, PageHeader, Section, Tag, TextLink, dateOnly } from "@/components/studio/ui";
import { TV_KIND_LABEL, tvEmbedUrl, tvHref } from "@/lib/tv";
import { studioPage } from "../../_lib/guard";
import { TvVideoForm } from "../TvVideoForm";
import { formChoices } from "../_data";
import { deleteTvVideoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TvVideoStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const staff = await studioPage(`/studio/tv/${id}`, "tv.view");
  if (!staff) return <NoAccess what="Trichollective TV" />;
  const sp = await searchParams;
  const canEdit = staff.perms.has("tv.edit");

  const video = await prisma.tvVideo.findUnique({ where: { id } });
  if (!video) notFound();
  const choices = canEdit ? await formChoices() : null;
  const embed = tvEmbedUrl(video);

  return (
    <div className="space-y-8">
      <Link href="/studio/tv" className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All videos
      </Link>
      <PageHeader
        title={video.title}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <Tag tone={video.published ? "positive" : "default"}>{video.published ? "Live" : "Draft"}</Tag>
            <Tag>{TV_KIND_LABEL[video.kind]}</Tag>
            {video.professionalOnly && <Tag>Professional</Tag>}
            <span>Recorded {dateOnly(video.recordedAt)}</span>
            {video.published && <TextLink href={tvHref(video.slug)}>Open it as a member</TextLink>}
            {video.postId && <TextLink href={`/members/community/${video.postId}`}>See the community post</TextLink>}
          </span>
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {embed && (
        <div className="relative aspect-video max-w-4xl overflow-hidden rounded-2xl bg-ink">
          <iframe src={embed} title={video.title} className="absolute inset-0 h-full w-full" allow="fullscreen; picture-in-picture" loading="lazy" />
        </div>
      )}

      {choices && (
        <Section title="Details">
          <TvVideoForm video={video} events={choices.events} episodes={choices.episodes} />
        </Section>
      )}

      {canEdit && (
        <Section title="Delete" intro="Removes it from the library for good. Its community post is hidden, along with the replies under it.">
          <form action={deleteTvVideoAction}>
            <input type="hidden" name="tvId" value={video.id} />
            <SubmitButton variant="destructive" pendingLabel="Deleting…">
              Delete this video
            </SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}
