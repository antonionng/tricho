import type { PrismaClient } from "@prisma/client";
import { DEFAULT_EXTRA_PLACES, DEFAULT_PACKAGES, DEFAULT_STAGE_SLOTS, DEFAULT_STAND_SPACES } from "@/lib/package-defaults";

/**
 * Sets an in-person event up with the standard exhibitor packages, as used for
 * TRICHOLLECTIVE UK at Whittlebury Hall. Shared by the Studio button and
 * scripts/whittlebury-packages.ts. Safe to run more than once:
 *  - stand spaces and stage slots get their defaults only when not set yet;
 *  - packages are added only when the event has none of that name;
 *  - the extra places add-on is added once, and offered to every package that
 *    includes places (never to Sponsor).
 * Attendee ticket types are never created or changed; their prices are
 * reported so they can be checked by eye.
 */

type Db = Pick<PrismaClient, "event" | "eventTicketType">;

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB")}`;

export type SetupReport = {
  event: { id: string; title: string; published: boolean };
  changes: string[];
  ticketTypes: { name: string; pricePence: number; memberPricePence: number | null }[];
};

export async function setupEventPackages(db: Db, eventId: string, opts: { apply: boolean }): Promise<SetupReport | { error: string }> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, published: true, online: true, standSpaces: true, stageSlots: true },
  });
  if (!event) return { error: "That event could not be found." };
  if (event.online) return { error: "Exhibitor packages are for in-person events." };

  const changes: string[] = [];
  const eventData: { standSpaces?: number; stageSlots?: number } = {};
  if (event.standSpaces == null) {
    eventData.standSpaces = DEFAULT_STAND_SPACES;
    changes.push(`Stand spaces set to ${DEFAULT_STAND_SPACES}.`);
  }
  if (event.stageSlots == null) {
    eventData.stageSlots = DEFAULT_STAGE_SLOTS;
    changes.push(`Stage slots set to ${DEFAULT_STAGE_SLOTS}.`);
  }
  if (opts.apply && Object.keys(eventData).length) await db.event.update({ where: { id: event.id }, data: eventData });

  const existing = await db.eventTicketType.findMany({
    where: { eventId: event.id },
    select: { id: true, name: true, kind: true, pricePence: true, memberPricePence: true, placesIncluded: true, addonForTypeIds: true },
  });
  const packageNames = new Set(existing.filter((t) => t.kind === "package").map((t) => t.name.toLowerCase()));
  for (const p of DEFAULT_PACKAGES) {
    if (packageNames.has(p.name.toLowerCase())) continue;
    if (opts.apply) {
      await db.eventTicketType.create({ data: { ...p, eventId: event.id, kind: "package", maxPerOrder: 1, capacity: null, active: true } });
    }
    changes.push(`Added the ${p.name} package at ${pounds(p.pricePence)}.`);
  }

  const withPlaces = opts.apply
    ? await db.eventTicketType.findMany({ where: { eventId: event.id, kind: "package", placesIncluded: { gt: 0 } }, select: { id: true } })
    : existing.filter((t) => t.kind === "package" && t.placesIncluded > 0);
  const ids = withPlaces.map((t) => t.id);
  const addon = existing.find((t) => t.kind === "addon");
  if (!addon) {
    if (opts.apply) {
      await db.eventTicketType.create({ data: { ...DEFAULT_EXTRA_PLACES, eventId: event.id, kind: "addon", placesIncluded: 1, active: true, addonForTypeIds: ids } });
    }
    changes.push(`Added ${DEFAULT_EXTRA_PLACES.name} at ${pounds(DEFAULT_EXTRA_PLACES.pricePence)} each, up to ${DEFAULT_EXTRA_PLACES.maxPerOrder} per package with places.`);
  } else {
    const missing = ids.filter((id) => !addon.addonForTypeIds.includes(id));
    if (missing.length) {
      if (opts.apply) await db.eventTicketType.update({ where: { id: addon.id }, data: { addonForTypeIds: [...addon.addonForTypeIds, ...missing] } });
      changes.push(`${addon.name} is now offered with ${missing.length} more ${missing.length === 1 ? "package" : "packages"}.`);
    }
  }

  return {
    event: { id: event.id, title: event.title, published: event.published },
    changes,
    ticketTypes: existing.filter((t) => t.kind === "attendee").map((t) => ({ name: t.name, pricePence: t.pricePence, memberPricePence: t.memberPricePence })),
  };
}
