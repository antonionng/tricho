import { fail, json, withMember } from "@/lib/mobile/api";
import { requestForm, runFormAction } from "@/lib/mobile/form-action";
import { tierById } from "@/config/subscriptions";
import { editableProfile, profileOptions } from "@/lib/mobile/profile";
import { trialDaysLeft } from "@/lib/directory";
import { PROFILE_ERRORS, PROFILE_MESSAGES, loadProfile } from "@/app/members/profile/_data";
import { saveMemberDetails, saveProfileSection } from "@/app/members/profile/actions";

/** The member's own profile, as on /members/profile. Open to free accounts, as on the website. */
export const GET = withMember(async (_req, ctx) => {
  const data = await loadProfile(ctx, ctx.session.user.id);
  if (!data) return fail(404, "We couldn't find your account.");
  const { user, listing } = data;
  return json({
    user: {
      id: ctx.session.user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isFounding: user.isFounding,
      chapter: user.chapter,
    },
    plan: ctx.allowed ? (tierById(ctx.plan)?.name ?? null) : null,
    profession: data.profession,
    isVerified: !!data.profile?.isVerified,
    profile: editableProfile(data.profile),
    photoUrl: data.photoUrl,
    coverUrl: data.coverUrl,
    completeness: data.completeness,
    fullProfile: data.fullProfile,
    publicHref: data.publicHref,
    listing: listing
      ? {
          status: listing.status,
          slug: listing.slug,
          trialDaysLeft: listing.kind !== "member" && listing.freeUntil ? trialDaysLeft(listing) : 0,
        }
      : null,
    enquiries: data.fullProfile ? data.enquiries.length : 0,
    heldEnquiries: data.fullProfile ? 0 : data.enquiries.length,
    certificates: data.certificates,
    emails: { updates: user.emailUpdates, activity: user.emailActivity, address: user.email },
    options: profileOptions(data.chapters),
  });
});

const SECTIONS = new Set(["about", "practice", "qualifications", "contact", "goals"]);

/**
 * Saves one section of the profile, with the same fields as the website's
 * forms. `section` is "about" (name, profession, chapter) or one of practice,
 * qualifications, contact and goals.
 */
export const POST = withMember(async (req) => {
  const form = await requestForm(req);
  const section = String(form.get("section") ?? "");
  if (!SECTIONS.has(section)) return fail(400, "Please choose which part of your profile to save.");
  return runFormAction(
    () => (section === "about" ? saveMemberDetails(form) : saveProfileSection(form)),
    PROFILE_ERRORS,
    PROFILE_MESSAGES
  );
});
