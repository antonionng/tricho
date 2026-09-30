/**
 * Preview demo mode: only on Vercel *preview* deployments with PREVIEW_DEMO=true.
 * Enables the email-only sign-in and full access so stakeholders can explore.
 * Never true in production.
 */
export function isPreviewDemo() {
  return process.env.VERCEL_ENV === "preview" && process.env.PREVIEW_DEMO === "true";
}

/** Local development or a preview demo. */
export function isDevOrDemo() {
  return process.env.NODE_ENV !== "production" || isPreviewDemo();
}
