import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  Search,
  Sparkles,
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
import { tierById } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import { saveMemberDetails, signOutAction } from "./actions";

export const metadata = { title: "Your profile" };

const MESSAGES: Record<string, string> = {
  about: "Your details are saved.",
  listing: "Your directory profile is saved and live.",
};
const ERRORS: Record<string, string> = {
  name: "Please add your name, at least two letters.",
  discipline: "Please choose the discipline closest to your work.",
  profession: "Please choose your discipline in About you first, then save your directory profile.",
  city: "Please add the city you practise in.",
};

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

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
            enquiries: { select: { id: true, name: true, email: true, message: true, createdAt: true, status: true } },
          },
        })
      : null);
  const enquiries = user.listings.length
    ? user.listings.flatMap((l) => l.enquiries).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : (listing?.enquiries ?? []);
  const profession = user.profile?.profession ?? null;
  const plan = tierById(ctx.plan)?.name;
  const publicHref = listing?.slug && listing.status === "listed" ? `/directory/p/${listing.slug}` : null;

  const links = [
    { href: "/members/billing", label: "Plan and billing", icon: CreditCard },
    { href: "/members/notifications", label: "Notifications", icon: Bell },
    { href: "/members/messages", label: "Messages", icon: MessageCircle },
    { href: "/members/people", label: "People", icon: Search },
    { href: "/members/trichozette", label: "Trichozette", icon: Newspaper },
    { href: "/members/assistant", label: "Assistant", icon: Sparkles },
    ...(ctx.isAdmin || ctx.unlocked ? [{ href: "/studio", label: "Studio", icon: LayoutDashboard }] : []),
  ];

  return (
    <MemberPage size="narrow">
      <header className="mb-8 flex items-center gap-4">
        <Avatar name={user.name} src={listing?.photoUrl ?? user.image} size="xl" />
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

      {ctx.professional ? (
        <section id="listing" className="mt-10 scroll-mt-20">
          <SectionLabel
            action={
              publicHref ? (
                <Link href={publicHref} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:underline">
                  View <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : undefined
            }
          >
            Directory profile
          </SectionLabel>
          <Card className="p-5 sm:p-6">
            <p className="mb-5 text-sm leading-relaxed text-ink-2">
              This is what the public sees in the directory. Enquiries come straight to you here. Your phone number stays
              private.
            </p>
            {!profession ? (
              <p className="rounded-xl bg-paper-2 p-4 text-sm text-ink-2">
                Choose your discipline in About you first, then you can publish your directory profile.
              </p>
            ) : (
              <form action={publishMemberListing} className="flex flex-col gap-4">
                <input type="hidden" name="next" value="/members/profile?saved=listing#listing" />
                <input type="hidden" name="name" value={user.name ?? ""} />
                <input type="hidden" name="profession" value={profession} />
                <Field label="Headline" hint="One line about what you do and who you help.">
                  <input
                    name="headline"
                    maxLength={140}
                    defaultValue={listing?.headline ?? ""}
                    placeholder="Trichologist helping women with shedding and thinning"
                    className={cn(fieldClass, "h-12")}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Specialism">
                    <input
                      name="specialization"
                      maxLength={120}
                      defaultValue={listing?.specialization ?? user.profile?.specialization ?? ""}
                      className={cn(fieldClass, "h-12")}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      name="city"
                      required
                      minLength={2}
                      maxLength={80}
                      defaultValue={listing?.city ?? user.profile?.location ?? user.chapter?.city ?? ""}
                      className={cn(fieldClass, "h-12")}
                    />
                  </Field>
                </div>
                <Field label="About your practice">
                  <textarea
                    name="bio"
                    rows={5}
                    maxLength={800}
                    defaultValue={listing?.bio ?? user.profile?.bio ?? ""}
                    className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
                  />
                </Field>
                <Field label="Services" hint="Separate each one with a comma, for example: Scalp consultation, Head spa, Hair loss assessment.">
                  <input name="services" defaultValue={listing?.services.join(", ") ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Website">
                    <input
                      name="website"
                      type="url"
                      inputMode="url"
                      placeholder="https://"
                      defaultValue={listing?.website ?? user.profile?.website ?? ""}
                      className={cn(fieldClass, "h-12")}
                    />
                  </Field>
                  <Field label="Phone" hint="Private. Never shown publicly.">
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={listing?.phone ?? user.profile?.phone ?? ""}
                      className={cn(fieldClass, "h-12")}
                    />
                  </Field>
                </div>
                <Field label="Photo URL" hint="A link to a square photo of you, starting with https://">
                  <input
                    name="photoUrl"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    defaultValue={listing?.photoUrl ?? ""}
                    className={cn(fieldClass, "h-12")}
                  />
                </Field>
                <SubmitButton className="self-start" pending="Publishing…">
                  {listing ? "Save and publish" : "Publish to the directory"}
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

      <section id="enquiries" className="mt-10 scroll-mt-20">
        <SectionLabel>Enquiries</SectionLabel>
        {!ctx.professional ? (
          <Card className="p-5 text-sm leading-relaxed text-ink-2">
            {enquiries.length > 0
              ? `${enquiries.length} ${enquiries.length === 1 ? "enquiry is" : "enquiries are"} waiting for your listing. They are held until you move to Professional.`
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
    </MemberPage>
  );
}
