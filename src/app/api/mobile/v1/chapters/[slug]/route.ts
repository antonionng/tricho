import { fail, json, withMember } from "@/lib/mobile/api";
import { getChapter } from "@/app/members/chapters/[slug]/_data";

/** A local chapter: its posts, members and upcoming meetups. */
export const GET = withMember<{ slug: string }>(async (_req, ctx, { slug }) => {
  const data = await getChapter(slug, { userId: ctx.session.user.id, professional: ctx.professional, chapterId: ctx.chapterId });
  if (!data) return fail(404, "This chapter could not be found.");
  const { chapter, isMine, blurb, posts, members, memberCount, events } = data;
  return json({
    chapter: { slug: chapter.slug, city: chapter.city, country: chapter.country },
    isMine,
    blurb,
    posts,
    members: members.map((m) => ({ id: m.id, name: m.name, image: m.image, profession: m.profile?.profession ?? null })),
    memberCount,
    events: events.map(({ rsvps, ...e }) => ({ ...e, going: rsvps.length > 0 })),
  });
}, { members: true });
