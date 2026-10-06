import { body, runAction, withMember } from "@/lib/mobile/api";
import { submitCheck } from "@/app/members/courses/[slug]/actions";
import { answersFrom } from "../../../../_shared";

/** Marks a lesson's knowledge check with the website's action. Answering it completes the lesson. */
export const POST = withMember<{ slug: string; lesson: string }>(async (req, _ctx, { slug, lesson }) => {
  const { answers } = await body<{ answers: unknown }>(req);
  return runAction(() => submitCheck(slug, lesson, answersFrom(answers)));
});
