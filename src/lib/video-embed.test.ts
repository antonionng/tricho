import { describe, expect, it } from "vitest";
import { parseVideoUrl, videoEmbedUrl } from "./video-embed";

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=42", "dQw4w9WgXcQ"],
    ["youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x", "dQw4w9WgXcQ"],
  ])("reads YouTube link %s", (url, id) => {
    expect(parseVideoUrl(url)).toEqual({ provider: "youtube", id });
  });

  it.each([
    ["https://vimeo.com/76979871", "76979871"],
    ["https://vimeo.com/76979871/8272103f6e", "76979871:8272103f6e"],
    ["https://player.vimeo.com/video/76979871?h=8272103f6e", "76979871:8272103f6e"],
    ["https://vimeo.com/channels/staffpicks/76979871", "76979871"],
  ])("reads Vimeo link %s", (url, id) => {
    expect(parseVideoUrl(url)).toEqual({ provider: "vimeo", id });
  });

  it.each(["", "not a link", "https://example.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=short", "javascript:alert(1)", "https://vimeo.com/about"])(
    "rejects %s",
    (url) => {
      expect(parseVideoUrl(url)).toBeNull();
    }
  );
});

describe("videoEmbedUrl", () => {
  it("only ever builds an embed on the providers' own player domains", () => {
    expect(videoEmbedUrl({ provider: "youtube", id: "dQw4w9WgXcQ" })).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(videoEmbedUrl({ provider: "vimeo", id: "76979871:8272103f6e" })).toBe("https://player.vimeo.com/video/76979871?h=8272103f6e&dnt=1");
    expect(videoEmbedUrl({ provider: "youtube", id: "x\"><script>" })).toBeNull();
  });
});
