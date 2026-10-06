import { runAction, withMember } from "@/lib/mobile/api";
import { markNotificationRead } from "@/app/members/notifications/actions";

/** Marks one notification read. */
export const POST = withMember<{ id: string }>(async (_req, _ctx, { id }) => runAction(() => markNotificationRead(id)), { members: true });
