import type { TrichologistProfile } from "@prisma/client";
import { PROFESSIONS } from "@/config/rooms";
import { LISTING_COUNTRIES } from "@/content/chapters";
import { GOALS, INTEREST_GROUPS, MEMBERSHIP_BODIES, SOCIAL_KEYS, SOCIAL_NETWORKS, readQualifications, readSocials } from "@/lib/profile";

/** The choices the profile and onboarding forms offer, so the app never keeps its own copy. */
export function profileOptions(chapters: { slug: string; city: string; country?: string }[]) {
  return {
    professions: PROFESSIONS.map(({ id, label, blurb }) => ({ id, label, blurb })),
    chapters,
    countries: [...LISTING_COUNTRIES],
    goals: GOALS.map(({ id, label }) => ({ id, label })),
    interestGroups: INTEREST_GROUPS.map((g) => ({ topic: g.topic, items: g.items.map(({ id, label }) => ({ id, label })) })),
    membershipBodies: MEMBERSHIP_BODIES.map(({ id, label }) => ({ id, label })),
    socials: SOCIAL_KEYS.map((key) => ({ key, label: SOCIAL_NETWORKS[key].label })),
  };
}

/** The fields a member can edit, in the shapes the app's forms use. */
export function editableProfile(profile: TrichologistProfile | null | undefined) {
  return {
    headline: profile?.headline ?? null,
    practiceName: profile?.practiceName ?? null,
    city: profile?.city ?? profile?.location ?? null,
    country: profile?.country ?? null,
    bio: profile?.bio ?? null,
    specialisms: profile?.specialisms.length ? profile.specialisms : profile?.specialization ? [profile.specialization] : [],
    services: profile?.services ?? [],
    yearsInPractice: profile?.yearsInPractice ?? null,
    qualifications: readQualifications(profile?.qualifications),
    memberships: profile?.memberships ?? [],
    phone: profile?.phone ?? null,
    website: profile?.website ?? null,
    socials: readSocials(profile?.socials),
    addressLine1: profile?.addressLine1 ?? null,
    addressLine2: profile?.addressLine2 ?? null,
    postcode: profile?.postcode ?? null,
    showPhone: !!profile?.showPhone,
    showAddress: !!profile?.showAddress,
    goals: profile?.goals ?? [],
    interests: profile?.interests ?? [],
  };
}
