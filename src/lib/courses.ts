import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deliverOnce } from "@/lib/mail/send";
import { formatMoney } from "@/lib/mail/templates/billing";
import { courseCertificateEmail, courseEnrolledEmail } from "@/lib/mail/templates/courses";
import { courseBySlug, type Course } from "@/content/courses";
import { certificateReference } from "@/lib/course-rules";
import { courseContent } from "@/content/course-lessons";
import type { Question } from "@/content/course-types";

/**
 * Courses: buying a place, working through the lessons, the final assessment
 * and the certificate. Course content is static (src/content/course-lessons);
 * everything about a learner lives in CourseEnrolment and its children.
 *
 * Rules:
 *  - A place is tied to an account, so buyers sign in first.
 *  - Active members pay the member price; everyone else pays the full price.
 *    A price of £0 means no checkout, and the place is given straight away.
 *  - A certificate is issued once every lesson is complete and the final
 *    assessment is passed at PASS_MARK or above. Retakes are unlimited.
 */

export { CHECKOUT_EXPIRES_MINUTES, PASS_MARK, certificateReference, coursePrice, grade, isCertificateReference } from "@/lib/course-rules";
export type { CoursePriceType, Graded } from "@/lib/course-rules";

/** The lessons and assessment for a course, or null if it has none yet. */
export function lessonsOf(slug: string) {
  return courseContent[slug] ?? null;
}

export function totalMinutes(slug: string) {
  return lessonsOf(slug)?.lessons.reduce((sum, l) => sum + l.minutes, 0) ?? 0;
}

/** Questions without their answers, safe to send to the browser. */
export function publicQuestions(questions: Question[]) {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}

export type Progress = {
  done: number;
  total: number;
  percent: number;
  /** The lesson to open on "Continue": the last one opened if unfinished, otherwise the first unfinished. */
  next: string | null;
  complete: Set<string>;
};

export function progressOf(
  slug: string,
  lessons: { lessonSlug: string; completedAt: Date | null }[],
  lastLessonSlug?: string | null
): Progress {
  const all = lessonsOf(slug)?.lessons ?? [];
  const complete = new Set(lessons.filter((l) => l.completedAt).map((l) => l.lessonSlug));
  const done = all.filter((l) => complete.has(l.slug)).length;
  const firstOpen = all.find((l) => !complete.has(l.slug))?.slug ?? null;
  const last = lastLessonSlug && all.some((l) => l.slug === lastLessonSlug) && !complete.has(lastLessonSlug) ? lastLessonSlug : null;
  return {
    done,
    total: all.length,
    percent: all.length ? Math.round((done / all.length) * 100) : 0,
    next: last ?? firstOpen,
    complete,
  };
}

function refresh(slug: string) {
  try {
    revalidatePath(`/courses/${slug}`);
    revalidatePath("/members/learn");
    revalidatePath(`/members/courses/${slug}`, "layout");
  } catch {
    // Outside a request (e.g. the webhook in tests).
  }
}

/** Gives a place on a free course straight away. Safe to repeat. */
export async function enrolFree(userId: string, course: Course) {
  const existing = await prisma.courseEnrolment.findUnique({ where: { userId_courseSlug: { userId, courseSlug: course.slug } } });
  if (existing?.status === "active") return existing;
  const enrolment = await prisma.courseEnrolment.upsert({
    where: { userId_courseSlug: { userId, courseSlug: course.slug } },
    create: { userId, courseSlug: course.slug, status: "active", priceType: "free", amount: 0, activatedAt: new Date() },
    update: { status: "active", priceType: "free", amount: 0, activatedAt: new Date() },
  });
  await welcome(enrolment.id);
  refresh(course.slug);
  return enrolment;
}

/** The enrolment email and an in-app notification, sent once per enrolment. */
async function welcome(enrolmentId: string) {
  const enrolment = await prisma.courseEnrolment.findUnique({
    where: { id: enrolmentId },
    include: { user: { select: { name: true, email: true } } },
  });
  const course = enrolment && courseBySlug(enrolment.courseSlug);
  if (!enrolment || !course || !enrolment.user.email) return;
  const email = courseEnrolledEmail({
    name: enrolment.user.name,
    course,
    lessons: lessonsOf(course.slug)?.lessons.length ?? course.syllabus.length,
    amount: enrolment.amount > 0 ? formatMoney(enrolment.amount, enrolment.currency) : null,
  });
  const sent = await deliverOnce(`course-enrolled:${enrolment.id}`, enrolment.user.email, email.subject, email.content, { tag: "course" });
  if (sent) {
    await prisma.notification.create({
      data: { userId: enrolment.userId, kind: "course", title: `You're enrolled on ${course.title}. Start the first lesson when you're ready.`, href: `/members/courses/${course.slug}` },
    });
  }
}

/**
 * Issues the certificate when every lesson is done and the assessment is
 * passed. Returns the certificate (new or existing), or null if not yet earned.
 */
export async function maybeIssueCertificate(enrolmentId: string) {
  const enrolment = await prisma.courseEnrolment.findUnique({
    where: { id: enrolmentId },
    include: {
      lessons: { select: { lessonSlug: true, completedAt: true } },
      attempts: { where: { passed: true }, orderBy: { score: "desc" }, take: 1 },
      certificate: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!enrolment || enrolment.status !== "active") return null;
  if (enrolment.certificate) return enrolment.certificate;
  const course = courseBySlug(enrolment.courseSlug);
  const best = enrolment.attempts[0];
  const progress = progressOf(enrolment.courseSlug, enrolment.lessons);
  if (!course || !best || progress.total === 0 || progress.done < progress.total) return null;

  let certificate = null;
  for (let i = 0; i < 5 && !certificate; i++) {
    certificate = await prisma.certificate
      .create({
        data: {
          id: certificateReference(),
          userId: enrolment.userId,
          enrolmentId: enrolment.id,
          courseSlug: course.slug,
          courseTitle: course.title,
          holderName: enrolment.user.name?.trim() || "Trichollective member",
          hours: course.hours,
          score: best.score,
          total: best.total,
        },
      })
      .catch(async (error: { code?: string; meta?: { target?: string[] | string } }) => {
        if (error?.code !== "P2002") throw error;
        // Someone issued it a moment ago (double submit): use theirs. Otherwise the reference collided: try another.
        return prisma.certificate.findUnique({ where: { enrolmentId: enrolment.id } });
      });
  }
  if (!certificate) return null;

  await prisma.courseEnrolment.update({ where: { id: enrolment.id }, data: { completedAt: enrolment.completedAt ?? new Date() } });
  if (enrolment.user.email) {
    const email = courseCertificateEmail({ name: enrolment.user.name, course, reference: certificate.id });
    const sent = await deliverOnce(`course-certificate:${certificate.id}`, enrolment.user.email, email.subject, email.content, { tag: "course" });
    if (sent) {
      await prisma.notification.create({
        data: { userId: enrolment.userId, kind: "course", title: `You've completed ${course.title}. Your certificate is ready.`, href: `/members/courses/${course.slug}/certificate` },
      });
    }
  }
  refresh(course.slug);
  return certificate;
}

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** checkout.session.completed for a course place. Safe to run more than once. */
export async function handleCourseCheckoutCompleted(session: Stripe.Checkout.Session) {
  const enrolmentId = session.metadata?.enrolmentId;
  if (!enrolmentId) return { ok: false as const, reason: "no-enrolment-id" };
  if (session.payment_status !== "paid") {
    console.warn("[COURSES] checkout completed without payment", { enrolmentId, status: session.payment_status });
    return { ok: false as const, reason: "unpaid" };
  }
  const enrolment = await prisma.courseEnrolment.findUnique({ where: { id: enrolmentId } });
  if (!enrolment) {
    console.error("[COURSES] paid checkout for an unknown enrolment", { enrolmentId, session: session.id });
    return { ok: false as const, reason: "unknown-enrolment" };
  }
  const paymentIntent = idOf(session.payment_intent as string | { id: string } | null);
  // A lapsed checkout is still honoured: the money has been taken.
  const updated = await prisma.courseEnrolment.updateMany({
    where: { id: enrolment.id, status: { in: ["pending", "cancelled"] } },
    data: {
      status: "active",
      activatedAt: new Date(),
      stripeSessionId: session.id,
      ...(paymentIntent ? { stripePaymentIntentId: paymentIntent } : {}),
      ...(typeof session.amount_total === "number" ? { amount: session.amount_total } : {}),
      ...(session.currency ? { currency: session.currency } : {}),
    },
  });
  await welcome(enrolment.id);
  refresh(enrolment.courseSlug);
  return { ok: true as const, enrolmentId, already: updated.count === 0 };
}

export async function handleCourseCheckoutExpired(session: Stripe.Checkout.Session) {
  const enrolmentId = session.metadata?.enrolmentId;
  if (!enrolmentId) return;
  await prisma.courseEnrolment.updateMany({ where: { id: enrolmentId, status: "pending" }, data: { status: "cancelled" } });
}

/**
 * A full refund closes the place and withdraws any certificate earned with it.
 * A partial refund leaves the place open.
 */
export async function handleCourseRefund(charge: Stripe.Charge) {
  if (!charge.refunded) return { ok: false as const, reason: "partial" };
  const paymentIntentId = idOf(charge.payment_intent as string | { id: string } | null);
  if (!paymentIntentId) return { ok: false as const, reason: "no-payment-intent" };
  const enrolments = await prisma.courseEnrolment.findMany({
    where: { stripePaymentIntentId: paymentIntentId, status: { not: "refunded" } },
    select: { id: true, courseSlug: true },
  });
  if (!enrolments.length) return { ok: false as const, reason: "not-a-course" };
  const ids = enrolments.map((e) => e.id);
  await prisma.courseEnrolment.updateMany({ where: { id: { in: ids } }, data: { status: "refunded" } });
  await prisma.certificate.updateMany({
    where: { enrolmentId: { in: ids }, withdrawnAt: null },
    data: { withdrawnAt: new Date(), withdrawnNote: "The course fee was refunded." },
  });
  for (const e of enrolments) refresh(e.courseSlug);
  return { ok: true as const, count: ids.length };
}

const isCourseSession = (s: Stripe.Checkout.Session) => s.mode === "payment" && s.metadata?.kind === "course";

/**
 * The Stripe webhook's entry point for courses. Returns true when the event
 * was a course checkout and has been handled. Refunds return false so other
 * handlers (tickets) still see them.
 */
export async function handleCourseWebhook(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isCourseSession(session)) return false;
      await handleCourseCheckoutCompleted(session);
      return true;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isCourseSession(session)) return false;
      await handleCourseCheckoutExpired(session);
      return true;
    }
    case "charge.refunded": {
      try {
        await handleCourseRefund(event.data.object as Stripe.Charge);
      } catch (error) {
        console.error("[COURSES] refund handling failed", error);
      }
      return false;
    }
    default:
      return false;
  }
}

/** The certificates a member has chosen to show, for profile badges. */
export async function profileCertificates(userId: string) {
  return prisma.certificate
    .findMany({
      where: { userId, showOnProfile: true, withdrawnAt: null },
      orderBy: { issuedAt: "desc" },
      select: { id: true, courseSlug: true, courseTitle: true, hours: true, issuedAt: true },
    })
    .catch(() => []);
}
