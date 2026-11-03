import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckInDesk } from "@/components/studio/CheckInDesk";
import { NoAccess, PageHeader, dateTime } from "@/components/studio/ui";
import { doorList } from "@/lib/checkin";
import { eventTimeZone } from "@/lib/event-time";
import { prisma } from "@/lib/prisma";
import { studioPage } from "../../../_lib/guard";

export const dynamic = "force-dynamic";

/**
 * Check-in at the door, for a phone. The whole door list is loaded with the
 * page, so searching works even when the hotel signal drops; checking someone
 * in needs a connection, and the printed list is the backup when there is none.
 */
export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await studioPage(`/studio/events/${id}/checkin`, "events.checkin");
  if (!staff) return <NoAccess what="check-in" />;

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true, startsAt: true, timezone: true } });
  if (!event) notFound();
  const people = await doorList(event.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Check-in"
        intro={`${event.title}, ${dateTime(event.startsAt)}. Scan each QR code, or search by name. Dietary and access needs show as each person arrives.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href={`/studio/events/${event.id}/checkin/print`}>Download printable list</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/studio/events/${event.id}/attendees`}>Attendees</Link>
            </Button>
          </>
        }
      />
      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody has a paid, named ticket for this event yet.</p>
      ) : (
        <CheckInDesk eventId={event.id} people={people} timeZone={eventTimeZone(event.timezone)} />
      )}
    </div>
  );
}
