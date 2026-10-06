import { fail, json, withMember } from "@/lib/mobile/api";
import { courseBySlug } from "@/content/courses";
import { coursePrice, enrolFree } from "@/lib/courses";

/**
 * Takes a free place on a course, as the website's enrol button does when the
 * price is £0. Paid places are bought on the website only: the app does not
 * sell digital content outside the App Store's in-app purchase.
 */
export const POST = withMember<{ slug: string }>(async (_req, ctx, { slug }) => {
  const course = courseBySlug(slug);
  if (!course) return fail(404, "We couldn't find that course.");
  if (course.status !== "open") return fail(400, "This course hasn't opened yet.");
  const price = coursePrice(course, ctx.membership.isActive);
  if (price.amountPence > 0) return fail(400, "Places on this course are available on trichollective.net.", { reason: "paid" });
  await enrolFree(ctx.session.user.id, course);
  return json({ ok: true });
});
