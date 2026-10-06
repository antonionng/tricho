import { fail, json, withMember } from "@/lib/mobile/api";
import { plainTextBlocks } from "@/lib/plain-text";
import { AUDIENCE, publishedPiece } from "@/app/members/learn/_data";

/** A library piece, with its body split into headings and paragraphs. */
export const GET = withMember<{ id: string }>(
  async (_req, ctx, { id }) => {
    const piece = await publishedPiece(id);
    if (!piece) return fail(404, "This piece is no longer in the library.");
    return json({
      piece: {
        id: piece.id,
        title: piece.title,
        summary: piece.summary,
        kind: piece.kind,
        audience: AUDIENCE[piece.audience] ?? piece.audience,
        blocks: plainTextBlocks(piece.body),
      },
      // Professionals can take the piece to the Assistant, as on the website.
      assistantPrompt: ctx.professional
        ? `Help me apply this Trichollective piece in practice: "${piece.title}". Summary: ${piece.summary}`
        : null,
    });
  },
  { members: true }
);
