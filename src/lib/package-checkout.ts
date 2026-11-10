import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { checkoutTermsText } from "@/lib/legal";
import { newAttendeeCode, attendeeRows } from "@/lib/attendees";
import { CHECKOUT_EXPIRES_MINUTES, holdCutoff, seatUsage, ticketLineName, typeAvailability } from "@/lib/tickets";
import {
  exhibitorDetails,
  extrasLeft,
  invoiceFields,
  kindOf,
  packageAvailability,
  packageBlocked,
  packagePlaces,
  type PackageRule,
} from "@/lib/packages";

/**
 * Starting a Stripe Checkout for an exhibitor package, or for extra places on
 * one. Called by the event checkout route once it knows the ticket type is a
 * package or an add-on. Everything the buyer gives comes in the POST body and
 * is stored with the pending order, never put in a URL.
 *
 * Package checkouts turn on Stripe's invoice creation, so the business gets an
 * invoice with its company name, and Stripe's own tax ID collection, so a buyer
 * can add their VAT number there too. No VAT is charged on event prices for now.
 */

export type CheckoutEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  timezone: string;
  online: boolean;
  stageSlots: number | null;
  standSpaces: number | null;
};

export type CheckoutResult = { status: number; body: { url?: string; error?: string } };

class Refused extends Error {
  constructor(
    message: string,
    readonly status = 409
  ) {
    super(message);
  }
}

const fail = (error: string, status: number): CheckoutResult => ({ status, body: { error } });

function lock(eventId: string) {
  return `event-tickets:${eventId}`;
}

/** Create the Checkout Session for a held order, or release the hold if Stripe refuses. */
async function openCheckout(ticketId: string, params: Stripe.Checkout.SessionCreateParams): Promise<CheckoutResult> {
  try {
    const checkout = await stripe.checkout.sessions.create(params);
    await prisma.eventTicket.update({ where: { id: ticketId }, data: { stripeSessionId: checkout.id } });
    return { status: 200, body: { url: checkout.url ?? undefined } };
  } catch (error) {
    await prisma.eventTicket.update({ where: { id: ticketId }, data: { status: "cancelled" } }).catch(() => null);
    throw error;
  }
}

/** Buy one exhibitor or sponsor package. */
export async function startPackageCheckout(
  event: CheckoutEvent,
  type: PackageRule,
  body: { exhibitor?: unknown; attendees?: unknown },
  who: { isMember: boolean } | null
): Promise<CheckoutResult> {
  if (event.online) return fail("Exhibitor packages are only sold for in-person events.", 400);
  const details = exhibitorDetails(body.exhibitor);
  if (!details.ok) return fail(details.error, 400);
  const d = details.data;
  const places = packagePlaces(body.attendees, type.placesIncluded, d);
  if (!places.ok) return fail(places.error, 400);
  const pricePence = Math.max(0, Math.round(type.pricePence));
  if (pricePence <= 0) return fail("This package has no price to pay. Please get in touch with us to book it.", 400);

  let ticketId: string;
  let manageCode: string;
  try {
    ({ ticketId, manageCode } = await prisma.$transaction(async (tx) => {
      // The same lock as attendee tickets, so stock, stands and stage slots can never be oversold.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lock(event.id)}))`;
      const now = new Date();
      await tx.eventTicket.updateMany({
        where: { eventId: event.id, status: "pending", createdAt: { lt: holdCutoff(now) } },
        data: { status: "cancelled" },
      });
      const usage = await seatUsage(event.id, now, tx);
      const a = packageAvailability(type, event, usage.packageOrders, { now, isMember: !!who?.isMember });
      const blocked = packageBlocked(type, a);
      if (blocked) throw new Refused(blocked, a.state === "sold_out" ? 409 : 400);
      const created = await tx.eventTicket.create({
        data: {
          eventId: event.id,
          userId: null,
          email: d.contactEmail,
          name: d.contactName,
          quantity: 1,
          amount: pricePence,
          currency: "gbp",
          priceType: "guest",
          ticketTypeId: type.id,
          status: "pending",
        },
        select: { id: true },
      });
      const code = newAttendeeCode();
      await tx.eventExhibitor.create({ data: { ...d, eventId: event.id, ticketId: created.id, manageCode: code } });
      if (places.rows.length) {
        await tx.eventAttendee.createMany({
          data: places.rows.map((p) => ({ ...p, ticketId: created.id, eventId: event.id, code: newAttendeeCode() })),
        });
      }
      return { ticketId: created.id, manageCode: code };
    }));
  } catch (err) {
    if (err instanceof Refused) return fail(err.message, err.status);
    throw err;
  }

  const metadata = { kind: "ticket", ticketId, eventId: event.id, ticketTypeId: type.id, package: type.name.slice(0, 100) };
  const line = `${type.name} package, ${ticketLineName(event)}`.slice(0, 250);
  return openCheckout(ticketId, {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: pricePence,
          tax_behavior: "inclusive",
          product_data: { name: line, description: `Exhibitor package for ${d.companyName}`.slice(0, 250) },
        },
      },
    ],
    customer_email: d.contactEmail,
    customer_creation: "always",
    // Businesses get an invoice with their company name on it.
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: line,
        custom_fields: invoiceFields(d),
        metadata: { ticketId, eventId: event.id },
        footer: `Invoice to: ${d.companyName}, ${d.invoiceAddress.replace(/\n/g, ", ")}`.slice(0, 5000),
      },
    },
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    locale: "en-GB",
    allow_promotion_codes: true,
    custom_text: checkoutTermsText("exhibitor"),
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
    metadata,
    payment_intent_data: { metadata, description: line },
    success_url: `${site.url}/events/${event.slug}/exhibitor/${manageCode}?package=success`,
    cancel_url: `${site.url}/events/${event.slug}?package=cancelled#exhibit`,
  });
}

/** The package order a code belongs to, if it is paid and for this event. */
export async function packageByCode(eventId: string, code: unknown) {
  const raw = typeof code === "string" ? code.trim().toUpperCase().replace(/[\s-]/g, "") : "";
  if (!raw || raw.length > 40) return null;
  const ex = await prisma.eventExhibitor.findFirst({
    where: { eventId, manageCode: raw, ticket: { status: "paid" } },
    select: {
      companyName: true,
      contactName: true,
      contactEmail: true,
      manageCode: true,
      ticket: { select: { id: true, ticketTypeId: true, ticketType: { select: { kind: true } } } },
    },
  });
  if (!ex || kindOf(ex.ticket.ticketType) !== "package") return null;
  return ex;
}

/** Buy extra places for a paid package, up to the add-on's limit per package. */
export async function startAddonCheckout(
  event: CheckoutEvent,
  addon: PackageRule,
  body: { packageCode?: unknown; quantity?: unknown; attendees?: unknown },
  who: { isMember: boolean } | null
): Promise<CheckoutResult> {
  const pkg = await packageByCode(event.id, body.packageCode);
  if (!pkg) return fail("We could not find a paid package with that code. Please check the code in your confirmation email.", 404);
  if (!pkg.ticket.ticketTypeId || !(addon.addonForTypeIds ?? []).includes(pkg.ticket.ticketTypeId)) {
    return fail(`${addon.name} is not available with your package.`, 400);
  }
  const quantity = Math.round(Number(body.quantity ?? 1));
  if (!Number.isFinite(quantity) || quantity < 1) return fail("Please choose how many extra places you need.", 400);
  const people = attendeeRows(body.attendees, quantity, { name: pkg.contactName, email: pkg.contactEmail });
  if (!people.ok) return fail(people.error, 400);
  const pricePence = Math.max(0, Math.round(addon.pricePence));
  if (pricePence <= 0) return fail("Extra places have no price to pay. Please get in touch with us to add them.", 400);

  let ticketId: string;
  try {
    ticketId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lock(event.id)}))`;
      const now = new Date();
      await tx.eventTicket.updateMany({
        where: { eventId: event.id, status: "pending", createdAt: { lt: holdCutoff(now) } },
        data: { status: "cancelled" },
      });
      const usage = await seatUsage(event.id, now, tx);
      const total = usage.packageOrders.filter((o) => o.ticketTypeId === addon.id).reduce((s, o) => s + o.quantity, 0);
      const a = typeAvailability(addon, { now, eventStartsAt: event.startsAt, taken: total, eventLeft: null, isMember: !!who?.isMember || !addon.membersOnly });
      if (a.state === "not_yet") throw new Refused(`${addon.name} is not on sale yet.`, 400);
      if (a.state === "closed") throw new Refused(`${addon.name} is no longer on sale.`, 400);
      const left = extrasLeft(addon, pkg.ticket.id, usage.packageOrders);
      if (left < quantity) {
        throw new Refused(
          left === 0
            ? `${pkg.companyName} already has every extra place available to its package.`
            : `${pkg.companyName} can add ${left} more ${left === 1 ? "place" : "places"}.`
        );
      }
      const created = await tx.eventTicket.create({
        data: {
          eventId: event.id,
          userId: null,
          email: pkg.contactEmail,
          name: pkg.contactName,
          quantity,
          amount: pricePence * quantity,
          currency: "gbp",
          priceType: "guest",
          ticketTypeId: addon.id,
          packageTicketId: pkg.ticket.id,
          status: "pending",
        },
        select: { id: true },
      });
      await tx.eventAttendee.createMany({
        data: people.rows.map((p) => ({ ...p, ticketId: created.id, eventId: event.id, code: newAttendeeCode() })),
      });
      return created.id;
    });
  } catch (err) {
    if (err instanceof Refused) return fail(err.message, err.status);
    throw err;
  }

  const metadata = { kind: "ticket", ticketId, eventId: event.id, ticketTypeId: addon.id, packageTicketId: pkg.ticket.id };
  const line = `${addon.name}, ${ticketLineName(event)}`.slice(0, 250);
  const back = `${site.url}/events/${event.slug}/exhibitor/${pkg.manageCode}`;
  return openCheckout(ticketId, {
    mode: "payment",
    line_items: [
      {
        quantity,
        price_data: {
          currency: "gbp",
          unit_amount: pricePence,
          tax_behavior: "inclusive",
          product_data: { name: line, description: `Extra places for ${pkg.companyName}`.slice(0, 250) },
        },
      },
    ],
    customer_email: pkg.contactEmail,
    customer_creation: "always",
    invoice_creation: {
      enabled: true,
      invoice_data: { description: line, custom_fields: [{ name: "Company", value: pkg.companyName.slice(0, 140) }], metadata: { ticketId, eventId: event.id } },
    },
    tax_id_collection: { enabled: true },
    locale: "en-GB",
    custom_text: checkoutTermsText("exhibitor"),
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60,
    metadata,
    payment_intent_data: { metadata, description: line },
    success_url: `${back}?extras=success`,
    cancel_url: `${back}?extras=cancelled`,
  });
}
