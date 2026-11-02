import { site } from "@/config/site";

export type Author = {
  id: string;
  name: string;
  kind: "person" | "organization";
  /** Shown under the name on posts. */
  role: string;
  bio: string;
  /** Profiles that confirm who the author is. Used as schema.org sameAs. */
  sameAs: string[];
  /** Where the byline links. */
  href: string;
};

export const authors = {
  karley: {
    id: "karley",
    name: site.founderFull,
    kind: "person",
    role: "Trichologist and founder of Trichollective",
    bio: site.founderBio,
    sameAs: [site.founderPractice.url],
    href: "/about",
  },
  editorial: {
    id: "editorial",
    name: "Trichollective editorial team",
    kind: "organization",
    role: "Edited and checked before publication",
    bio: `The ${site.name} editorial team writes for hair and scalp professionals and the clients they see. Posts may be drafted with the help of AI tools, then edited, fact-checked against named sources and approved by ${site.founderFull} before they are published.`,
    sameAs: [],
    href: "/about",
  },
} satisfies Record<string, Author>;

export type AuthorId = keyof typeof authors;
