import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { isReviewLink, reviewEnabled } from "./review";

const sp = (review?: string) => Promise.resolve(review === undefined ? {} : { review });
const TOKEN = "a".repeat(32);

afterEach(() => vi.unstubAllEnvs());

describe("review links", () => {
  it("are off unless a long enough token is set", async () => {
    vi.stubEnv("REVIEW_TOKEN", "");
    expect(reviewEnabled()).toBe(false);
    expect(await isReviewLink(sp(""))).toBe(false);
    vi.stubEnv("REVIEW_TOKEN", "short");
    expect(await isReviewLink(sp("short"))).toBe(false);
  });

  it("open only with the exact token", async () => {
    vi.stubEnv("REVIEW_TOKEN", TOKEN);
    expect(await isReviewLink(sp(TOKEN))).toBe(true);
    expect(await isReviewLink(sp(TOKEN.slice(1) + "b"))).toBe(false);
    expect(await isReviewLink(sp())).toBe(false);
    expect(await isReviewLink(undefined)).toBe(false);
  });
});
