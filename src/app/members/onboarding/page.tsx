import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberPage, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { PROFESSIONS } from "@/config/rooms";
import { cn } from "@/lib/utils";
import { finishOnboarding, saveChapter, saveDiscipline } from "./actions";

export const metadata = { title: "Welcome" };

const STEPS = ["Your discipline", "Your chapter", "Say hello"];

const optionClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-rule bg-card p-4 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-2";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/onboarding");

  const { step: rawStep, error } = await searchParams;
  const step = Math.min(3, Math.max(1, Number(rawStep) || 1));
  const [user, chapters] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { name: true, chapter: { select: { slug: true } } },
    }),
    step === 2 ? prisma.chapter.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }] }) : [],
  ]);

  return (
    <MemberPage size="narrow">
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i + 1 === step ? "step" : undefined}>
            <span className={cn("block h-1 rounded-full", i + 1 <= step ? "bg-ink" : "bg-paper-3")} />
            <span className={cn("mt-2 block text-xs", i + 1 === step ? "text-ink" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form action={saveDiscipline} className="flex flex-col gap-6">
          <header>
            <p className="label text-muted-foreground">Welcome to Trichollective</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Which best describes your work?</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              This helps us show you the conversations and learning most relevant to you. You can change it later.
            </p>
          </header>
          <label className="flex flex-col gap-1.5">
            <span className="label text-muted-foreground">Your name</span>
            <input name="name" defaultValue={user?.name ?? ""} autoComplete="name" className={cn(fieldClass, "h-12")} />
          </label>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="sr-only">Discipline</legend>
            {PROFESSIONS.map((p, i) => (
              <label key={p.id} className={optionClass}>
                <input
                  type="radio"
                  name="profession"
                  value={p.id}
                  required
                  defaultChecked={ctx.profession ? ctx.profession === p.id : i === 0}
                  className="mt-1 accent-[var(--ink)]"
                />
                <span>
                  <span className="block font-medium">{p.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{p.blurb}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {error && <p className="text-sm text-destructive">Please choose the option closest to your work.</p>}
          <SubmitButton className="self-start">Continue</SubmitButton>
        </form>
      )}

      {step === 2 && (
        <form action={saveChapter} className="flex flex-col gap-6">
          <header>
            <p className="label text-muted-foreground">Step two</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Where are you based?</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Your chapter is the group of members near you. You&apos;ll see local posts, meetups and people to meet.
            </p>
          </header>
          <fieldset className="grid gap-2.5 sm:grid-cols-2">
            <legend className="sr-only">Chapter</legend>
            {chapters.map((c) => (
              <label key={c.id} className={optionClass}>
                <input
                  type="radio"
                  name="chapter"
                  value={c.slug}
                  required
                  defaultChecked={user?.chapter?.slug === c.slug}
                  className="mt-1 accent-[var(--ink)]"
                />
                <span>
                  <span className="block font-medium">{c.city}</span>
                  <span className="block text-sm text-muted-foreground">{c.country}</span>
                </span>
              </label>
            ))}
            <label className={cn(optionClass, "sm:col-span-2")}>
              <input type="radio" name="chapter" value="none" required className="mt-1 accent-[var(--ink)]" />
              <span>
                <span className="block font-medium">None near me yet</span>
                <span className="block text-sm text-muted-foreground">
                  That&apos;s fine. You&apos;ll still see everything, and we&apos;ll let you know when a chapter opens nearby.
                </span>
              </span>
            </label>
          </fieldset>
          {error && <p className="text-sm text-destructive">Please choose a chapter, or none for now.</p>}
          <div className="flex items-center gap-3">
            <SubmitButton>Continue</SubmitButton>
            <Link href="/members/onboarding?step=1" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
        </form>
      )}

      {step === 3 && !ctx.allowed && (
        <form action={finishOnboarding} className="flex flex-col gap-6">
          <header>
            <p className="label text-muted-foreground">Last step</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Your free account is ready to use.</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              You can add your free founding listing, read the opening pages of every Trichozette edition and follow the
              news. When you want peer review, CPD and referrals, you can become a member from your home page.
            </p>
          </header>
          <div>
            <SubmitButton pending="Finishing…">Go to my free account</SubmitButton>
          </div>
        </form>
      )}

      {step === 3 && ctx.allowed && (
        <form action={finishOnboarding} className="flex flex-col gap-6">
          <header>
            <p className="label text-muted-foreground">Last step</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Introduce yourself</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              A few lines in Introductions is the easiest way to be welcomed. Say what you do, where you practise and what
              you&apos;d love to learn. You can skip this and do it later.
            </p>
          </header>
          <textarea
            name="intro"
            rows={6}
            maxLength={3000}
            placeholder="Hello, I'm a head spa therapist in Dublin. I've been practising for four years and I'd love to learn more about when to refer clients on."
            className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending="Finishing…">Finish and go to the community</SubmitButton>
            <Link href="/members/onboarding?step=2" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">If you leave the box empty, nothing is posted.</p>
        </form>
      )}
    </MemberPage>
  );
}
