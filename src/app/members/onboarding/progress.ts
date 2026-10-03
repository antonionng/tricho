/** The furthest onboarding step a member has saved or skipped, kept in a cookie as "userId.step". */
export const PROGRESS_COOKIE = "tc_onboarding";

export function readProgress(value: string | undefined, userId: string) {
  if (!value) return 0;
  const dot = value.lastIndexOf(".");
  if (dot < 0 || value.slice(0, dot) !== userId) return 0;
  const step = Number(value.slice(dot + 1));
  return Number.isInteger(step) && step > 0 ? step : 0;
}
