import { randomBytes, randomInt } from "node:crypto";

/**
 * Words for consumer aliases, e.g. "Willow-428". The alias is chosen at random and never
 * built from the person's name or email, so it can't be traced back to them.
 */
const ALIAS_WORDS = [
  "Alder", "Aspen", "Birch", "Bramble", "Briar", "Brook", "Cedar", "Clover", "Coral", "Cove",
  "Dune", "Ember", "Fern", "Finch", "Fjord", "Glade", "Harbour", "Hazel", "Heath", "Heron",
  "Holly", "Iris", "Ivy", "Juniper", "Kestrel", "Lagoon", "Larch", "Linden", "Maple", "Marram",
  "Meadow", "Moss", "Oak", "Orchid", "Otter", "Pebble", "Pine", "Plover", "Poppy", "Quartz",
  "Rowan", "Sable", "Sage", "Sorrel", "Spruce", "Starling", "Thistle", "Tide", "Wren", "Willow",
] as const;

export function randomAlias(rand: (max: number) => number = randomInt) {
  const word = ALIAS_WORDS[rand(ALIAS_WORDS.length)];
  return `${word}-${100 + rand(900)}`;
}

/** Seeds the generated avatar. Random, so it says nothing about the person. */
export function randomAvatarSeed() {
  return randomBytes(8).toString("hex");
}

export function isAliasFormat(v: string) {
  return /^[A-Z][a-z]+-\d{3}$/.test(v) && ALIAS_WORDS.includes(v.split("-")[0] as (typeof ALIAS_WORDS)[number]);
}
