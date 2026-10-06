export type PersonSummary = {
  id: string;
  name: string | null;
  image: string | null;
  isFounding: boolean;
  verified: boolean;
  discipline: string | null;
  subtitle: string;
  following: boolean;
  isMe: boolean;
};

export type PeoplePage = {
  people: PersonSummary[];
  total: number;
  nextCursor: string | null;
  professions: { id: string; label: string }[];
};

export type ProfilePost = {
  id: string;
  title: string | null;
  content: string;
  spaceLabel: string | null;
  createdAt: string;
  comments: number;
  useful: number;
};

export type MemberProfile = {
  id: string;
  name: string | null;
  image: string | null;
  isFounding: boolean;
  verified: boolean;
  headline: string | null;
  practiceName: string | null;
  place: string | null;
  discipline: { id: string; label: string } | null;
  chapter: { slug: string; city: string } | null;
  bio: string | null;
  specialisms: string[];
  services: string[];
  yearsInPractice: number | null;
  qualifications: { title: string; body?: string; year?: number }[];
  memberships: string[];
  badges: { id: string; courseSlug: string; courseTitle: string; hours: number; issuedAt: string }[];
  contact: { website: string | null; socials: { key: string; url: string; label: string }[]; phone: string | null; address: string | null };
  publicPath: string | null;
  counts: { followers: number; following: number };
  isMe: boolean;
  following: boolean;
  canRefer: boolean;
  posts: ProfilePost[];
};
