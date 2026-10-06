import { fail, json, withMember } from "@/lib/mobile/api";
import { images, img } from "@/content/images";
import { AUDIENCE, loadLearn } from "@/app/members/learn/_data";

/**
 * The Learn hub: the member's courses and CPD, the course catalogue and the
 * library. Like the website, someone who bought a course without joining still
 * sees their courses; everyone else without membership gets 402.
 */
export const GET = withMember(async (_req, ctx) => {
  const { locked, mine, enrolledSlugs, cpdHours, library, catalogue } = await loadLearn({
    userId: ctx.session.user.id,
    allowed: ctx.allowed,
    profession: ctx.profession,
  });
  if (locked) return fail(402, "The library and member prices on courses are part of membership.");

  return json({
    member: ctx.allowed,
    professional: ctx.professional,
    cpdHours,
    mine: mine.map(({ e, course, progress }) => {
      const certificate = e.certificate && !e.certificate.withdrawnAt ? e.certificate : null;
      return {
        id: e.id,
        slug: course.slug,
        title: course.title,
        certificate: certificate ? { id: certificate.id, hours: certificate.hours } : null,
        done: progress.done,
        total: progress.total,
        percent: progress.percent,
        status: certificate
          ? `Completed. Certificate ${certificate.id}, ${certificate.hours} hours CPD.`
          : progress.done === progress.total
            ? "Every lesson done. The final assessment is ready for you."
            : `${progress.done} of ${progress.total} lessons complete.`,
      };
    }),
    courses: catalogue.map((c) => ({
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      hours: c.hours,
      status: c.status,
      enrolled: enrolledSlugs.has(c.slug),
      price: c.memberPriceGBP === 0 ? "Free for members" : `£${c.memberPriceGBP} for members`,
      image: img(images[c.imageKey], 640),
    })),
    library: library.map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      kind: p.kind,
      audience: AUDIENCE[p.audience] ?? p.audience,
    })),
  });
});
