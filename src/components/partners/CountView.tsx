"use client";

import { useEffect, useRef } from "react";

/**
 * Sends one small POST when the page is actually shown in a browser, so partner
 * reports count real visits and not link prefetches. Renders nothing.
 */
export function CountView({ url, body }: { url: string; body?: unknown }) {
  const sent = useRef(false);
  const payload = body === undefined ? undefined : JSON.stringify(body);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(url, {
      method: "POST",
      keepalive: true,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload,
    }).catch(() => undefined);
  }, [url, payload]);
  return null;
}
