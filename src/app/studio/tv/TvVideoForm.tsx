import type { TvVideo } from "@prisma/client";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Field, fieldClass } from "@/components/studio/ui";
import { EVENT_KIND_LABEL } from "@/components/editorial/events";
import { TV_KIND_LABEL, TV_KINDS, tvVideo } from "@/lib/tv";
import { videoPageUrl } from "@/lib/video-embed";
import { createTvVideoAction, updateTvVideoAction } from "./actions";

export type EventChoice = { id: string; title: string; kind: keyof typeof EVENT_KIND_LABEL; startsAt: Date };
export type EpisodeChoice = { id: string; title: string; number: number | null };

function dateInput(d: Date | null | undefined) {
  return d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d) : "";
}

function shortDay(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }).format(d);
}

/** Adding or editing a video. Choosing the event or episode it came from fills in anything left blank. */
export function TvVideoForm({
  video,
  events,
  episodes,
}: {
  video: TvVideo | null;
  events: EventChoice[];
  episodes: EpisodeChoice[];
}) {
  const parsed = video ? tvVideo(video) : null;
  return (
    <form
      action={video ? updateTvVideoAction : createTvVideoAction}
      className="max-w-4xl space-y-5 rounded-2xl border border-rule bg-card p-5 sm:p-6"
    >
      {video && <input type="hidden" name="tvId" value={video.id} />}

      <Field
        label="Vimeo or YouTube link"
        hint="Upload the recording to Vimeo or YouTube first. On Vimeo, set it to unlisted and restrict embedding to trichollective.net so it can only be watched here. On YouTube, make it unlisted."
      >
        <input
          name="link"
          required
          maxLength={500}
          defaultValue={parsed ? videoPageUrl(parsed) : ""}
          placeholder="https://vimeo.com/123456789/abcdef1234"
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From the event" hint="For masterclass and case round recordings. The title, summary, presenters and date are taken from the event if you leave them blank.">
          <select name="eventId" defaultValue={video?.eventId ?? ""} className={fieldClass}>
            <option value="">Not from an event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {EVENT_KIND_LABEL[e.kind]}: {e.title} ({shortDay(e.startsAt)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Podcast episode" hint="For a filmed podcast. Members can find the transcript from the video's page.">
          <select name="podcastEpisodeId" defaultValue={video?.podcastEpisodeId ?? ""} className={fieldClass}>
            <option value="">Not a podcast episode</option>
            {episodes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.number ? `${e.number}. ` : ""}
                {e.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Shelf" hint="Where it sits in the library. Leave as it is to follow the event or episode.">
          <select name="kind" defaultValue={video?.kind ?? ""} className={fieldClass}>
            {!video && <option value="">Follow the event or episode</option>}
            {TV_KINDS.map((k) => (
              <option key={k} value={k}>
                {TV_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Recorded on" hint="Leave blank to use the event or episode date.">
          <input type="date" name="recordedAt" defaultValue={dateInput(video?.recordedAt)} className={fieldClass} />
        </Field>
        <Field label="Length in minutes" hint="Optional.">
          <input type="number" name="durationMin" min={1} max={999} defaultValue={video?.durationMin ?? ""} className={fieldClass} />
        </Field>
      </div>

      <Field label="Title">
        <input name="title" maxLength={200} defaultValue={video?.title ?? ""} className={fieldClass} />
      </Field>
      <Field label="Presented by" hint="For example: Adam Bond (LIVDOR) and Karley Weir.">
        <input name="presenters" maxLength={300} defaultValue={video?.presenters ?? ""} className={fieldClass} />
      </Field>
      <Field label="Summary" hint="What members will learn. Shown on the video's page and in the community post. Leave a blank line between paragraphs.">
        <textarea name="summary" rows={5} maxLength={5000} defaultValue={video?.summary ?? ""} className={fieldClass} />
      </Field>
      {video && (
        <Field label="Web address" hint={`trichollective.net/members/tv/${video.slug}`}>
          <input name="slug" maxLength={80} defaultValue={video.slug} className={fieldClass} />
        </Field>
      )}

      <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
        <input type="checkbox" name="professionalOnly" defaultChecked={video?.professionalOnly ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
        <span>
          <span className="font-medium text-ink">Professional members only</span>
          <span className="block text-muted-foreground">
            For case rounds and other clinical recordings. Other members see it in the library with an invitation to upgrade, and it is
            shared in the Case Room rather than The Lounge.
          </span>
        </span>
      </label>

      {!video?.postId && (
        <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
          <input type="checkbox" name="share" defaultChecked className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            <span className="font-medium text-ink">Share it in the community when it is published</span>
            <span className="block text-muted-foreground">
              Posts it once, from the Trichollective team account, with the video and an invitation to talk about it.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {video?.published ? (
          <>
            <SubmitButton name="intent" value="save" pendingLabel="Saving…">
              Save changes
            </SubmitButton>
            <SubmitButton name="intent" value="unpublish" variant="outline" pendingLabel="Taking it down…" formNoValidate>
              Take off TV
            </SubmitButton>
          </>
        ) : (
          <>
            <SubmitButton name="intent" value="publish" pendingLabel="Publishing…">
              Publish to members
            </SubmitButton>
            <SubmitButton name="intent" value="save" variant="outline" pendingLabel="Saving…">
              Save as a draft
            </SubmitButton>
          </>
        )}
      </div>
    </form>
  );
}
