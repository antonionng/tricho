import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDoorOpen } from "@/content/gazette/advent";
import { icsEscape } from "@/lib/mail/ics";

export const dynamic = "force-dynamic";

/** Door 6: every date from Edition 10's "Dates for your diary", as all-day events. */
const DATES: [string, string][] = [
  ["2026-12-25", "Christmas Day (UK and Ireland)"],
  ["2026-12-26", "St Stephen's Day (Ireland)"],
  ["2026-12-28", "Boxing Day substitute bank holiday (UK)"],
  ["2027-01-01", "New Year's Day. Unfair dismissal protection after six months' service begins"],
  ["2027-01-04", "Substitute bank holiday (Scotland)"],
  ["2027-01-13", "England's consultation on high-risk cosmetic procedures closes"],
  ["2027-02-01", "New EU cosmetic ingredient bans apply (Ireland and Northern Ireland)"],
  ["2027-02-14", "Last day to sell existing stock of the 16 newly banned substances (GB)"],
  ["2027-04-01", "National Living Wage rises to £13.21 (April 2027)"],
  ["2027-04-06", "Making Tax Digital for Income Tax for qualifying income over £30,000"],
  ["2027-10-01", "Flexible working changes under the Employment Rights Act (October 2027)"],
  ["2027-12-02", "EU AI Act rules for stand-alone high-risk systems apply"],
];

const compact = (d: string) => d.replace(/-/g, "");
const nextDay = (d: string) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/signup?next=/advent/6", process.env.NEXT_PUBLIC_SITE_URL ?? "https://trichollective.net"));
  if (!isDoorOpen(6)) return new NextResponse("Door 6 opens on 6 December.", { status: 403 });

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = DATES.map(([d, title], i) =>
    [
      "BEGIN:VEVENT",
      `UID:trichozette-2027-${i + 1}@trichollective.net`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(d)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(d))}`,
      `SUMMARY:${icsEscape(title)}`,
      `DESCRIPTION:${icsEscape("From Trichozette, Edition 10. Sources are listed at the end of the edition.")}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n")
  );
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Trichollective//Trichozette advent//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Trichozette 2027 dates", ...events, "END:VCALENDAR"].join("\r\n");
  return new NextResponse(body, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="trichozette-2027-dates.ics"' },
  });
}
