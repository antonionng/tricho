"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { deliver } from "@/lib/mail/send";
import { rsvpConfirmedEmail } from "@/lib/mail/templates/members";

export async function toggleRsvp(eventId: string) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId || !ctx.allowed || !eventId) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, published: true },
    select: { id: true, capacity: true, startsAt: true, _count: { select: { rsvps: true } } },
  });
  if (!event) return;

  const key = { eventId_userId: { eventId, userId } };
  const existing = await prisma.eventRsvp.findUnique({ where: key });
  if (existing) {
    await prisma.eventRsvp.delete({ where: key });
  } else {
    if (event.startsAt.getTime() < Date.now()) return;
    if (event.capacity != null && event._count.rsvps >= event.capacity) return;
    await prisma.eventRsvp.create({ data: { eventId, userId } });
    // A booking confirmation is part of the service, so it is always sent.
    after(async () => {
      const [user, full] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
        prisma.event.findUnique({ where: { id: eventId } }),
      ]);
      if (!user?.email || !full) return;
      const email = rsvpConfirmedEmail({ name: user.name, event: full });
      await deliver(user.email, email.subject, email.content, { tag: "event-rsvp" });
    });
  }
  revalidatePath("/members/events");
  revalidatePath("/members");
}
