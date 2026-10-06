/** Dates as the website writes them: "Just now", "3 hours ago", "Yesterday", then "4 Oct 2026". */

const toDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);

export function shortDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(toDate(date));
}

export function timeOfDay(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(toDate(date));
}

export function timeAgo(date: string | Date, now = new Date()) {
  const s = Math.max(0, Math.round((now.getTime() - toDate(date).getTime()) / 1000));
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

/** "Ana Ruiz, Ben Cole", or "Just you" when nobody else is in the conversation. */
export function threadTitle(others: { name: string | null }[]) {
  return others.map((o) => o.name || "Member").join(", ") || "Just you";
}

/** "Ana" for Ana Ruiz, "Dr Ruiz" for Dr Ana Ruiz, as the website shortens names. */
export function shortName(name: string | null | undefined, fallback = "") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (/^(dr|mr|mrs|ms|miss|mx|prof|professor)\.?$/i.test(parts[0])) {
    return parts.length > 1 ? `${parts[0].replace(/\.$/, "")} ${parts[parts.length - 1]}` : fallback;
  }
  return parts[0];
}
