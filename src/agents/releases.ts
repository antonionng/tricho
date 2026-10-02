import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { courses } from "@/content/courses";
import type { Edition } from "@/content/gazette";
import {
  articlesAnnouncement,
  courseAnnouncement,
  editionsAnnouncement,
  eventAnnouncement,
  type Announcement,
} from "@/lib/mail/templates/releases";
import type { AgentDefinition, DraftInput } from "./types";
import { DAY, monthLabel } from "./util";

/** Only things released in the last two weeks are announced. */
export const RELEASE_WINDOW_DAYS = 14;

/** The draft an announcement becomes. Always "high" risk: Karley approves every send. */
export function announcementDraft(a: Announcement): DraftInput {
  const payload: Prisma.InputJsonObject = {
    type: a.type,
    subject: a.subject,
    preheader: a.preheader,
    eyebrow: a.eyebrow,
    heading: a.heading,
    href: a.href,
    image: a.image,
    cta: a.cta,
    ...(a.facts ? { facts: a.facts } : {}),
    ...(a.covers ? { covers: a.covers } : {}),
  };
  return {
    kind: "announcement",
    title: a.subject,
    summary: `Announces this ${a.type === "article" ? "month's Trichozette pieces" : a.type} to every member and subscriber who gets news of new releases.`,
    body: a.body,
    payload,
    ref: a.ref,
    risk: "high",
  };
}

/**
 * Every release ref that already has an announcement, in any state, including
 * the refs a combined announcement covers. Drafts moved aside by "Regenerate"
 * don't count, so they can be drafted again.
 */
export async function knownReleaseRefs() {
  const drafts = await prisma.draft.findMany({ where: { kind: "announcement" }, select: { payload: true } });
  const known = new Set<string>();
  for (const d of drafts) {
    const p = (d.payload ?? {}) as Record<string, unknown>;
    if (typeof p.replacedRef === "string") continue;
    if (typeof p.ref === "string") known.add(p.ref);
    if (Array.isArray(p.covers)) for (const c of p.covers) if (typeof c === "string") known.add(c);
  }
  return known;
}

/** "2026-09-30" as a date, read as midnight UTC. */
function isoDay(value: string) {
  const t = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(t) ? null : new Date(t);
}

/** Monthly editions published in the window, grouped by publication day. The archive series is never included. */
export function newEditions(list: Edition[], now: Date, known: Set<string>) {
  const since = now.getTime() - RELEASE_WINDOW_DAYS * DAY;
  const byDay = new Map<string, Edition[]>();
  for (const e of list) {
    if (e.series === "archive") continue;
    const at = isoDay(e.published);
    if (!at || at.getTime() < since || at.getTime() > now.getTime()) continue;
    if (known.has(`release:edition:${e.slug}`)) continue;
    const day = e.published.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), e]);
  }
  return [...byDay.values()];
}

export const releasesAgent: AgentDefinition = {
  id: "releases",
  name: "Release announcer",
  description:
    "Spots anything new from the last two weeks: Trichozette editions and pieces, courses that open, and newly published events. It drafts a short announcement for each, and when you approve one it goes to every member, free account and subscriber who gets news of new releases.",
  schedule: "Daily at 7:30am",
  cron: "30 7 * * *",
  risk: "high",
  async run(ctx) {
    const { now } = ctx;
    const since = new Date(now.getTime() - RELEASE_WINDOW_DAYS * DAY);
    const known = await knownReleaseRefs();
    const made: string[] = [];

    const add = async (a: Announcement) => {
      if (known.has(a.ref)) return;
      const created = await ctx.createDraft(announcementDraft(a));
      if (created) {
        made.push(a.subject);
        known.add(a.ref);
        for (const c of a.covers ?? []) known.add(c);
      }
    };

    /* 1. Trichozette editions. Several published on one day share one email. */
    // Built-in editions and those published from Studio. Imported here so tests of this module never load server-only code.
    const { getEditions } = await import("@/content/gazette/loader");
    for (const group of newEditions(await getEditions(), now, known)) await add(editionsAnnouncement(group));

    /* 2. Courses, once they open. The catalogue has no publication date, so opening is the release. */
    for (const c of courses) if (c.status === "open") await add(courseAnnouncement(c));

    /* 3. Upcoming events published or changed in the window. Studio announces new ones straight away too. */
    const events = await prisma.event.findMany({
      where: { published: true, startsAt: { gt: now }, updatedAt: { gte: since } },
      orderBy: { startsAt: "asc" },
    });
    for (const e of events) await add(eventAnnouncement(e));

    /* 4. This month's Trichozette pieces, once none of them is still waiting in the inbox. */
    const articles = await prisma.draft.findMany({
      where: { kind: "gazette_article", status: { in: ["published", "draft"] } },
      select: { title: true, status: true, publishedAt: true, payload: true },
      orderBy: { publishedAt: "asc" },
    });
    const byMonth = new Map<string, { titles: string[]; waiting: boolean; recent: boolean }>();
    for (const a of articles) {
      const month = (a.payload as Record<string, unknown> | null)?.edition;
      if (typeof month !== "string") continue;
      const row = byMonth.get(month) ?? { titles: [], waiting: false, recent: false };
      if (a.status === "draft") row.waiting = true;
      else {
        row.titles.push(a.title);
        if (a.publishedAt && a.publishedAt >= since) row.recent = true;
      }
      byMonth.set(month, row);
    }
    for (const [month, row] of byMonth) {
      if (!row.recent || row.waiting || !row.titles.length) continue;
      const [y, m] = month.split("-").map(Number);
      const label = y && m ? monthLabel(new Date(Date.UTC(y, m - 1, 15))) : month;
      await add(articlesAnnouncement(month, label, row.titles));
    }

    return {
      summary: made.length
        ? `Drafted ${made.length} announcement${made.length === 1 ? "" : "s"}: ${made.join("; ")}. Nothing is sent until you approve it.`
        : "Nothing new to announce.",
    };
  },
};
