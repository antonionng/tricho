import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock, ExternalLink, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Pill } from "@/components/site/primitives";
import { Card, EmptyState, MemberPage, PageHeader, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { Button } from "@/components/ui/button";
import { longDate } from "@/components/members/format";
import { educatorMembership } from "@/config/subscriptions";
import { hasEducatorAccess, submitCoursesBlocker } from "@/lib/educator-rules";
import { cn } from "@/lib/utils";
import { requireEducator } from "./_data";
import { createEducatorCourseAction, saveEducatorProfileAction } from "./actions";

export const metadata = { title: "Educator" };

const STATE: Record<string, { label: string; tone: "default" | "positive" | "ink" }> = {
  draft: { label: "Draft", tone: "default" },
  in_review: { label: "With the team for review", tone: "ink" },
  published: { label: "On sale", tone: "positive" },
  unlisted: { label: "Off sale", tone: "default" },
};

const ERRORS: Record<string, string> = {
  name: "Please give the name learners should see, of at least two letters.",
  website: "Please give your website as a full address, starting with https://.",
  title: "Please give the course a title of at least a few words.",
  status: "You can't start a new course while your Educator membership isn't active.",
};

export default async function EducatorDashboardPage({ searchParams }: { searchParams: Promise<{ joined?: string; saved?: string; error?: string }> }) {
  const { joined, saved, error } = await searchParams;
  const { profile } = await requireEducator();

  if (!profile) {
    return (
      <MemberPage size="narrow">
        <PageHeader
          label="Educator"
          title={joined ? "We're confirming your payment." : "Teach on Trichollective."}
          lede={
            joined
              ? "This usually takes a few seconds. Refresh the page in a moment and your Educator dashboard will be ready."
              : `Build your own courses, sell them to practitioners across every discipline and keep ${educatorMembership.defaultSharePct}% of every sale.`
          }
        />
        {joined ? <meta httpEquiv="refresh" content="4" /> : (
          <Button asChild size="lg">
            <Link href="/educators">
              See how Educator membership works <ArrowRight />
            </Link>
          </Button>
        )}
      </MemberPage>
    );
  }

  const courses = await prisma.course.findMany({
    where: { educatorId: profile.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, updatedAt: true, versions: { where: { status: "submitted" }, select: { id: true } } },
  });
  const enrolments = courses.length
    ? await prisma.courseEnrolment.groupBy({ by: ["courseSlug"], where: { courseSlug: { in: courses.map((c) => c.slug) }, status: "active" }, _count: true })
    : [];
  const learners = new Map(enrolments.map((e) => [e.courseSlug, e._count]));
  const blocker = submitCoursesBlocker(profile);
  const active = hasEducatorAccess(profile);

  return (
    <MemberPage>
      <PageHeader
        label="Educator"
        title={`Welcome, ${profile.displayName.split(" ")[0]}.`}
        lede="Write your courses, send them for review and see how learners are getting on."
        action={
          profile.status === "approved" ? (
            <Button asChild variant="outline">
              <Link href={`/educators/${profile.slug}`}>
                Your public page <ExternalLink />
              </Link>
            </Button>
          ) : undefined
        }
      />

      {joined && <p role="status" className="mb-6 rounded-2xl bg-positive/10 px-5 py-4 text-[15px]"><strong>Welcome to the Educator programme.</strong> Your membership has started, and we&apos;ve emailed you what happens next.</p>}
      {saved && <p role="status" className="mb-6 rounded-2xl bg-positive/10 px-5 py-4 text-[15px]">Your profile is saved.</p>}
      {error && ERRORS[error] && <p role="alert" className="mb-6 rounded-2xl bg-destructive/5 px-5 py-4 text-[15px] text-destructive">{ERRORS[error]}</p>}

      <StatusBanner status={profile.status} note={profile.reviewNote} />

      <section id="courses" className="mb-10 scroll-mt-20">
        <SectionLabel>Your courses</SectionLabel>
        {courses.length === 0 ? (
          <EmptyState title="You haven't started a course yet." body="Give it a working title below. You can change everything later, and nothing is seen by learners until it has been reviewed." />
        ) : (
          <ul className="mb-4 flex flex-col divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-card">
            {courses.map((c) => (
              <li key={c.id}>
                <Link href={`/members/educator/courses/${c.id}`} className="flex flex-col gap-2 p-5 transition-colors hover:bg-paper-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{c.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      Edited {longDate(c.updatedAt)} · {learners.get(c.slug) ?? 0} {(learners.get(c.slug) ?? 0) === 1 ? "learner" : "learners"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap gap-1.5">
                    {c.versions.length > 0 && c.status !== "in_review" && <Pill tone="ink">Update with the team</Pill>}
                    <Pill tone={STATE[c.status]?.tone ?? "default"}>{STATE[c.status]?.label ?? c.status}</Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {active && (
          <form action={createEducatorCourseAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="new-course" className="sr-only">
              Title of a new course
            </label>
            <input id="new-course" name="title" required minLength={3} maxLength={160} placeholder="Working title of a new course" className={cn(fieldClass, "h-12 flex-1")} />
            <SubmitButton pending="Starting…">
              <BookOpen /> Start a course
            </SubmitButton>
          </form>
        )}
        {blocker && profile.status === "pending_review" && (
          <p className="mt-3 text-sm text-muted-foreground">You can write as much as you like now. {blocker}</p>
        )}
      </section>

      <section id="profile" className="mb-10 scroll-mt-20">
        <SectionLabel>Your educator profile</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveEducatorProfileAction} className="flex flex-col gap-4">
            <Field label="Name learners see">
              <input name="displayName" required defaultValue={profile.displayName} className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Headline" hint='For example "Consultant trichologist, Dublin".'>
              <input name="headline" defaultValue={profile.headline} className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="About you" hint="A few sentences on your practice and why you teach. Shown on your public page.">
              <textarea name="bio" rows={5} defaultValue={profile.bio} className={cn(fieldClass, "min-h-32 resize-y py-3")} />
            </Field>
            <Field label="Qualifications and experience" hint="The team reads this when reviewing your membership. It's shown on your public page too.">
              <textarea name="credentials" rows={4} defaultValue={profile.credentials} className={cn(fieldClass, "min-h-28 resize-y py-3")} />
            </Field>
            <Field label="Topics you teach" hint="Separate them with commas.">
              <input name="topics" defaultValue={profile.topics.join(", ")} className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Website (optional)">
              <input name="website" type="url" defaultValue={profile.website ?? ""} placeholder="https://" className={cn(fieldClass, "h-12")} />
            </Field>
            <SubmitButton className="self-start">Save profile</SubmitButton>
          </form>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 p-5">
          <p className="label text-muted-foreground">Payouts</p>
          <p className="text-[15px] leading-relaxed text-ink-2">
            You keep {profile.sharePct}% of each sale. Before your first course goes on sale you&apos;ll connect a Stripe account, so your share can be paid straight to your bank account.
          </p>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <p className="label text-muted-foreground">Membership</p>
          <p className="text-[15px] leading-relaxed text-ink-2">
            {profile.currentPeriodEnd
              ? profile.cancelAtPeriodEnd
                ? `Your Educator membership ends on ${longDate(profile.currentPeriodEnd)}.`
                : `Your Educator membership renews on ${longDate(profile.currentPeriodEnd)} for £${educatorMembership.annualPrice}.`
              : "Your Educator membership is being set up."}{" "}
            Professional membership is included while you&apos;re an Educator.
          </p>
          {profile.stripeCustomerId && (
            <form action="/api/educators/billing" method="POST">
              <button type="submit" className="text-sm font-medium underline underline-offset-4">
                Manage billing in Stripe
              </button>
            </form>
          )}
        </Card>
      </section>
    </MemberPage>
  );
}

function StatusBanner({ status, note }: { status: string; note: string | null }) {
  if (status === "approved") return null;
  const map: Record<string, { icon: typeof Clock; title: string; body: string; tone: string }> = {
    pending_review: {
      icon: Clock,
      title: "The team is reviewing your Educator membership.",
      body: "This usually takes up to five working days. Complete your profile so we can see your experience, and start writing your first course while you wait.",
      tone: "border-rule bg-paper-2",
    },
    rejected: { icon: ShieldAlert, title: "Your Educator application wasn't approved.", body: "Your fee is being refunded.", tone: "border-destructive/30 bg-destructive/5" },
    suspended: { icon: ShieldAlert, title: "Your Educator membership is suspended.", body: "Your courses are off sale for now, and learners who have a place keep access.", tone: "border-destructive/30 bg-destructive/5" },
    lapsed: { icon: CheckCircle2, title: "Your Educator membership has ended.", body: "Your courses are off sale, and learners who have a place keep access. Rejoin to put them back on sale.", tone: "border-rule bg-paper-2" },
  };
  const s = map[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <div className={cn("mb-8 flex gap-4 rounded-2xl border p-5", s.tone)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.6]" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{s.title}</p>
        <p className="text-[15px] leading-relaxed text-ink-2">{s.body}</p>
        {note && status !== "pending_review" && <p className="mt-1 text-[15px]"><strong>The team&apos;s note:</strong> {note}</p>}
        {status === "lapsed" && (
          <Link href="/educators" className="mt-1 text-[15px] font-medium underline underline-offset-4">
            Rejoin as an Educator
          </Link>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
