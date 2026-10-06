import { useSyncExternalStore } from "react";

/**
 * The sentence the website shows after a save, carried back to the screen the
 * owner returns to (for example the jobs list after posting a role).
 */
let message: string | null = null;
const listeners = new Set<() => void>();

export function setFlash(next: string | null) {
  message = next;
  listeners.forEach((l) => l());
}

export function useFlash() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => message
  );
}
