"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { HUB_LABEL } from "@/config/consumer";
import { listingVisitorState, setListingSaved, type SavedState } from "@/lib/actions/saved";

const VisitorContext = createContext<SavedState | null>(null);

/** The signed-in visitor on a directory profile, if any. Read in the browser so the page stays cached. */
export function useListingVisitor() {
  return useContext(VisitorContext);
}

export function ListingVisitorProvider({ listingId, children }: { listingId: string; children: React.ReactNode }) {
  const [state, setState] = useState<SavedState | null>(null);
  useEffect(() => {
    let alive = true;
    listingVisitorState(listingId)
      .then((s) => alive && setState(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [listingId]);
  return <VisitorContext.Provider value={state}>{children}</VisitorContext.Provider>;
}

/**
 * Save for consumers, and an invitation to create a free account for visitors who are
 * signed out. Professionals see nothing.
 */
export function SaveListingButton({ listingId, slug }: { listingId: string; slug: string }) {
  const visitor = useListingVisitor();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  const isSaved = saved ?? visitor?.saved ?? false;

  if (!visitor) return null;
  if (!visitor.consumer) {
    if (visitor.signedIn) return null;
    return (
      <Link
        href={`/signup/you?next=/directory/p/${slug}`}
        className="inline-flex items-center gap-2 rounded-full border border-rule bg-card px-4 py-2 text-sm text-ink-2 hover:border-ink/40"
      >
        <Bookmark className="h-4 w-4" /> Create a free account to save this professional
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={isSaved}
      onClick={() =>
        start(async () => {
          const r = await setListingSaved(listingId, !isSaved);
          if (r.ok) setSaved(r.saved);
        })
      }
      className="inline-flex items-center gap-2 rounded-full border border-rule bg-card px-4 py-2 text-sm text-ink hover:border-ink/40"
    >
      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {isSaved ? `Saved to ${HUB_LABEL.toLowerCase()}` : "Save this professional"}
    </button>
  );
}
