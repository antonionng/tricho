import { describe, expect, it } from "vitest";
import {
  ORG_STAGES,
  OPEN_STAGES,
  STAGE_LABEL,
  buildOrgWhere,
  changedFields,
  cleanUrl,
  crmFilterQuery,
  initials,
  intakeFields,
  mergeTimeline,
  organisationsCsv,
  parseCrmFilters,
  parseDay,
  parseGBP,
  parseTags,
  pipelineTotals,
  readSocials,
  ORG_CSV_HEADER,
} from "./crm";

const now = new Date("2026-10-02T12:00:00Z");

describe("stages", () => {
  it("describes every stage in a full sentence", () => {
    for (const s of ORG_STAGES) {
      expect(STAGE_LABEL[s].label).toBeTruthy();
      expect(STAGE_LABEL[s].description).toMatch(/\.$/);
    }
    expect(OPEN_STAGES).toEqual(["lead", "contacted", "proposal"]);
  });
});

describe("parseTags", () => {
  it("splits, trims, lower-cases and de-duplicates", () => {
    expect(parseTags(" Scalp care, Devices ,scalp  care,, ")).toEqual(["scalp care", "devices"]);
    expect(parseTags("")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
  it("keeps at most twenty tags of forty characters", () => {
    const many = Array.from({ length: 30 }, (_, i) => `t${i}`).join(",");
    expect(parseTags(many)).toHaveLength(20);
    expect(parseTags("x".repeat(80))[0]).toHaveLength(40);
  });
});

describe("filters", () => {
  it("ignores values it doesn't recognise", () => {
    expect(parseCrmFilters({ q: " acme ", stage: "nope", kind: "bank", owner: "a b", view: "grid" })).toEqual({
      q: "acme",
      stage: "",
      kind: "",
      tag: "",
      owner: "",
      due: false,
      view: "table",
    });
    expect(parseCrmFilters({ stage: "open", kind: "clinic", tag: "VIP", owner: "none", due: "1", view: "board" })).toEqual({
      q: "",
      stage: "open",
      kind: "clinic",
      tag: "vip",
      owner: "none",
      due: true,
      view: "board",
    });
  });

  it("round-trips through a query string", () => {
    const f = parseCrmFilters({ q: "acme", stage: "won", due: "1", view: "board" });
    expect(crmFilterQuery(f)).toBe("?q=acme&stage=won&due=1&view=board");
    expect(crmFilterQuery(f, { view: "" })).toBe("?q=acme&stage=won&due=1");
    expect(crmFilterQuery({})).toBe("");
  });

  it("builds a Prisma query", () => {
    expect(buildOrgWhere({})).toEqual({});
    const where = buildOrgWhere({ q: "acme", stage: "open", tag: "vip", owner: "none", due: true }, now);
    const and = where.AND as object[];
    expect(and).toHaveLength(5);
    expect(JSON.stringify(and[0])).toContain("contacts");
    expect(and[1]).toEqual({ stage: { in: ["lead", "contacted", "proposal"] } });
    expect(and[2]).toEqual({ tags: { has: "vip" } });
    expect(and[3]).toEqual({ ownerStaffId: null });
    expect(and[4]).toEqual({ followUpAt: { lte: now } });
    expect(buildOrgWhere({ stage: "won", owner: "u1", kind: "salon" })).toEqual({
      AND: [{ stage: "won" }, { kind: "salon" }, { ownerStaffId: "u1" }],
    });
  });
});

describe("pipelineTotals", () => {
  it("counts every stage and sums the open pipeline", () => {
    const t = pipelineTotals([
      { stage: "lead", valueGBP: 1000 },
      { stage: "lead", valueGBP: null },
      { stage: "proposal", valueGBP: 2500 },
      { stage: "won", valueGBP: 9000 },
      { stage: "mystery", valueGBP: 1 },
    ]);
    expect(t.byStage.lead).toEqual({ count: 2, value: 1000 });
    expect(t.byStage.won).toEqual({ count: 1, value: 9000 });
    expect(t.byStage.churned).toEqual({ count: 0, value: 0 });
    expect(t.open).toEqual({ count: 3, value: 3500 });
  });
});

describe("parsing", () => {
  it("reads pounds", () => {
    expect(parseGBP("£12,500")).toBe(12500);
    expect(parseGBP("")).toBeNull();
    expect(parseGBP("12.5")).toBeUndefined();
  });
  it("reads days", () => {
    expect(parseDay("2026-10-14")?.toISOString()).toBe("2026-10-14T12:00:00.000Z");
    expect(parseDay("")).toBeNull();
    expect(parseDay("14/10/2026")).toBeUndefined();
  });
  it("keeps only web links", () => {
    expect(cleanUrl("example.com")).toBe("https://example.com/");
    expect(cleanUrl("http://acme.co.uk/shop")).toBe("http://acme.co.uk/shop");
    expect(cleanUrl("javascript:alert(1)")).toBeNull();
    expect(cleanUrl("")).toBeNull();
  });
  it("makes initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("ada.byron@example.com")).toBe("AB");
    expect(initials(null)).toBe("?");
  });
  it("reads socials", () => {
    expect(readSocials({ instagram: " @acme ", twitter: "x", tiktok: 4 })).toEqual({ instagram: "@acme" });
    expect(readSocials(null)).toEqual({});
  });
});

describe("timeline", () => {
  it("merges notes, changes and the intake, newest first, without repeating notes", () => {
    const items = mergeTimeline({
      notes: [{ id: "n1", createdAt: new Date("2026-10-01"), kind: "call", body: "Spoke to Sam." }],
      audits: [
        { id: "a1", createdAt: new Date("2026-10-02"), action: "organisation.stage", summary: "Moved to proposal.", actorEmail: "t@x" },
        { id: "a2", createdAt: new Date("2026-10-01"), action: "organisation.note", summary: "Added a note.", actorEmail: "t@x" },
      ],
      intake: { at: new Date("2026-09-01"), source: "application", value: { company: "Acme", application: true, nested: { a: 1 }, empty: "" } },
    });
    expect(items.map((i) => i.id)).toEqual(["a1", "n1", "intake"]);
    const intake = items[2];
    expect(intake.type === "intake" && intake.fields).toEqual([
      ["Company", "Acme"],
      ["Application", "Yes"],
    ]);
  });
  it("labels intake keys readably", () => {
    expect(intakeFields({ contactEmail: "a@b.c", vat_number: "GB1" })).toEqual([
      ["Contact email", "a@b.c"],
      ["Vat number", "GB1"],
    ]);
    expect(intakeFields(["x"])).toEqual([]);
  });
});

describe("changedFields", () => {
  it("returns only what changed", () => {
    const r = changedFields({ name: "A", city: null as string | null, tags: ["x"] }, { name: "A", city: "Leeds", tags: ["x"] });
    expect(r.changed).toEqual(["city"]);
    expect(r.before).toEqual({ city: null });
    expect(r.after).toEqual({ city: "Leeds" });
  });
});

describe("export", () => {
  it("writes a header and safe rows", () => {
    const csv = organisationsCsv([
      {
        name: "=Acme, Ltd",
        kind: "brand",
        stage: "lead",
        interest: "premium",
        valueGBP: 1200,
        followUpAt: new Date("2026-10-10T12:00:00Z"),
        owner: "Sam",
        tags: ["vip", "devices"],
        email: null,
        phone: null,
        website: null,
        city: null,
        country: null,
        accountEmail: null,
        primaryName: null,
        primaryEmail: null,
        source: "studio",
        createdAt: new Date("2026-10-01T09:00:00Z"),
      },
    ]);
    const [head, row] = csv.trim().split("\n");
    expect(head).toBe(ORG_CSV_HEADER.join(","));
    expect(row.startsWith(`"'=Acme, Ltd",brand,lead,premium,1200,2026-10-10,Sam,vip; devices`)).toBe(true);
  });
});
