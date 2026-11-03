import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateTime } from "@/components/studio/ui";
import { loadAttendees } from "@/lib/tickets";
import { studioPage } from "../../../_lib/guard";
import { emailMembersStartingAction, refundAttendeeAction } from "../../actions";

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
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      sellTickets: true,
      online: true,
      joinUrl: true,
      published: true,
      timezone: true,
    },
  });
  if (!event) notFound();

  const attendees = await loadAttendees(event.id);
  const canRefund = staff.perms.has("events.refund");
  const timeOnly = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: event.timezone }).format(d);
  const notOver = (event.endsAt ?? event.startsAt).getTime() > new Date().getTime();
  const paid = attendees.filter((a) => a.status === "Paid");
  // Places refunded on their own no longer count as sold.
  const sold = paid.reduce((n, a) => n + a.quantity - a.people.filter((p) => p.cancelledAt).length, 0);
  const revenue = paid.reduce((n, a) => n + (a.amount ?? 0) - a.people.reduce((r, p) => r + (p.refundedPence ?? 0), 0), 0);
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
                  <Fragment key={a.key}>
                    <tr>
                      <td className="px-4 py-3 text-ink">{a.name || "No name given"}</td>
                      <td className="px-4 py-3 text-ink-2">{a.email}</td>
                      <td className="px-4 py-3">{a.ticketType ? `${a.ticketType} · ${a.type}` : a.type}</td>
                      <td className="px-4 py-3">{a.quantity}</td>
                      <td className="px-4 py-3">
                        <Tag tone={a.status === "Refunded" ? "warn" : "positive"}>{a.status}</Tag>
                      </td>
                      <td className="px-4 py-3">{a.amount != null ? money(a.amount) : ""}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dateTime(a.at)}</td>
                    </tr>
                    {a.people.map((p) => {
                      const cancelled = !!p.cancelledAt || a.status === "Refunded";
                      return (
                        <tr key={p.id} className="bg-paper/60 text-xs">
                          <td className="py-2 pl-8 pr-4 text-ink">
                            {p.name}
                            <span className="block font-mono text-[11px] text-muted-foreground">{p.code}</span>
                          </td>
                          <td className="px-4 py-2 text-ink-2">{p.email}</td>
                          <td className="px-4 py-2 text-ink-2" colSpan={2}>
                            {[p.dietary && `Dietary: ${p.dietary}`, p.accessNeeds && `Access: ${p.accessNeeds}`].filter(Boolean).join(" · ")}
                          </td>
                          <td className="px-4 py-2">
                            {cancelled ? (
                              <Tag tone="warn">Cancelled</Tag>
                            ) : p.checkedInAt ? (
                              <Tag tone="positive">In at {timeOnly(p.checkedInAt)}</Tag>
                            ) : (
                              <Tag>Not in yet</Tag>
                            )}
                          </td>
                          <td className="px-4 py-2">{p.refundedPence != null ? `${money(p.refundedPence)} refunded` : ""}</td>
                          <td className="px-4 py-2">
                            {canRefund && !cancelled && a.status === "Paid" && (
                              <details>
                                <summary className="cursor-pointer text-ink-2 underline underline-offset-4">Refund this place</summary>
                                <form action={refundAttendeeAction} className="mt-2 flex flex-col gap-2">
                                  <input type="hidden" name="eventId" value={event.id} />
                                  <input type="hidden" name="attendeeId" value={p.id} />
                                  <label className="flex items-center gap-2">
                                    <input type="checkbox" name="confirm" className="h-4 w-4" /> Refund {p.name} through Stripe
                                  </label>
                                  <div>
                                    <SubmitButton size="xs" variant="outline" pendingLabel="Refunding…">
                                      Refund and cancel
                                    </SubmitButton>
                                  </div>
                                </form>
                              </details>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
