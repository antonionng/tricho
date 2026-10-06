import "server-only";
import type { Prisma, Profession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPosts, memberDirectoryWhere } from "@/lib/community";
import { professionById } from "@/config/rooms";
import { urlForFile } from "@/lib/storage";
import { SOCIAL_KEYS, SOCIAL_NETWORKS, readQualifications, readSocials } from "@/lib/profile";
import { referralBlocker } from "@/lib/client-referrals";
import { loadRecipient } from "@/app/members/referrals/_data";
import { profileCertificates } from "@/lib/courses";
import { peopleSearchWhere } from "@/lib/people-search";

/**
 * The member directory: members who have settled in, matching the search, newest
 * first so people met at a gathering are easy to find.
 */
export async function searchMembers({
  me,
  q,
  profession,
  skip = 0,
  take,
}: {
  me: string;
  q: string;
  profession?: Profession | null;
  skip?: number;
  take: number;
}) {
  const search = peopleSearchWhere(q);
  const where: Prisma.UserWhereInput = {
    AND: [memberDirectoryWhere(), ...(search ? [search] : []), ...(profession ? [{ profile: { profession } }] : [])],
  };
  const [people, total, following] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ onboardedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        name: true,
        image: true,
        isFounding: true,
        chapter: { select: { city: true } },
        profile: { select: { profession: true, specialization: true, location: true, city: true, practiceName: true, isVerified: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.follow.findMany({ where: { followerId: me }, select: { followeeId: true } }),
  ]);
  return { people, total, following: new Set(following.map((f) => f.followeeId)) };
}

/** Everything a member's profile page shows, as seen by `viewer`. Null when there is no such member. */
export async function getMemberProfile(id: string, viewer: { id: string; professional: boolean }) {
  const me = viewer.id;
  const person = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      isFounding: true,
      chapter: { select: { slug: true, city: true } },
      profile: {
        select: {
          profession: true,
          specialization: true,
          bio: true,
          location: true,
          photoFileId: true,
          headline: true,
          practiceName: true,
          city: true,
          country: true,
          specialisms: true,
          services: true,
          qualifications: true,
          memberships: true,
          yearsInPractice: true,
          website: true,
          socials: true,
          phone: true,
          showPhone: true,
          addressLine1: true,
          addressLine2: true,
          postcode: true,
          showAddress: true,
          isVerified: true,
        },
      },
      listings: {
        where: { status: "listed", slug: { not: null } },
        select: { slug: true, headline: true, photoUrl: true, isVerified: true },
        take: 1,
      },
      _count: { select: { followers: true, following: true } },
    },
  });
  if (!person) return null;

  const [isFollowing, posts, uploadedPhoto, recipient, badges] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followeeId: { followerId: me, followeeId: id } } }),
    getPosts({ userId: me, professional: viewer.professional, authorId: id, take: 10 }),
    urlForFile(person.profile?.photoFileId),
    viewer.professional && me !== id ? loadRecipient(id) : null,
    profileCertificates(person.id),
  ]);
  const profile = person.profile;
  const listing = person.listings[0];
  const socials = readSocials(profile?.socials);
  return {
    person,
    profile,
    listing,
    posts,
    badges,
    uploadedPhoto,
    isMe: me === id,
    isFollowing: !!isFollowing,
    canRefer: !!recipient && !referralBlocker({ id: me, professional: viewer.professional }, recipient),
    discipline: profile?.profession ? professionById(profile.profession) : null,
    headline: profile?.headline || listing?.headline,
    place: [profile?.city || profile?.location, profile?.country].filter(Boolean).join(", "),
    qualifications: readQualifications(profile?.qualifications),
    specialisms: profile?.specialisms.length ? profile.specialisms : profile?.specialization ? [profile.specialization] : [],
    socialLinks: SOCIAL_KEYS.filter((k) => socials[k]).map((k) => ({ key: k, url: socials[k]!, label: SOCIAL_NETWORKS[k].label })),
    phone: profile?.showPhone && profile.phone ? profile.phone : null,
    address: profile?.showAddress
      ? [profile.addressLine1, profile.addressLine2, profile.city, profile.postcode].filter(Boolean).join(", ")
      : null,
    verified: !!profile?.isVerified || !!listing?.isVerified,
  };
}

export type MemberProfile = NonNullable<Awaited<ReturnType<typeof getMemberProfile>>>;
