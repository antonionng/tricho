import { fail, json, withMember } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { POST as startCheckout } from "@/app/api/events/[id]/checkout/route";

/**
 * Starts the website's Stripe checkout for a ticket to an in-person event, for
 * the app to open in the browser. Answers { url }. Tickets to online events are
 * not sold in the app (App Store rules), so those answer 403 and members buy on
 * trichollective.net. After paying, Stripe returns to the public event page,
 * which needs no sign-in in the browser.
 */
export const POST = withMember<{ slug: string }>(
  async (req, _ctx, { slug }) => {
    const event = await prisma.event.findFirst({
      where: { slug, published: true },
      select: { id: true, online: true, sellTickets: true },
    });
    if (!event || !event.sellTickets) return fail(404, "Tickets for this event are not sold on Trichollective.");
    if (event.online) return fail(403, "Tickets for this event are available on trichollective.net.");

    const res = await startCheckout(
      new Request(req.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ quantity: 1 }) }),
      { params: Promise.resolve({ id: event.id }) }
    );
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !data.url) return fail(res.status >= 400 ? res.status : 500, data.error ?? "We could not start the payment. Please try again in a moment.");
    return json({ url: data.url });
  },
  { members: true }
);
