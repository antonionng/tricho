/** Shapes of /api/mobile/v1/profile and /onboarding. */

export type Option = { id: string; label: string };

export type ProfileOptions = {
  professions: (Option & { blurb: string })[];
  chapters: { slug: string; city: string; country?: string }[];
  countries: string[];
  goals: Option[];
  interestGroups: { topic: string; items: Option[] }[];
  membershipBodies: Option[];
  socials: { key: string; label: string }[];
};

export type EditableProfile = {
  headline: string | null;
  practiceName: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  specialisms: string[];
  services: string[];
  yearsInPractice: number | null;
  qualifications: { title: string; body?: string; year?: number }[];
  memberships: string[];
  phone: string | null;
  website: string | null;
  socials: Record<string, string>;
  addressLine1: string | null;
  addressLine2: string | null;
  postcode: string | null;
  showPhone: boolean;
  showAddress: boolean;
  goals: string[];
  interests: string[];
};

export type ProfileResponse = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    isFounding: boolean;
    chapter: { slug: string; city: string } | null;
  };
  plan: string | null;
  profession: string | null;
  isVerified: boolean;
  profile: EditableProfile;
  photoUrl: string | null;
  coverUrl: string | null;
  completeness: { percent: number; missing: string[] };
  fullProfile: boolean;
  publicHref: string | null;
  listing: { status: string; slug: string | null; trialDaysLeft: number } | null;
  enquiries: number;
  heldEnquiries: number;
  certificates: { id: string; courseSlug: string; courseTitle: string; hours: number; showOnProfile: boolean }[];
  emails: { updates: boolean; activity: boolean; address: string | null };
  options: ProfileOptions;
};

export type OnboardingResponse = {
  onboarded: boolean;
  free: boolean;
  steps: { id: string; label: string }[];
  filled: Record<string, boolean>;
  step: number;
  user: { name: string | null; chapter: { slug: string; city: string } | null };
  profession: string | null;
  profile: EditableProfile;
  photoUrl: string | null;
  options: ProfileOptions;
};

/** What a form action answers: a message to show, or the next step of onboarding. */
export type SaveResult = { ok: boolean; message?: string | null; step?: number; done?: boolean; redirect?: string };

export const profileKey = ["profile"] as const;
