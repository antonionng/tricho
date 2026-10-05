/** "20261021T180000Z" */
function gcalStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * An "Add to Google Calendar" link. For members who are going, the joining
 * link goes in the details so it is in their calendar when the time comes.
 */
export function googleCalendarHref(e: {
  title: string;
  summary: string;
  startsAt: Date;
  endsAt?: Date | null;
  online: boolean;
  venue?: string | null;
  city?: string | null;
  joinUrl?: string | null;
  pageUrl: string;
}) {
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 60 * 60 * 1000);
  const details = [e.summary, e.joinUrl ? `Join online: ${e.joinUrl}` : null, `Event page: ${e.pageUrl}`].filter(Boolean).join("\n\n");
  const location = e.online ? e.joinUrl ?? "Online" : [e.venue, e.city].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${gcalStamp(e.startsAt)}/${gcalStamp(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
