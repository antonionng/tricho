import { fail, runAction, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { shareGoingAction } from "@/app/members/events/actions";

/**
 * "Tell the community you're going": posts once in The Lounge. Answers
 * { ok, redirect } with the post's path, or the event's path with ?shared=no
 * when it could not be shared.
 */
export const POST = withMember<{ slug: string }>(
  async (_req, _ctx, { slug }) => {
    const event = await prisma.event.findFirst({ where: { slug, published: true }, select: { id: true } });
    if (!event) return fail(404, "This event is no longer listed.");
    return runAction(() => shareGoingAction(event.id));
  },
  { members: true }
);
