import { prisma } from "@/lib/prisma";
import { eventAnnouncement } from "@/lib/mail/templates/releases";
import { announcementDraft, knownReleaseRefs } from "./releases";
import { createDraft } from "./runtime";

/**
 * Draft the announcement for an event the moment it is published in Studio,
 * so Karley finds it in the inbox straight away. Uses the same ref as the
 * Release announcer, which therefore never drafts it twice. Never throws.
 */
export async function announceEvent(eventId: string) {
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.published || event.startsAt.getTime() <= Date.now()) return null;
    const a = eventAnnouncement(event);
    if ((await knownReleaseRefs()).has(a.ref)) return null;
    return await createDraft({ ...announcementDraft(a), agent: "releases", runId: null, agentRisk: "high" });
  } catch (error) {
    console.error(`[releases] could not draft an announcement for event ${eventId}`, error);
    return null;
  }
}
