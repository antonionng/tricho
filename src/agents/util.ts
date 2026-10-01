import { site } from "@/config/site";

export const DAY = 24 * 60 * 60 * 1000;

export const appUrl = (path = "") => `${site.url.replace(/\/$/, "")}${path}`;

const TITLES = new Set(["dr", "mr", "mrs", "ms", "miss", "mx", "prof", "professor"]);

/** "Niamh Sample" → "Niamh"; "Dr Sample Okafor" → "Dr Okafor". */
export function firstName(name: string | null | undefined, fallback = "there") {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (TITLES.has(parts[0].toLowerCase().replace(/\.$/, "")) && parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return parts[0];
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** ISO week key such as 2026-W40, used so weekly work happens once a week. */
export function isoWeekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return { key: `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, week };
}

export function excerpt(text: string, max = 180) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : flat;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
}

export function formatTime(d: Date) {
  return d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Europe/London" })
    .replace(":00", "")
    .replace(" ", "");
}

const PROFESSION_PHRASE: Record<string, string> = {
  cosmetic: "who works in cosmetic hair and scalp care",
  clinical: "who works in clinical trichology",
  medical: "who works in medical practice",
  brand: "who joins us from the business side of the industry",
};

export function professionPhrase(profession: string | null | undefined) {
  return (profession && PROFESSION_PHRASE[profession]) || "who works with hair and scalps";
}

const STOP = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves client clients anyone does would really think know like get got one also much many still use using used want wondering thoughts people thing things way ive im dont whats its been going work working week time month months year years three two four five first last next adding added hello today yesterday tomorrow`.split(
    /\s+/
  )
);

/** The most repeated meaningful words across some text: a rough "themes" signal. */
export function topKeywords(texts: string[], limit = 6) {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const seen = new Set<string>();
    for (const raw of text.toLowerCase().replace(/[^a-z\s-]/g, " ").split(/\s+/)) {
      const w = raw.replace(/^-+|-+$/g, "");
      if (w.length < 4 || STOP.has(w) || seen.has(w)) continue;
      seen.add(w);
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([w]) => w);
}

/** Lower-cases the first letter unless the word looks like an acronym (LED, UV). */
export function lowerFirst(s: string) {
  if (!s || /^[A-Z]{2}/.test(s)) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function stripQuestion(s: string) {
  return s.replace(/[?.!]+$/, "").trim();
}
