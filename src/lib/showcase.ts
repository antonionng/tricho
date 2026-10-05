/**
 * What a showcase page can hold, by package, and the pure helpers that read its content.
 * The portal, the Studio and the public pages all ask this module, so the limits live in one place.
 */

export type Allowance = {
  cover: boolean;
  colour: boolean;
  highlights: number;
  offerings: number;
  photos: number;
  cta: boolean;
  video: boolean;
  sections: number;
};

/**
 * Kinds of page: "brand" (a paying partner, labelled sponsored), "charity" (supported free and
 * shown in the "Proud supporters of" band) and "gifted" (a free Premium page with no partner or
 * sponsor wording, found only through its own page and directory search).
 */
export const PARTNER_KINDS = ["brand", "charity", "gifted"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

/** Business (£99 a month) partner pages. */
const BUSINESS: Allowance = { cover: true, colour: true, highlights: 3, offerings: 6, photos: 8, cta: true, video: false, sections: 1 };
/** Premium Business, and charities we support free of charge. */
const PREMIUM: Allowance = { cover: true, colour: true, highlights: 4, offerings: 9, photos: 16, cta: true, video: true, sections: 4 };
/** A Professional member's directory profile (or a free listing inside its trial). */
export const PRACTITIONER: Allowance = { cover: true, colour: false, highlights: 0, offerings: 0, photos: 6, cta: false, video: false, sections: 0 };

export function partnerAllowance(p: { tier: string; kind?: string | null }): Allowance {
  return p.kind === "charity" || p.kind === "gifted" || p.tier === "premium" ? PREMIUM : BUSINESS;
}

export type Highlight = { value: string; label: string };
export type Offering = { title: string; body: string };
export type FeatureSection = { eyebrow?: string; title: string; body?: string; steps?: string[]; ctaLabel?: string; ctaUrl?: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Stored JSON is only ever trusted after this: unknown shapes become empty lists, never errors. */
export function readHighlights(value: unknown, limit = 9): Highlight[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({ value: str(v?.value, 12), label: str(v?.label, 80) }))
    .filter((h) => h.value && h.label)
    .slice(0, limit);
}

export function readOfferings(value: unknown, limit = 12): Offering[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({ title: str(v?.title, 80), body: str(v?.body, 400) }))
    .filter((o) => o.title)
    .slice(0, limit);
}

export function readSections(value: unknown, limit = 4): FeatureSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => ({
      eyebrow: str(v?.eyebrow, 40) || undefined,
      title: str(v?.title, 140),
      body: str(v?.body, 1200) || undefined,
      steps: Array.isArray(v?.steps) ? v.steps.map((s: unknown) => str(s, 300)).filter(Boolean).slice(0, 6) : undefined,
      ctaLabel: str(v?.ctaLabel, 40) || undefined,
      ctaUrl: str(v?.ctaUrl, 500) || undefined,
    }))
    .filter((s) => s.title)
    .slice(0, limit);
}

/** A hex colour, or the fallback. Only "#rrggbb" is ever written into a style attribute. */
export function safeHex(value: string | null | undefined, fallback = "#0B0B0B") {
  return value && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or ink text on a brand colour, whichever reads better (WCAG contrast). */
export function textOn(hex: string): "#FFFFFF" | "#0B0B0B" {
  const l = luminance(safeHex(hex));
  const onWhite = 1.05 / (l + 0.05);
  const onInk = (l + 0.05) / (luminance("#0B0B0B") + 0.05);
  return onWhite >= onInk ? "#FFFFFF" : "#0B0B0B";
}

/** A soft tint of a colour for light backgrounds: the colour mixed with white. */
export function tint(hex: string, amount: number) {
  const h = safeHex(hex);
  const mix = (i: number) =>
    Math.round(parseInt(h.slice(i, i + 2), 16) * amount + 255 * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(1)}${mix(3)}${mix(5)}`.toUpperCase();
}

/** A YouTube or Vimeo link turned into its privacy-friendly embed address, or null. */
export function videoEmbedUrl(value: string | null | undefined) {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com") id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === "vimeo.com") {
    const vid = url.pathname.match(/^\/(\d{5,12})/)?.[1];
    if (vid) return `https://player.vimeo.com/video/${vid}?dnt=1`;
  }
  return null;
}

/** Splits a long text into paragraphs on blank lines. */
export function paragraphs(text: string | null | undefined) {
  // Forms send line breaks as \r\n, so normalise them before splitting on blank lines.
  return (text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
