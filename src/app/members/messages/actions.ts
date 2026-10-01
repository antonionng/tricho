"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { notify } from "@/lib/community";
import { deliver } from "@/lib/mail/send";
import { newMessageEmail } from "@/lib/mail/templates/members";
import type { FormState } from "@/app/members/community/actions";

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getMemberContext();
  const me = ctx.session?.user?.id;
  if (!me || !ctx.allowed) return { error: "Messages are part of membership." };

  const conversationId = String(formData.get("conversationId") ?? "").slice(0, 64);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!body) return { error: "Write a message first." };

  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    select: { userId: true, lastReadAt: true },
  });
  if (!members.some((m) => m.userId === me)) return { error: "That conversation could not be found." };

  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: me, body } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } }),
    prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: me } },
      data: { lastReadAt: now },
    }),
  ]);

  const href = `/members/messages/${conversationId}`;
  const sender = ctx.session?.user?.name || "A member";
  for (const m of members) {
    if (m.userId === me) continue;
    // One unread notification per conversation is enough; don't stack them.
    const pending = await prisma.notification.findFirst({
      where: { userId: m.userId, href, readAt: null },
      select: { id: true },
    });
    if (pending) continue;
    await notify({ userId: m.userId, kind: "message", title: `New message from ${sender}`, href });
    // Email only alongside a new notification, so a busy conversation sends one email until it is read.
    const recipientId = m.userId;
    after(async () => {
      const to = await prisma.user.findUnique({ where: { id: recipientId }, select: { name: true, email: true } });
      if (!to?.email) return;
      const email = newMessageEmail({ recipientName: to.name, senderName: sender, message: body, conversationId });
      await deliver(to.email, email.subject, email.content, { list: "activity", tag: "activity" });
    });
  }

  revalidatePath(href);
  revalidatePath("/members/messages");
  return { ok: true };
}
