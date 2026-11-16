import "server-only";
import { redirect } from "next/navigation";
import { getMemberContext } from "@/lib/member";
import { isReviewLink } from "@/lib/review";
import { isDoorOpen } from "@/content/gazette/advent";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

/**
 * Who can see an advent gift: anyone with a Trichollective account, once the door has opened.
 * A private review link (?review=…) can look at any door on any day, signed in or not.
 */
export async function adventAccess(day: number, path: string, searchParams: SearchParams) {
  const review = await isReviewLink(searchParams);
  const ctx = await getMemberContext();
  if (!review && !ctx.session?.user?.id) redirect(`/signup?next=${encodeURIComponent(path)}`);
  return { ctx, review, open: review || isDoorOpen(day) };
}
