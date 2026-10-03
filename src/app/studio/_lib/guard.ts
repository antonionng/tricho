import type { Permission } from "@/config/staff";
import { requirePermission, requirePermissionPage } from "@/lib/staff";

/**
 * For Studio pages. Signed out: off to the login page. Signed in but without
 * this permission: returns null, and the page shows the "not in your role" note.
 */
export async function studioPage(next = "/studio", perm: Permission = "overview.view") {
  return requirePermissionPage(perm, next);
}

/** For Studio server actions and route handlers. Throws for anyone whose role doesn't include this. */
export async function studioAction(perm: Permission = "overview.view") {
  return requirePermission(perm);
}
