import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { getMembershipByEmail } from "@/lib/subscription";
import {
  CHECKOUT_EXPIRES_MINUTES,
  MAX_GUEST_TICKETS,
  MAX_MEMBER_TICKETS,
  clampQuantity,
  guestDetails,
  holdCutoff,
  seatUsage,
  seatsLeft,
  ticketLineName,
  ticketPrice,
} from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tickets for an event sold on Trichollective. Signing in is optional:
 *  - GET returns what this visitor would pay, so the button can show the
 *    member price to members and a short name-and-email form to guests.
 *  - POST holds the seats and starts a one-off Stripe Checkout payment.
 * Signed-in active members buy one ticket at the member price; everyone else
 * may buy up to four at the guest price. Emails are never put in URLs.
 */

type Params = { params: Promise<{ id: string }> };

const eventSelect = {
  id: true,
  slug: true,
  title: true,
  startsAt: true,
  capacity: true,
  priceGBP: true,
  memberPriceGBP: true,
  published: true,
  sellTickets: true,
} as const;

async function loadEvent(id: string) {
  const event = await prisma.event.findFirst({ where: { OR: [{ id }, { slug: id }], published: true }, select: eventSelect });
  if (!event || !event.sellTickets) return null;
  return event;
}

async function buyer() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session?.user?.id || !email) return null;
  const membership = await getMembershipByEmail(email);
  return { userId: session.user.id, email, name: session.user.name ?? null, isMember: membership.isActive };
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) return error("Tickets for this event are not sold on Trichollective.", 404);

  const who = await buyer();
  const isMember = !!who?.isMember;
  const price = ticketPrice(event, isMember);
  const usage = await seatUsage(event.id);
  const left = seatsLeft(event, usage.tickets, usage.rsvps);
  const holds = who
    ? await prisma.eventTicket.count({ where: { eventId: event.id, userId: who.userId, status: "paid" } })
    : 0;

  return NextResponse.json(
    {
      signedIn: !!who,
      member: isMember,
      name: who?.name ?? null,
      priceType: price.priceType,
      amountPence: price.amountPence,
      maxQuantity: isMember ? MAX_MEMBER_TICKETS : MAX_GUEST_TICKETS,
      seatsLeft: left,
      hasTicket: holds > 0,
      onSale: event.startsAt.getTime() > Date.now(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

class SoldOut extends Error {}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { name?: unknown; email?: unknown; quantity?: unknown; returnTo?: unknown };

    if (!process.env.STRIPE_SECRET_KEY) return error("Payments are not switched on yet. Please try again shortly.", 503);

    const event = await loadEvent(id);
    if (!event) return error("Tickets for this event are not sold on Trichollective.", 404);
    if (event.startsAt.getTime() <= Date.now()) return error("This event has already started, so tickets are no longer on sale.", 400);

    const who = await buyer();
    const isMember = !!who?.isMember;
    const price = ticketPrice(event, isMember);
    if (price.amountPence <= 0) {
      return error(
        isMember
          ? "This event is free for members. Please save your place from the events page in the members' area."
          : "This event has no ticket price to pay.",
        400
      );
    }

    let name: string | null;
    let email: string;
    if (who) {
      name = who.name;
      email = who.email;
      const already = await prisma.eventTicket.count({ where: { eventId: event.id, userId: who.userId, status: "paid" } });
      if (isMember && already > 0) return error("You already have a ticket for this event.", 409);
    } else {
      const details = guestDetails(body);
      if (!details.ok) return error(details.error, 400);
      name = details.name;
      email = details.email;
    }
    const quantity = clampQuantity(body.quantity, isMember);

    // Hold the seats. The advisory lock serialises buyers for this event so two
    // people can never take the last place at the same moment.
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`event-tickets:${event.id}`}))`;
      const now = new Date();
      await tx.eventTicket.updateMany({
        where: { eventId: event.id, status: "pending", createdAt: { lt: holdCutoff(now) } },
        data: { status: "cancelled" },
      });
      const usage = await seatUsage(event.id, now, tx);
      const left = seatsLeft(event, usage.tickets, usage.rsvps);
      if (left != null && left < quantity) throw new SoldOut(left === 0 ? "This event is sold out." : `Only ${left} ${left === 1 ? "place is" : "places are"} left.`);
      return tx.eventTicket.create({
        data: {
          eventId: event.id,
          userId: who?.userId ?? null,
          email,
          name,
          quantity,
          amount: price.amountPence * quantity,
          currency: "gbp",
          priceType: price.priceType,
          status: "pending",
        },
        select: { id: true },
      });
    });

    const back = body.returnTo === "members" ? "/members/events" : `/events/${event.slug}`;
    const metadata = { kind: "ticket", ticketId: ticket.id, eventId: event.id };
    try {
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity,
            price_data: {
              currency: "gbp",
              unit_amount: price.amountPence,
              // Event prices include VAT, like the membership prices.
              tax_behavior: "inclusive",
              product_data: {
                name: ticketLineName(event),
                description: price.priceType === "member" ? "Member ticket" : "Guest ticket",
              },
            },
          },
        ],
        customer_email: email,
        locale: "en-GB",
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
        metadata,
        payment_intent_data: { metadata, description: ticketLineName(event) },
        success_url: `${site.url}${back}?ticket=success&t=${encodeURIComponent(ticket.id)}`,
        cancel_url: `${site.url}${back}?ticket=cancelled`,
      });
      await prisma.eventTicket.update({ where: { id: ticket.id }, data: { stripeSessionId: checkout.id } });
      return NextResponse.json({ url: checkout.url });
    } catch (stripeError) {
      await prisma.eventTicket.update({ where: { id: ticket.id }, data: { status: "cancelled" } }).catch(() => null);
      throw stripeError;
    }
  } catch (err) {
    if (err instanceof SoldOut) return error(err.message, 409);
    console.error("[TICKET_CHECKOUT]", err);
    return error("We could not start the payment. Please try again in a moment.", 500);
  }
}
