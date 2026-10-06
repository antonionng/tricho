import { json, withMember } from "@/lib/mobile/api";
import { goingSentence } from "@/components/members/EventAttendees";
import { memberEventStatus } from "@/lib/event-status";
import { upcomingMemberEvents } from "@/app/members/events/_data";
import { site } from "@/config/site";
import { presentEvent } from "./_present";

/** Events members can come to, soonest first. Mirrors /members/events. */
export const GET = withMember(
  async (_req, ctx) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const events = await upcomingMemberEvents(now);
    const going = events.filter((e) => e.rsvps.some((r) => r.userId === userId)).length;
    return json({
      going,
      next: { city: site.next.city, status: site.next.status },
      events: events.map((e) => {
        const status = memberEventStatus(e, userId, now);
        const attendees = e.rsvps.map((r) => r.user).filter((u) => u.accessStatus === "active");
        return {
          ...presentEvent(e, status, ctx.chapterId ?? null),
          attendees: attendees.slice(0, 5).map((a) => ({ id: a.id, name: a.name, image: a.image })),
          goingText: goingSentence(attendees.length, attendees.some((a) => a.id === userId)),
        };
      }),
    });
  },
  { members: true }
);
