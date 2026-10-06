import { body, fail, json, withMember } from "@/lib/mobile/api";
import { saveNotes } from "@/app/members/courses/[slug]/actions";

/** Saves a learner's private notes and reflection for one lesson, with the website's action. */
export const POST = withMember<{ slug: string; lesson: string }>(async (req, _ctx, { slug, lesson }) => {
  const { notes, reflection } = await body<{ notes: unknown; reflection: unknown }>(req);
  const result = await saveNotes(slug, lesson, {
    notes: typeof notes === "string" ? notes : undefined,
    reflection: typeof reflection === "string" ? reflection : undefined,
  });
  if (!result.ok) return fail(403, "Notes are saved once you're enrolled.");
  return json(result);
});
