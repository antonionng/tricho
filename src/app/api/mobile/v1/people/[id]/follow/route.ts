import { body, fail, json, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { toggleFollow } from "@/app/members/people/actions";

async function setFollow(me: string, id: string, want: boolean) {
  if (id === me) return fail(400, "You can't follow yourself.");
  const key = { followerId_followeeId: { followerId: me, followeeId: id } };
  const now = !!(await prisma.follow.findUnique({ where: key }));
  // The website's action toggles; only call it when the state needs to change, so retries are safe.
  if (now !== want) await toggleFollow(id);
  const following = !!(await prisma.follow.findUnique({ where: key }));
  if (want && !following) return fail(404, "That member could not be found.");
  return json({ ok: true, following });
}

/** Follows the member. Pass { follow: false } to unfollow. Answers { ok, following }. */
export const POST = withMember<{ id: string }>(
  async (req, ctx, { id }) => {
    const { follow } = await body<{ follow: boolean }>(req);
    return setFollow(ctx.session.user.id, id, follow !== false);
  },
  { members: true }
);

/** Unfollows the member. */
export const DELETE = withMember<{ id: string }>(async (_req, ctx, { id }) => setFollow(ctx.session.user.id, id, false), { members: true });
