import { runAction, withMember } from "@/lib/mobile/api";
import { markAllNotificationsRead } from "@/app/members/notifications/actions";

/** Marks every notification read. */
export const POST = withMember(async () => runAction(() => markAllNotificationsRead()), { members: true });
