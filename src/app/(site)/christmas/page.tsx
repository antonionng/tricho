import { redirect } from "next/navigation";
import { ADVENT_ANCHOR, ADVENT_PATH } from "@/lib/advent";

/**
 * trichollective.net/christmas is the short link for the 12 Days of Christmas, used in the
 * daily emails and on social. The calendar itself lives in the Christmas edition of Trichozette,
 * so this passes the visitor on with whatever the link carried (?door=4&utm_source=email).
 */
export default async function ChristmasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) query.set(key, v);
  }
  const qs = query.toString();
  redirect(`${ADVENT_PATH}${qs ? `?${qs}` : ""}#${ADVENT_ANCHOR}`);
}
