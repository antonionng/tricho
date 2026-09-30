import type { Draft, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail, textToHtml } from "@/lib/email";
import { normalizeSpace } from "@/config/rooms";
import { site } from "@/config/site";

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

/** Everyone who should receive the monthly newsletter, de-duplicated by email. */
export async function newsletterRecipients() {
  const now = new Date();
  const [subscribers, members] = await Promise.all([
    prisma.subscriber.findMany({ where: { unsubscribedAt: null }, select: { email: true } }),
    prisma.user.findMany({
      where: { stripeCurrentPeriodEnd: { gt: now }, email: { not: null } },
      select: { email: true },
    }),
  ]);
  const set = new Set<string>();
  for (const row of [...subscribers, ...members]) {
    const email = row.email?.trim().toLowerCase();
    if (email && email.includes("@") && !email.endsWith(".local")) set.add(email);
  }
  return [...set];
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
          space: normalizeSpace(str(payload.space) || "lounge"),
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
      const subject = str(payload.subject) || draft.title;
      if (!to.includes("@")) throw new Error("This email has no valid recipient.");
      const result = await sendEmail({ to, subject, text: draft.body });
      await done({ sentAt: now.toISOString(), skipped: !!result.skipped });
      return {
        status: "published",
        message: result.skipped ? "Approved. Email sending isn't switched on yet, so it was logged instead." : `Sent to ${to}.`,
      };
    }

    case "newsletter": {
      const recipients = await newsletterRecipients();
      const subject = str(payload.subject) || draft.title;
      const text = `${draft.body}\n\nYou're receiving this because you joined Trichollective or signed up at ${site.url}. To stop receiving the newsletter, reply to this email and we'll take you off the list.`;
      const html = textToHtml(text);
      let sent = 0;
      let skipped = false;
      for (const to of recipients) {
        try {
          const r = await sendEmail({ to, subject, text, html });
          skipped = skipped || !!r.skipped;
          sent++;
        } catch (error) {
          console.error(`[newsletter] failed for ${to}`, error);
        }
      }
      await done({ sentAt: now.toISOString(), sentCount: sent, recipientCount: recipients.length, skipped });
      return {
        status: "published",
        message: skipped
          ? `Approved for ${recipients.length} people. Email sending isn't switched on yet, so it was logged instead.`
          : `Sent to ${sent} of ${recipients.length} people.`,
      };
    }

    default: {
      // community_nudge, partner_enquiry and anything else: the team acts on it by hand.
      await done({}, "approved");
      return { status: "approved", message: "Marked as handled." };
    }
  }
}
