import { json, page, withMember } from "@/lib/mobile/api";
import { searchMembers } from "@/lib/people";
import { cleanQuery, parseProfession, personSubtitle } from "@/lib/people-search";
import { PROFESSIONS, professionById } from "@/config/rooms";

/**
 * The member directory, as on /members/people. ?q= searches name, city, practice,
 * specialism or discipline; ?profession= narrows to one discipline. The cursor is
 * an offset: pass back `nextCursor` for the next page.
 */
export const GET = withMember(
  async (req, ctx) => {
    const me = ctx.session.user.id;
    const { cursor, limit, url } = page(req, 24);
    const skip = Math.max(0, Math.min(12_000, Number.parseInt(cursor ?? "0", 10) || 0));
    const q = cleanQuery(url.searchParams.get("q"));
    const profession = parseProfession(url.searchParams.get("profession"));
    const { people, total, following } = await searchMembers({ me, q, profession, skip, take: limit });

    return json({
      people: people.map((p) => {
        const discipline = p.profile?.profession ? professionById(p.profile.profession)?.label ?? null : null;
        const place = p.profile?.city || p.chapter?.city || p.profile?.location || null;
        return {
          id: p.id,
          name: p.name,
          image: p.image,
          isFounding: p.isFounding,
          verified: !!p.profile?.isVerified,
          discipline,
          subtitle: personSubtitle({ discipline, practiceName: p.profile?.practiceName, specialization: p.profile?.specialization, place }),
          following: following.has(p.id),
          isMe: p.id === me,
        };
      }),
      total,
      nextCursor: skip + people.length < total && people.length > 0 ? String(skip + people.length) : null,
      professions: PROFESSIONS.map((p) => ({ id: p.id, label: p.label })),
    });
  },
  { members: true }
);
