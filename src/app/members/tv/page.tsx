import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mic, Video } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { Card, EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { RecordingPlayer, hasRecording } from "@/components/events/RecordingPlayer";
import { liveSessionWhen, nextLiveSession, RECORDING_KIND_LABEL, recordingDate } from "@/lib/recordings";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Trichollective TV" };

/**
 * Trichollective TV for members: every recording plays here, newest first,
 * with the next live session and the podcast alongside.
 */
export default async function MemberTvPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/tv");
  if (!ctx.allowed) return <Paywall title="Trichollective TV" body="Recordings of every masterclass and case round are part of membership." />;

  const [rows, next] = await Promise.all([
    prisma.event.findMany({
      where: { published: true, recordingUrl: { not: null }, startsAt: { lt: new Date() } },
      orderBy: { startsAt: "desc" },
      take: 24,
      select: { id: true, slug: true, title: true, kind: true, summary: true, startsAt: true, presenters: true, recordingUrl: true },
    }),
    nextLiveSession(),
  ]);
  const recordings = rows.filter((r) => hasRecording(r.recordingUrl));

  return (
    <MemberPage>
      <PageHeader
        label="Trichollective TV"
        title="Watch again"
        lede="Every masterclass and case round, recorded for the members who could not be there. For members only, so please keep the links inside Trichollective."
      />

      {next && (
        <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Next live session</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug tracking-[-0.01em]">{next.title}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> {RECORDING_KIND_LABEL[next.kind] ?? "Live session"}, online
              </span>
              <span>{liveSessionWhen(next.startsAt)} UK time</span>
              {next.presenters && <span>with {next.presenters}</span>}
            </p>
          </div>
          <Link
            href={`/members/events/${next.slug}`}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/85"
          >
            Save your place <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      {recordings.length === 0 ? (
        <EmptyState title="No recordings yet" body="The first recording appears here shortly after the next live session." />
      ) : (
        <ul className="flex flex-col gap-6">
          {recordings.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-4 p-4 sm:p-5">
                <RecordingPlayer url={r.recordingUrl} title={r.title} />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Pill>{RECORDING_KIND_LABEL[r.kind] ?? "Session"}</Pill>
                    <Pill tone="ink">Recording</Pill>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em]">
                    <Link href={`/members/events/${r.slug}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </h2>
                  <p className="text-[13px] text-muted-foreground">
                    {recordingDate(r.startsAt)}
                    {r.presenters ? `, with ${r.presenters}` : ""}
                  </p>
                  <p className="text-sm leading-relaxed text-ink-2">{r.summary}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">The podcast</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">Conversations from the community, to listen to between sessions.</p>
        </div>
        <Link href="/podcast" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-rule px-5 text-sm font-medium hover:bg-paper-2">
          <Mic className="h-4 w-4" /> Listen <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </MemberPage>
  );
}
