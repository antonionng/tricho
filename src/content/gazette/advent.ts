/**
 * The Trichozette advent, Edition 10 ("ready-for-2027").
 *
 * Twelve doors open one a day from 1 to 12 December 2026, at midnight UK time. Each door has a gift.
 * The server strips the gift of any door that hasn't opened yet (see lockAdvent), so nobody can read ahead,
 * and a 7am email tells every account that the day's door is ready (see /api/cron/advent).
 *
 * Quotes are all out of copyright: Dickens, Scott, Irving, Alcott, Shakespeare, Tusser, Mabie, Coolidge.
 */

export type AdventGift = {
  /** The button on the gift card. */
  label: string;
  /** Where the button goes. Gift pages live at /advent/<day>; claims at /advent/claim/<day>. */
  href: string;
  /** A short note beside the button. */
  note: string;
};

export type AdventDoor = {
  day: number;
  title: string;
  text: string;
  /** "Behind it today: something …" in the morning email, which never gives the gift away. */
  hint: string;
  gift: AdventGift;
  /** How the gift is delivered: a page to read or download, or a claim the team fulfils. */
  kind: "page" | "claim";
  /** Gifts still waiting on someone's agreement or content. Shown as "Coming soon" until filled. */
  pending?: string;
};

export const ADVENT_EDITION = "ready-for-2027";
export const ADVENT_YEAR = 2026;
export const ADVENT_MONTH = 12;
export const ADVENT_TZ = "Europe/London";

export const ADVENT_DOORS: AdventDoor[] = [
  {
    day: 1,
    title: "Your Christmas hours poster",
    text: "A printable A4 poster in the Trichollective style for your window and reception, with space for your own opening hours from 21 December to 4 January.",
    hint: "for your window",
    gift: { label: "Get your poster", href: "/advent/1", note: "Print or save as PDF" },
    kind: "page",
  },
  {
    day: 2,
    title: "A holiday voicemail script",
    text: "A 30-second script that says when you close, when you reopen and how clients can book in the meantime. Record it in one take.",
    hint: "for your phone",
    gift: { label: "Get the script", href: "/advent/2", note: "Copy and record" },
    kind: "page",
  },
  {
    day: 3,
    title: "Client Christmas messages",
    text: "Three short messages to copy: a thank-you to your regulars, a January rebooking note and a closed-for-Christmas reply.",
    hint: "for your clients",
    gift: { label: "Copy the messages", href: "/advent/3", note: "Email and text versions" },
    kind: "page",
  },
  {
    day: 4,
    title: "Consultation form check-up",
    text: "A one-page set of questions on medication, mood and recent changes in health, in line with the MHRA's 2026 finasteride update.",
    hint: "for your consultations",
    gift: { label: "Get the check-up", href: "/advent/4", note: "Print or save as PDF" },
    kind: "page",
    pending: "Karley checks the clinical wording before 4 December.",
  },
  {
    day: 5,
    title: "Ingredient ban stock check",
    text: "What changed in Great Britain on 15 August 2026, the 14 February 2027 sell-through date, and the questions to put to your suppliers.",
    hint: "for your stock room",
    gift: { label: "Get the stock check", href: "/advent/5", note: "Sourced from SI 2026/23" },
    kind: "page",
  },
  {
    day: 6,
    title: "Your 2027 diary dates",
    text: "Every bank holiday and deadline in this edition, in one calendar file for Google, Outlook or Apple Calendar.",
    hint: "for your diary",
    gift: { label: "Add to your calendar", href: "/advent/calendar.ics", note: "One file, twelve dates" },
    kind: "page",
  },
  {
    day: 7,
    title: "A masterclass guest ticket",
    text: "Bring a colleague who isn't yet a member to a Trichollective masterclass in January or February, on us. A guest ticket is usually £20.",
    hint: "for a colleague",
    gift: { label: "Claim a ticket", href: "/advent/claim/7", note: "One per member" },
    kind: "claim",
  },
  {
    day: 8,
    title: "A month of Trichollective, free",
    text: "Members get a month added to their membership. Not a member yet? Join and your first month is on us.",
    hint: "from us to you",
    gift: { label: "Claim your month", href: "/advent/claim/8", note: "Added to your account" },
    kind: "claim",
  },
  {
    day: 9,
    title: "A gift from LIVDOR",
    text: "A Christmas gift for Trichollective members from LIVDOR, our Founding Premium Partner.",
    hint: "from one of our partners",
    gift: { label: "See the gift", href: "/advent/9", note: "Partner gift" },
    kind: "page",
    pending: "Waiting on Adam Bond to confirm LIVDOR's gift.",
  },
  {
    day: 10,
    title: "A month of Kiera SI, free",
    text: "A month of the super intelligence front desk for your clinic or salon, so the phone is answered while you are with a client.",
    hint: "for your front desk",
    gift: { label: "Claim your month", href: "/advent/claim/10", note: "Partner gift from Kiera SI" },
    kind: "claim",
  },
  {
    day: 11,
    title: "Karley's Christmas tip",
    text: "A short video from Karley Weir with the one thing she wants every practice to do before the new year.",
    hint: "from Karley",
    gift: { label: "Watch Karley", href: "/advent/11", note: "About two minutes" },
    kind: "page",
    pending: "Waiting on Karley's video.",
  },
  {
    day: 12,
    title: "Win a year of membership",
    text: "Enter the draw for a free year of Trichollective membership. One winner, drawn on 19 December 2026.",
    hint: "with a prize in it",
    gift: { label: "Enter the draw", href: "/advent/claim/12", note: "Terms apply" },
    kind: "claim",
  },
];

/** One quote per morning email, in door order. All out of copyright. */
export const ADVENT_QUOTES: { text: string; who: string }[] = [
  { text: "I will honour Christmas in my heart, and try to keep it all the year.", who: "Charles Dickens, A Christmas Carol" },
  { text: "Heap on more wood! the wind is chill; but let it whistle as it will, we'll keep our Christmas merry still.", who: "Sir Walter Scott, Marmion" },
  { text: "A good time; a kind, forgiving, charitable, pleasant time.", who: "Charles Dickens, A Christmas Carol" },
  { text: "Christmas is the season for kindling the fire of hospitality in the hall, the genial flame of charity in the heart.", who: "Washington Irving, Old Christmas" },
  { text: "Blessed is the season which engages the whole world in a conspiracy of love.", who: "Hamilton Wright Mabie" },
  { text: "Christmas won't be Christmas without any presents.", who: "Louisa May Alcott, Little Women" },
  { text: "It is good to be children sometimes, and never better than at Christmas.", who: "Charles Dickens, A Christmas Carol" },
  { text: "At Christmas I no more desire a rose than wish a snow in May's new-fangled mirth.", who: "William Shakespeare, Love's Labour's Lost" },
  { text: "Christmas is not a time nor a season, but a state of mind.", who: "Calvin Coolidge" },
  { text: "Happy, happy Christmas, that can win us back to the delusions of our childish days.", who: "Charles Dickens, The Pickwick Papers" },
  { text: "At Christmas play and make good cheer, for Christmas comes but once a year.", who: "Thomas Tusser" },
  { text: "God bless Us, Every One!", who: "Tiny Tim, in Charles Dickens' A Christmas Carol" },
];

export function adventDoor(day: number) {
  return ADVENT_DOORS.find((d) => d.day === day);
}

/** Today's date in the UK as { year, month, day }. */
export function ukToday(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: ADVENT_TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * The highest door that is open today: 0 before 1 December 2026, 12 from 12 December onwards.
 * `override` lets a private review link look at a chosen day.
 */
export function openThrough(now: Date = new Date(), override?: number) {
  if (override !== undefined) return Math.max(0, Math.min(12, override));
  const t = ukToday(now);
  if (t.year < ADVENT_YEAR || (t.year === ADVENT_YEAR && t.month < ADVENT_MONTH)) return 0;
  if (t.year > ADVENT_YEAR) return 12;
  return Math.min(12, t.day);
}

export function isDoorOpen(day: number, now: Date = new Date(), override?: number) {
  return day <= openThrough(now, override);
}

/**
 * Fills in every advent door that has opened (up to `through`, see openThrough) from ADVENT_DOORS.
 * Doors that haven't opened stay wrapped, so their gifts never leave the server.
 * Server code only: client components must not import this file.
 */
export function lockAdvent<E extends { slug: string; pages: unknown[] }>(edition: E, through: number): E {
  if (edition.slug !== ADVENT_EDITION) return edition;
  const fill = (blocks: unknown[]) =>
    blocks.map((b) => {
      const block = b as { type?: string; doors?: { day: number }[] };
      if (block.type !== "advent" || !block.doors) return b;
      return {
        ...block,
        doors: block.doors.map((d) => {
          const door = adventDoor(d.day);
          if (!door || d.day > through) return { day: d.day, title: "Still wrapped", text: `Opens on ${d.day} December.`, locked: true };
          return { day: door.day, title: door.title, text: door.text, gift: door.gift, ...(door.pending ? { pending: "soon" } : {}) };
        }),
      };
    });
  return {
    ...edition,
    pages: edition.pages.map((p) => {
      const page = p as { blocks?: unknown[] };
      return page.blocks ? { ...page, blocks: fill(page.blocks) } : p;
    }),
  };
}
