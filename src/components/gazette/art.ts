import { images, img, type BrandImage } from "@/content/images";
import type { Edition, ImageKey, Page } from "@/content/gazette";

/** Editorial portraits (ed01…), falling back to the brand portraits. */
const POOL: ImageKey[] = (() => {
  const ed = (Object.keys(images) as ImageKey[]).filter((k) => /^ed\d+$/.test(k)).sort();
  return ed.length ? ed : (["heroPortrait", "portraitA", "portraitB", "portraitC", "hairDetail", "headSpa"] as ImageKey[]);
})();

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Hand-picked covers. Every cover is a person, and hair is the subject. */
const COVERS: Record<string, string> = {
  "the-founding-edition": "ed01",
  "from-the-room-whittlebury-park": "ed03",
  "head-spa-properly": "ed10",
  "shedding-season": "ed05",
  "light-and-devices": "ed11",
  "the-business-of-scalp-care": "ed12",
  "textured-hair-and-traction": "ed07",
  dublin: "ed02",
  "ireland-in-review": "ire11",
};

/** Editions shot on the day use their own photographs for unassigned art, not the editorial pool. */
const EVENT_POOLS: Record<string, ImageKey[]> = {
  "ireland-in-review": ["ire08", "ire03", "ire07", "ire01", "ire09", "ire04", "ire12", "ire02", "ire05"],
};

/** A person shot, or our own photography: both are kept wherever an editor chose them. */
const keeps = (k: ImageKey) => /^ed\d+$/.test(k) || k.startsWith("portrait") || k === "heroPortrait" || (images[k] as BrandImage).local === true;

/** The cover portrait for an edition. */
export function coverImage(e: Edition): BrandImage {
  if (e.coverImageKey && (/^ed\d+$/.test(e.coverImageKey) || (images[e.coverImageKey] as BrandImage).local)) return images[e.coverImageKey];
  const picked = COVERS[e.slug] as ImageKey | undefined;
  if (picked && picked in images) return images[picked];
  return images[POOL[hash(e.slug) % POOL.length]];
}

/**
 * Art for a page. Articles and image spreads keep their chosen photograph when it
 * is a person; everything else is art-directed from the editorial pool, varied per edition.
 */
export function artFor(e: Edition, page: Page, index: number): BrandImage {
  const own = "imageKey" in page && page.imageKey ? page.imageKey : null;
  if (own && keeps(own)) return images[own];
  // Never repeat the cover inside the edition.
  const cover = coverImage(e);
  const pool = EVENT_POOLS[e.slug] ?? POOL;
  const at = (n: number) => images[pool[n % pool.length]];
  const seed = EVENT_POOLS[e.slug] ? 0 : hash(e.slug);
  let pick = at(seed + index * 7 + 3);
  if (pick === cover) pick = at(seed + index * 7 + 4);
  return pick;
}

export { img };
