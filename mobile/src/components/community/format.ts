const PROFESSIONS: Record<string, string> = { cosmetic: "Cosmetic", clinical: "Clinical", medical: "Medical", brand: "Business" };

/** The discipline's name, as the website shows it. */
export const professionLabel = (id: string | null | undefined) => (id ? (PROFESSIONS[id] ?? null) : null);

/** "Just now", "12 minutes ago", "3 hours ago", "Yesterday", then a date, as on the website. */
export function timeAgo(iso: string, now = new Date()) {
  const date = new Date(iso);
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export function eventWhen(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Copies `data` with the post or reply whose id matches changed, wherever it sits in a cached response. */
export function patchById<T>(data: T, id: string, patch: Record<string, unknown>): T {
  if (Array.isArray(data)) {
    let changed = false;
    const next = data.map((v) => {
      const p = patchById(v, id, patch);
      if (p !== v) changed = true;
      return p;
    });
    return (changed ? next : data) as T;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.id === id && "useful" in obj) return { ...obj, ...patch } as T;
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = patchById(v, id, patch);
      if (p !== v) changed = true;
      next[k] = p;
    }
    return (changed ? next : data) as T;
  }
  return data;
}

/** What a muted member is told, matching the website. `until` is from me.access.muted. */
export const mutedNotice = (until: string) =>
  `You can read the community, but posting, replying and reacting are paused for your account until ${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`;
