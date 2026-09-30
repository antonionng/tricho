"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { draftRefExists } from "@/agents/runtime";
import { roomById } from "@/config/rooms";
import { LAUNCH_POSTS } from "@/content/launch-posts";
import { studioAction } from "../_lib/guard";

/**
 * Drafts the launch-week discussion starters for the team to approve. Posts that
 * were drafted before (in any state) are skipped, so this is safe to press twice.
 */
export async function draftLaunchPostsAction() {
  await studioAction();

  let created = 0;
  let skipped = 0;
  for (const [index, post] of LAUNCH_POSTS.entries()) {
    const ref = `launch:${index}`;
    if (await draftRefExists(ref)) {
      skipped++;
      continue;
    }
    // Saved straight to the inbox rather than through createDraft, so nothing
    // is published without a person reading it first.
    await prisma.draft.create({
      data: {
        agent: "community",
        kind: "community_post",
        title: post.title,
        summary: `Launch-week post for ${roomById(post.space)?.label ?? post.space}${post.pin ? ", pinned to the top" : ""}.`,
        body: post.body,
        payload: { space: post.space, title: post.title, pin: !!post.pin, ref },
      },
    });
    created++;
  }

  revalidatePath("/studio", "layout");
  const notice =
    created === 0
      ? "The launch-week posts have already been drafted. You'll find them in the inbox."
      : `Drafted ${created} launch-week post${created === 1 ? "" : "s"}${skipped ? ` (${skipped} already existed)` : ""}. Approve each one in the inbox to post it as the Trichollective team.`;
  redirect(`/studio/community?notice=${encodeURIComponent(notice)}`);
}
