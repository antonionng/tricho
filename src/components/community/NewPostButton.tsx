"use client";

import { PenLine } from "lucide-react";

/** A thumb-reach "New post" button above the mobile tab bar. It opens the composer, wherever it is on the page. */
export function NewPostButton() {
  const open = () => {
    // Clear any existing #compose so the composer's hashchange listener fires every time.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.location.hash = "compose";
  };
  return (
    <button
      type="button"
      onClick={open}
      className="fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-paper shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] transition-transform active:scale-95 bottom-tabbar mb-4 lg:hidden"
    >
      <PenLine className="h-[18px] w-[18px] stroke-[1.8]" />
      New post
    </button>
  );
}
