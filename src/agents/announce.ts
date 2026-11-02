import { prisma } from "@/lib/prisma";
import { eventAnnouncement, masterclassAnnouncement } from "@/lib/mail/templates/releases";
import { eventDay } from "@/lib/mail/templates/members";
import { announcementDraft, knownReleaseRefs } from "./releases";
import { createDraft } from "./runtime";

/**
 * Draft the announcement for an event the moment it is published in Studio,
 * so Karley finds it in the inbox straight away. Uses the same ref as the
 * Release announcer, which therefore never drafts it twice. Masterclasses use
 * their own wording, with the sponsor and presenters. Never throws.
 */
export async function announceEvent(eventId: string) {
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { sponsor: { select: { name: true } } } });
    if (!event || !event.published || event.startsAt.getTime() <= Date.now()) return null;
    const a = event.kind === "masterclass" ? masterclassAnnouncement({ ...event, sponsorName: event.sponsor?.name ?? null }) : eventAnnouncement(event);
    if ((await knownReleaseRefs()).has(a.ref)) return null;
    return await createDraft({ ...announcementDraft(a), agent: "releases", runId: null, agentRisk: "high" });
  } catch (error) {
    console.error(`[releases] could not draft an announcement for event ${eventId}`, error);
    return null;
  }
}

/** The in-app notification every user gets for a masterclass. */
export function masterclassNotice(e: { title: string; slug: string; startsAt: Date; sponsorName?: string | null }) {
  const sponsored = e.sponsorName ? ` (sponsored by ${e.sponsorName})` : "";
  return {
    kind: "masterclass",
    title: `New masterclass: ${e.title}, ${eventDay(e.startsAt)}${sponsored}`,
    // The public page works for everyone: members book at the member price, everyone else buys a guest ticket.
    href: `/events/${e.slug}`,
  };
}

export const masterclassRef = (eventId: string, userId: string) => `masterclass:${eventId}:${userId}`;

const BATCH = 1000;

export type MasterclassAnnouncement = { notified: number; drafted: boolean; firstTime: boolean };

/**
 * Tell everyone about a newly published masterclass: an in-app notification for every
 * active account straight away (members and free accounts alike), and the announcement
 * email drafted for approval. Each person is notified at most once per masterclass,
 * however often it is saved, republished or this is run again, because every
 * notification carries its own ref. Never throws.
 *
 * `onlyFirstTime` skips the run when the masterclass was announced before, which is what
 * saving in Studio wants; the "Notify all users" button runs it again to catch anyone missed.
 */
export async function announceMasterclass(eventId: string, { onlyFirstTime = false } = {}): Promise<MasterclassAnnouncement | null> {
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { sponsor: { select: { name: true } } } });
    if (!event || event.kind !== "masterclass" || !event.published || event.startsAt.getTime() <= Date.now()) return null;
    if (onlyFirstTime && event.announcedAt) return null;

    const notice = masterclassNotice({ ...event, sponsorName: event.sponsor?.name ?? null });
    const users = await prisma.user.findMany({ where: { accessStatus: "active" }, select: { id: true } });
    let notified = 0;
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH).map((u) => ({ userId: u.id, ...notice, refKey: masterclassRef(event.id, u.id) }));
      notified += (await prisma.notification.createMany({ data: batch, skipDuplicates: true })).count;
    }
    const marked = await prisma.event.updateMany({ where: { id: event.id, announcedAt: null }, data: { announcedAt: new Date() } });
    const drafted = !!(await announceEvent(event.id));
    return { notified, drafted, firstTime: marked.count > 0 };
  } catch (error) {
    console.error(`[releases] could not announce masterclass ${eventId}`, error);
    return null;
  }
}
