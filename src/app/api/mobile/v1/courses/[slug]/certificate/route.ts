import { body, fail, formData, json, runAction, withMember } from "@/lib/mobile/api";
import { site } from "@/config/site";
import { certificateLinks, getLearner } from "@/app/members/courses/[slug]/_data";
import { setCertificateOnProfile } from "@/app/members/courses/[slug]/actions";
import { notEnrolled } from "../../_shared";

/** The certificate, its public links and the CPD record, as /members/courses/[slug]/certificate shows them. */
export const GET = withMember<{ slug: string }>(async (_req, ctx, { slug }) => {
  const learner = await getLearner(ctx.session.user.id, slug);
  if (!learner) return fail(404, "We couldn't find that course.");
  if (!learner.active) return notEnrolled();
  const { course, content, enrolment } = learner;
  const certificate = enrolment?.certificate;
  if (!certificate) return fail(404, "There's no certificate for this course yet. Pass the final assessment to earn it.");

  const progress = new Map((enrolment.lessons ?? []).map((l) => [l.lessonSlug, l]));
  return json({
    certificate: {
      id: certificate.id,
      holderName: certificate.holderName,
      courseTitle: certificate.courseTitle,
      hours: certificate.hours,
      issuedAt: certificate.issuedAt,
      score: certificate.score,
      total: certificate.total,
      showOnProfile: certificate.showOnProfile,
      withdrawnAt: certificate.withdrawnAt,
      withdrawnNote: certificate.withdrawnNote,
    },
    course: { slug: course.slug, title: course.title },
    reviewer: course.reviewer ? `${course.reviewer.name}, ${course.reviewer.credentials}` : null,
    ...certificateLinks(certificate),
    contactEmail: site.contactEmail,
    record: content.lessons.map((l) => {
      const row = progress.get(l.slug);
      return {
        slug: l.slug,
        title: l.title,
        reflectionPrompt: l.reflection,
        completedAt: row?.completedAt ?? null,
        checkScore: row?.checkScore ?? null,
        checkTotal: row?.checkTotal ?? null,
        reflection: row?.reflection ?? "",
        notes: row?.notes ?? "",
      };
    }),
  });
});

/** Shows or hides the certificate's badge on the member's profile, with the website's action. Body: { show: boolean }. */
export const POST = withMember<{ slug: string }>(async (req, ctx, { slug }) => {
  const { show } = await body<{ show: boolean }>(req);
  const learner = await getLearner(ctx.session.user.id, slug);
  const id = learner?.enrolment?.certificate?.id;
  if (!id) return fail(404, "There's no certificate for this course yet.");
  return runAction(() => setCertificateOnProfile(formData({ id, show: show ? "1" : "0" })));
});
