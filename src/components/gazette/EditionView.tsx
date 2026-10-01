"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Edition } from "@/content/gazette";
import { ScrollEdition } from "./ScrollEdition";
import { Reader } from "./Reader";

/** Scroll is the default. "Print edition" opens the A4 page-turning view over it. */
export function EditionView(props: {
  edition: Edition;
  lockedTitles: { kicker: string; title: string }[];
  signedIn: boolean;
  coverLines: string[];
  nextEdition?: Edition;
}) {
  const [print, setPrint] = useState(false);
  return (
    <>
      <ScrollEdition {...props} onPrint={() => setPrint(true)} />
      {print && (
        <div className="fixed inset-0 z-[80] bg-[#1a1a1a]">
          <button
            type="button"
            onClick={() => setPrint(false)}
            className="absolute right-4 top-2 z-[90] grid h-9 w-9 place-items-center rounded-full text-white/80 hover:text-white"
            aria-label="Close print edition"
          >
            <X className="h-5 w-5" />
          </button>
          <Reader {...props} />
        </div>
      )}
    </>
  );
}
