import { describe, expect, it } from "vitest";
import {
  accessState,
  buildMemberWhere,
  memberCsvRow,
  memberFilterQuery,
  membersCsv,
  parseMemberFilters,
  untilFromDays,
  sourceKey,
  sourceLabel,
  startOfToday,
  MEMBER_CSV_HEADER,
} from "./members-filter";

const now = new Date("2026-10-02T12:00:00Z");
const SYSTEM = "team@trichollective.local";
const DAY = 24 * 60 * 60 * 1000;

describe("member filters", () => {
  it("ignores values it doesn't recognise", () => {
    expect(parseMemberFilters({ q: "  dublin ", plan: "gold", status: "deleted" })).toEqual({ q: "dublin", plan: "", status: "" });
    expect(parseMemberFilters({ plan: "none", status: "staff" })).toEqual({ q: "", plan: "none", status: "staff" });
    expect(parseMemberFilters({ plan: ["business", "community"] }).plan).toBe("business");
  });

  it("keeps filters in links", () => {
    expect(memberFilterQuery({ q: "a b", plan: "", status: "banned" })).toBe("?q=a+b&status=banned");
    expect(memberFilterQuery({})).toBe("");
    expect(memberFilterQuery({ plan: "professional" }, { cursor: "x" })).toBe("?plan=professional&cursor=x");
  });

  it("always leaves out the system account", () => {
    const where = buildMemberWhere({ q: "", plan: "", status: "" }, now, SYSTEM);
    expect(where).toEqual({ AND: [{ NOT: { email: SYSTEM } }] });
  });

  it("searches name, email and city without minding case", () => {
    const where = buildMemberWhere({ q: "niamh", plan: "", status: "" }, now, SYSTEM);
    const or = (where.AND as object[])[1] as { OR: object[] };
    expect(or.OR).toHaveLength(3);
    expect(JSON.stringify(or)).toContain('"mode":"insensitive"');
  });

  it("matches a plan whether it is paid for or complimentary", () => {
    const where = buildMemberWhere({ q: "", plan: "professional", status: "" }, now, SYSTEM);
    expect((where.AND as object[])[1]).toEqual({ OR: [{ plan: "professional" }, { compPlan: "professional" }] });
    const none = buildMemberWhere({ q: "", plan: "none", status: "" }, now, SYSTEM);
    expect((none.AND as object[])[1]).toEqual({ plan: null, compPlan: null });
  });

  it("counts a suspension only while it lasts", () => {
    const where = buildMemberWhere({ q: "", plan: "", status: "suspended" }, now, SYSTEM);
    expect((where.AND as object[])[1]).toEqual({
      accessStatus: "suspended",
      OR: [{ accessUntil: null }, { accessUntil: { gt: now } }],
    });
  });

  it("treats a running complimentary plan as active and not lapsed", () => {
    const active = JSON.stringify(buildMemberWhere({ q: "", plan: "", status: "active" }, now, SYSTEM));
    expect(active).toContain("compPlan");
    const lapsed = (buildMemberWhere({ q: "", plan: "", status: "lapsed" }, now, SYSTEM).AND as object[])[1] as Record<string, unknown>;
    expect(lapsed.NOT).toBeDefined();
    expect(lapsed.plan).toEqual({ not: null });
  });

  it("lists the team for staff", () => {
    const where = buildMemberWhere({ q: "", plan: "", status: "staff" }, now, SYSTEM);
    expect((where.AND as object[])[1]).toEqual({ staffRole: { not: null } });
  });
});

describe("joined today and sources", () => {
  it("filters to people who joined since midnight in Ireland", () => {
    expect(parseMemberFilters({ joined: "today" }).joined).toBe("today");
    expect(parseMemberFilters({ joined: "yesterday" }).joined).toBeUndefined();
    expect(memberFilterQuery({ joined: "today" })).toBe("?joined=today");
    const where = buildMemberWhere({ q: "", plan: "", status: "", joined: "today" }, now, SYSTEM);
    expect((where.AND as object[])[1]).toEqual({ createdAt: { gte: startOfToday(now) } });
  });

  it("finds midnight in Irish summer and winter time", () => {
    expect(startOfToday(new Date("2026-10-02T12:00:00Z")).toISOString()).toBe("2026-10-01T23:00:00.000Z");
    expect(startOfToday(new Date("2026-12-02T12:00:00Z")).toISOString()).toBe("2026-12-02T00:00:00.000Z");
    expect(startOfToday(new Date("2026-10-02T23:30:00Z")).toISOString()).toBe("2026-10-02T23:00:00.000Z");
  });

  it("counts dublin and ireland as Trichollective Ireland", () => {
    expect(sourceKey("dublin")).toBe("ireland");
    expect(sourceKey("Ireland")).toBe("ireland");
    expect(sourceKey(null)).toBe("direct");
    expect(sourceLabel("dublin")).toBe("Trichollective Ireland");
    expect(sourceLabel("ireland")).toBe("Trichollective Ireland");
    expect(sourceLabel("instagram")).toBe("Instagram");
    expect(sourceLabel("spring_promo")).toBe("Spring promo");
  });
});

describe("access state", () => {
  it("lets suspensions and mutes run out on their own", () => {
    expect(accessState({ accessStatus: "banned" }, now)).toBe("banned");
    expect(accessState({ accessStatus: "suspended", accessUntil: null }, now)).toBe("suspended");
    expect(accessState({ accessStatus: "suspended", accessUntil: new Date(now.getTime() - DAY) }, now)).toBe("active");
    expect(accessState({ accessStatus: "active", mutedUntil: new Date(now.getTime() + DAY) }, now)).toBe("muted");
    expect(accessState({ accessStatus: "active", mutedUntil: new Date(now.getTime() - DAY) }, now)).toBe("active");
  });

  it("turns a duration into an end date, or none for until lifted", () => {
    expect(untilFromDays(7, now)?.toISOString()).toBe("2026-10-09T12:00:00.000Z");
    expect(untilFromDays(0, now)).toBeNull();
    expect(untilFromDays(Number.NaN, now)).toBeNull();
  });
});

describe("member spreadsheet", () => {
  const row = {
    name: "=Niamh, Byrne",
    email: "niamh@example.com",
    plan: "professional",
    compPlan: null,
    stripeCurrentPeriodEnd: new Date("2026-11-01T00:00:00Z"),
    isFounding: true,
    role: "trichologist",
    staffRole: null,
    accessStatus: "active",
    mutedUntil: null,
    createdAt: new Date("2026-09-01T10:00:00Z"),
    signupSource: "dublin",
  };

  it("has the columns in order", () => {
    expect(MEMBER_CSV_HEADER).toEqual(["name", "email", "plan", "comp_plan", "active_until", "founding", "role", "staff_role", "access", "joined", "source"]);
  });

  it("writes one safe row per member", () => {
    expect(memberCsvRow(row, now)).toBe(`"'=Niamh, Byrne",niamh@example.com,professional,,2026-11-01,yes,trichologist,,active,2026-09-01,dublin`);
  });

  it("starts with the header and ends with a newline", () => {
    const csv = membersCsv([row, { ...row, accessStatus: "banned", name: "Aoife" }], now);
    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toBe(MEMBER_CSV_HEADER.join(","));
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain(",banned,");
    expect(csv.endsWith("\n")).toBe(true);
  });
});
