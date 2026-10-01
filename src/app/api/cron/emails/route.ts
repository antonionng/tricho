import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { deliverOnce, ownerEmails } from "@/lib/mail/send";
import { eventReminderEmail } from "@/lib/mail/templates/members";
import { digestIsEmpty, ownerDigestEmail, type DigestLead, type OwnerDigest } from "@/lib/mail/templates/owners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const HOUR = 60 * 60 * 1000;

const PLAN_LABEL: Record<string, string> = { community: "Community", professional: "Professional", business: "Business" };

/** Everyone who RSVP'd to an event starting in 24 to 48 hours gets one reminder. */
async function sendEventReminders(now: Date) {
  const events = await prisma.event.findMany({
    where: { published: true, startsAt: { gte: new Date(now.getTime() + 24 * HOUR), lt: new Date(now.getTime() + 48 * HOUR) } },
    include: { rsvps: { select: { userId: true, user: { select: { name: true, email: true } } } } },
  });
  let sent = 0;
  for (const event of events) {
    for (const r of event.rsvps) {
      if (!r.user.email) continue;
      const email = eventReminderEmail({ name: r.user.name, event });
      if (await deliverOnce(`event-reminder:${event.id}:${r.userId}`, r.user.email, email.subject, email.content, { tag: "event-reminder" })) {
        sent++;
      }
    }
  }
  return sent;
}

function payloadField(payload: unknown, key: string) {
  const v = payload && typeof payload === "object" ? (payload as Record<string, unknown>)[key] : null;
  return typeof v === "string" ? v : "";
}

async function gatherDigest(now: Date): Promise<OwnerDigest> {
  const since = new Date(now.getTime() - 24 * HOUR);
  const recent = { gte: since };
  const realUsers = { email: { not: null, notIn: [SYSTEM_USER_EMAIL] } };

  const [subscriberRows, newUsers, listingsWaiting, enquiryRows, contacts, partners, reportsOpen] = await Promise.all([
    prisma.subscriber.findMany({ where: { createdAt: recent }, select: { email: true, source: true, createdAt: true } }),
    prisma.user.findMany({
      where: { ...realUsers, createdAt: recent },
      select: { name: true, email: true, plan: true, stripeCurrentPeriodEnd: true, createdAt: true },
    }),
    prisma.directoryListing.count({ where: { status: "pending", isSample: false } }),
    prisma.enquiry.groupBy({ by: ["status"], where: { createdAt: recent }, _count: { _all: true } }),
    prisma.draft.findMany({ where: { kind: "contact", createdAt: recent }, select: { payload: true, createdAt: true } }),
    prisma.draft.findMany({ where: { kind: "partner_enquiry", createdAt: recent }, select: { payload: true, createdAt: true } }),
    prisma.report.count({ where: { resolvedAt: null } }),
  ]);

  const bySource = new Map<string, number>();
  for (const s of subscriberRows) bySource.set(s.source || "website", (bySource.get(s.source || "website") ?? 0) + 1);

  // New accounts that are paying now count as paid members; the rest are free accounts.
  const paid = newUsers.filter((u) => u.plan && u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > now);
  const byPlan = new Map<string, number>();
  for (const u of paid) {
    const label = PLAN_LABEL[u.plan ?? ""] ?? String(u.plan);
    byPlan.set(label, (byPlan.get(label) ?? 0) + 1);
  }

  const count = (status: string) => enquiryRows.find((r) => r.status === status)?._count._all ?? 0;

  const leads: (DigestLead & { at: Date })[] = [
    ...newUsers.map((u) => ({
      name: u.name,
      email: u.email ?? "",
      source: paid.includes(u) ? `${PLAN_LABEL[u.plan ?? ""] ?? "Paid"} member` : "Free account",
      at: u.createdAt,
    })),
    ...subscriberRows.map((s) => ({ name: null, email: s.email, source: `Subscriber, ${s.source || "website"}`, at: s.createdAt })),
    ...contacts.map((c) => ({
      name: payloadField(c.payload, "name") || null,
      email: payloadField(c.payload, "email"),
      source: "Contact form",
      at: c.createdAt,
    })),
    ...partners.map((p) => ({
      name: payloadField(p.payload, "name") || null,
      email: payloadField(p.payload, "email"),
      source: "Partner enquiry",
      at: p.createdAt,
    })),
  ].filter((l) => l.email.includes("@"));

  // One line per person: the most recent way they reached us.
  const seen = new Set<string>();
  const newest = leads
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .filter((l) => {
      const key = l.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 15)
    .map(({ name, email, source }) => ({ name, email, source }));

  return {
    dateLabel: now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" }),
    subscribersBySource: [...bySource.entries()].map(([source, n]) => ({ source, count: n })).sort((a, b) => b.count - a.count),
    freeAccounts: newUsers.length - paid.length,
    paidByPlan: [...byPlan.entries()].map(([plan, n]) => ({ plan, count: n })),
    listingsWaiting,
    enquiriesDelivered: count("forwarded") + count("closed"),
    enquiriesHeld: count("new"),
    contactMessages: contacts.length,
    partnerApplications: partners.length,
    reportsOpen,
    leads: newest,
  };
}

async function sendOwnerDigest(now: Date) {
  const digest = await gatherDigest(now);
  if (digestIsEmpty(digest)) return { sent: 0, skipped: true };
  const { subject, content } = ownerDigestEmail(digest);
  const day = now.toISOString().slice(0, 10);
  let sent = 0;
  for (const owner of ownerEmails()) {
    if (await deliverOnce(`owner-digest:${day}:${owner}`, owner, subject, content, { tag: "owner-digest" })) sent++;
  }
  return { sent, skipped: false };
}

/** Daily: event reminders and the owners' summary. Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const now = new Date();
  const result: Record<string, unknown> = {};
  try {
    result.reminders = await sendEventReminders(now);
  } catch (error) {
    console.error("[cron/emails] event reminders failed", error);
    result.remindersError = error instanceof Error ? error.message : String(error);
  }
  try {
    result.digest = await sendOwnerDigest(now);
  } catch (error) {
    console.error("[cron/emails] owner digest failed", error);
    result.digestError = error instanceof Error ? error.message : String(error);
  }
  const failed = "remindersError" in result || "digestError" in result;
  return NextResponse.json(result, { status: failed ? 500 : 200 });
}
