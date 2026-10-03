"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { deliver } from "@/lib/mail/send";
import { rsvpConfirmedEmail } from "@/lib/mail/templates/members";
import { seatUsage, seatsLeft } from "@/lib/tickets";

export async function toggleRsvp(eventId: string) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId || !ctx.allowed || !eventId) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, published: true },
    select: { id: true, capacity: true, startsAt: true, sellTickets: true, memberPriceGBP: true, _count: { select: { rsvps: true } } },
  });
  if (!event) return;

  const key = { eventId_userId: { eventId, userId } };
  const existing = await prisma.eventRsvp.findUnique({ where: key });
  if (existing) {
    // A paid ticket keeps its place; refunds go through the team.
    const paid = await prisma.eventTicket.count({ where: { eventId, userId, status: "paid" } });
    if (paid > 0) return;
    await prisma.eventRsvp.delete({ where: key });
  } else {
    if (event.startsAt.getTime() < Date.now()) return;
    // When tickets are sold here, members pay through checkout unless the event is free for them.
    if (event.sellTickets && event.memberPriceGBP > 0) return;
    if (event.sellTickets) {
      const usage = await seatUsage(eventId);
      if (seatsLeft(event, usage.tickets, usage.rsvps) === 0) return;
    } else if (event.capacity != null && event._count.rsvps >= event.capacity) return;
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
