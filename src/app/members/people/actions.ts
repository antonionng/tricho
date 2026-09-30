"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { notify } from "@/lib/community";

export async function toggleFollow(followeeId: string) {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me || !ctx.allowed || !followeeId || followeeId === me) return;

  const key = { followerId_followeeId: { followerId: me, followeeId } };
  const existing = await prisma.follow.findUnique({ where: key });
  if (existing) {
    await prisma.follow.delete({ where: key });
  } else {
    const target = await prisma.user.findUnique({ where: { id: followeeId }, select: { id: true } });
    if (!target) return;
    await prisma.follow.create({ data: { followerId: me, followeeId } });
    await notify({
      userId: followeeId,
      kind: "follow",
      title: `${ctx.session?.user?.name || "A member"} started following you`,
      href: `/members/people/${me}`,
    });
  }
  revalidatePath("/members/people");
  revalidatePath(`/members/people/${followeeId}`);
  revalidatePath("/members");
}

/** Opens the existing one-to-one conversation with this member, or starts one. */
export async function startConversation(formData: FormData) {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me) redirect("/login?next=/members/messages");
  if (!ctx.allowed) redirect("/pricing");

  const otherId = String(formData.get("userId") ?? "").slice(0, 64);
  if (!otherId || otherId === me) redirect("/members/messages");
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!other) redirect("/members/people");

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [{ members: { some: { userId: me } } }, { members: { some: { userId: otherId } } }],
      members: { every: { userId: { in: [me, otherId] } } },
    },
    select: { id: true },
  });
  if (existing) redirect(`/members/messages/${existing.id}`);

  const convo = await prisma.conversation.create({
    data: { members: { create: [{ userId: me, lastReadAt: new Date() }, { userId: otherId }] } },
    select: { id: true },
  });
  redirect(`/members/messages/${convo.id}`);
}
