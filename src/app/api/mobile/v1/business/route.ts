import { fail, json, withMember } from "@/lib/mobile/api";
import { BUSINESS_SEATS, isBusinessAccount } from "@/lib/subscription";
import { nextSetupStep, SETUP_STEPS, setupProgress } from "@/lib/business-profile";
import { partnerLogoSrc, partnerTierLabel } from "@/lib/partners";
import { partnerStatsSummary } from "@/lib/partner-stats";
import { countOpenJobs, loadBusiness } from "@/app/members/business/_data";
import { NEXT_STEP, PREMIUM_INCLUDES, RESULT_DAYS, RESULT_METRICS } from "@/app/members/business/messages";
import { ownerEmail } from "./_outcome";

/**
 * The business portal at a glance, as on /members/business: the page's status, setup progress,
 * results for the last 30 days, team seats and open roles. The page itself is edited on the website.
 */
export const GET = withMember(async (_req, ctx) => {
  const email = ownerEmail(ctx);
  if (!email) return fail(400, "Your account has no email address, so it cannot hold a business page.");

  const [{ page, org, seats, photos }, business] = await Promise.all([loadBusiness(email), isBusinessAccount(email)]);
  const seatList = seats.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    role: s.role,
    bio: s.bio,
    showOnPage: s.showOnPage,
    photoUrl: s.photoUrl,
    createdAt: s.createdAt,
  }));

  if (!page) {
    return json({ business, page: null, seats: { used: seats.length, limit: BUSINESS_SEATS, list: seatList }, web: { setup: "/members/business/setup?step=details" } });
  }

  const progress = setupProgress({ page, org, seats: seats.length, photos: photos.length });
  const stepsLeft = SETUP_STEPS.filter((st) => !progress[st.id]).length;
  const next = stepsLeft ? nextSetupStep(progress) : null;
  const [openJobs, stats] = await Promise.all([countOpenJobs(page.id), partnerStatsSummary(page.id, RESULT_DAYS)]);

  return json({
    business,
    page: {
      id: page.id,
      name: page.name,
      slug: page.slug,
      tierLabel: partnerTierLabel(page.tier, page.kind),
      premium: page.tier === "premium",
      isFounding: page.isFounding,
      published: page.published,
      hidden: page.hidden,
      hasPerk: !!page.perk?.trim(),
      logo: partnerLogoSrc(page.logoUrl),
    },
    setup: {
      total: SETUP_STEPS.length,
      stepsLeft,
      steps: SETUP_STEPS.map((st) => ({ id: st.id, label: st.label, done: progress[st.id] })),
      next: next
        ? {
            id: next,
            button: NEXT_STEP[next].button,
            sentence: page.published
              ? `Your page is live, and your next step is ${NEXT_STEP[next].phrase}.`
              : `Your page is not live yet, and your next step is ${NEXT_STEP[next].phrase}.`,
          }
        : null,
    },
    premium: page.tier === "premium" ? { includes: PREMIUM_INCLUDES } : null,
    results: {
      days: RESULT_DAYS,
      nothingYet: Object.values(stats.totals).every((n) => n === 0),
      series: stats.series,
      metrics: RESULT_METRICS.map((m) => ({ field: m.field, label: m.label, total: stats.totals[m.field], explain: m.explain(stats.totals[m.field]) })),
    },
    seats: { used: seats.length, limit: BUSINESS_SEATS, list: seatList },
    jobs: { open: openJobs },
    web: {
      portal: "/members/business",
      setup: `/members/business/setup?step=${next ?? "details"}`,
      perk: "/members/business/setup?step=perk",
      page: page.published ? `/partners/${page.slug}` : null,
    },
  });
});
