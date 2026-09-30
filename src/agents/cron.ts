/**
 * A small cron reader for the simple expressions our agents use
 * ("m h dom mon dow" with numbers, lists, ranges, steps and *). Times are UTC,
 * which is how Vercel Cron runs them.
 */

function field(spec: string, min: number, max: number): Set<number> {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [range, stepRaw] = part.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    let lo = min;
    let hi = max;
    if (range !== "*") {
      const [a, b] = range.split("-").map(Number);
      lo = a;
      hi = b ?? (stepRaw ? max : a);
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

export function parseCron(expr: string) {
  const [m, h, dom, mon, dow] = expr.trim().split(/\s+/);
  return {
    minutes: field(m, 0, 59),
    hours: field(h, 0, 23),
    doms: field(dom, 1, 31),
    months: field(mon, 1, 12),
    dows: field(dow, 0, 6),
    domAny: dom === "*",
    dowAny: dow === "*",
  };
}

/** Every run time of an expression within a calendar month (month is 0-based). */
export function occurrencesInMonth(expr: string, year: number, month: number): Date[] {
  const c = parseCron(expr);
  const out: Date[] = [];
  if (!c.months.has(month + 1)) return out;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1; d <= days; d++) {
    const dow = new Date(Date.UTC(year, month, d)).getUTCDay();
    const domOk = c.doms.has(d);
    const dowOk = c.dows.has(dow);
    const dayOk = c.domAny && c.dowAny ? true : c.domAny ? dowOk : c.dowAny ? domOk : domOk || dowOk;
    if (!dayOk) continue;
    for (const h of [...c.hours].sort((a, b) => a - b)) {
      for (const m of [...c.minutes].sort((a, b) => a - b)) {
        out.push(new Date(Date.UTC(year, month, d, h, m)));
      }
    }
  }
  return out;
}

export function nextRun(expr: string, from = new Date()): Date | null {
  for (let i = 0; i < 14; i++) {
    const y = from.getUTCFullYear();
    const mo = from.getUTCMonth() + i;
    const hit = occurrencesInMonth(expr, y + Math.floor(mo / 12), mo % 12).find((d) => d > from);
    if (hit) return hit;
  }
  return null;
}
