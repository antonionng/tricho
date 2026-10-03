import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAllRooms } from "@/lib/rooms";
import { normalizeSpace, roomById, type Room, type RoomId } from "@/config/rooms";
import { aiAvailable, generateStructured } from "./ai";

/** Shared with the Case Room privacy check in the community agent. */
export const CASE_PRIVACY_GUIDANCE =
  "You check anonymised clinical case posts shared between hair and scalp professionals. Decide whether the text contains information that could identify the client: a name, a name with an age, contact details, an exact address, workplace, or a rare combination of specifics. Broad details such as 'a woman in her 30s' are fine.";

export const verdictSchema = z.object({
  severity: z.enum(["none", "low", "high"]),
  category: z.enum(["privacy", "medical_claim", "promotion", "abuse", "other"]),
  rationale: z.string(),
  suggestedAction: z.enum(["none", "review", "hide"]),
});

export type ModerationVerdict = z.infer<typeof verdictSchema>;

const MODERATION_SYSTEM = `You are the moderation assistant for a professional community of hair and scalp practitioners. You read one post or reply and give the team a short, calm assessment. You never act yourself; a person reviews everything you flag.

Look for four things:
- Privacy: ${CASE_PRIVACY_GUIDANCE}
- Medical claims: promises to cure or guarantee results, or confident diagnoses given to the public. Professionals discussing clinical approaches carefully with each other is fine.
- Promotion: advertising, discount codes or pushing a product or service in a space that is not for business.
- Abuse: personal attacks, harassment, discrimination or anything unkind aimed at a person.

Severity:
- "none": nothing to act on. Use category "other" and suggested action "none".
- "low": worth a look but probably fine. Suggested action "review".
- "high": clearly breaks the rules or puts a client's privacy at risk. Suggested action "hide" when the content should come down until someone checks it, otherwise "review".

Write the rationale as one or two plain sentences in British English, saying exactly what you noticed. Do not quote identifying details back.`;

/** Asks the moderation assistant for a verdict. Returns null without an AI key or on failure. */
export async function assessContent({ text, room }: { text: string; room?: Room | null }): Promise<ModerationVerdict | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const about = room
    ? [
        `Space: ${room.label}`,
        `About the space: ${room.blurb}`,
        room.professionalOnly ? "This space is for verified professionals discussing anonymised client cases, so privacy matters most here." : null,
        room.noBrands ? "Businesses and brands may not post in this space." : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "Space: unknown";
  return generateStructured(verdictSchema, MODERATION_SYSTEM, `${about}\n\nContent:\n${trimmed.slice(0, 4000)}`);
}

/**
 * Checks a new post or reply in rooms that have the moderation assistant switched on.
 * A high-severity verdict files a report for the team; in professional rooms, where the
 * main risk is a client's privacy, the content is also hidden until someone reviews it.
 * Does nothing without an AI key.
 */
export async function moderateNewContent({
  postId,
  commentId,
  text,
  roomId,
}: {
  postId?: string;
  commentId?: string;
  text: string;
  roomId: RoomId;
}): Promise<ModerationVerdict | null> {
  if (!aiAvailable()) return null;
  try {
    const rooms = await getAllRooms();
    const room = roomById(roomId, rooms);
    if (!room?.aiModeration) return null;

    const verdict = await assessContent({ text, room });
    if (!verdict || verdict.severity !== "high") return verdict;

    let reportPostId = postId;
    if (!reportPostId && commentId) {
      const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { postId: true } });
      reportPostId = comment?.postId;
    }
    if (!reportPostId) return verdict;

    await prisma.report.create({
      data: {
        postId: reportPostId,
        commentId: commentId ?? null,
        source: "moderation",
        reason: verdict.rationale,
        aiVerdict: verdict,
      },
    });

    if (room.professionalOnly) {
      const hiddenReason = `Hidden automatically by the moderation assistant until the team reviews it. ${verdict.rationale}`;
      if (commentId) {
        await prisma.comment.update({ where: { id: commentId }, data: { hiddenAt: new Date(), hiddenReason } });
      } else {
        await prisma.communityPost.update({ where: { id: reportPostId }, data: { hiddenAt: new Date(), hiddenReason } });
      }
    }
    return verdict;
  } catch (error) {
    console.error("[moderation] could not check new content", error);
    return null;
  }
}

/** Attaches the moderation assistant's verdict to a member's report. Does nothing without an AI key. */
export async function assessReport(reportId: string): Promise<ModerationVerdict | null> {
  if (!aiAvailable()) return null;
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        aiVerdict: true,
        post: { select: { title: true, content: true, space: true } },
        comment: { select: { content: true } },
      },
    });
    if (!report || report.aiVerdict) return null;
    const rooms = await getAllRooms();
    const room = roomById(normalizeSpace(report.post.space, rooms), rooms);
    const text = report.comment ? report.comment.content : [report.post.title ?? "", report.post.content].join("\n\n");
    const verdict = await assessContent({ text, room });
    if (!verdict) return null;
    await prisma.report.update({ where: { id: reportId }, data: { aiVerdict: verdict } });
    return verdict;
  } catch (error) {
    console.error("[moderation] could not assess report", error);
    return null;
  }
}

/** Reads a stored verdict back safely; old or malformed values come back as null. */
export function parseVerdict(value: unknown): ModerationVerdict | null {
  const parsed = verdictSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
