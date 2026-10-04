import Link from "next/link";
import { eventDay, timeOfDay } from "./format";

export function EventMini({
  event,
  going,
}: {
  event: { slug: string; title: string; startsAt: Date; city: string | null; online: boolean };
  going?: boolean;
}) {
  const d = eventDay(event.startsAt);
  return (
    <Link href={`/members/events/${event.slug}`} className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition-colors hover:bg-paper-2">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-rule bg-paper text-center leading-none">
        <span>
          <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{d.month}</span>
          <span className="mt-0.5 block text-lg font-semibold">{d.day}</span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{event.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[d.weekday, timeOfDay(event.startsAt), event.online ? "Online" : event.city].filter(Boolean).join(" · ")}
          {going ? " · You're going" : ""}
        </span>
      </span>
    </Link>
  );
}
