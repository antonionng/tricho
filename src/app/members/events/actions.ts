"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { deliver } from "@/lib/mail/send";
import { rsvpConfirmedEmail } from "@/lib/mail/templates/members";
import { seatUsage, seatsLeft } from "@/lib/tickets";

export type RsvpResult = { ok: boolean; going?: boolean; error?: string };

export async function toggleRsvp(eventId: string): Promise<RsvpResult> {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) return { ok: false, error: "Please sign in again to say you are going." };
  if (!ctx.allowed) return { ok: false, error: "Saying you are going to events is part of membership." };
  if (ctx.restricted && ctx.restricted.status !== "muted") return { ok: false, error: "This account cannot book events at the moment." };
  if (!eventId) return { ok: false, error: "We could not find that event." };

  const event = await prisma.event.findFirst({
    where: { id: eventId, published: true },
    select: { id: true, slug: true, capacity: true, startsAt: true, sellTickets: true, memberPriceGBP: true, _count: { select: { rsvps: true } } },
  });
  if (!event) return { ok: false, error: "This event is no longer listed." };

  const key = { eventId_userId: { eventId, userId } };
  const existing = await prisma.eventRsvp.findUnique({ where: key });
  let going: boolean;
  if (existing) {
    // A paid ticket keeps its place; refunds go through the team.
    const paid = await prisma.eventTicket.count({ where: { eventId, userId, status: "paid" } });
    if (paid > 0) return { ok: false, error: "You have a paid ticket for this event. To cancel it, please write to the team." };
    await prisma.eventRsvp.delete({ where: key });
    going = false;
  } else {
    if (event.startsAt.getTime() < Date.now()) return { ok: false, error: "This event has already started, so places can no longer be reserved." };
    // When tickets are sold here, members pay through checkout unless the event is free for them.
    if (event.sellTickets && event.memberPriceGBP > 0) return { ok: false, error: "This is a paid event, so please buy a ticket to reserve your place." };
    if (event.sellTickets) {
      const usage = await seatUsage(eventId);
      if (seatsLeft(event, usage.tickets, usage.rsvps) === 0) return { ok: false, error: "This event is sold out." };
    } else if (event.capacity != null && event._count.rsvps >= event.capacity) {
      return { ok: false, error: "This event is fully booked." };
    }
    await prisma.eventRsvp.create({ data: { eventId, userId } });
    going = true;
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
  revalidatePath(`/members/events/${event.slug}`);
  revalidatePath("/members");
  return { ok: true, going };
}
