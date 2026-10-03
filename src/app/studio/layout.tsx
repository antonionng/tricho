import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStaff } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { StudioRail } from "@/components/studio/StudioRail";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false, nocache: true },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  if (!staff) {
    const session = await auth();
    if (!session?.user) redirect("/login?next=/studio");
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-4">
        <div className="max-w-md space-y-6 text-center">
          <BrandMark size="md" />
          <h1 className="display text-4xl">Studio is for the Trichollective team.</h1>
          <p className="text-[15px] text-ink-2">
            You&apos;re signed in as {session.user.email}, which isn&apos;t a team account. If you think you should have
            access, ask {site.founder} to add you.
          </p>
          <Button asChild>
            <Link href="/members">Go to the member app</Link>
          </Button>
        </div>
      </main>
    );
  }

  const inboxCount = staff.perms.has("inbox.view") ? await prisma.draft.count({ where: { status: "draft", kind: { not: "event_prefill" } } }) : 0;

  return (
    <div className="min-h-screen bg-paper">
      <StudioRail
        inboxCount={inboxCount}
        perms={[...staff.perms]}
        who={{ name: staff.name ?? staff.email, role: staff.role }}
      />
      <div className="lg:ml-60">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
