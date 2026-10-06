/**
 * Matches store products to Trichollective plans. Product ids name their plan,
 * e.g. "tc_professional_annual", the same rule the server uses in
 * src/lib/mobile/store.ts. Pure, so it is tested in src/lib/mobile/app-helpers.test.ts.
 */
export type PlanId = "community" | "professional" | "business";

const ORDER: PlanId[] = ["business", "professional", "community"];

export function planForProduct(productId: string | null | undefined): PlanId | null {
  const id = (productId ?? "").toLowerCase();
  return ORDER.find((plan) => id.includes(plan)) ?? null;
}

/** "P1M" -> "month", "P1Y" -> "year", from the store's ISO 8601 period. */
export function periodLabel(period: string | null | undefined): string | null {
  const m = /^P(\d+)([DWMY])$/.exec(period ?? "");
  if (!m) return null;
  const n = Number(m[1]);
  const unit = { D: "day", W: "week", M: "month", Y: "year" }[m[2] as "D" | "W" | "M" | "Y"];
  if (unit === "week" && n === 52) return "year";
  if (n === 1) return unit;
  if (unit === "month" && n === 12) return "year";
  return `${n} ${unit}s`;
}

type PackageLike = { identifier: string; product: { identifier: string; priceString: string; subscriptionPeriod: string | null } };

/**
 * The packages on sale grouped by plan, in the order the plans are listed, with
 * monthly before annual. Packages whose product names no plan are left out.
 */
export function packagesByPlan<P extends PackageLike>(packages: P[], planOrder: string[]): { plan: PlanId; packages: P[] }[] {
  const groups = new Map<PlanId, P[]>();
  for (const pkg of packages) {
    const plan = planForProduct(pkg.product.identifier);
    if (!plan) continue;
    groups.set(plan, [...(groups.get(plan) ?? []), pkg]);
  }
  const rank = (p: P) => (periodLabel(p.product.subscriptionPeriod) === "year" ? 1 : 0);
  return [...groups.entries()]
    .sort(([a], [b]) => indexOr(planOrder, a) - indexOr(planOrder, b))
    .map(([plan, list]) => ({ plan, packages: [...list].sort((a, b) => rank(a) - rank(b)) }));
}

const indexOr = (list: string[], id: string) => {
  const i = list.indexOf(id);
  return i < 0 ? list.length : i;
};
