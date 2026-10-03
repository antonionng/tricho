import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS, flagshipTier } from "@/config/subscriptions";
import { generateStructured } from "./ai";
import { SYSTEM_USER_EMAIL } from "./publish";
import type { AgentDefinition } from "./types";
import { DAY, appUrl, firstName } from "./util";

const SIGN_OFF = `${site.founder}, Trichollective`;

const emailSchema = z.object({ subject: z.string(), body: z.string() });

/** Let the model polish a template email. Falls back to the template untouched. */
async function polish(purpose: string, draft: { subject: string; body: string }) {
  const out = await generateStructured(
    emailSchema,
    `You are polishing a short, friendly email from ${site.founder} at Trichollective. Purpose: ${purpose}. Keep every fact, date, price and link exactly as given, keep it under 170 words, and sign off as "${site.founder}, Trichollective". Return a subject line and a plain-text body.`,
    `Subject: ${draft.subject}\n\n${draft.body}`
  );
  if (!out?.subject || !out.body) return draft;
  return { subject: out.subject.replace(/!/g, "."), body: out.body.replace(/!/g, ".") };
}

/** Reminder stages keyed by days left in the 90-day full-profile trial. */
const STAGES = [
  { stage: "30", from: 10, to: 30, label: "30 days left" },
  { stage: "10", from: 0, to: 10, label: "10 days left" },
  { stage: "0", from: -7, to: 0, label: "ends today" },
] as const;

function stageFor(daysLeft: number) {
  return STAGES.find((s) => daysLeft > s.from && daysLeft <= s.to) ?? null;
}

function listingEmail(name: string, slug: string | null, daysLeft: number, freeUntil: Date) {
  const first = firstName(name);
  const date = freeUntil.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const claim = appUrl(slug ? `/directory/claim/${slug}` : "/pricing");
  const price = `£${flagshipTier.foundingPrice ?? flagshipTier.price} a month`;
  if (daysLeft <= 0) {
    return {
      subject: "Your full Trichollective profile trial ends today",
      body: [
        `Hello ${first},`,
        `Your ${FREE_LISTING_DAYS}-day trial of the full directory profile ends today. Your listing stays in the Trichollective directory as a basic listing, so people can still find your name, discipline and town.`,
        `To keep your photo, services and website on show, and to keep receiving enquiries from the public straight to your inbox, you can claim your listing on the Professional plan (${price} for founding members):`,
        claim,
        `Any enquiries that arrive from now on will wait safely for you until you join. Thank you for being one of the first in the directory, and if you have any questions, just reply to this email.`,
        SIGN_OFF,
      ].join("\n\n"),
    };
  }
  return {
    subject:
      daysLeft <= 10
        ? `${daysLeft} days left on your full Trichollective profile`
        : `Your full Trichollective profile: ${daysLeft} days of your trial to go`,
    body: [
      `Hello ${first},`,
      `A quick note to say your free trial of the full directory profile runs until ${date}, which is ${daysLeft} days from now. During the trial, enquiries from the public come straight to your inbox.`,
      `After ${date} your listing stays in the directory as a basic listing. To keep your full profile and your enquiries, you can claim it on the Professional plan (${price} for founding members), which also gives you the Case Room, the referral network and your CPD log:`,
      claim,
      `If you'd rather stay on the basic listing, there's nothing you need to do.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export const membershipAgent: AgentDefinition = {
  id: "membership",
  name: "Membership helper",
  description:
    "Drafts the routine emails: reminders before full-profile trials end, a heads-up when an unclaimed listing has an enquiry waiting, and a friendly nudge to anyone who hasn't finished setting up after three days. Nothing is sent until you approve it.",
  schedule: "Daily at 8am",
  cron: "0 8 * * *",
  risk: "high",
  async run(ctx) {
    const { now } = ctx;
    const includeSamples = process.env.NODE_ENV !== "production";
    let reminders = 0;
    let enquiryEmails = 0;
    let onboarding = 0;

    /* 1. Free listing reminders. */
    const listings = await prisma.directoryListing.findMany({
      where: {
        status: "listed",
        kind: "listed",
        freeUntil: { not: null, lte: new Date(now.getTime() + 30 * DAY), gt: new Date(now.getTime() - 7 * DAY) },
        ...(includeSamples ? {} : { isSample: false }),
      },
      select: { id: true, name: true, email: true, slug: true, freeUntil: true },
    });
    for (const l of listings) {
      if (!l.freeUntil) continue;
      const daysLeft = Math.ceil((l.freeUntil.getTime() - now.getTime()) / DAY);
      const stage = stageFor(daysLeft);
      if (!stage) continue;
      const email = await polish(
        "remind a professional that their free directory listing is ending and explain how to stay listed",
        listingEmail(l.name, l.slug, Math.max(daysLeft, 0), l.freeUntil)
      );
      const created = await ctx.createDraft({
        kind: "email",
        title: email.subject,
        summary: `Free listing reminder for ${l.name} (${stage.label}).`,
        body: email.body,
        payload: { to: l.email, subject: email.subject, listingId: l.id },
        ref: `listing-reminder:${l.id}:${stage.stage}`,
      });
      if (created) reminders++;
    }

    /* 2. Enquiries waiting on unclaimed listings. */
    const waiting = await prisma.directoryListing.findMany({
      where: {
        kind: "listed",
        enquiries: { some: { status: "new" } },
        ...(includeSamples ? {} : { isSample: false }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        enquiries: { where: { status: "new" }, select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    });
    // Enquiries already emailed at the moment they arrived (sendEnquiry) are skipped, so nobody gets two emails.
    const heldRefs = waiting.flatMap((l) => l.enquiries.map((e) => `enquiry-held:${l.id}:${e.id}`));
    const alreadyEmailed = new Set(
      heldRefs.length
        ? (await prisma.emailLog.findMany({ where: { ref: { in: heldRefs } }, select: { ref: true } })).map((r) => r.ref)
        : []
    );
    for (const l of waiting) {
      const unnotified = l.enquiries.filter((e) => !alreadyEmailed.has(`enquiry-held:${l.id}:${e.id}`));
      const count = unnotified.length;
      const latest = unnotified[0];
      if (!latest) continue;
      const first = firstName(l.name);
      const template = {
        subject: count === 1 ? "Someone has asked to see you through Trichollective" : `${count} people have asked to see you through Trichollective`,
        body: [
          `Hello ${first},`,
          count === 1
            ? "Someone found you in the Trichollective directory and sent you an enquiry."
            : `${count} people found you in the Trichollective directory and sent you enquiries.`,
          `We're holding ${count === 1 ? "it" : "them"} safely for you. To read ${count === 1 ? "it" : "them"} and reply, claim your listing on the Professional plan. ${count === 1 ? "It" : "They"} will be waiting in your inbox as soon as you do:`,
          appUrl(l.slug ? `/directory/claim/${l.slug}` : "/pricing"),
          "We don't share enquiry details until a listing is claimed, to keep things private for everyone.",
          SIGN_OFF,
        ].join("\n\n"),
      };
      const email = await polish("let a professional know a member of the public has sent them an enquiry that is waiting until they claim their listing", template);
      const created = await ctx.createDraft({
        kind: "email",
        title: email.subject,
        summary: `${l.name} has ${count} enquir${count === 1 ? "y" : "ies"} waiting on an unclaimed listing.`,
        body: email.body,
        payload: { to: l.email, subject: email.subject, listingId: l.id, enquiryCount: count },
        ref: `enquiry-waiting:${l.id}:${latest.id}`,
      });
      if (created) enquiryEmails++;
    }

    /* 3. Members who signed up three or more days ago and haven't finished onboarding. */
    const unfinished = await prisma.user.findMany({
      where: {
        onboardedAt: null,
        createdAt: { lte: new Date(now.getTime() - 3 * DAY), gte: new Date(now.getTime() - 30 * DAY) },
        email: { not: null },
        NOT: [{ email: SYSTEM_USER_EMAIL }, { role: "admin" }, { staffRole: { not: null } }],
      },
      select: { id: true, name: true, email: true },
      take: 50,
    });
    for (const u of unfinished) {
      if (!u.email) continue;
      const first = firstName(u.name);
      const email = await polish("gently encourage a new member to finish setting up their account", {
        subject: "Finish setting up your Trichollective profile",
        body: [
          `Hello ${first},`,
          "Thank you for joining Trichollective. It only takes a couple of minutes to finish setting up: choose your discipline, add your city so we can connect you with your local chapter, and say hello in Introductions.",
          appUrl("/members"),
          "Once you're set up, you'll see the spaces, events and people most relevant to you. If anything is unclear, just reply to this email and I'll help.",
          SIGN_OFF,
        ].join("\n\n"),
      });
      const created = await ctx.createDraft({
        kind: "email",
        title: email.subject,
        summary: `${u.name ?? u.email} signed up over three days ago and hasn't finished setting up.`,
        body: email.body,
        payload: { to: u.email, subject: email.subject, userId: u.id },
        ref: `onboarding-nudge:${u.id}`,
      });
      if (created) onboarding++;
    }

    return {
      summary: `Drafted ${reminders} listing reminder${reminders === 1 ? "" : "s"}, ${enquiryEmails} "enquiry waiting" email${enquiryEmails === 1 ? "" : "s"} and ${onboarding} onboarding nudge${onboarding === 1 ? "" : "s"}. Nothing has been sent.`,
    };
  },
};
