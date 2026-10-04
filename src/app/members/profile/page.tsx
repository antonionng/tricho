import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  Sparkles,
  UserPlus,
  BookOpen,
  Gift,
  HeartHandshake,
} from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Avatar } from "@/components/members/Avatar";
import { Card, MemberPage, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { ProfessionalUpsell } from "@/components/members/Paywall";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shortDate } from "@/components/members/format";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { publishMemberListing } from "@/lib/actions/directory";
import { PROFESSIONS, professionById } from "@/config/rooms";
import { hasFullProfile, trialDaysLeft } from "@/lib/directory";
import { urlForFile } from "@/lib/storage";
import { profileCompleteness } from "@/lib/profile";
import { ImageUpload } from "@/components/forms/ImageUpload";
import {
  ContactFields,
  Field,
  GoalsFields,
  IdentityFields,
  PracticeFields,
  QualificationFields,
} from "@/components/members/ProfileFields";
import { tierById } from "@/config/subscriptions";
import { isBusinessAccount } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { saveEmailPreferences, saveMemberDetails, saveProfilePhotoAction, saveProfileSection, signOutAction } from "./actions";

export const metadata = { title: "Your profile" };

const MESSAGES: Record<string, string> = {
  about: "Your details are saved.",
  photo: "Your photo is saved.",
  practice: "Your practice details are saved.",
  qualifications: "Your qualifications and memberships are saved.",
  contact: "Your contact details are saved.",
  goals: "Your goals and interests are saved.",
  listing: "Your directory profile is saved and live.",
  emails: "Your email preferences are saved.",
};
const ERRORS: Record<string, string> = {
  name: "Please add your name, at least two letters.",
  discipline: "Please choose the discipline closest to your work.",
  profession: "Please choose your discipline in About you first, then save your directory profile.",
  city: "Please add the town or city you practise in under Practice, then publish your directory profile.",
  photo: "We couldn't use that photo. Please upload a JPEG, PNG or WebP image under 8MB.",
  nophoto: "Please choose a photo to upload, or tick the box to remove the current one.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/profile");
  const userId = ctx.session.user.id;
  const { saved, error } = await searchParams;

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
  if (!user) redirect("/login");

  // A listing claimed through the old email-only route may not be linked yet.
  const listing =
    user.listings[0] ??
    (user.email
      ? await prisma.directoryListing.findFirst({
          where: { email: user.email.toLowerCase(), userId: null },
          orderBy: { createdAt: "desc" },
          select: {
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
            enquiries: { select: { id: true, name: true, email: true, message: true, createdAt: true, status: true } },
          },
        })
      : null);
  const enquiries = user.listings.length
    ? user.listings.flatMap((l) => l.enquiries).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : (listing?.enquiries ?? []);
  const profession = user.profile?.profession ?? null;
  const profile = user.profile;
  const uploadedPhoto = await urlForFile(profile?.photoFileId);
  const photoUrl = uploadedPhoto ?? listing?.photoUrl ?? user.image ?? null;
  const completeness = profileCompleteness(profile, { name: user.name, image: photoUrl });
  const plan = tierById(ctx.plan)?.name;
  // Paid members always have the full profile; free accounts during their 90-day trial.
  const fullProfile = ctx.professional || (!!listing && listing.status === "listed" && hasFullProfile(listing));
  const publicHref = listing?.slug && listing.status === "listed" ? `/directory/p/${listing.slug}` : null;

  const ownEmail = user.email?.toLowerCase();
  const business = ownEmail
    ? !!(await prisma.partner.findUnique({ where: { ownerEmail: ownEmail }, select: { id: true } }).catch(() => null)) ||
      (await isBusinessAccount(ownEmail))
    : false;

  const links = [
    { href: "/members/billing", label: "Plan and billing", icon: CreditCard },
    { href: "/members/notifications", label: "Notifications", icon: Bell },
    { href: "/members/messages", label: "Messages", icon: MessageCircle },
    { href: "/members/learn", label: "Learn", icon: BookOpen },
    { href: "/members/trichozette", label: "Trichozette", icon: Newspaper },
    { href: "/members/assistant", label: "Assistant", icon: Sparkles },
    { href: "/members/perks", label: "Member perks", icon: Gift },
    { href: "/members/referrals", label: "Client referrals", icon: HeartHandshake },
    { href: "/members/refer", label: "Invite a colleague", icon: UserPlus },
    ...(business ? [{ href: "/members/business", label: "Your business", icon: Building2 }] : []),
    ...(ctx.isAdmin || ctx.unlocked ? [{ href: "/studio", label: "Studio", icon: LayoutDashboard }] : []),
  ];

  const sections = [
    { id: "about", label: "About you" },
    { id: "photo", label: "Photo" },
    { id: "practice", label: "Practice" },
    { id: "qualifications", label: "Qualifications" },
    { id: "contact", label: "Contact and address" },
    { id: "goals", label: "Goals and interests" },
    ...(fullProfile ? [{ id: "listing", label: "Directory profile" }] : []),
    { id: "emails", label: "Email preferences" },
    { id: "enquiries", label: "Enquiries" },
  ];

  return (
    <MemberPage>
      <div className="lg:grid lg:grid-cols-[minmax(0,42rem)_12rem] lg:justify-between lg:gap-12">
      <div className="min-w-0">
      <header className="mb-8 flex items-center gap-4">
        <Avatar name={user.name} src={[uploadedPhoto, listing?.photoUrl, user.image]} size="xl" />
        <div className="min-w-0">
          <p className="label text-muted-foreground">Your profile</p>
          <h1 className="display mt-2 truncate text-4xl sm:text-5xl">{user.name || "Member"}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {plan && ctx.allowed && <Pill>{plan}</Pill>}
            {user.isFounding && <Pill tone="ink">Founding member</Pill>}
            {profession && <Pill>{professionById(profession)?.label}</Pill>}
          </div>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/members/people/${userId}`}
          className="inline-flex h-10 items-center rounded-full border border-rule bg-card px-4 text-sm hover:border-ink/40"
        >
          How members see you
        </Link>
        {publicHref && (
          <Link
            href={publicHref}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-rule bg-card px-4 text-sm hover:border-ink/40"
          >
            View public profile <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {saved && MESSAGES[saved] && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          {MESSAGES[saved]}
        </p>
      )}
      {error && ERRORS[error] && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {ERRORS[error]}
        </p>
      )}

      <Card className="mb-4 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-medium">Your profile is {completeness.percent}% complete.</p>
          <span className="text-sm text-muted-foreground">{completeness.percent}%</span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completeness.percent}
          aria-label="Profile completeness"
        >
          <div className="h-full rounded-full bg-ink" style={{ width: `${completeness.percent}%` }} />
        </div>
        {completeness.missing.length > 0 && (
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Adding {completeness.missing.slice(0, 3).join(", ")} will help colleagues and clients understand your work and
            refer to you with confidence.
          </p>
        )}
      </Card>

      <Link
        href="/members/profile/verification"
        className="mb-10 flex items-center gap-4 rounded-2xl border border-rule bg-card p-5 hover:border-ink/40"
      >
        <BadgeCheck className="h-6 w-6 shrink-0 text-positive" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">
            {profile?.isVerified ? "Your credentials are verified." : "Get the verified badge on your profile."}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {profile?.isVerified
              ? "The verified badge shows on your member and directory profiles."
              : "Upload proof of your qualification and we will check it, so clients and colleagues know your credentials are confirmed."}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <section id="about" className="scroll-mt-20">
        <SectionLabel>About you</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveMemberDetails} className="flex flex-col gap-4">
            <Field label="Name">
              <input name="name" required minLength={2} defaultValue={user.name ?? ""} autoComplete="name" className={cn(fieldClass, "h-12")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discipline">
                <select name="profession" defaultValue={profession ?? ""} className={cn(fieldClass, "h-12")}>
                  <option value="" disabled>
                    Choose one
                  </option>
                  {PROFESSIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Chapter">
                <select name="chapter" defaultValue={user.chapter?.slug ?? "none"} className={cn(fieldClass, "h-12")}>
                  {chapters.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.city}
                    </option>
                  ))}
                  <option value="none">None near me yet</option>
                </select>
              </Field>
            </div>
            <SubmitButton className="self-start">Save</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="photo" className="mt-10 scroll-mt-20">
        <SectionLabel>Photo</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveProfilePhotoAction} className="flex flex-col gap-4">
            <ImageUpload
              name="photo"
              currentUrl={photoUrl}
              shape="circle"
              label={photoUrl ? "Choose a new photo" : "Choose a photo"}
              hint="A clear, square head-and-shoulders photo works best. JPEG, PNG or WebP, up to 8MB."
              removeName="removePhoto"
            />
            <SubmitButton className="self-start" pending="Uploading…">
              Save photo
            </SubmitButton>
          </form>
        </Card>
      </section>

      <section id="practice" className="mt-10 scroll-mt-20">
        <SectionLabel>Practice</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveProfileSection} className="flex flex-col gap-4">
            <input type="hidden" name="section" value="practice" />
            <IdentityFields profile={profile} fallbackCity={user.chapter?.city} />
            <PracticeFields profile={profile} withBio />
            {!fullProfile && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                These details are saved to your member profile straight away. Your headline, photo, services and website
                appear in the public directory while you have a full profile.
              </p>
            )}
            <SubmitButton className="self-start">Save practice details</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="qualifications" className="mt-10 scroll-mt-20">
        <SectionLabel>Qualifications and memberships</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveProfileSection} className="flex flex-col gap-5">
            <input type="hidden" name="section" value="qualifications" />
            <QualificationFields profile={profile} />
            <SubmitButton className="self-start">Save qualifications</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="contact" className="mt-10 scroll-mt-20">
        <SectionLabel>Contact and address</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveProfileSection} className="flex flex-col gap-5">
            <input type="hidden" name="section" value="contact" />
            <ContactFields profile={profile} />
            <SubmitButton className="self-start">Save contact details</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="goals" className="mt-10 scroll-mt-20">
        <SectionLabel>Goals and interests</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveProfileSection} className="flex flex-col gap-5">
            <input type="hidden" name="section" value="goals" />
            <p className="text-sm leading-relaxed text-ink-2">
              Only you can see these. We use them to suggest people, discussions and learning that match what you want.
            </p>
            <GoalsFields profile={profile} />
            <SubmitButton className="self-start">Save goals and interests</SubmitButton>
          </form>
        </Card>
      </section>

      {fullProfile ? (
        <section id="listing" className="mt-10 scroll-mt-20">
          <SectionLabel
            action={
              publicHref ? (
                <Link href={publicHref} className="inline-flex min-h-10 items-center gap-1 text-sm text-ink-2 hover:underline">
                  View <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : undefined
            }
          >
            Directory profile visibility
          </SectionLabel>
          <Card className="p-5 sm:p-6">
            <p className="mb-5 text-sm leading-relaxed text-ink-2">
              Your directory listing is filled from the profile above, including your photo, headline, practice,
              specialisms, services, qualifications and website. Enquiries come straight to you here. Your phone number and
              address stay private unless you choose to show them in Contact and address.
            </p>
            {!profession ? (
              <p className="rounded-xl bg-paper-2 p-4 text-sm text-ink-2">
                Choose your discipline in About you first, then you can publish your directory profile.
              </p>
            ) : (
              <form action={publishMemberListing} className="flex flex-col gap-4">
                <input type="hidden" name="next" value="/members/profile?saved=listing#listing" />
                {listing && (
                  <p className="text-sm text-ink-2">
                    {listing.status === "listed"
                      ? "Your listing is live in the directory."
                      : listing.status === "pending"
                        ? "Your listing is waiting for a quick check by our team before it goes live."
                        : "Your listing is not public yet. Publishing sends it to the directory."}
                    {listing.kind !== "member" && listing.freeUntil && trialDaysLeft(listing) > 0
                      ? ` Your full profile is included for another ${trialDaysLeft(listing)} days.`
                      : ""}
                  </p>
                )}
                <SubmitButton className="self-start" pending="Publishing…">
                  {listing ? "Update my directory listing" : "Publish to the directory"}
                </SubmitButton>
              </form>
            )}
          </Card>
        </section>
      ) : (
        <section className="mt-10">
          <ProfessionalUpsell
            title="Be found, and hear from clients directly"
            body="Professional turns your listing into a full profile and adds the tools that bring you referrals."
            points={[
              "A full directory profile with photo, services and website",
              "Enquiries from the public sent straight to you",
              "The Case Room for anonymised case discussion",
              "The referral network and the Assistant",
            ]}
          />
        </section>
      )}

      <section id="emails" className="mt-10 scroll-mt-20">
        <SectionLabel>Email preferences</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveEmailPreferences} className="flex flex-col gap-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="emailUpdates"
                defaultChecked={user.emailUpdates}
                className="mt-1 h-5 w-5 shrink-0 accent-ink"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-medium">News and new releases</span>
                <span className="text-sm text-muted-foreground">
                  The monthly newsletter, and an email when a new Trichozette edition, course or event is released.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="emailActivity"
                defaultChecked={user.emailActivity}
                className="mt-1 h-5 w-5 shrink-0 accent-ink"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-medium">Replies and messages</span>
                <span className="text-sm text-muted-foreground">
                  An email when someone replies to your post or sends you a private message. You&apos;ll always see them in
                  the app.
                </span>
              </span>
            </label>
            <p className="text-sm text-muted-foreground">
              Emails about your account, event bookings and payments are always sent to {user.email ?? "your email address"}.
            </p>
            <SubmitButton className="self-start">Save email preferences</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="enquiries" className="mt-10 scroll-mt-20">
        <SectionLabel>Enquiries</SectionLabel>
        {!fullProfile ? (
          <Card className="p-5 text-sm leading-relaxed text-ink-2">
            {enquiries.length > 0
              ? `${enquiries.length} ${enquiries.length === 1 ? "enquiry is" : "enquiries are"} waiting for your listing. They are held until you join the Professional plan.`
              : "When a member of the public contacts you through the directory, it will appear here once you're on Professional."}
          </Card>
        ) : enquiries.length === 0 ? (
          <Card className="p-5 text-sm leading-relaxed text-muted-foreground">
            No enquiries yet. A clear headline, a list of services and a photo make it easier for people to reach out.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {enquiries.map((e) => (
              <li key={e.id} className="rounded-2xl border border-rule bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{shortDate(e.createdAt)}</p>
                </div>
                <a href={`mailto:${e.email}`} className="text-sm text-ink-2 underline underline-offset-4">
                  {e.email}
                </a>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionLabel>Everything else</SectionLabel>
        <ul className="overflow-hidden rounded-2xl border border-rule bg-card">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href} className="border-b border-rule last:border-0">
              <Link href={href} className="flex h-14 items-center gap-3 px-4 text-[15px] hover:bg-paper-2">
                <Icon className="h-[18px] w-[18px] stroke-[1.6]" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOutAction} className="mt-4">
          <SubmitButton variant="ghost" size="default" pending="Signing out…">
            Sign out
          </SubmitButton>
        </form>
      </section>
      </div>
      <nav aria-label="Profile sections" className="hidden lg:block">
        <div className="sticky top-24 space-y-1 border-l border-rule pl-4">
          <p className="pb-2 text-xs font-medium text-muted-foreground">On this page</p>
          {sections.map((sec) => (
            <a key={sec.id} href={`#${sec.id}`} className="block py-1 text-sm text-ink-2 hover:text-ink">
              {sec.label}
            </a>
          ))}
          <p className="pt-4 text-xs leading-relaxed text-muted-foreground">Your profile is {completeness.percent}% complete.</p>
        </div>
      </nav>
      </div>
    </MemberPage>
  );
}
