import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isBusinessAccount } from "@/lib/subscription";
import { errorText, SAVED_MESSAGES } from "../messages";

/** The signed-in business, its page and whether its plan is active. */
export async function loadPoster(next: string) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect(`/login?next=${encodeURIComponent(next)}`);
  const [page, active] = await Promise.all([
    prisma.partner.findUnique({ where: { ownerEmail: email } }),
    isBusinessAccount(email),
  ]);
  return { email, page, active };
}

export function Notices({ saved, error, message }: { saved?: string; error?: string; message?: string }) {
  const problem = errorText(error, message);
  return (
    <>
      {saved && SAVED_MESSAGES[saved] && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          {SAVED_MESSAGES[saved]}
        </p>
      )}
      {problem && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {problem}
        </p>
      )}
    </>
  );
}
