import type { Draft, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeSpace } from "@/config/rooms";
import { getRooms } from "@/lib/rooms";
import { deliver, wantsList, type EmailList } from "@/lib/mail/send";
import type { EmailContent } from "@/lib/mail/layout";
import { draftEmailContent } from "@/lib/mail/templates/members";
import { announcementEmail, newsletterEmail } from "@/lib/mail/templates/releases";

export const SYSTEM_USER_EMAIL = "team@trichollective.local";

/** The "Trichollective team" account that agent-drafted community posts are published as. */
export async function getSystemUser() {
  return prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {},
    create: { email: SYSTEM_USER_EMAIL, name: "Trichollective team" },
  });
}

export function payloadOf(draft: Pick<Draft, "payload">): Record<string, unknown> {
  const p = draft.payload;
  return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : {};
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmails(rows: { email: string | null }[]) {
  const set = new Set<string>();
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (email && email.includes("@") && !email.endsWith(".local")) set.add(email);
  }
  return [...set];
}

/**
 * Everyone who should receive the monthly newsletter, de-duplicated by email:
 * subscribers and active paid members who haven't left the updates list.
 */
export async function newsletterRecipients() {
  const now = new Date();
  const [subscribers, members] = await Promise.all([
    prisma.subscriber.findMany({ where: { unsubscribedAt: null }, select: { email: true } }),
    prisma.user.findMany({
      where: { stripeCurrentPeriodEnd: { gt: now }, email: { not: null }, emailUpdates: true },
      select: { email: true },
    }),
  ]);
  return cleanEmails([...subscribers, ...members]);
}

/**
 * Everyone who hears about new releases: every account with an email (paid
 * members and free accounts alike) and every subscriber, unless they've left
 * the updates list. Members-only releases still go to everyone, because
 * non-members land on the free preview.
 */
export async function announcementRecipients() {
  const [subscribers, users] = await Promise.all([
    prisma.subscriber.findMany({ where: { unsubscribedAt: null }, select: { email: true } }),
    prisma.user.findMany({ where: { email: { not: null }, emailUpdates: true }, select: { email: true } }),
  ]);
  return cleanEmails([...subscribers, ...users]);
}

const sendingEnabled = () => !!process.env.AUTH_RESEND_KEY;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One email per person, so each carries their own unsubscribe link. Paced
 * gently when really sending, to stay inside the email provider's rate limit.
 */
async function sendToEach(recipients: string[], subject: string, content: EmailContent, list: EmailList, tag: string) {
  let sent = 0;
  for (const to of recipients) {
    if (await deliver(to, subject, content, { list, tag })) sent++;
    if (sendingEnabled()) await pause(250);
  }
  return sent;
}

export type PublishResult = { status: "published" | "approved"; message: string };

/**
 * Carry out what "Approve & publish" means for each kind of draft.
 * Throws if something goes wrong, leaving the draft untouched.
 */
export async function publishDraft(id: string): Promise<PublishResult> {
  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft) throw new Error("That draft no longer exists.");
  if (draft.status === "published") return { status: "published", message: "This was already published." };

  const payload = payloadOf(draft);
  const now = new Date();
  const done = (extra: Prisma.InputJsonObject = {}, status: "published" | "approved" = "published") =>
    prisma.draft.update({
      where: { id },
      data: {
        status,
        reviewedAt: now,
        ...(status === "published" ? { publishedAt: now } : {}),
        payload: { ...(payload as Prisma.InputJsonObject), ...extra },
      },
    });

  switch (draft.kind) {
    case "gazette_article": {
      await done();
      return { status: "published", message: "Published to Trichozette." };
    }

    case "community_post": {
      const system = await getSystemUser();
      const post = await prisma.communityPost.create({
        data: {
          title: str(payload.title) || draft.title,
          content: draft.body,
          category: "discussion",
          space: normalizeSpace(str(payload.space) || "lounge", await getRooms()),
          ...(payload.pin === true ? { pinned: true } : {}),
          // Agent posts go out as the team account so they read as the collective, not as one person.
          authorId: system.id,
        },
      });
      await done({ postId: post.id });
      return { status: "published", message: "Posted in the community." };
    }

    case "email": {
      const to = str(payload.to);
      if (!to.includes("@")) throw new Error("This email has no valid recipient.");
      const { subject, content } = draftEmailContent(draft, payload);
      // Invitations are optional mail, so they carry an unsubscribe link; reminders are part of the service.
      const list: EmailList | undefined = payload.invite === true ? "updates" : undefined;
      if (list && !(await wantsList(to, list))) throw new Error(`${to} has asked not to receive these emails.`);
      const sent = await deliver(to, subject, content, { list, tag: payload.invite === true ? "invite" : "membership" });
      if (!sent) throw new Error("The email couldn't be sent. Please try again in a moment.");
      const skipped = !sendingEnabled();
      await done({ sentAt: now.toISOString(), skipped });
      return {
        status: "published",
        message: skipped ? "Approved. Email sending isn't switched on yet, so it was logged instead." : `Sent to ${to}.`,
      };
    }

    case "newsletter": {
      const recipients = await newsletterRecipients();
      const { subject, content } = newsletterEmail(draft, payload);
      const sent = await sendToEach(recipients, subject, content, "updates", "newsletter");
      const skipped = !sendingEnabled();
      await done({ sentAt: now.toISOString(), sentCount: sent, recipientCount: recipients.length, skipped });
      return {
        status: "published",
        message: skipped
          ? `Approved for ${recipients.length} people. Email sending isn't switched on yet, so it was logged instead.`
          : `Sent to ${sent} of ${recipients.length} people.`,
      };
    }

    case "announcement": {
      const recipients = await announcementRecipients();
      const { subject, content } = announcementEmail(draft, payload);
      const sent = await sendToEach(recipients, subject, content, "updates", "release");
      const skipped = !sendingEnabled();
      await done({ sentAt: now.toISOString(), sentCount: sent, recipientCount: recipients.length, skipped });
      return {
        status: "published",
        message: skipped
          ? `Approved for ${recipients.length} ${recipients.length === 1 ? "person" : "people"}. Email sending isn't switched on yet, so it was logged instead.`
          : `Announced to ${sent} ${sent === 1 ? "person" : "people"}${sent < recipients.length ? ` of ${recipients.length}; the rest have left the list or couldn't be reached` : ""}.`,
      };
    }

    default: {
      // community_nudge, partner_enquiry and anything else: the team acts on it by hand.
      await done({}, "approved");
      return { status: "approved", message: "Marked as handled." };
    }
  }
}
