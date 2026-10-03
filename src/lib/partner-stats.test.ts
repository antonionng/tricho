import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { isBot, shouldCount, summariseStats, utcDay, recordPartnerStat, plural } = await import("./partner-stats");

const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

describe("utcDay", () => {
  it("rounds down to midnight UTC", () => {
    expect(utcDay(new Date("2026-10-03T23:59:00+01:00")).toISOString()).toBe("2026-10-03T00:00:00.000Z");
    expect(utcDay(new Date("2026-10-04T00:30:00+01:00")).toISOString()).toBe("2026-10-03T00:00:00.000Z");
  });
});

describe("isBot and shouldCount", () => {
  it("skips crawlers, previews and empty user agents", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Discordbot/2.0)")).toBe(true);
    expect(isBot("WhatsApp link preview")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot(chrome)).toBe(false);
  });
  it("skips the team and the brand's own visits", () => {
    expect(shouldCount({ userAgent: chrome })).toBe(true);
    expect(shouldCount({ userAgent: chrome, viewerIsStaff: true })).toBe(false);
    expect(shouldCount({ userAgent: chrome, viewerEmail: "Owner@Brand.com", ownerEmail: "owner@brand.com" })).toBe(false);
    expect(shouldCount({ userAgent: chrome, viewerEmail: "member@clinic.ie", ownerEmail: "owner@brand.com" })).toBe(true);
  });
});

describe("summariseStats", () => {
  const now = new Date("2026-10-03T15:00:00Z");

  it("fills every day with zeros, oldest first", () => {
    const { series, totals, from, to } = summariseStats([], 7, now);
    expect(series).toHaveLength(7);
    expect(series[0].day).toBe("2026-09-27");
    expect(series[6].day).toBe("2026-10-03");
    expect(from.toISOString().slice(0, 10)).toBe("2026-09-27");
    expect(to.toISOString().slice(0, 10)).toBe("2026-10-03");
    expect(totals).toEqual({ views: 0, websiteClicks: 0, perkViews: 0, perkClaims: 0 });
  });

  it("adds rows into their day and the totals, ignoring days outside the window", () => {
    const { series, totals } = summariseStats(
      [
        { day: new Date("2026-10-03T00:00:00Z"), views: 5, websiteClicks: 2 },
        { day: new Date("2026-09-30T00:00:00Z"), views: 3, perkViews: 10, perkClaims: 1 },
        { day: new Date("2026-09-01T00:00:00Z"), views: 100 },
      ],
      7,
      now
    );
    expect(totals).toEqual({ views: 8, websiteClicks: 2, perkViews: 10, perkClaims: 1 });
    expect(series.find((d) => d.day === "2026-09-30")).toMatchObject({ views: 3, perkViews: 10, perkClaims: 1 });
    expect(series.at(-1)).toMatchObject({ views: 5, websiteClicks: 2 });
  });
});

describe("recordPartnerStat", () => {
  it("never throws, even when the database is unavailable", async () => {
    await expect(recordPartnerStat("p1", "views")).resolves.toBeUndefined();
  });
});

describe("plural", () => {
  it("chooses the right word", () => {
    expect(plural(1, "view", "views")).toBe("1 view");
    expect(plural(1200, "view", "views")).toBe("1,200 views");
  });
});
