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
};

/** The cover portrait for an edition. */
export function coverImage(e: Edition): BrandImage {
  if (e.coverImageKey && /^ed\d+$/.test(e.coverImageKey)) return images[e.coverImageKey];
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
  if (own && (/^ed\d+$/.test(own) || own.startsWith("portrait") || own === "heroPortrait")) return images[own];
  // Never repeat the cover inside the edition.
  const cover = coverImage(e);
  let pick = images[POOL[(hash(e.slug) + index * 7 + 3) % POOL.length]];
  if (pick === cover) pick = images[POOL[(hash(e.slug) + index * 7 + 4) % POOL.length]];
  return pick;
}

export { img };
