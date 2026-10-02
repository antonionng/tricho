import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PodcastEpisode } from "@prisma/client";

const db = vi.hoisted(() => ({
  podcastEpisode: { findUnique: vi.fn(), update: vi.fn() },
}));
const ai = vi.hoisted(() => ({ generate: vi.fn(), generateStructured: vi.fn() }));
const runtime = vi.hoisted(() => ({ createDraft: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("./ai", () => ai);
vi.mock("./runtime", () => runtime);
vi.mock("./gazette", () => ({
  readMonth: vi.fn(async () => ({ ranked: [], spaces: [["hair-loss", { score: 3, posts: [] }]], keywords: ["minoxidil"] })),
}));

import {
  announceEpisode,
  chunkTranscript,
  cleanMoments,
  episodeHeading,
  fallbackPlan,
  planEpisode,
  transcribeEpisode,
  transcriptFromUtterances,
  writeShowNotes,
} from "./podcast";

function episode(over: Partial<PodcastEpisode> = {}): PodcastEpisode {
  return {
    id: "ep1",
    slug: "scalp-health",
    number: 3,
    season: null,
    status: "draft",
    title: "Why the scalp is skin,",
    fade: "and what that means for your consultations.",
    summary: "A conversation about the scalp.",
    showNotes: "",
    keyMoments: null,
    quotes: [],
    guestName: "Dr Sample",
    guestRole: "Dermatologist",
    guestBio: null,
    guestUserId: null,
    topic: "scalp health",
    audioUrl: "https://host.example/ep.mp3",
    embedUrl: null,
    externalId: null,
    durationSec: 1800,
    coverImageKey: null,
    transcript: "[00:00] Speaker A: Welcome to the show.\n\n[01:15] Speaker B: The scalp is skin and deserves the same care.\n\n[02:30] Speaker B: Refer early when you are unsure.",
    transcriptStatus: "ready",
    plan: null,
    membersOnly: true,
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  ai.generate.mockResolvedValue(null);
  ai.generateStructured.mockResolvedValue(null);
  db.podcastEpisode.update.mockResolvedValue({});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("planEpisode", () => {
  it("falls back to a template without AI", async () => {
    const plan = await planEpisode({ guestName: "Aoife", topic: "head spa" });
    expect(plan).toEqual(fallbackPlan({ guestName: "Aoife", topic: "head spa" }));
    expect(plan.questions.length).toBeGreaterThanOrEqual(6);
    expect(plan.runningOrder.reduce((t, s) => t + s.minutes, 0)).toBeGreaterThan(30);
  });

  it("uses the AI plan and gives it the month's context", async () => {
    const aiPlan = { title: "T,", fade: "F.", questions: [], runningOrder: [] };
    ai.generateStructured.mockResolvedValueOnce(aiPlan);
    expect(await planEpisode({ guestName: "Aoife", guestRole: "Trichologist", topic: "x", notes: "n" })).toBe(aiPlan);
    const prompt = ai.generateStructured.mock.calls[0][2] as string;
    expect(prompt).toContain("Guest: Aoife");
    expect(prompt).toContain("minoxidil");
  });
});

describe("transcription", () => {
  it("builds markers from utterances and breaks long answers at sentence ends", () => {
    const words = [
      { text: "First", start: 0 },
      { text: "sentence.", start: 1000 },
      { text: "Still", start: 61_000 },
      { text: "going.", start: 62_000 },
      { text: "New", start: 63_000 },
      { text: "paragraph.", start: 64_000 },
    ];
    expect(
      transcriptFromUtterances([
        { speaker: "A", text: "Hello there.", start: 5000 },
        { speaker: "B", text: "ignored", start: 0, words },
      ])
    ).toBe("[00:05] Speaker A: Hello there.\n\n[00:00] Speaker B: First sentence.\n\n[01:01] Still going. New paragraph.");
  });

  it("refuses without a key", async () => {
    vi.stubEnv("ASSEMBLYAI_API_KEY", "");
    expect((await transcribeEpisode("ep1")).ok).toBe(false);
    expect(db.podcastEpisode.findUnique).not.toHaveBeenCalled();
  });

  it("submits the audio URL, polls and saves the transcript", async () => {
    vi.stubEnv("ASSEMBLYAI_API_KEY", "test-key");
    db.podcastEpisode.findUnique.mockResolvedValue(episode({ transcriptStatus: "none" }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "job1", status: "queued" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "job1", status: "processing" })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "job1", status: "completed", utterances: [{ speaker: "A", text: "Hi.", start: 0 }] }))
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeEpisode("ep1", { pollMs: 1 });
    expect(result.ok).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ audio_url: "https://host.example/ep.mp3" });
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe("test-key");
    const updates = db.podcastEpisode.update.mock.calls.map((c) => c[0].data);
    expect(updates[0]).toMatchObject({ transcriptStatus: "transcribing", plan: { _transcriptJob: "job1" } });
    expect(updates.at(-1)).toMatchObject({ transcriptStatus: "ready", transcript: "[00:00] Speaker A: Hi.", plan: {} });
  });

  it("picks up a job that is still running instead of starting again", async () => {
    vi.stubEnv("ASSEMBLYAI_API_KEY", "test-key");
    db.podcastEpisode.findUnique.mockResolvedValue(episode({ transcriptStatus: "transcribing", plan: { _transcriptJob: "job9" } }));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "job9", status: "error", error: "Bad audio" })));
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeEpisode("ep1", { pollMs: 1 });
    expect(fetchMock.mock.calls[0][0]).toContain("/transcript/job9");
    expect(result).toMatchObject({ ok: false });
    expect(result.message).toContain("Bad audio");
    expect(db.podcastEpisode.update.mock.calls.at(-1)?.[0].data).toMatchObject({ transcriptStatus: "failed" });
  });
});

describe("show notes", () => {
  it("only keeps moments that match a transcript marker", () => {
    const t = episode().transcript!;
    expect(
      cleanMoments(
        [
          { time: "02:30", label: "Referral." },
          { time: "01:15", label: "Scalp as skin" },
          { time: "01:16", label: "Made up" },
          { time: "nonsense", label: "x" },
        ],
        t,
        1800
      )
    ).toEqual([
      { t: 75, label: "Scalp as skin" },
      { t: 150, label: "Referral" },
    ]);
    expect(cleanMoments([{ time: "40:00", label: "Too late" }, { time: "10:00", label: "Fine" }], "no markers", 1800)).toEqual([
      { t: 600, label: "Fine" },
    ]);
  });

  it("chunks long transcripts by paragraph", () => {
    const para = "word ".repeat(200).trim();
    const chunks = chunkTranscript(Array(10).fill(para).join("\n\n"), 2500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2500);
    expect(chunkTranscript("short")).toEqual(["short"]);
  });

  it("saves notes and drops quotes that aren't in the transcript", async () => {
    db.podcastEpisode.findUnique.mockResolvedValue(episode({ fade: "" }));
    ai.generateStructured.mockResolvedValueOnce({
      fade: "and why it matters.",
      summary: "Summary.",
      showNotes: "One.\n\n\n\nTwo.",
      keyMoments: [{ time: "01:15", label: "Scalp" }, { time: "09:99", label: "Bad" }],
      guestBio: "A dermatologist.",
      quotes: ["The scalp is skin and deserves the same care", "Something never said at all", "Refer early when you are unsure", "Welcome to the show"],
    });
    const result = await writeShowNotes("ep1", "Shorter please");
    expect(result.ok).toBe(true);
    expect(ai.generateStructured.mock.calls[0][2]).toContain("Shorter please");
    const data = db.podcastEpisode.update.mock.calls[0][0].data;
    expect(data).toMatchObject({
      summary: "Summary.",
      showNotes: "One.\n\nTwo.",
      keyMoments: [{ t: 75, label: "Scalp" }],
      guestBio: "A dermatologist.",
      fade: "and why it matters.",
    });
    expect(data.quotes).toEqual(["The scalp is skin and deserves the same care", "Refer early when you are unsure", "Welcome to the show"]);
  });

  it("summarises long transcripts in parts before combining", async () => {
    const long = Array(30).fill(`[00:00] ${"talk ".repeat(600)}`).join("\n\n");
    db.podcastEpisode.findUnique.mockResolvedValue(episode({ transcript: long }));
    ai.generateStructured.mockImplementation(async (_schema, _system, prompt: string) =>
      prompt.includes("This is part")
        ? { points: ["A point."], moments: [{ time: "00:00", label: "Start" }], quotes: [] }
        : { fade: "f.", summary: "s", showNotes: "n", keyMoments: [{ time: "00:00", label: "Start" }], guestBio: "", quotes: [] }
    );
    const result = await writeShowNotes("ep1");
    expect(result.ok).toBe(true);
    const calls = ai.generateStructured.mock.calls.length;
    expect(calls).toBeGreaterThan(2);
    expect(ai.generateStructured.mock.calls[calls - 1][2]).toContain("Part 1");
  });

  it("explains when there is no transcript or no AI", async () => {
    db.podcastEpisode.findUnique.mockResolvedValueOnce(episode({ transcript: null }));
    expect((await writeShowNotes("ep1")).ok).toBe(false);
    db.podcastEpisode.findUnique.mockResolvedValueOnce(episode());
    expect((await writeShowNotes("ep1")).ok).toBe(false);
    expect(db.podcastEpisode.update).not.toHaveBeenCalled();
  });
});

describe("announceEpisode", () => {
  it("drafts an announcement and a community post for a published episode", async () => {
    db.podcastEpisode.findUnique.mockResolvedValue(episode({ status: "published" }));
    runtime.createDraft.mockResolvedValue({ id: "d", status: "draft" });
    await announceEpisode("ep1");
    expect(runtime.createDraft).toHaveBeenCalledTimes(2);
    const [a, p] = runtime.createDraft.mock.calls.map((c) => c[0]);
    expect(a).toMatchObject({
      kind: "announcement",
      agent: "podcast",
      ref: "podcast:ep1:announcement",
      payload: { type: "podcast", href: "/podcast/scalp-health", cta: { href: "/podcast/scalp-health" } },
    });
    expect(a.body).toContain("Nothing on the podcast is medical advice");
    expect(p).toMatchObject({ kind: "community_post", ref: "podcast:ep1:community", payload: { type: "podcast", space: "lounge" } });
    expect(p.payload.title).toBe("New podcast: Why the scalp is skin");
  });

  it("does nothing for an unpublished episode and never throws", async () => {
    db.podcastEpisode.findUnique.mockResolvedValueOnce(episode({ status: "draft" }));
    await announceEpisode("ep1");
    db.podcastEpisode.findUnique.mockRejectedValueOnce(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(announceEpisode("ep1")).resolves.toEqual({ announcement: null, post: null });
    expect(runtime.createDraft).not.toHaveBeenCalled();
  });

  it("writes the title as one sentence", () => {
    expect(episodeHeading({ title: "Why the scalp is skin,", fade: "And what it means." })).toBe("Why the scalp is skin, and what it means.");
    expect(episodeHeading({ title: "A title", fade: "" })).toBe("A title.");
  });
});
