import { syncStoreSubscription } from "@/lib/mobile/store";
import { getMembershipByEmail } from "@/lib/subscription";
import { json, withMember } from "@/lib/mobile/api";

/** Called by the app straight after a purchase or restore, so access opens without waiting for the webhook. */
export const POST = withMember(async (_req, ctx) => {
  const store = await syncStoreSubscription(ctx.session.user.id);
  const membership = await getMembershipByEmail(ctx.session.user.email);
  return json({ store, membership });
});
