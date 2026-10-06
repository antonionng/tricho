import { fail, json, withMember } from "@/lib/mobile/api";
import { goingSentence } from "@/components/members/EventAttendees";
import { formatEventDate, formatEventTime } from "@/components/editorial/events";
import { professionById } from "@/config/rooms";
import { googleCalendarHref } from "@/lib/calendar-links";
import { absoluteUrl } from "@/lib/mail/layout";
import { memberEventStatus } from "@/lib/event-status";
import { memberEventBySlug, visibleAttendees } from "@/app/members/events/_data";
import { presentEvent } from "../_present";

/** One event, with who is going, the calendar links and, for members who are going online, the joining link. */
export const GET = withMember<{ slug: string }>(
  async (_req, ctx, { slug }) => {
    const userId = ctx.session.user.id;
    const event = await memberEventBySlug(slug);
    if (!event) return fail(404, "This event is no longer listed.");

    const status = memberEventStatus(event, userId);
    const attendees = visibleAttendees(event.rsvps, userId);
    const pageUrl = absoluteUrl(`/members/events/${event.slug}`);
    return json({
      event: {
        ...presentEvent(event, status, ctx.chapterId ?? null),
        date: formatEventDate(event.startsAt),
        timeLong: `${formatEventTime(event.startsAt, event.endsAt)} (Irish and UK time)`,
        paragraphs: (event.body ?? "")
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean),
        attending: status.attending,
        joinUrl: status.joinUrl,
        calendar: status.attending
          ? {
              google: googleCalendarHref({ ...event, joinUrl: status.joinUrl, pageUrl }),
              ics: absoluteUrl(`/api/events/${event.id}/ics`),
            }
          : null,
        chapter: event.chapter,
        url: pageUrl,
        attendees: attendees.map((a) => ({
          id: a.id,
          name: a.name,
          image: a.image,
          you: a.id === userId,
          profession: a.profile?.profession ? professionById(a.profile.profession)?.label ?? "Member" : "Member",
        })),
        goingText: status.past
          ? `${attendees.length} ${attendees.length === 1 ? "member" : "members"} said they were going.`
          : goingSentence(attendees.length, attendees.some((a) => a.id === userId)),
      },
    });
  },
  { members: true }
);
