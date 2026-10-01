"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "@/app/members/notifications/actions";

/** Marks notifications read once the page has been seen, then refreshes the badge. */
export function MarkAllRead({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (enabled) void markAllNotificationsRead();
  }, [enabled]);
  return null;
}
