import type { images } from "@/content/images";

/** Labels, dates and images for recordings and live sessions. No database here, so emails and scripts can use it too. */

/** Plain labels for the kinds of event that get recorded, usable outside React. */
export const RECORDING_KIND_LABEL: Record<string, string> = {
  masterclass: "Masterclass",
  case_round: "Case round",
  gathering: "Gathering",
  chapter_meetup: "Chapter meetup",
  welcome: "Welcome session",
};

/** The editorial image that stands in for a recording's thumbnail, by kind of session. */
export function recordingImage(kind: string): keyof typeof images {
  if (kind === "case_round") return "ire04";
  if (kind === "masterclass") return "ire03";
  return "gathering";
}

/** "21 October 2026", in UK time, for emails and cards. */
export function recordingDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }).format(d);
}

/** "Wednesday 3 December, 7pm", in UK time, for the next live session. */
export function liveSessionWhen(d: Date) {
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Europe/London" })
    .format(d)
    .replace(":00", "")
    .replace(/\s/g, "")
    .toLowerCase();
  return `${day}, ${time}`;
}
