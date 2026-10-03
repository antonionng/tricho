import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MemberPage, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { ContactFields, GoalsFields, IdentityFields, PracticeFields, QualificationFields } from "@/components/members/ProfileFields";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { urlForFile } from "@/lib/storage";
import { ONBOARDING_STEPS, filledSteps, resumeStep } from "@/lib/profile";
import { PROFESSIONS } from "@/config/rooms";
import { cn } from "@/lib/utils";
import { finishOnboarding, saveChapter, saveDiscipline, saveProfileStep } from "./actions";
import { PROGRESS_COOKIE, readProgress } from "./progress";

export const metadata = { title: "Welcome" };

const TOTAL = ONBOARDING_STEPS.length;

const optionClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-rule bg-card p-4 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-2";

const ERRORS: Record<string, string> = {
  discipline: "Please choose the option closest to your work.",
  chapter: "Please choose a chapter, or none for now.",
  photo: "We couldn't use that photo. Please upload a JPEG, PNG or WebP image under 8MB.",
};

function Header({ step, title, body }: { step: number; title: string; body: React.ReactNode }) {
  return (
    <header>
      <p className="label text-muted-foreground">
        Step {step} of {TOTAL}
      </p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </header>
  );
}

/** Continue, skip and back. Skip submits the form without validation and saves nothing. */
function Footer({ step, skip = true, label = "Continue" }: { step: number; skip?: boolean; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SubmitButton>{label}</SubmitButton>
      {skip && (
        <button
          type="submit"
          name="intent"
          value="skip"
          formNoValidate
          className="h-12 rounded-full px-4 text-sm text-ink-2 hover:bg-paper-2"
        >
          Skip for now
        </button>
      )}
      {step > 1 && (
        <Link
          href={`/members/onboarding?step=${step - 1}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back
        </Link>
      )}
    </div>
  );
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/onboarding");
  const userId = ctx.session.user.id;

  const { step: rawStep, error } = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, chapterId: true, chapter: { select: { slug: true, city: true } }, profile: true },
  });
  const profile = user?.profile ?? null;

  const reached = readProgress((await cookies()).get(PROGRESS_COOKIE)?.value, userId);
  const requested = Number(rawStep);
  const step =
    Number.isInteger(requested) && requested >= 1
      ? Math.min(TOTAL, requested)
      : resumeStep(filledSteps(profile, user), reached);
  // The discipline comes first; later steps make little sense without it.
  if (step > 1 && !profile?.profession) redirect("/members/onboarding?step=1");

  const [chapters, photoUrl] = await Promise.all([
    step === 7 ? prisma.chapter.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }] }) : [],
    step === 2 ? urlForFile(profile?.photoFileId).then((u) => u ?? user?.image ?? null) : null,
  ]);
  const free = !ctx.allowed;
  const optionalNote = free
    ? " This step is optional on a free account, so you can skip it and add the details from your profile later."
    : "";

  return (
    <MemberPage size="narrow">
      <ol className="mb-8 grid grid-cols-8 gap-1.5" aria-label="Progress">
        {ONBOARDING_STEPS.map((s, i) => (
          <li key={s.id} aria-current={i + 1 === step ? "step" : undefined}>
            <span className={cn("block h-1 rounded-full", i + 1 <= step ? "bg-ink" : "bg-paper-3")} />
            <span
              className={cn(
                "mt-2 hidden truncate text-[11px] sm:block",
                i + 1 === step ? "text-ink" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {error && ERRORS[error] && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {ERRORS[error]}
        </p>
      )}

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
          <Footer step={1} skip={false} />
        </form>
      )}

      {step === 2 && (
        <form action={saveProfileStep} className="flex flex-col gap-6">
          <input type="hidden" name="step" value="2" />
          <Header
            step={2}
            title="Add your photo and where you practise."
            body="Colleagues refer more readily to someone they can picture. Your photo, headline and town appear on your member profile, and on your directory listing if you have one."
          />
          <ImageUpload
            name="photo"
            currentUrl={photoUrl}
            shape="circle"
            label={photoUrl ? "Choose a new photo" : "Choose a photo"}
            hint="A clear, square head-and-shoulders photo works best. JPEG, PNG or WebP, up to 8MB."
          />
          <IdentityFields profile={profile} fallbackCity={user?.chapter?.city} />
          <Footer step={2} />
        </form>
      )}

      {step === 3 && (
        <form action={saveProfileStep} className="flex flex-col gap-6">
          <input type="hidden" name="step" value="3" />
          <Header
            step={3}
            title="Tell colleagues what you specialise in."
            body={`Your specialisms and services help other professionals know when to refer a client to you, and help members find the right person for a case.${optionalNote}`}
          />
          <PracticeFields profile={profile} />
          <Footer step={3} />
        </form>
      )}

      {step === 4 && (
        <form action={saveProfileStep} className="flex flex-col gap-6">
          <input type="hidden" name="step" value="4" />
          <Header
            step={4}
            title="Add your qualifications and professional memberships."
            body={`Listing your training and the bodies you belong to shows clients and colleagues the standard you work to. Add your main qualifications now and the rest on your profile at any time.${optionalNote}`}
          />
          <QualificationFields profile={profile} extraRows={0} />
          <Footer step={4} />
        </form>
      )}

      {step === 5 && (
        <form action={saveProfileStep} className="flex flex-col gap-6">
          <input type="hidden" name="step" value="5" />
          <Header
            step={5}
            title="Add the ways people can find and contact you."
            body={`Your website and social profiles can appear on your public profile so clients can see your work.${optionalNote}`}
          />
          <ContactFields profile={profile} />
          <Footer step={5} />
        </form>
      )}

      {step === 6 && (
        <form action={saveProfileStep} className="flex flex-col gap-6">
          <input type="hidden" name="step" value="6" />
          <Header
            step={6}
            title="Choose what you would like from Trichollective."
            body="We use your answers to suggest people, discussions and learning that match your goals. Only you can see them."
          />
          <GoalsFields profile={profile} />
          <Footer step={6} />
        </form>
      )}

      {step === 7 && (
        <form action={saveChapter} className="flex flex-col gap-6">
          <Header
            step={7}
            title="Choose your local chapter."
            body="Your chapter is the group of members near you, so you will see local posts, meetups and people to meet."
          />
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
                  You will still see everything, and we will let you know when a chapter opens nearby.
                </span>
              </span>
            </label>
          </fieldset>
          <Footer step={7} />
        </form>
      )}

      {step === 8 && free && (
        <form action={finishOnboarding} className="flex flex-col gap-6">
          <Header
            step={8}
            title="Your free account is ready to use."
            body="You can add your free founding listing, read the opening pages of every Trichozette edition and follow the news. When you want peer review, CPD and referrals, you can become a member from your home page."
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending="Finishing…">Go to my free account</SubmitButton>
            <Link href="/members/onboarding?step=7" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
        </form>
      )}

      {step === 8 && !free && (
        <form action={finishOnboarding} className="flex flex-col gap-6">
          <Header
            step={8}
            title="Introduce yourself to the community."
            body="A few lines in Introductions is the easiest way to be welcomed. Say what you do, where you practise and what you would like to learn. You can skip this and do it later."
          />
          <textarea
            name="intro"
            rows={6}
            maxLength={3000}
            placeholder="Hello, I'm a head spa therapist in Dublin. I've been practising for four years and I'd love to learn more about when to refer clients on."
            className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending="Finishing…">Finish and go to the community</SubmitButton>
            <Link href="/members/onboarding?step=7" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Back
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">If you leave the box empty, nothing is posted.</p>
        </form>
      )}
    </MemberPage>
  );
}
