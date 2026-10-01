const TZ = "Europe/Dublin";

/** "Just now", "12 minutes ago", "3 hours ago", "Yesterday", then a date. */
export function timeAgo(date: Date, now = new Date()) {
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return shortDate(date);
}

export function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(date);
}

export function longDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(date);
}

export function monthYear(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: TZ }).format(date);
}

export function timeOfDay(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(date);
}

export function eventDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", weekday: "short", timeZone: TZ }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { day: get("day"), month: get("month"), weekday: get("weekday") };
}

export function greeting(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
