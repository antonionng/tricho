import { fail, json, withMember } from "@/lib/mobile/api";
import { requestForm, runFormAction } from "@/lib/mobile/form-action";
import { editableProfile, profileOptions } from "@/lib/mobile/profile";
import { ONBOARDING_STEPS, filledSteps, resumeStep } from "@/lib/profile";
import { urlForFile } from "@/lib/storage";
import { ONBOARDING_ERRORS, onboardingChapters, onboardingUser } from "@/app/members/onboarding/_data";
import { finishOnboarding, saveChapter, saveDiscipline, saveProfileStep } from "@/app/members/onboarding/actions";

/**
 * The first-run steps, as on /members/onboarding. `?reached=<step>` is the
 * furthest step the app saw the member save or skip (the website keeps it in a
 * cookie), so the member resumes where they left off.
 */
export const GET = withMember(async (req, ctx) => {
  const userId = ctx.session.user.id;
  const reached = Math.max(0, Number(new URL(req.url).searchParams.get("reached")) || 0);
  const [user, chapters] = await Promise.all([onboardingUser(userId), onboardingChapters()]);
  if (!user) return fail(404, "We couldn't find your account.");
  const profile = user.profile ?? null;
  const filled = filledSteps(profile, user);
  const photoUrl = (await urlForFile(profile?.photoFileId)) ?? user.image ?? null;

  return json({
    onboarded: ctx.onboarded,
    free: !ctx.allowed,
    steps: ONBOARDING_STEPS,
    filled,
    step: resumeStep(filled, reached),
    user: { name: user.name, chapter: user.chapter },
    profession: profile?.profession ?? null,
    profile: editableProfile(profile),
    photoUrl,
    options: profileOptions(chapters.map((c) => ({ slug: c.slug, city: c.city, country: c.country }))),
  });
});

/**
 * Saves one step with the same fields as the website's form, plus `step`.
 * `intent=skip` moves on without saving. Step 2 may be multipart with a `photo`.
 * Answers { ok, step } with the next step, or { ok, done, redirect } at the end.
 */
export const POST = withMember(async (req) => {
  const form = await requestForm(req);
  const step = Number(form.get("step"));
  if (!Number.isInteger(step) || step < 1 || step > ONBOARDING_STEPS.length) return fail(400, "Please choose a step to save.");
  const chapterStep = ONBOARDING_STEPS.findIndex((s) => s.id === "chapter") + 1;

  const action =
    step === 1
      ? () => saveDiscipline(form)
      : step === chapterStep
        ? () => saveChapter(form)
        : step === ONBOARDING_STEPS.length
          ? () => finishOnboarding(form)
          : () => saveProfileStep(form);

  const res = await runFormAction(action, ONBOARDING_ERRORS);
  if (!res.ok) return res;
  const out = (await res.json()) as { ok: true; redirect?: string; params?: Record<string, string> };
  const next = Number(out.params?.step);
  if (out.redirect?.startsWith("/members/onboarding") && next) return json({ ok: true, step: next });
  return json({ ok: true, done: true, redirect: out.redirect ?? "/members" });
});
