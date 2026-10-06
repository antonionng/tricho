import "server-only";
import { prisma } from "@/lib/prisma";
import type { MemberContext } from "@/lib/member";
import { hasFullProfile } from "@/lib/directory";
import { urlForFile } from "@/lib/storage";
import { profileCompleteness } from "@/lib/profile";
import { isBusinessAccount } from "@/lib/subscription";
import { listPhotos } from "@/lib/photos";

/** Shown after a section saves. Shared by the profile page and the app. */
export const PROFILE_MESSAGES: Record<string, string> = {
  about: "Your details are saved.",
  photo: "Your photo is saved.",
  cover: "Your cover photo is saved.",
  gallery: "Your photos are updated.",
  practice: "Your practice details are saved.",
  qualifications: "Your qualifications and memberships are saved.",
  contact: "Your contact details are saved.",
  goals: "Your goals and interests are saved.",
  listing: "Your directory profile is saved and live.",
  emails: "Your email preferences are saved.",
};

export const PROFILE_ERRORS: Record<string, string> = {
  name: "Please add your name, at least two letters.",
  discipline: "Please choose the discipline closest to your work.",
  profession: "Please choose your discipline in About you first, then save your directory profile.",
  city: "Please add the town or city you practise in under Practice, then publish your directory profile.",
  photo: "We couldn't use that photo. Please upload a JPEG, PNG or WebP image under 8MB.",
  nophoto: "Please choose a photo to upload, or tick the box to remove the current one.",
};

const listingSelect = {
  id: true,
  slug: true,
  status: true,
  headline: true,
  specialization: true,
  city: true,
  bio: true,
  website: true,
  phone: true,
  services: true,
  photoUrl: true,
  kind: true,
  freeUntil: true,
} as const;

/**
 * Everything the profile page shows for the signed-in member: their details,
 * photos, directory listing and enquiries. Null when the account has gone.
 */
export async function loadProfile(ctx: MemberContext, userId: string) {
  const certificates = await prisma.certificate
    .findMany({
      where: { userId, withdrawnAt: null },
      orderBy: { issuedAt: "desc" },
      select: { id: true, courseSlug: true, courseTitle: true, hours: true, showOnProfile: true },
    })
    .catch(() => []);
  const [user, chapters] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        isFounding: true,
        emailUpdates: true,
        emailActivity: true,
        chapter: { select: { slug: true, city: true } },
        profile: true,
        listings: {
          orderBy: { updatedAt: "desc" },
          select: {
            ...listingSelect,
            enquiries: {
              orderBy: { createdAt: "desc" },
              take: 50,
              select: { id: true, name: true, email: true, message: true, createdAt: true, status: true },
            },
          },
        },
      },
    }),
    prisma.chapter.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }], select: { slug: true, city: true } }),
  ]);
  if (!user) return null;

  // A listing claimed through the old email-only route may not be linked yet.
  const listing =
    user.listings[0] ??
    (user.email
      ? await prisma.directoryListing.findFirst({
          where: { email: user.email.toLowerCase(), userId: null },
          orderBy: { createdAt: "desc" },
          select: {
            ...listingSelect,
            enquiries: { select: { id: true, name: true, email: true, message: true, createdAt: true, status: true } },
          },
        })
      : null);
  const enquiries = user.listings.length
    ? user.listings.flatMap((l) => l.enquiries).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : (listing?.enquiries ?? []);
  const profession = user.profile?.profession ?? null;
  const profile = user.profile;
  const [uploadedPhoto, coverUrl, galleryPhotos] = await Promise.all([
    urlForFile(profile?.photoFileId),
    urlForFile(profile?.coverFileId),
    listPhotos({ userId }),
  ]);
  const photoUrl = uploadedPhoto ?? listing?.photoUrl ?? user.image ?? null;
  const completeness = profileCompleteness(profile, { name: user.name, image: photoUrl });
  // Paid members always have the full profile; free accounts during their 90-day trial.
  const fullProfile = ctx.professional || (!!listing && listing.status === "listed" && hasFullProfile(listing));
  const publicHref = listing?.slug && listing.status === "listed" ? `/directory/p/${listing.slug}` : null;

  const ownEmail = user.email?.toLowerCase();
  const business = ownEmail
    ? !!(await prisma.partner.findUnique({ where: { ownerEmail: ownEmail }, select: { id: true } }).catch(() => null)) ||
      (await isBusinessAccount(ownEmail))
    : false;

  return {
    user,
    chapters,
    certificates,
    listing,
    enquiries,
    profession,
    profile,
    uploadedPhoto,
    photoUrl,
    coverUrl,
    galleryPhotos,
    completeness,
    fullProfile,
    publicHref,
    business,
  };
}
