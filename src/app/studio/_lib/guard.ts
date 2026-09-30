import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/member";

/**
 * For Studio pages. Signed out: off to the login page. Signed in but not on
 * the team: returns null, and the layout shows the "team only" message.
 */
export async function studioPage(next = "/studio") {
  const admin = await requireAdmin();
  if (admin) return admin;
  const session = await auth();
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return null;
}

/** For Studio server actions and route handlers. Throws for anyone not on the team. */
export async function studioAction() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Studio is for the Trichollective team.");
  return admin;
}
