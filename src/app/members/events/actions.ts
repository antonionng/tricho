"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { getRooms } from "@/lib/rooms";
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

/** The community post a member shares to say they are going. */
function goingPostText(e: { title: string; startsAt: Date; online: boolean; venue: string | null; city: string | null; slug: string }) {
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Dublin" }).format(e.startsAt);
  const where = e.online ? "It is online, so you can join from anywhere." : `It is at ${[e.venue, e.city].filter(Boolean).join(", ")}.`;
  return {
    title: `I'm going to ${e.title}`,
    content: `I'm going to ${e.title} on ${day}. ${where} Is anyone else coming? You can save your place from the events page: /members/events/${e.slug}`,
  };
}

/**
 * Tell the community you are going: a short post in The Lounge, once per
 * member and event, that links to the event so others can join you.
 */
export async function shareGoingAction(eventId: string) {
  const ctx = await getMemberContext();
  const userId = ctx.session?.user?.id;
  if (!userId) redirect("/login?next=/members/events");
  const event = await prisma.event.findFirst({
    where: { id: eventId, published: true },
    select: { id: true, slug: true, title: true, startsAt: true, online: true, venue: true, city: true, chapterId: true },
  });
  if (!event) redirect("/members/events");
  const back = `/members/events/${event.slug}`;

  const going =
    (await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId, userId } } })) ||
    (await prisma.eventTicket.findFirst({ where: { eventId, userId, status: "paid" }, select: { id: true } }));
  if (!going || ctx.restricted) redirect(`${back}?shared=no`);

  const rooms = await getRooms();
  if (!memberCanPost("lounge", ctx, rooms)) redirect(`${back}?shared=no`);

  const { title, content } = goingPostText(event);
  const existing = await prisma.communityPost.findFirst({ where: { authorId: userId, title }, select: { id: true } });
  const post =
    existing ??
    (await prisma.communityPost.create({
      data: { title, content, category: "discussion", space: "lounge", authorId: userId, chapterId: event.chapterId },
      select: { id: true },
    }));
  revalidatePath("/members/community");
  redirect(`/members/community/${post.id}?shared=1`);
}
