"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { consumerSession } from "@/lib/consumer-session";
import { publicListingWhere } from "@/lib/stats";

export type SavedState = { signedIn: boolean; consumer: boolean; saved: boolean; name: string | null; email: string | null };

/**
 * What the directory profile needs to know about the visitor, read in the browser so the
 * page itself stays cached: whether they are a consumer, whether this listing is saved,
 * and the details to fill in the enquiry form.
 */
export async function listingVisitorState(listingId: string): Promise<SavedState> {
  const me = await consumerSession();
  if (!me) {
    const { auth } = await import("@/auth");
    const session = await auth();
    return { signedIn: !!session?.user?.id, consumer: false, saved: false, name: null, email: null };
  }
  const saved = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: me.userId, listingId } },
    select: { id: true },
  });
  return { signedIn: true, consumer: true, saved: !!saved, name: me.user.name, email: me.user.email };
}

/** Saves or un-saves a public listing for the signed-in consumer. */
export async function setListingSaved(listingId: string, save: boolean): Promise<{ ok: boolean; saved: boolean }> {
  const me = await consumerSession();
  if (!me) return { ok: false, saved: false };
  if (!save) {
    await prisma.savedListing.deleteMany({ where: { userId: me.userId, listingId } });
  } else {
    const listing = await prisma.directoryListing.findFirst({ where: { AND: [{ id: listingId }, publicListingWhere()] }, select: { id: true } });
    if (!listing) return { ok: false, saved: false };
    await prisma.savedListing.upsert({
      where: { userId_listingId: { userId: me.userId, listingId } },
      create: { userId: me.userId, listingId },
      update: {},
    });
  }
  revalidatePath("/hub/saved");
  revalidatePath("/hub");
  return { ok: true, saved: save };
}
