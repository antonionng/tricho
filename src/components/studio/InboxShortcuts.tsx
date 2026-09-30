"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keyboard shortcuts for the inbox: j / k to move, a to approve, r to reject.
 * Everything still works with a mouse; this only adds speed.
 */
export function InboxShortcuts({ hrefs, currentIndex }: { hrefs: string[]; currentIndex: number }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;

      if (e.key === "j" || e.key === "k") {
        if (!hrefs.length) return;
        const step = e.key === "j" ? 1 : -1;
        const from = currentIndex < 0 ? (step === 1 ? -1 : hrefs.length) : currentIndex;
        const next = Math.min(hrefs.length - 1, Math.max(0, from + step));
        if (next !== currentIndex) {
          e.preventDefault();
          router.push(hrefs[next], { scroll: false });
        }
      } else if (e.key === "a") {
        const btn = document.querySelector<HTMLElement>("[data-shortcut='approve']");
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      } else if (e.key === "r") {
        const note = document.querySelector<HTMLTextAreaElement>("[data-shortcut='reject-note']");
        if (note) {
          e.preventDefault();
          note.scrollIntoView({ block: "center", behavior: "smooth" });
          note.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hrefs, currentIndex, router]);

  useEffect(() => {
    document.querySelector("[data-current='true']")?.scrollIntoView({ block: "nearest" });
  }, [currentIndex]);

  return (
    <p className="hidden text-xs text-muted-foreground lg:block">
      Shortcuts: <kbd className="rounded border border-rule bg-card px-1">j</kbd> /{" "}
      <kbd className="rounded border border-rule bg-card px-1">k</kbd> to move,{" "}
      <kbd className="rounded border border-rule bg-card px-1">a</kbd> to approve,{" "}
      <kbd className="rounded border border-rule bg-card px-1">r</kbd> to reject
    </p>
  );
}
