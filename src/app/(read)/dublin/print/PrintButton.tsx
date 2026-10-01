"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full bg-paper px-4 py-1.5 text-sm font-medium text-ink">
      Print
    </button>
  );
}
