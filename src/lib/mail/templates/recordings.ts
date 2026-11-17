import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";
import { images, img } from "@/content/images";
import { RECORDING_KIND_LABEL, liveSessionWhen, recordingDate, recordingImage } from "@/lib/recordings-format";

/**
 * The announcement that masterclass and case round recordings are on the
 * platform. Sent once, by hand, by scripts/send-recordings-live.ts: members
 * are sent straight to the recordings, and free accounts are told that
 * membership is how to watch them.
 */

export type RecordingLine = {
  title: string;
  /** The event kind, e.g. "masterclass" or "case_round". */
  kind: string;
  summary: string;
  startsAt: Date;
  presenters?: string | null;
  /** The public page that explains what the session covered. */
  href: string;
};

export type NextLive = {
  title: string;
  kind: string;
  startsAt: Date;
  presenters?: string | null;
  href: string;
};

export const RECORDINGS_MEMBER_REASON = "You receive this because you are a Trichollective member.";
export const RECORDINGS_FREE_REASON = "You receive this because you have a free Trichollective account.";

function kindLabel(kind: string) {
  return RECORDING_KIND_LABEL[kind] ?? "Session";
}

/** One picture card per recording, with what it covered and when it was recorded. */
function cards(recordings: RecordingLine[]) {
  return recordings.map((r) => {
    const key = recordingImage(r.kind);
    const who = r.presenters ? ` With ${r.presenters}.` : "";
    return {
      title: r.title,
      text: `${kindLabel(r.kind)}, recorded ${recordingDate(r.startsAt)}.${who} ${r.summary} ${r.href}`,
      image: { src: img(images[key], 1200), alt: images[key].alt },
    };
  });
}

/** The next live session as label/value rows, with a line to join it. */
function nextRows(next: NextLive | null | undefined): [string, string][] | undefined {
  if (!next) return undefined;
  return [
    ["What", `${kindLabel(next.kind)}: ${next.title}`],
    ["When", `${liveSessionWhen(next.startsAt)}, UK and Irish time, online`],
    ...(next.presenters ? ([["Who", next.presenters]] as [string, string][]) : []),
    ["Where", next.href],
  ];
}

function greeting(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hello,";
}

export function recordingsLiveEmail(
  name: string | null | undefined,
  opts: { member: boolean; recordings: RecordingLine[]; next?: NextLive | null; siteUrl: string }
): { subject: string; content: EmailContent } {
  const { member, recordings, next, siteUrl } = opts;
  const count = recordings.length;
  const plural = count === 1 ? "recording" : "recordings";
  const nextLine = next
    ? `The next live session is ${liveSessionWhen(next.startsAt)}, and the details are below.`
    : "The next live session will be announced soon.";

  if (member) {
    return {
      subject: `Trichollective TV: the masterclass ${plural} are ready to watch`,
      content: {
        preheader: `${count} ${plural} from the live sessions, on the platform whenever you have an hour.`,
        eyebrow: "Trichollective TV",
        heading: "The masterclass recordings are on the platform, ready whenever you have an hour.",
        image: "ire03",
        body: [
          greeting(name),
          `If you missed a live session, or want to go back over one, the recording now sits on the event page in the members' area. ${nextLine}`,
          "The recordings are for members, so please keep the links inside Trichollective.",
        ].join("\n\n"),
        features: cards(recordings),
        factsHeading: next ? "Next live session" : undefined,
        facts: nextRows(next),
        cta: { label: "Watch the recordings", href: `${siteUrl}/members/events` },
        secondary: next ? { label: "Save your place at the next live session", href: next.href } : { label: "See Trichollective TV", href: `${siteUrl}/tv` },
        reason: RECORDINGS_MEMBER_REASON,
      },
    };
  }

  return {
    subject: `Trichollective TV is live: the masterclass ${plural} are here for members`,
    content: {
      preheader: `${count} ${plural} from the live masterclass and case round sessions are now on the platform. Membership is how you watch them.`,
      eyebrow: "Trichollective TV",
      heading: "The masterclass recordings are live. Membership is what lets you watch them.",
      image: "ire03",
      body: [
        greeting(name),
        "Every month, members meet online for a live masterclass from a specialist and a case round where practitioners bring anonymised cases for a second opinion. The recordings now stay on Trichollective TV afterwards, so a session you missed is no longer gone. Here is what is there so far.",
      ].join("\n\n"),
      features: cards(recordings),
      factsHeading: next ? "Next live session, free for members" : undefined,
      facts: nextRows(next),
      cta: { label: "Become a member to watch", href: `${siteUrl}/pricing` },
      secondary: { label: "See Trichollective TV", href: `${siteUrl}/tv` },
      reason: RECORDINGS_FREE_REASON,
    },
  };
}

const SAMPLE_RECORDINGS: RecordingLine[] = [
  {
    title: "Masterclass: the five-minute scalp check",
    kind: "masterclass",
    summary: "A structured scalp check you can run in the first five minutes of any consultation, and what each finding should prompt you to do next.",
    startsAt: new Date("2026-10-21T18:00:00Z"),
    presenters: "Karley Weir",
    href: "https://www.trichollective.net/events/masterclass-five-minute-scalp-check",
  },
  {
    title: "Case round: November",
    kind: "case_round",
    summary: "Professional members bring anonymised cases for peer review across cosmetic, clinical and medical disciplines.",
    startsAt: new Date("2026-11-04T19:00:00Z"),
    href: "https://www.trichollective.net/events/case-round-november-2026",
  },
];
const SAMPLE_NEXT: NextLive = {
  title: "Masterclass: reading a trichoscopy image",
  kind: "masterclass",
  startsAt: new Date("2026-12-02T19:00:00Z"),
  presenters: "Karley Weir",
  href: "https://www.trichollective.net/events/masterclass-trichoscopy",
};
const memberSample = recordingsLiveEmail("Alex Morgan", { member: true, recordings: SAMPLE_RECORDINGS, next: SAMPLE_NEXT, siteUrl: "https://www.trichollective.net" });
const freeSample = recordingsLiveEmail("Alex Morgan", { member: false, recordings: SAMPLE_RECORDINGS, next: SAMPLE_NEXT, siteUrl: "https://www.trichollective.net" });

export const samples: EmailSample[] = [
  {
    id: "recordings-live-member",
    name: "Recordings are live (members)",
    trigger: "Sent once, by hand, to every paid member when recordings go on the platform.",
    audience: "members",
    subject: memberSample.subject,
    content: memberSample.content,
  },
  {
    id: "recordings-live-free",
    name: "Recordings are live (free accounts)",
    trigger: "Sent once, by hand, to every free account at the same time, with membership as the way to watch.",
    audience: "public",
    subject: freeSample.subject,
    content: freeSample.content,
  },
];
