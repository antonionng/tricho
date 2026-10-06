import { body, fail, json, runAction, withMember } from "@/lib/mobile/api";
import { PASS_MARK, publicQuestions } from "@/lib/courses";
import { getLearner } from "@/app/members/courses/[slug]/_data";
import { submitAssessment } from "@/app/members/courses/[slug]/actions";
import { answersFrom, notEnrolled } from "../../_shared";

/**
 * The final assessment, as /members/courses/[slug]/assessment shows it. The
 * questions go out without their answers; the answer key is only included
 * once the learner has passed and holds a certificate, for the review.
 */
export const GET = withMember<{ slug: string }>(async (_req, ctx, { slug }) => {
  const learner = await getLearner(ctx.session.user.id, slug);
  if (!learner) return fail(404, "We couldn't find that course.");
  if (!learner.active) return notEnrolled();

  const { course, content, enrolment, progress } = learner;
  const total = content.assessment.length;
  const certificate = enrolment?.certificate && !enrolment.certificate.withdrawnAt ? enrolment.certificate : null;
  const remaining = content.lessons.filter((l) => !progress.complete.has(l.slug));
  const locked = remaining.length > 0 && !learner.isStaff;

  return json({
    course: { slug: course.slug, title: course.title },
    total,
    needed: Math.ceil(total * PASS_MARK),
    passMark: PASS_MARK,
    locked,
    remaining: remaining.map((l) => ({ slug: l.slug, title: l.title })),
    attempts: (enrolment?.attempts ?? []).map((a) => ({ score: a.score, total: a.total, passed: a.passed, createdAt: a.createdAt })),
    holderName: learner.name?.trim() || "Trichollective member",
    questions: certificate || locked ? [] : publicQuestions(content.assessment),
    certificate: certificate ? { id: certificate.id, issuedAt: certificate.issuedAt, score: certificate.score, total: certificate.total } : null,
    review: certificate
      ? content.assessment.map((q) => ({ id: q.id, prompt: q.prompt, answer: q.options[q.answer], explain: q.explain }))
      : null,
  });
});

/** Marks the assessment with the website's action, which issues the certificate on a pass. */
export const POST = withMember<{ slug: string }>(async (req, _ctx, { slug }) => {
  const { answers } = await body<{ answers: unknown }>(req);
  return runAction(() => submitAssessment(slug, answersFrom(answers)));
});
