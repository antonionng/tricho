import type { PodcastEpisode, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { images } from "@/content/images";
import {
  formatDuration,
  formatTimestamp,
  parseTimestamp,
  quotesInTranscript,
  transcriptMarkers,
  transcriptParagraphs,
  type KeyMoment,
} from "@/lib/podcast-feed";
import { generate, generateStructured } from "./ai";
import { createDraft } from "./runtime";

/**
 * The podcast helpers behind Studio: planning an interview, transcribing the
 * audio the host already serves, writing show notes from the transcript, and
 * drafting the announcement and community post for the inbox.
 */

export const PODCAST_AGENT = "podcast";

/* ------------------------------------------------------------------ */
/* Planning                                                             */
/* ------------------------------------------------------------------ */

export type EpisodePlan = {
  title: string;
  fade: string;
  questions: { section: string; question: string; why: string }[];
  runningOrder: { segment: string; minutes: number }[];
};

export type PlanInput = { guestName: string; guestRole?: string | null; topic?: string | null; notes?: string | null };

const planSchema = z.object({
  title: z.string().describe("A full-sentence episode title that names the guest's subject, under 80 characters, ending with a comma."),
  fade: z.string().describe("The second half of the title sentence, which completes it and states what listeners will learn, under 80 characters, ending with a full stop."),
  questions: z
    .array(
      z.object({
        section: z.string().describe("The part of the interview, for example Introduction, Practice, Referral or Closing."),
        question: z.string().describe("One open question, as the host would ask it."),
        why: z.string().describe("One sentence on what this question draws out for listeners."),
      })
    )
    .min(6)
    .max(16),
  runningOrder: z.array(z.object({ segment: z.string(), minutes: z.number().int().min(1).max(60) })).min(3).max(8),
});

/** The plan JSON column, read safely. */
export function planOf(value: unknown): EpisodePlan | null {
  const parsed = planSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function fallbackPlan(input: PlanInput): EpisodePlan {
  const guest = input.guestName.trim() || "our guest";
  const topic = input.topic?.trim() || "their work in hair and scalp care";
  return {
    title: `${guest} on ${topic},`,
    fade: "and what other practitioners can take from it.",
    questions: [
      { section: "Introduction", question: `How did you come to work in hair and scalp care, and what does a typical week look like for you now?`, why: "It places the guest's discipline and experience for listeners from other fields." },
      { section: "Introduction", question: `What first drew you to ${topic}?`, why: "It sets up the subject of the episode in the guest's own terms." },
      { section: "Practice", question: "Talk us through how you approach a first appointment with a new client.", why: "Listeners can compare it with their own consultation process." },
      { section: "Practice", question: `What do people most often misunderstand about ${topic}?`, why: "It surfaces practical corrections other practitioners can use with clients." },
      { section: "Practice", question: "What has changed in the way you work over the last few years, and why?", why: "It shows how the guest keeps learning and adapting." },
      { section: "Referral", question: "When do you pass a client to a colleague in another discipline, and how do you make that hand-over work?", why: "Referral across disciplines is central to how the community works together." },
      { section: "Referral", question: "What would you like practitioners in other disciplines to know about what you do?", why: "It builds understanding between cosmetic, clinical and medical practice." },
      { section: "Closing", question: "What do you wish you had known sooner in your career?", why: "It gives listeners advice they can act on." },
      { section: "Closing", question: "Where can listeners find out more about your work?", why: "It closes the conversation and credits the guest properly." },
    ],
    runningOrder: [
      { segment: "Welcome and introduction", minutes: 3 },
      { segment: "The guest's path into the field", minutes: 7 },
      { segment: `${topic.charAt(0).toUpperCase()}${topic.slice(1)} in practice`, minutes: 20 },
      { segment: "Referral and working across disciplines", minutes: 10 },
      { segment: "Closing questions and thanks", minutes: 5 },
    ],
  };
}

async function communityContext() {
  try {
    const { readMonth } = await import("./gazette");
    const { spaces, keywords } = await readMonth(new Date());
    const busiest = spaces.slice(0, 3).map(([space]) => space);
    return `Busiest community spaces this month: ${busiest.join(", ") || "none"}. Recurring words in conversations: ${keywords.slice(0, 8).join(", ") || "none"}.`;
  } catch {
    return "";
  }
}

/** Interview questions and a running order for a new episode. Never returns null. */
export async function planEpisode(input: PlanInput): Promise<EpisodePlan> {
  const context = await communityContext();
  const ai = await generateStructured(
    planSchema,
    `Plan an interview for the Trichollective podcast, a monthly conversation hosted by ${site.founderFull} with someone who works in hair and scalp care. Write open questions grouped into sections that follow the running order. Questions should draw out how the guest practises, what they have learned, and when they refer clients to other disciplines. Never ask the guest to diagnose or to give treatment advice to listeners. Do not invent facts about the guest beyond what you are given. The running order should add up to between 35 and 55 minutes.`,
    [
      `Guest: ${input.guestName}`,
      input.guestRole ? `Guest's role: ${input.guestRole}` : "",
      input.topic ? `Topic: ${input.topic}` : "",
      input.notes ? `Notes from the team: ${input.notes}` : "",
      context ? `What members are talking about (for relevance only; do not quote anyone): ${context}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );
  return ai ?? fallbackPlan(input);
}

/* ------------------------------------------------------------------ */
/* Transcription                                                        */
/* ------------------------------------------------------------------ */

const ASSEMBLY = "https://api.assemblyai.com/v2";

export function isTranscriptionAvailable() {
  return !!process.env.ASSEMBLYAI_API_KEY;
}

type AssemblyWord = { text: string; start: number };
type AssemblyUtterance = { speaker?: string | null; text: string; start: number; words?: AssemblyWord[] };
type AssemblyTranscript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  error?: string;
  text?: string | null;
  utterances?: AssemblyUtterance[] | null;
};

/** Longest stretch, in seconds, that one transcript paragraph covers before a new marker. */
const PARAGRAPH_SECONDS = 60;

/** AssemblyAI's result as paragraphs that each start with an [mm:ss] marker. */
export function transcriptFromUtterances(utterances: AssemblyUtterance[]): string {
  const paragraphs: string[] = [];
  for (const u of utterances) {
    const speaker = u.speaker ? `Speaker ${u.speaker}: ` : "";
    const words = u.words?.length ? u.words : null;
    if (!words) {
      paragraphs.push(`[${formatTimestamp(u.start / 1000)}] ${speaker}${u.text.trim()}`);
      continue;
    }
    let start = words[0].start;
    let chunk: string[] = [];
    let first = true;
    const flush = () => {
      if (!chunk.length) return;
      paragraphs.push(`[${formatTimestamp(start / 1000)}] ${first ? speaker : ""}${chunk.join(" ")}`);
      first = false;
      chunk = [];
    };
    for (const w of words) {
      // Break long answers at the end of a sentence once the paragraph is long enough.
      const prev = chunk[chunk.length - 1] ?? "";
      if (chunk.length && w.start - start >= PARAGRAPH_SECONDS * 1000 && /[.?!]$/.test(prev)) {
        flush();
        start = w.start;
      }
      chunk.push(w.text);
    }
    flush();
  }
  return paragraphs.join("\n\n");
}

/** Where a running AssemblyAI job is remembered, so a timed-out request can pick it up again. */
const JOB_KEY = "_transcriptJob";

function planJson(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

async function assembly<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASSEMBLY}${path}`, {
    ...init,
    headers: { authorization: process.env.ASSEMBLYAI_API_KEY ?? "", "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`The transcription service answered with ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export type StepResult = { ok: boolean; message: string };

/**
 * Transcribe the episode from the audio URL the host serves. AssemblyAI
 * fetches the file itself, so long episodes are never downloaded here.
 * If the time budget runs out the job keeps running, and pressing
 * Transcribe again picks it up rather than starting over.
 */
export async function transcribeEpisode(
  id: string,
  opts: { budgetMs?: number; pollMs?: number } = {}
): Promise<StepResult> {
  const budgetMs = opts.budgetMs ?? 720_000;
  const pollMs = opts.pollMs ?? 5_000;
  if (!isTranscriptionAvailable()) {
    return { ok: false, message: "Automatic transcription isn't set up. Add ASSEMBLYAI_API_KEY to the site settings, or paste or upload a transcript instead." };
  }
  const episode = await prisma.podcastEpisode.findUnique({ where: { id } });
  if (!episode) return { ok: false, message: "That episode no longer exists." };
  if (!episode.audioUrl) return { ok: false, message: "Add the episode's audio URL on the Audio tab before transcribing." };

  const plan = planJson(episode.plan);
  const existing = typeof plan[JOB_KEY] === "string" ? (plan[JOB_KEY] as string) : null;
  const deadline = Date.now() + budgetMs;

  try {
    let jobId = episode.transcriptStatus === "transcribing" && existing ? existing : null;
    if (!jobId) {
      const job = await assembly<AssemblyTranscript>("/transcript", {
        method: "POST",
        body: JSON.stringify({ audio_url: episode.audioUrl, speaker_labels: true, language_code: "en", punctuate: true, format_text: true }),
      });
      jobId = job.id;
    }
    await prisma.podcastEpisode.update({
      where: { id },
      data: { transcriptStatus: "transcribing", plan: { ...plan, [JOB_KEY]: jobId } as Prisma.InputJsonObject },
    });

    for (;;) {
      const result = await assembly<AssemblyTranscript>(`/transcript/${jobId}`);
      if (result.status === "completed") {
        const text = result.utterances?.length ? transcriptFromUtterances(result.utterances) : (result.text ?? "").trim();
        if (!text) throw new Error("The transcription came back empty.");
        delete plan[JOB_KEY];
        await prisma.podcastEpisode.update({
          where: { id },
          data: { transcript: text, transcriptStatus: "ready", plan: plan as Prisma.InputJsonObject },
        });
        return { ok: true, message: "The transcript is ready. Check the speaker names before publishing." };
      }
      if (result.status === "error") throw new Error(result.error || "The transcription service couldn't transcribe this audio.");
      if (Date.now() + pollMs > deadline) {
        return { ok: true, message: "The transcription is still running. Come back in a few minutes and press Transcribe again to collect it." };
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
  } catch (error) {
    delete plan[JOB_KEY];
    await prisma.podcastEpisode
      .update({ where: { id }, data: { transcriptStatus: "failed", plan: plan as Prisma.InputJsonObject } })
      .catch(() => null);
    console.error(`[podcast] transcription failed for ${id}`, error);
    return { ok: false, message: `The transcription failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/* ------------------------------------------------------------------ */
/* Show notes                                                           */
/* ------------------------------------------------------------------ */

/** Transcripts longer than this are summarised in parts first. */
export const CHUNK_CHARS = 60_000;

export function chunkTranscript(transcript: string, size = CHUNK_CHARS): string[] {
  if (transcript.length <= size) return [transcript];
  const chunks: string[] = [];
  let current = "";
  for (const p of transcriptParagraphs(transcript)) {
    if (current && current.length + p.length + 2 > size) {
      chunks.push(current);
      current = "";
    }
    // A single paragraph longer than the limit is cut, so no chunk is ever too big.
    for (let i = 0; i < p.length; i += size) {
      const piece = p.slice(i, i + size);
      current = current ? `${current}\n\n${piece}` : piece;
      if (current.length >= size) {
        chunks.push(current);
        current = "";
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const momentSchema = z.object({
  time: z.string().describe("The [mm:ss] marker from the transcript where this moment starts, without brackets, for example 12:30."),
  label: z.string().describe("A short, plain description of what is discussed, under 70 characters."),
});

const partSchema = z.object({
  points: z.array(z.string()).describe("The main points made in this part of the conversation, one sentence each."),
  moments: z.array(momentSchema).max(6),
  quotes: z.array(z.string()).max(5).describe("Sentences copied exactly, word for word, from the transcript. Never paraphrase."),
});

const notesSchema = z.object({
  fade: z.string().describe("A short second line that completes the episode title and says what listeners will learn, ending with a full stop."),
  summary: z.string().describe("Two or three sentences that tell a practitioner what the episode covers and why it is worth their time."),
  showNotes: z.string().describe("Three to six paragraphs of plain text, separated by blank lines, covering the conversation in order. No Markdown, no bullets."),
  keyMoments: z.array(momentSchema).max(10),
  guestBio: z.string().describe("Two or three sentences about the guest, using only what the transcript and the details given say."),
  quotes: z.array(z.string()).max(5).describe("Up to three memorable sentences copied exactly, word for word, from the transcript. Never paraphrase or tidy them."),
});

const NOTES_SYSTEM = `You write show notes for the Trichollective podcast, a monthly conversation hosted by ${site.founderFull} for hair and scalp professionals. Write for practitioners, plainly and in full sentences. Describe what the guest said; never add advice of your own, never diagnose and never make treatment claims. Nothing on the podcast is medical advice. Quotes must be copied exactly from the transcript.`;

type Notes = z.infer<typeof notesSchema>;

export function cleanMoments(raw: { time: string; label: string }[], transcript: string, durationSec: number | null): KeyMoment[] {
  const markers = transcriptMarkers(transcript);
  const seen = new Set<number>();
  const out: KeyMoment[] = [];
  for (const m of raw) {
    const t = parseTimestamp(m.time.replace(/[[\]]/g, ""));
    const label = m.label.trim().replace(/\.$/, "");
    if (t === null || !label || seen.has(t)) continue;
    if (markers.size ? !markers.has(t) : durationSec ? t > durationSec : false) continue;
    seen.add(t);
    out.push({ t, label: label.slice(0, 200) });
  }
  return out.sort((a, b) => a.t - b.t);
}

function episodeFacts(e: PodcastEpisode) {
  return [
    `Episode title: ${e.title}`,
    e.guestName ? `Guest: ${e.guestName}${e.guestRole ? `, ${e.guestRole}` : ""}` : "",
    e.topic ? `Topic: ${e.topic}` : "",
    e.guestBio ? `Existing guest bio: ${e.guestBio}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function draftNotes(e: PodcastEpisode, transcript: string, note?: string): Promise<Notes | null> {
  const chunks = chunkTranscript(transcript);
  const ask = note ? `\n\nNote from the editor for this version: ${note}` : "";
  if (chunks.length === 1) {
    return generateStructured(notesSchema, NOTES_SYSTEM, `${episodeFacts(e)}${ask}\n\nTranscript:\n${transcript}`);
  }
  const parts: z.infer<typeof partSchema>[] = [];
  for (const [i, chunk] of chunks.entries()) {
    const part = await generateStructured(
      partSchema,
      NOTES_SYSTEM,
      `${episodeFacts(e)}\n\nThis is part ${i + 1} of ${chunks.length} of the transcript. Note what is said in it.\n\n${chunk}`
    );
    if (part) parts.push(part);
  }
  if (!parts.length) return null;
  const material = parts
    .map(
      (p, i) =>
        `Part ${i + 1}\nPoints:\n${p.points.map((x) => `- ${x}`).join("\n")}\nMoments:\n${p.moments.map((m) => `- ${m.time} ${m.label}`).join("\n")}\nQuotes:\n${p.quotes.map((q) => `- ${q}`).join("\n")}`
    )
    .join("\n\n");
  return generateStructured(
    notesSchema,
    NOTES_SYSTEM,
    `${episodeFacts(e)}${ask}\n\nThe transcript was too long to read at once, so here are notes from each part in order. Use only the moments and quotes listed, exactly as given.\n\n${material}`
  );
}

/** Summary, show notes, key moments, guest bio and quotes, written from the transcript. */
export async function writeShowNotes(id: string, note?: string): Promise<StepResult> {
  const episode = await prisma.podcastEpisode.findUnique({ where: { id } });
  if (!episode) return { ok: false, message: "That episode no longer exists." };
  const transcript = episode.transcript?.trim();
  if (!transcript) return { ok: false, message: "Add a transcript first. The show notes are written from it." };

  const notes = await draftNotes(episode, transcript, note?.trim() || undefined);
  if (!notes) {
    return { ok: false, message: "The writing assistant isn't available right now, so the show notes weren't drafted. You can write them by hand below." };
  }

  const keyMoments = cleanMoments(notes.keyMoments, transcript, episode.durationSec);
  const quotes = quotesInTranscript(notes.quotes, transcript).slice(0, 3);
  await prisma.podcastEpisode.update({
    where: { id },
    data: {
      summary: notes.summary.trim(),
      showNotes: notes.showNotes.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
      keyMoments: keyMoments as unknown as Prisma.InputJsonArray,
      guestBio: notes.guestBio.trim() || episode.guestBio,
      quotes,
      ...(episode.fade.trim() ? {} : { fade: notes.fade.trim() }),
      status: episode.status === "planning" ? "draft" : episode.status,
    },
  });
  return {
    ok: true,
    message: `Drafted the show notes with ${keyMoments.length} key moment${keyMoments.length === 1 ? "" : "s"} and ${quotes.length} quote${quotes.length === 1 ? "" : "s"} checked against the transcript. Read them through before publishing.`,
  };
}

/* ------------------------------------------------------------------ */
/* Announcing                                                           */
/* ------------------------------------------------------------------ */

export const episodeHref = (slug: string) => `/podcast/${slug}`;

/** The episode's title as one sentence: "Title, fade." */
export function episodeHeading(e: Pick<PodcastEpisode, "title" | "fade">) {
  const title = e.title.trim();
  const fade = e.fade.trim();
  if (!fade) return /[.?]$/.test(title) ? title : `${title}.`;
  return `${title.replace(/[,.]$/, "")}, ${fade.charAt(0).toLowerCase()}${fade.slice(1)}`.replace(/([^.?])$/, "$1.");
}

function imageKey(key: string | null | undefined): keyof typeof images {
  return key && key in images ? (key as keyof typeof images) : "community";
}

/** The announcement email and community post drafts for a published episode. Pure, for testing. */
export function episodeDrafts(e: PodcastEpisode, communityBody: string | null) {
  const href = episodeHref(e.slug);
  const label = e.number ? `Episode ${e.number}` : "A new episode";
  const guest = e.guestName ? `${e.guestName}${e.guestRole ? `, ${e.guestRole},` : ""}` : null;
  const length = formatDuration(e.durationSec);
  const facts: [string, string][] = [];
  if (e.guestName) facts.push(["Guest", e.guestRole ? `${e.guestName}, ${e.guestRole}` : e.guestName]);
  if (length) facts.push(["Length", length]);
  if (e.transcript) facts.push(["Transcript", e.membersOnly ? "Free for members" : "Free to read"]);

  const subject = `${label} of the Trichollective podcast is out now`;
  const announcementBody = [
    e.summary.trim() || (guest ? `In this episode, ${site.founder} talks to ${guest} about ${e.topic ?? "their work"}.` : `${site.founder} has a new conversation for you.`),
    e.transcript
      ? e.membersOnly
        ? "You can listen on the episode page or in your podcast app, and members can read the full transcript alongside it."
        : "You can listen on the episode page or in your podcast app, and read the full transcript alongside it."
      : "You can listen on the episode page or in your podcast app.",
    "Our guests share their own experience. Nothing on the podcast is medical advice.",
  ].join("\n\n");

  const announcement = {
    kind: "announcement",
    title: subject,
    summary: "Announces the new podcast episode to every member and subscriber who gets news of new releases.",
    body: announcementBody,
    payload: {
      type: "podcast",
      subject,
      preheader: episodeHeading(e),
      eyebrow: e.number ? `Podcast, episode ${e.number}` : "Podcast",
      heading: episodeHeading(e),
      href,
      image: imageKey(e.coverImageKey),
      cta: { label: "Listen to the episode", href },
      ...(facts.length ? { facts } : {}),
    } satisfies Prisma.InputJsonObject,
    ref: `podcast:${e.id}:announcement`,
    risk: "high" as const,
  };

  const postTitle = `New podcast: ${e.title.replace(/[,.]$/, "")}`;
  const post = {
    kind: "community_post",
    title: postTitle,
    summary: "Shares the new episode in the Lounge and asks members what they took from it.",
    body:
      communityBody ??
      [
        guest
          ? `The new episode of the podcast is out. ${site.founder} talks to ${guest} about ${e.topic ?? "their work"}.`
          : "The new episode of the podcast is out.",
        e.summary.trim(),
        `You can listen here: ${href}`,
        "Once you have listened, tell us what you would do differently in your own practice, or what you would ask the guest next.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    payload: { type: "podcast", title: postTitle, space: "lounge" } satisfies Prisma.InputJsonObject,
    ref: `podcast:${e.id}:community`,
    risk: "high" as const,
  };

  return { announcement, post };
}

/**
 * Draft the announcement email and the community post for a newly published
 * episode. Both wait in the inbox for approval. Each is drafted once per
 * episode. Never throws.
 */
export async function announceEpisode(id: string) {
  try {
    const episode = await prisma.podcastEpisode.findUnique({ where: { id } });
    if (!episode || episode.status !== "published") return { announcement: null, post: null };
    const communityBody = await generate(
      "Write a short community post, 80 to 140 words, sharing a new podcast episode with members in the Lounge. Say who the guest is and what they discuss, using only the details given. Include the episode link on its own line. End with one open question that invites members to share how they handle the same subject in their own practice. No hashtags.",
      `${episodeFacts(episode)}\nSummary: ${episode.summary || "none"}\nEpisode link: ${episodeHref(episode.slug)}`
    );
    const { announcement, post } = episodeDrafts(episode, communityBody);
    const [a, p] = await Promise.all([
      createDraft({ ...announcement, agent: PODCAST_AGENT, runId: null, agentRisk: "high" }),
      createDraft({ ...post, agent: PODCAST_AGENT, runId: null, agentRisk: "high" }),
    ]);
    return { announcement: a, post: p };
  } catch (error) {
    console.error(`[podcast] could not draft announcements for episode ${id}`, error);
    return { announcement: null, post: null };
  }
}

/** The episode behind a podcast draft, from refs like podcast:{id}:announcement. Null for anything else. */
export function episodeIdFromRef(ref: unknown) {
  if (typeof ref !== "string") return null;
  const match = /^podcast:([^:#]+):(announcement|community)$/.exec(ref);
  return match ? match[1] : null;
}
