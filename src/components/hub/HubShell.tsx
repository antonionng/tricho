import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConsumerAvatar } from "@/components/hub/ConsumerAvatar";
import { HubNav } from "@/components/hub/HubNav";
import { HUB_LABEL, HUB_PATH } from "@/config/consumer";

/**
 * The frame around every hub page. It is separate from MemberShell on purpose: nothing
 * here links into the member area or the community.
 */
export function HubShell({
  children,
  displayName,
  avatarSeed,
  signOut,
}: {
  children: React.ReactNode;
  displayName: string;
  avatarSeed: string;
  signOut: () => Promise<void>;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <Link href={HUB_PATH} className="flex items-center gap-3" aria-label={`${HUB_LABEL} home`}>
            <BrandMark size="sm" />
            <span className="hidden text-sm text-ink-2 sm:inline">{HUB_LABEL}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/hub/profile" className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
              <ConsumerAvatar seed={avatarSeed} size={32} />
              <span className="hidden max-w-[12rem] truncate sm:inline">{displayName}</span>
            </Link>
            <form action={signOut}>
              <button type="submit" className="rounded-full px-3 py-2 text-sm text-ink-2 hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <HubNav />
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
