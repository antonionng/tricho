import { describe, expect, it } from "vitest";
import { formatMinutes, isTvKind, tvEmbedUrl, tvPost, tvPostSpace, tvThumbnail } from "./tv";

const masterclass = {
  kind: "masterclass" as const,
  title: "The five-minute scalp check.",
  summary: "A practical session for stylists and head spa therapists.",
  presenters: "Karley Weir",
  professionalOnly: false,
};

describe("tvPost", () => {
  it("names the recording, credits the presenters and asks members to talk about it", () => {
    const post = tvPost(masterclass);
    expect(post.title).toBe("Masterclass recording: The five-minute scalp check");
    expect(post.content).toContain("Presented by Karley Weir.");
    expect(post.content).toContain(masterclass.summary);
    expect(post.content).toContain("Trichollective TV");
    expect(post.space).toBe("lounge");
  });

  it("shares Professional-only recordings in the Case Room and reminds members to keep clients anonymous", () => {
    const post = tvPost({ ...masterclass, kind: "case_round", professionalOnly: true, presenters: null });
    expect(post.title.startsWith("Case round recording:")).toBe(true);
    expect(post.space).toBe("case-room");
    expect(post.content).toContain("without anything that could identify a client");
    expect(post.content).not.toContain("Presented by");
  });

  it("doesn't repeat the kind when the event title already starts with it", () => {
    expect(tvPost({ ...masterclass, title: "Masterclass: the five-minute scalp check" }).title).toBe(
      "Masterclass recording: the five-minute scalp check"
    );
    expect(tvPost({ ...masterclass, kind: "case_round", title: "Case round: November" }).title).toBe("Case round recording: November");
  });

  it("keeps the title within the community's limit", () => {
    expect(tvPost({ ...masterclass, title: "x".repeat(300) }).title.length).toBeLessThanOrEqual(140);
  });
});

describe("tvPostSpace", () => {
  it("is the Lounge unless the video is for Professional members", () => {
    expect(tvPostSpace({ professionalOnly: false })).toBe("lounge");
    expect(tvPostSpace({ professionalOnly: true })).toBe("case-room");
  });
});

describe("players and stills", () => {
  it("builds the privacy-friendly YouTube player and its still", () => {
    const v = { provider: "youtube", videoId: "dQw4w9WgXcQ" };
    expect(tvEmbedUrl(v)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(tvThumbnail(v)).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("keeps a private Vimeo hash for the player, with no still", () => {
    const v = { provider: "vimeo", videoId: "123456789:abcdef1234" };
    expect(tvEmbedUrl(v)).toBe("https://player.vimeo.com/video/123456789?h=abcdef1234&dnt=1");
    expect(tvThumbnail(v)).toBeNull();
  });

  it("refuses anything that isn't a known provider and a valid id", () => {
    expect(tvEmbedUrl({ provider: "drive", videoId: "abc" })).toBeNull();
    expect(tvEmbedUrl({ provider: "youtube", videoId: "../evil" })).toBeNull();
  });
});

describe("small helpers", () => {
  it("formats a length in minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(95)).toBe("1 hr 35 min");
    expect(formatMinutes(null)).toBeNull();
  });

  it("knows the shelves", () => {
    expect(isTvKind("case_round")).toBe(true);
    expect(isTvKind("gathering")).toBe(false);
  });
});
