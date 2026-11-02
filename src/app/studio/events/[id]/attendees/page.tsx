import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateTime } from "@/components/studio/ui";
import { loadAttendees } from "@/lib/tickets";
import { studioPage } from "../../../_lib/guard";
import { emailMembersStartingAction } from "../../actions";

export const dynamic = "force-dynamic";
// Sending to every member is paced, so the action may take a while.
export const maxDuration = 300;

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default async function AttendeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const { notice, tone } = await searchParams;
  const staff = await studioPage(`/studio/events/${id}/attendees`, "events.view");
  if (!staff) return <NoAccess what="events" />;

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, title: true, startsAt: true, endsAt: true, capacity: true, sellTickets: true, online: true, joinUrl: true, published: true },
  });
  if (!event) notFound();

  const attendees = await loadAttendees(event.id);
  const notOver = (event.endsAt ?? event.startsAt).getTime() > new Date().getTime();
  const paid = attendees.filter((a) => a.status === "Paid");
  const sold = paid.reduce((n, a) => n + a.quantity, 0);
  const revenue = paid.reduce((n, a) => n + (a.amount ?? 0), 0);
  const rsvps = attendees.filter((a) => a.type === "RSVP").length;
  const coming = sold + rsvps;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Attendees"
        intro={`Everyone with a paid ticket or a saved place for ${event.title} on ${dateTime(event.startsAt)}. Members who bought a ticket are listed once, by their ticket.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/studio/events">Back to events</Link>
            </Button>
            {staff.perms.has("events.edit") && (
              <Button asChild>
                <a href={`/studio/events/${event.id}/attendees/export`}>Download as a spreadsheet</a>
              </Button>
            )}
          </>
        }
      />

      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}

      {staff.perms.has("events.edit") && event.published && notOver && (
        <Section title="Tell every member it is starting">
          <form action={emailMembersStartingAction} className="flex flex-col gap-4 rounded-2xl border border-rule bg-card p-5">
            <input type="hidden" name="eventId" value={event.id} />
            <p className="text-sm leading-relaxed text-ink-2">
              Send every active member an email saying {event.title} is about to start
              {event.online ? ", with the Google Meet link" : ""}. It goes to paid, complimentary and business-seat members,
              and to anyone Stripe shows as paying. Each member receives it once, however many times this is pressed.
            </p>
            {event.online && !event.joinUrl && (
              <Notice tone="danger">Add the Google Meet link to the event before sending.</Notice>
            )}
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="confirm" className="h-4 w-4" /> Yes, email every member now
            </label>
            <div>
              <Button type="submit">Email all members</Button>
            </div>
          </form>
        </Section>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Coming" value={event.capacity ? `${coming} of ${event.capacity}` : coming} note="Ticket places plus saved places." />
        <Stat label="Tickets sold" value={sold} note={event.sellTickets ? "Paid through Stripe." : "Ticket sales are switched off for this event."} />
        <Stat label="Ticket revenue" value={money(revenue)} note="Paid tickets only, before Stripe fees." />
      </div>

      <Section title="Guest list">
        {attendees.length === 0 ? (
          <Empty>No one has bought a ticket or saved a place yet.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-rule text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Places</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {attendees.map((a) => (
                  <tr key={a.key}>
                    <td className="px-4 py-3 text-ink">{a.name || "No name given"}</td>
                    <td className="px-4 py-3 text-ink-2">{a.email}</td>
                    <td className="px-4 py-3">{a.type}</td>
                    <td className="px-4 py-3">{a.quantity}</td>
                    <td className="px-4 py-3">
                      <Tag tone={a.status === "Refunded" ? "warn" : "positive"}>{a.status}</Tag>
                    </td>
                    <td className="px-4 py-3">{a.amount != null ? money(a.amount) : ""}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dateTime(a.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
