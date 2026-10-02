import Link from "next/link";
import { notFound } from "next/navigation";
import type { PodcastEpisode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { images } from "@/content/images";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Field, Notice, PageHeader, Section, Tag, TextLink, dateTime, fieldClass, NoAccess } from "@/components/studio/ui";
import { isTranscriptionAvailable, planOf } from "@/agents/podcast";
import { aiAvailable } from "@/agents/ai";
import { formatKeyMomentLines, formatTimestamp, keyMomentsOf } from "@/lib/podcast-feed";
import { cn } from "@/lib/utils";
import { studioPage } from "../../_lib/guard";
import {
  publishAction,
  regeneratePlanAction,
  saveAudioAction,
  saveNotesAction,
  saveTranscriptAction,
  writeNotesAction,
} from "../actions";
import { STATUS_LABEL, STATUS_TONE, TRANSCRIPT_LABEL } from "../labels";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "audio", label: "Audio" },
  { id: "transcript", label: "Transcript" },
  { id: "notes", label: "Show notes" },
  { id: "publish", label: "Publish" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function durationInput(sec: number | null) {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export default async function EpisodeStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const staff = await studioPage(`/studio/podcast/${id}`, "podcast.view");
  if (!staff) return <NoAccess what="the podcast" />;
  const sp = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === sp.tab) ? (sp.tab as TabId) : "plan";

  const episode = await prisma.podcastEpisode.findUnique({ where: { id } });
  if (!episode) notFound();
  const guest = episode.guestUserId
    ? await prisma.user.findUnique({ where: { id: episode.guestUserId }, select: { email: true, name: true } })
    : null;

  const canEdit = staff.perms.has("podcast.edit");
  const canPublish = staff.perms.has("podcast.publish");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <TextLink href="/studio/podcast" className="text-sm">
          All episodes
        </TextLink>
        <PageHeader
          title={episode.title}
          intro={episode.fade || undefined}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone={STATUS_TONE[episode.status]}>{STATUS_LABEL[episode.status]}</Tag>
              <Tag>{TRANSCRIPT_LABEL[episode.transcriptStatus] ?? episode.transcriptStatus}</Tag>
              {episode.status === "published" && (
                <Button asChild size="xs" variant="outline">
                  <Link href={`/podcast/${episode.slug}`} target="_blank">
                    View the page
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      <nav aria-label="Episode sections" className="flex flex-wrap gap-1 border-b border-rule">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/studio/podcast/${id}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === t.id ? "border-ink font-medium text-ink" : "border-transparent text-muted-foreground hover:text-ink"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {tab === "plan" && <PlanTab episode={episode} canEdit={canEdit} />}
      {tab === "audio" && <AudioTab episode={episode} canEdit={canEdit} guestEmail={guest?.email ?? ""} />}
      {tab === "transcript" && <TranscriptTab episode={episode} canEdit={canEdit} />}
      {tab === "notes" && <NotesTab episode={episode} canEdit={canEdit} />}
      {tab === "publish" && <PublishTab episode={episode} canEdit={canEdit} canPublish={canPublish} />}

      <p className="text-xs text-muted-foreground">Last changed {dateTime(episode.updatedAt)}.</p>
    </div>
  );
}

function PlanTab({ episode, canEdit }: { episode: PodcastEpisode; canEdit: boolean }) {
  const plan = planOf(episode.plan);
  const total = plan?.runningOrder.reduce((t, s) => t + s.minutes, 0) ?? 0;
  const sections = plan ? [...new Set(plan.questions.map((q) => q.section))] : [];
  return (
    <div className="space-y-8">
      <Card className="text-sm text-ink-2">
        <p>
          {[episode.guestName, episode.guestRole].filter(Boolean).join(", ") || "No guest yet"}
          {episode.topic ? `. Topic: ${episode.topic}.` : "."}
        </p>
      </Card>
      {!plan ? (
        <Empty>This episode has no interview plan. Episodes synced from your host start without one; you can ask for one below.</Empty>
      ) : (
        <>
          <Section title="Running order" intro={`About ${total} minutes in total.`}>
            <ol className="divide-y divide-rule rounded-2xl border border-rule bg-card">
              {plan.runningOrder.map((s, i) => (
                <li key={i} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-ink">{s.segment}</span>
                  <span className="tabular-nums text-muted-foreground">{s.minutes} min</span>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="Questions">
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section} className="space-y-2">
                  <h3 className="label text-muted-foreground">{section}</h3>
                  <ol className="space-y-3">
                    {plan.questions
                      .filter((q) => q.section === section)
                      .map((q, i) => (
                        <li key={i} className="rounded-2xl border border-rule bg-card p-4">
                          <p className="text-[15px] text-ink">{q.question}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{q.why}</p>
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
      {canEdit && (
        <form action={regeneratePlanAction} className="space-y-3 rounded-2xl border border-rule bg-card p-5">
          <input type="hidden" name="id" value={episode.id} />
          <Field label="What should the new plan do differently?" hint="Optional. For example: more on pricing, or fewer questions about training.">
            <textarea name="note" rows={2} maxLength={2000} className={fieldClass} />
          </Field>
          <SubmitButton variant="outline" pendingLabel="Writing a fresh plan…">
            {plan ? "Write a fresh plan" : "Write a plan"}
          </SubmitButton>
          {!aiAvailable() && (
            <p className="text-xs text-muted-foreground">The writing assistant isn&apos;t switched on, so you will get the standard question template.</p>
          )}
        </form>
      )}
    </div>
  );
}

function AudioTab({ episode, canEdit, guestEmail }: { episode: PodcastEpisode; canEdit: boolean; guestEmail: string }) {
  return (
    <form action={saveAudioAction} className="space-y-5 rounded-3xl border border-rule bg-card p-5 sm:p-8">
      <input type="hidden" name="id" value={episode.id} />
      <fieldset disabled={!canEdit} className="space-y-5">
        <Field label="Audio file" hint="The direct MP3 link from your podcast host. Sync from host fills this in for you.">
          <input type="url" name="audioUrl" defaultValue={episode.audioUrl ?? ""} placeholder="https://…/episode.mp3" className={fieldClass} />
        </Field>
        <Field label="Player link" hint="Optional. Your host's embeddable player address. When set, the episode page shows this player instead of the plain audio player.">
          <input type="url" name="embedUrl" defaultValue={episode.embedUrl ?? ""} placeholder="https://share.transistor.fm/e/…" className={fieldClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Length" hint="hh:mm:ss or mm:ss.">
            <input name="duration" defaultValue={durationInput(episode.durationSec)} placeholder="45:30" className={fieldClass} />
          </Field>
          <Field label="Cover image" hint="Shown on the podcast page and in the announcement email.">
            <select name="coverImageKey" defaultValue={episode.coverImageKey ?? ""} className={fieldClass}>
              <option value="">Standard image</option>
              {Object.entries(images).map(([key, img]) => (
                <option key={key} value={key}>
                  {key}: {img.alt.slice(0, 60)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guest's name">
            <input name="guestName" defaultValue={episode.guestName ?? ""} maxLength={120} className={fieldClass} />
          </Field>
          <Field label="Guest's role">
            <input name="guestRole" defaultValue={episode.guestRole ?? ""} maxLength={200} className={fieldClass} />
          </Field>
        </div>
        <Field label="Topic">
          <input name="topic" defaultValue={episode.topic ?? ""} maxLength={200} className={fieldClass} />
        </Field>
        <Field label="Guest's member email" hint="Optional. If the guest is a member, their profile is linked from the episode page for other members.">
          <input type="email" name="guestEmail" defaultValue={guestEmail} className={fieldClass} />
        </Field>
        {canEdit && <SubmitButton pendingLabel="Saving…">Save audio and guest</SubmitButton>}
      </fieldset>
    </form>
  );
}

function TranscriptTab({ episode, canEdit }: { episode: PodcastEpisode; canEdit: boolean }) {
  const available = isTranscriptionAvailable();
  const membersOnly = (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name="membersOnly" defaultChecked={episode.membersOnly} className="mt-0.5 h-4 w-4 accent-ink" />
      <span>
        <span className="font-medium text-ink">Transcript for members only</span>
        <span className="block text-xs text-muted-foreground">Everyone else sees the first few paragraphs and an invitation to join.</span>
      </span>
    </label>
  );
  return (
    <div className="space-y-8">
      {canEdit && (
        <Section
          title="Automatic transcription"
          intro="The transcription service fetches the audio from your host and returns a transcript with timestamps and speakers."
        >
          {!available ? (
            <Card className="text-sm text-ink-2">
              Automatic transcription isn&apos;t set up. Add an AssemblyAI key to the site settings as ASSEMBLYAI_API_KEY to switch it on.
              Until then, paste or upload the transcript your host or editor gives you.
            </Card>
          ) : !episode.audioUrl ? (
            <Card className="text-sm text-ink-2">Add the audio file on the Audio tab first, so there is something to transcribe.</Card>
          ) : (
            <form action={`/studio/podcast/${episode.id}/transcribe`} method="post" className="space-y-2">
              <Button type="submit" variant="outline">
                {episode.transcriptStatus === "transcribing" ? "Collect the transcript" : episode.transcript ? "Transcribe again" : "Transcribe"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {episode.transcriptStatus === "transcribing"
                  ? "A transcription is already running. Press the button to wait for it and save it here."
                  : "An hour of audio usually takes a few minutes. Keep this page open until it finishes. Transcribing again replaces the transcript below."}
              </p>
            </form>
          )}
        </Section>
      )}

      <Section title="Transcript" intro="Start each paragraph with a timestamp such as [12:30] so key moments can link to it. Leave a blank line between paragraphs.">
        <form action={saveTranscriptAction} className="space-y-4">
          <input type="hidden" name="id" value={episode.id} />
          <fieldset disabled={!canEdit} className="space-y-4">
            <textarea
              name="transcript"
              defaultValue={episode.transcript ?? ""}
              rows={20}
              className={cn(fieldClass, "font-mono text-[13px] leading-relaxed")}
              placeholder="[00:00] Karley: Welcome to the Trichollective podcast…"
            />
            {membersOnly}
            {canEdit && <SubmitButton pendingLabel="Saving…">Save the transcript</SubmitButton>}
          </fieldset>
        </form>
      </Section>

      {canEdit && (
        <Section title="Upload a transcript file" intro="A .txt, .vtt or .srt file. Caption files are turned into paragraphs with timestamps. Uploading replaces the transcript above.">
          <form action={saveTranscriptAction} className="space-y-4 rounded-2xl border border-rule bg-card p-5">
            <input type="hidden" name="id" value={episode.id} />
            <input type="file" name="file" accept=".txt,.vtt,.srt,text/plain,text/vtt" required className="block text-sm" />
            {membersOnly}
            <SubmitButton variant="outline" pendingLabel="Uploading…">
              Upload and replace
            </SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}

function NotesTab({ episode, canEdit }: { episode: PodcastEpisode; canEdit: boolean }) {
  const moments = keyMomentsOf(episode.keyMoments);
  return (
    <div className="space-y-8">
      {canEdit && (
        <form action={writeNotesAction} className="space-y-3 rounded-2xl border border-rule bg-card p-5">
          <input type="hidden" name="id" value={episode.id} />
          <p className="text-sm text-ink-2">
            {episode.transcript
              ? "Draft the summary, show notes, key moments, guest bio and quotes from the transcript. This replaces those fields below, apart from the title."
              : "Add a transcript first. The show notes are written from it."}
          </p>
          <Field label="Anything to change in this version?" hint="Optional. For example: shorter, or focus more on referral.">
            <textarea name="note" rows={2} maxLength={2000} className={fieldClass} />
          </Field>
          <SubmitButton variant="outline" disabled={!episode.transcript || !aiAvailable()} pendingLabel="Reading the transcript…">
            {episode.summary ? "Write the show notes again" : "Write the show notes"}
          </SubmitButton>
          {!aiAvailable() && <p className="text-xs text-muted-foreground">The writing assistant isn&apos;t switched on, so write the notes by hand below.</p>}
        </form>
      )}

      <form action={saveNotesAction} className="space-y-5 rounded-3xl border border-rule bg-card p-5 sm:p-8">
        <input type="hidden" name="id" value={episode.id} />
        <fieldset disabled={!canEdit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" hint="The first half of the headline sentence, usually ending with a comma.">
              <input name="title" defaultValue={episode.title} required maxLength={200} className={fieldClass} />
            </Field>
            <Field label="Second line" hint="Completes the sentence, shown in grey.">
              <input name="fade" defaultValue={episode.fade} maxLength={200} className={fieldClass} />
            </Field>
          </div>
          <Field label="Summary" hint="Two or three sentences for the episode list, search results and the announcement email.">
            <textarea name="summary" defaultValue={episode.summary} rows={3} maxLength={2000} className={fieldClass} />
          </Field>
          <Field label="Show notes" hint="Plain text. Leave a blank line between paragraphs.">
            <textarea name="showNotes" defaultValue={episode.showNotes} rows={12} className={fieldClass} />
          </Field>
          <Field label="Key moments" hint="One per line, as a timestamp and a label, for example: 12:30 How she prices a first consultation.">
            <textarea
              name="keyMoments"
              defaultValue={formatKeyMomentLines(moments)}
              rows={6}
              className={cn(fieldClass, "font-mono text-[13px]")}
            />
          </Field>
          <Field label="Quotes" hint="Up to three, one per line, copied exactly from the transcript.">
            <textarea name="quotes" defaultValue={episode.quotes.join("\n")} rows={4} className={fieldClass} />
          </Field>
          <Field label="About the guest">
            <textarea name="guestBio" defaultValue={episode.guestBio ?? ""} rows={3} maxLength={2000} className={fieldClass} />
          </Field>
          {canEdit && <SubmitButton pendingLabel="Saving…">Save the show notes</SubmitButton>}
        </fieldset>
      </form>
      {moments.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Key moments start at {moments.map((m) => formatTimestamp(m.t)).join(", ")}.
        </p>
      )}
    </div>
  );
}

function PublishTab({ episode, canEdit, canPublish }: { episode: PodcastEpisode; canEdit: boolean; canPublish: boolean }) {
  const checks = [
    { ok: !!(episode.audioUrl || episode.embedUrl), label: "An audio file or player link", required: true },
    { ok: !!episode.summary.trim(), label: "A summary", required: true },
    { ok: !!episode.transcript, label: "A transcript", required: false },
    { ok: !!episode.showNotes.trim(), label: "Show notes", required: false },
    { ok: !!episode.coverImageKey, label: "A cover image", required: false },
  ];
  const ready = checks.every((c) => c.ok || !c.required);
  return (
    <form action={publishAction} className="space-y-6 rounded-3xl border border-rule bg-card p-5 sm:p-8">
      <input type="hidden" name="id" value={episode.id} />
      <fieldset disabled={!canEdit && !canPublish} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Episode number">
            <input type="number" min={0} name="number" defaultValue={episode.number ?? ""} className={fieldClass} />
          </Field>
          <Field label="Season" hint="Optional.">
            <input type="number" min={0} name="season" defaultValue={episode.season ?? ""} className={fieldClass} />
          </Field>
          <Field label="Web address" hint={`/podcast/${episode.slug}`}>
            <input name="slug" defaultValue={episode.slug} maxLength={100} className={fieldClass} />
          </Field>
        </div>
        {episode.status === "published" && (
          <p className="text-xs text-muted-foreground">
            Changing the web address of a published episode breaks links that have already been shared.
          </p>
        )}

        <ul className="space-y-1.5 text-sm">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? "text-ink" : c.required ? "text-destructive" : "text-muted-foreground"}>
              {c.ok ? "Done" : c.required ? "Needed" : "Optional"}: {c.label}
            </li>
          ))}
        </ul>

        {episode.status === "published" ? (
          <p className="text-sm text-ink-2">
            This episode was published on {dateTime(episode.publishedAt)}. Edits on the other tabs show on the website straight away.
          </p>
        ) : (
          <p className="text-sm text-ink-2">
            Publishing puts the episode page on the website and drafts an announcement email and a community post for the inbox. Neither
            is sent until someone approves it.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <SubmitButton name="intent" value="save" variant="outline" pendingLabel="Saving…">
              Save details
            </SubmitButton>
          )}
          {canPublish && episode.status !== "published" && (
            <SubmitButton name="intent" value="publish" disabled={!ready} pendingLabel="Publishing…">
              Publish the episode
            </SubmitButton>
          )}
          {canPublish && episode.status === "published" && (
            <SubmitButton name="intent" value="withdraw" variant="outline" pendingLabel="Withdrawing…">
              Withdraw from the website
            </SubmitButton>
          )}
        </div>
        {!canPublish && <p className="text-xs text-muted-foreground">Your role can prepare episodes, but an editor or owner publishes them.</p>}
      </fieldset>
    </form>
  );
}
