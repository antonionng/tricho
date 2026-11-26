import { ADVENT_DAYS, ADVENT_DOORS, ADVENT_START, type AdventDoor } from "@/content/advent";

/** Today's date in the UK, as "YYYY-MM-DD". */
export function ukToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** The date a door opens, as "YYYY-MM-DD". */
export function doorDate(day: number) {
  const d = new Date(`${ADVENT_START}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toISOString().slice(0, 10);
}

/** "Sat 12 Dec" */
export function doorDateLabel(day: number, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: style === "short" ? "short" : "long",
    day: "numeric",
    month: style === "short" ? "short" : "long",
  }).format(new Date(`${doorDate(day)}T00:00:00Z`));
}

/** How many doors are open: 0 before the first morning, ADVENT_DAYS once the last has opened. */
export function openDoorCount(today = ukToday()) {
  const n = daysBetween(ADVENT_START, today) + 1;
  return Math.max(0, Math.min(ADVENT_DAYS, n));
}

/** As openDoorCount, but every door counts as open in local development so each one can be tried. */
export function liveDoorCount() {
  return process.env.NODE_ENV === "production" ? openDoorCount() : ADVENT_DAYS;
}

/** The door that opens today, if the calendar is running. */
export function todaysDoor(today = ukToday()): AdventDoor | null {
  const n = daysBetween(ADVENT_START, today) + 1;
  return n >= 1 && n <= ADVENT_DAYS ? (ADVENT_DOORS.find((d) => d.day === n) ?? null) : null;
}

/** Whether a door has something to claim: a brand offer with a code or a way to redeem it. */
export function isClaimable(d: AdventDoor) {
  return d.kind === "brand" && !!(d.code || d.redeem);
}

/** What a claim reveals. Never sent to the browser before the person has claimed. */
export type ClaimReveal = { code?: string; redeem?: string };

export function claimReveal(d: AdventDoor): ClaimReveal {
  return { code: d.code, redeem: d.redeem };
}

/**
 * A door as it may be sent to the browser: nothing until it opens, and the code
 * and how to redeem it only once this person has claimed it.
 */
export type PublicDoor = {
  day: number;
  date: string;
  dateLabel: string;
  open: boolean;
  door:
    | (Omit<AdventDoor, "code" | "redeem" | "reserved" | "cta"> & {
        cta: { label: string; href: string; external: boolean };
        claimable: boolean;
        claimed: ClaimReveal | null;
      })
    | null;
};

export function publicDoors(openCount: number, claimedDoors: number[] = []): PublicDoor[] {
  return ADVENT_DOORS.map((d) => {
    const open = d.day <= openCount;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { code, redeem, reserved, cta, ...rest } = d;
    const claimable = isClaimable(d);
    return {
      day: d.day,
      date: doorDate(d.day),
      dateLabel: doorDateLabel(d.day),
      open,
      door: open
        ? {
            ...rest,
            // Every button goes through the tracked link, so clicks are counted per door.
            cta: { label: cta.label, href: `/christmas/go/${d.day}`, external: /^https?:/.test(cta.href) },
            claimable,
            claimed: claimable && claimedDoors.includes(d.day) ? claimReveal(d) : null,
          }
        : null,
    };
  });
}
