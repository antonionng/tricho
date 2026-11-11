import { prisma } from "@/lib/prisma";

/**
 * Deletes a consumer account and what belongs to it. The profile and saved professionals
 * go with the user (cascade). Enquiries a professional has already received stay with them,
 * unlinked from the account (Enquiry.userId is set to null). Enquiries still held because
 * the professional has not joined were never delivered, so those are deleted outright.
 */
export async function deleteConsumerAccount(userId: string, email: string | null) {
  await prisma.$transaction([
    prisma.enquiry.deleteMany({ where: { userId, status: "new" } }),
    prisma.pendingSignup.deleteMany({ where: { email: email ?? "" } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
