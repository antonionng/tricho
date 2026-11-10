/**
 * Karley's exhibitor and sponsor packages for TRICHOLLECTIVE UK, used to fill
 * an event with a starting point. Everything can be changed in Studio
 * afterwards. Prices are before VAT: the setup also marks the event as
 * pricing VAT on top. No imports, so scripts can use it outside Next.
 */

export type PackageDefault = {
  name: string;
  pricePence: number;
  placesIncluded: number;
  includesStand: boolean;
  includesStageSlot: boolean;
  /** One benefit per line, shown as a list on the event page and in the confirmation email. */
  description: string;
  sortOrder: number;
};

export const DEFAULT_EXTRAS_PER_PACKAGE = 5;
/** Shared across every package with a stand or stage slot. Editable on the event in Studio. */
export const DEFAULT_STAND_SPACES = 20;
export const DEFAULT_STAGE_SLOTS = 8;

export const DEFAULT_PACKAGES: PackageDefault[] = [
  {
    name: "Sponsor",
    pricePence: 15_000,
    placesIncluded: 0,
    includesStand: false,
    includesStageSlot: false,
    description: "Your company listed in the event booklet that every delegate receives.",
    sortOrder: 100,
  },
  {
    name: "Promote",
    pricePence: 25_000,
    placesIncluded: 1,
    includesStand: false,
    includesStageSlot: false,
    description: "1 event ticket and promotion in the event materials and booklet, without stand space.",
    sortOrder: 110,
  },
  {
    name: "Elevate",
    pricePence: 50_000,
    placesIncluded: 1,
    includesStand: true,
    includesStageSlot: false,
    description: ["Standard stand space in the exhibition area.", "Enhanced promotion of your brand before the event.", "Your company listed in the event booklet."].join("\n"),
    sortOrder: 120,
  },
  {
    name: "Evolve",
    pricePence: 75_000,
    placesIncluded: 3,
    includesStand: true,
    includesStageSlot: true,
    description: [
      "Stand space with priority positioning in the exhibition area.",
      "A 15-minute slot on the main stage.",
      "Your company in the event booklet and in our online promotion.",
    ].join("\n"),
    sortOrder: 130,
  },
  {
    name: "Elite",
    pricePence: 100_000,
    placesIncluded: 5,
    includesStand: true,
    includesStageSlot: true,
    description: [
      "Stand space with prime positioning in the exhibition area.",
      "A 15-minute slot on the main stage.",
      "Your company in the event booklet and in our online promotion.",
      "Enhanced exposure in our social media and emails to the profession.",
    ].join("\n"),
    sortOrder: 140,
  },
];

/** Offered to every package that includes places: Promote, Elevate, Evolve and Elite. */
export const DEFAULT_EXTRA_PLACES = {
  name: "Extra exhibitor ticket",
  pricePence: 10_000,
  maxPerOrder: DEFAULT_EXTRAS_PER_PACKAGE,
  description: "A place for another member of your team, with their own e-ticket.",
  sortOrder: 150,
};
