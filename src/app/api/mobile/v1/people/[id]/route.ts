import { fail, json, withMember } from "@/lib/mobile/api";
import { getMemberProfile } from "@/lib/people";
import { membershipLabel } from "@/lib/profile";

/** A member's profile and recent posts, as on /members/people/[id]. Contact details follow the member's own privacy choices. */
export const GET = withMember<{ id: string }>(
  async (_req, ctx, { id }) => {
    const view = await getMemberProfile(id, { id: ctx.session.user.id, professional: ctx.professional });
    if (!view) return fail(404, "That member could not be found.");
    const { person, profile, listing } = view;
    return json({
      id: person.id,
      name: person.name,
      image: view.uploadedPhoto || listing?.photoUrl || person.image,
      isFounding: person.isFounding,
      verified: view.verified,
      headline: view.headline ?? null,
      practiceName: profile?.practiceName ?? null,
      place: view.place || null,
      discipline: view.discipline ? { id: view.discipline.id, label: view.discipline.label } : null,
      chapter: person.chapter,
      bio: profile?.bio ?? null,
      specialisms: view.specialisms,
      services: profile?.services ?? [],
      yearsInPractice: profile?.yearsInPractice ?? null,
      qualifications: view.qualifications,
      memberships: (profile?.memberships ?? []).map(membershipLabel),
      badges: view.badges,
      contact: {
        website: profile?.website ?? null,
        socials: view.socialLinks,
        phone: view.phone,
        address: view.address || null,
      },
      publicPath: listing?.slug ? `/directory/p/${listing.slug}` : null,
      counts: { followers: person._count.followers, following: person._count.following },
      isMe: view.isMe,
      following: view.isFollowing,
      canRefer: view.canRefer,
      posts: view.posts,
    });
  },
  { members: true }
);
