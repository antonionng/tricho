import { fail, runAction, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { toggleRsvp } from "@/app/members/events/actions";

/** Save or release a free place: the website's RSVP button. Answers { ok, going }. */
export const POST = withMember<{ slug: string }>(
  async (_req, _ctx, { slug }) => {
    const event = await prisma.event.findFirst({ where: { slug, published: true }, select: { id: true } });
    if (!event) return fail(404, "This event is no longer listed.");
    return runAction(() => toggleRsvp(event.id));
  },
  { members: true }
);
