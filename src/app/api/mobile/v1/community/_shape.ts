import type { ProfessionId } from "@/config/rooms";

type Author = { id: string; name: string | null; image: string | null; isFounding?: boolean; profile: { profession: string | null } | null };

/** A member as the app shows them beside a post or reply. */
export function author(a: Author) {
  return {
    id: a.id,
    name: a.name,
    image: a.image,
    isFounding: a.isFounding ?? false,
    profession: (a.profile?.profession as ProfessionId | null) ?? null,
  };
}
