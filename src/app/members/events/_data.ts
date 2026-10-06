import "server-only";
import { prisma } from "@/lib/prisma";
import { holdCutoff } from "@/lib/tickets";
import { publicEventSelect } from "@/components/editorial/events";

/** Seats that count: paid tickets and holds still inside their checkout window. */
const liveTickets = (cutoff: Date) => ({
  where: { OR: [{ status: "paid" as const }, { status: "pending" as const, createdAt: { gte: cutoff } }] },
  select: { quantity: true, userId: true, status: true },
});

/** Upcoming events for the members' events list, kept visible for a few hours after they start. */
export async function upcomingMemberEvents(now = new Date()) {
  const since = new Date(now);
  since.setHours(since.getHours() - 3);
  return prisma.event.findMany({
    where: { published: true, startsAt: { gte: since } },
    orderBy: { startsAt: "asc" },
    take: 40,
    select: {
      id: true,
      slug: true,
      title: true,
      kind: true,
      summary: true,
      startsAt: true,
      endsAt: true,
      venue: true,
      city: true,
      online: true,
      priceGBP: true,
      memberPriceGBP: true,
      capacity: true,
      ticketUrl: true,
      sellTickets: true,
      chapterId: true,
      rsvps: {
        orderBy: { createdAt: "asc" },
        select: { userId: true, user: { select: { id: true, name: true, image: true, accessStatus: true } } },
      },
      tickets: liveTickets(holdCutoff(now)),
    },
  });
}

/** One published event for the members' event page, with who is going. */
export async function memberEventBySlug(slug: string, now = new Date()) {
  return prisma.event.findFirst({
    where: { slug, published: true },
    select: {
      ...publicEventSelect,
      chapterId: true,
      joinUrl: true,
      rsvps: {
        orderBy: { createdAt: "asc" },
        select: {
          userId: true,
          user: { select: { id: true, name: true, image: true, accessStatus: true, profile: { select: { profession: true } } } },
        },
      },
      tickets: liveTickets(holdCutoff(now)),
    },
  });
}

/** Members who are going and whose accounts are active, with the viewer first. */
export function visibleAttendees<U extends { id: string; accessStatus: string | null }>(rsvps: { user: U }[], userId: string) {
  return rsvps
    .map((r) => r.user)
    .filter((u) => u.accessStatus === "active")
    .sort((a, b) => Number(b.id === userId) - Number(a.id === userId));
}
