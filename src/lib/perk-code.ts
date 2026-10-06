/**
 * The discount code inside a partner's perk text, if it has one, so the app can
 * offer to copy it. Partners write perks freely, e.g. "Use code TRICHO15 at
 * checkout for 15% off". A code is the capitalised word after "code", "coupon"
 * or "voucher": letters, digits, dashes or underscores, with at least one
 * capital letter or digit, and never an ordinary lower-case word.
 */
export function perkCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const re = /\b(?:promo(?:tional)?\s+code|discount\s+code|code|coupon|voucher)\b\s*(?:is\s+)?[:\-–]?\s*["“‘']?([A-Za-z0-9][A-Za-z0-9_-]{2,31})["”’']?/gi;
  for (const m of text.matchAll(re)) {
    const code = m[1].replace(/[-_]+$/, "");
    if (code.length < 3) continue;
    // Codes are written in capitals (or mixed with digits); "code at checkout" is not a code.
    if (code !== code.toUpperCase()) continue;
    if (!/[A-Z0-9]/.test(code)) continue;
    return code;
  }
  return null;
}
