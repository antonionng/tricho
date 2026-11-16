"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full px-6 py-3 text-[15px] font-semibold text-white" style={{ background: "#9b1b2a" }}>
      Print or save as PDF &rarr;
    </button>
  );
}
