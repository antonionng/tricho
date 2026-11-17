/**
 * Posts in The Lounge, as the Trichollective team, that the masterclass recordings are on
 * Trichollective TV. Pinned, and never posted twice (it checks for a post with the same title).
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/post-tv-live.ts          # dry run: prints the post
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/post-tv-live.ts --post   # posts it
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

const post = process.argv.includes("--post");

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("Set NEXT_PUBLIC_SITE_URL so links point at the live site, not localhost.");
  const { prisma } = await import("../src/lib/prisma");
  const { listRecordings, nextLiveSession, RECORDING_KIND_LABEL, recordingDate, liveSessionWhen } = await import("../src/lib/recordings");

  const recordings = await listRecordings(12);
  if (recordings.length === 0) throw new Error("No published past event has a recording yet, so there is nothing to announce.");
  const next = await nextLiveSession();

  const title = "Trichollective TV is live: the masterclass recordings are here";
  const label = (kind: string) => RECORDING_KIND_LABEL[kind] ?? "Session";
  // Titles usually carry the kind already ("Masterclass: ..."), so only add it when they don't.
  const named = (kind: string, title: string) => (title.toLowerCase().startsWith(label(kind).toLowerCase()) ? title : `${label(kind)}: ${title}`);
  const lines = recordings.map(
    (r) => `- ${named(r.kind, r.title)}, recorded ${recordingDate(r.startsAt)}${r.presenters ? ` with ${r.presenters}` : ""}. ${siteUrl}/members/events/${r.slug}`
  );
  const content = [
    "If you missed a live session, or want to go back over one, the recording now plays on the event page, and every recording lives together on Trichollective TV in the menu on the left.",
    lines.join("\n"),
    `Watch them all here: ${siteUrl}/members/tv`,
    next
      ? `The next live session is on ${liveSessionWhen(next.startsAt)} UK time: ${named(next.kind, next.title)}${next.presenters ? `, with ${next.presenters}` : ""}. Save your place: ${siteUrl}/members/events/${next.slug}`
      : "The next live session will be announced here as soon as it is scheduled.",
    "The recordings are for members, so please keep the links inside Trichollective.",
  ].join("\n\n");

  console.log(`Title: ${title}\n\n${content}\n`);
  if (!post) {
    console.log("Dry run. Add --post to publish it in The Lounge as the Trichollective team.");
    return;
  }
  // The "Trichollective team" account that agent posts go out as (see src/agents/publish.ts).
  const system = await prisma.user.upsert({
    where: { email: "team@trichollective.local" },
    update: {},
    create: { email: "team@trichollective.local", name: "Trichollective team" },
  });
  const existing = await prisma.communityPost.findFirst({ where: { authorId: system.id, title }, select: { id: true } });
  if (existing) {
    console.log(`Already posted (${existing.id}), nothing to do.`);
    return;
  }
  const created = await prisma.communityPost.create({
    data: { title, content, category: "discussion", space: "lounge", pinned: true, authorId: system.id },
    select: { id: true },
  });
  console.log(`Posted and pinned in The Lounge: ${siteUrl}/members/community/${created.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 500));
