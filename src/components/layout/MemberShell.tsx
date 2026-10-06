"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  BookOpen,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  UserRound,
  Gift,
  HeartHandshake,
  UserPlus,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { signOutAction } from "@/app/members/profile/actions";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean; children?: NavItem[] };

const primary: NavItem[] = [
  { href: "/members", label: "Home", icon: Home, exact: true },
  { href: "/members/community", label: "Community", icon: MessagesSquare },
  { href: "/members/messages", label: "Messages", icon: MessageCircle },
  { href: "/members/people", label: "People", icon: Users },
  { href: "/members/events", label: "Events", icon: CalendarDays },
  { href: "/members/trichozette", label: "Trichozette", icon: Newspaper },
  {
    href: "/members/learn",
    label: "Learn",
    icon: BookOpen,
    children: [{ href: "/members/assistant", label: "Assistant", icon: Sparkles }],
  },
  { href: "/members/perks", label: "Member perks", icon: Gift },
  { href: "/members/referrals", label: "Client referrals", icon: HeartHandshake },
];

const mobileTabs: NavItem[] = [
  { href: "/members", label: "Home", icon: Home, exact: true },
  { href: "/members/community", label: "Community", icon: MessagesSquare },
  { href: "/members/trichozette", label: "Trichozette", icon: Newspaper },
  { href: "/members/events", label: "Events", icon: CalendarDays },
  { href: "/members/profile", label: "Me", icon: UserRound },
];

function Dot({ label }: { label: string }) {
  return <span className="h-2 w-2 shrink-0 rounded-full bg-ink" role="status" aria-label={label} />;
}

export function MemberShell({
  children,
  name,
  image,
  unread = 0,
  messages = 0,
  referrals = 0,
  isAdmin = false,
  business = false,
}: {
  children: React.ReactNode;
  name?: string | null;
  /** The member's photo, if they have one. */
  image?: string | null;
  unread?: number;
  /** Conversations with a message the member has not read yet. */
  messages?: number;
  /** New client referrals waiting for an answer. */
  referrals?: number;
  isAdmin?: boolean;
  /** Business and Premium Business accounts get a link to their business portal. */
  business?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  // Onboarding gets a quiet header so new members finish setting up before exploring.
  if (pathname.startsWith("/members/onboarding")) {
    return (
      <div className="min-h-screen bg-paper">
        <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-4 sm:px-6">
            <BrandMark size="xs" />
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full px-3 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="pb-10">{children}</div>
      </div>
    );
  }

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
      active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
    );
  const learnOpen = ["/members/learn", "/members/assistant"].some((h) => isActive(h));

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-rule bg-paper lg:flex">
        <div className="px-6 pt-7 pb-6">
          <Link href="/members" aria-label="Your community">
            <BrandMark size="sm" sub />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Member">
          <ul className="flex flex-col gap-0.5">
            {primary.map(({ href, label, icon: Icon, exact, children: sub }) => (
              <li key={href}>
                <Link href={href} aria-current={isActive(href, exact) ? "page" : undefined} className={linkClass(isActive(href, exact))}>
                  <Icon className="h-[18px] w-[18px] stroke-[1.6]" />
                  <span className="flex-1">{label}</span>
                  {href === "/members/messages" && messages > 0 && !isActive(href) && (
                    <Dot label={`${messages} unread ${messages === 1 ? "conversation" : "conversations"}`} />
                  )}
                  {href === "/members/referrals" && referrals > 0 && (
                    <span className="rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper" aria-label={`${referrals} new`}>
                      {referrals > 9 ? "9+" : referrals}
                    </span>
                  )}
                </Link>
                {sub && learnOpen && (
                  <ul className="mt-0.5 mb-1 ml-[22px] flex flex-col gap-0.5 border-l border-rule pl-3">
                    {sub.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          aria-current={isActive(c.href) ? "page" : undefined}
                          className={cn(
                            "flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                            isActive(c.href) ? "bg-paper-2 font-medium text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                          )}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {(business || isAdmin) && (
            <div className="mt-5 flex flex-col gap-1.5 border-t border-rule pt-5">
              {business && (
                <Link
                  href="/members/business"
                  aria-current={isActive("/members/business") ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2 text-[15px] transition-colors",
                    isActive("/members/business") ? "border-ink bg-ink text-paper" : "border-rule text-ink-2 hover:border-ink/40 hover:text-ink"
                  )}
                >
                  <Building2 className="h-[18px] w-[18px] stroke-[1.6]" /> Your business
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/studio"
                  className="flex min-h-10 items-center gap-3 rounded-xl border border-rule px-3 py-2 text-[15px] text-ink-2 hover:border-ink/40 hover:text-ink"
                >
                  <LayoutDashboard className="h-[18px] w-[18px] stroke-[1.6]" /> Studio
                </Link>
              )}
            </div>
          )}
        </nav>
        <div className="border-t border-rule p-3">
          <Link
            href="/members/profile"
            aria-current={isActive("/members/profile") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              isActive("/members/profile") ? "bg-paper-2" : "hover:bg-paper-2"
            )}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-3 text-xs font-semibold">
                {(name || "M").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name || "Member"}</span>
              <span className="block text-xs text-muted-foreground">Profile and settings</span>
            </span>
          </Link>
          <div className="mt-1 flex flex-col gap-0.5">
            <Link
              href="/members/refer"
              aria-current={isActive("/members/refer") ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                isActive("/members/refer") ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
              )}
            >
              <UserPlus className="h-4 w-4 stroke-[1.6]" /> Invite a colleague
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
              >
                <LogOut className="h-4 w-4 stroke-[1.6]" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-xl lg:ml-64">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/members" className="lg:hidden" aria-label="Your community">
            <BrandMark size="xs" />
          </Link>
          <form action="/members/people" className="hidden flex-1 max-w-md lg:block" role="search">
            <label className="flex h-10 items-center gap-2 rounded-full border border-rule bg-card px-4 text-sm focus-within:border-ink">
              <Search className="h-4 w-4 opacity-50" />
              <span className="sr-only">Search members</span>
              <input name="q" placeholder="Search members by name, city or specialism" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
            </label>
          </form>
          <div className="flex items-center gap-1">
            <Link
              href="/members/messages"
              className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 lg:hidden"
              aria-label={messages ? `Messages, ${messages} unread` : "Messages"}
            >
              <MessageCircle className="h-5 w-5 stroke-[1.6]" />
              {messages > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-paper bg-ink" />}
            </Link>
            <Link
              href="/members/notifications"
              className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2"
              aria-label={unread ? `${unread} unread notifications` : "Notifications"}
            >
              <Bell className="h-5 w-5 stroke-[1.6]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="pb-tabbar lg:ml-64 lg:pb-0">{children}</div>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur-xl pb-safe px-safe lg:hidden"
        aria-label="Member"
      >
        <ul className="grid grid-cols-5">
          {mobileTabs.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href, exact) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors active:bg-paper-2",
                  isActive(href, exact) ? "font-semibold text-ink" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", isActive(href, exact) ? "stroke-[2]" : "stroke-[1.5]")} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
