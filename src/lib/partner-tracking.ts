import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordPartnerStats, shouldCount, type StatField } from "@/lib/partner-stats";

/**
 * Records a partner statistic for the current request, unless it comes from a bot,
 * the Trichollective team, or the brand looking at its own page. Never throws.
 */
export async function trackPartners(
  partners: { id: string; ownerEmail: string | null }[],
  field: StatField,
  userAgent: string | null
) {
  try {
    if (!partners.length || !shouldCount({ userAgent })) return;
    const session = await auth().catch(() => null);
    const email = session?.user?.email?.toLowerCase() ?? null;
    let staff = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { staffRole: true } }).catch(() => null);
      staff = !!user?.staffRole;
    }
    const ids = partners
      .filter((p) => shouldCount({ userAgent, viewerEmail: email, viewerIsStaff: staff, ownerEmail: p.ownerEmail }))
      .map((p) => p.id);
    await recordPartnerStats(ids, field);
  } catch (err) {
    console.error("[partner-tracking] failed", err);
  }
}
