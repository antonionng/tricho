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
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Search,
  Sparkles,
  UserRound,
  Gift,
  HeartHandshake,
  UserPlus,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const primary = [
  { href: "/members", label: "Home", icon: Home, exact: true },
  { href: "/members/community", label: "Community", icon: MessagesSquare },
  { href: "/members/learn", label: "Learn", icon: BookOpen },
  { href: "/members/events", label: "Events", icon: CalendarDays },
  { href: "/members/trichozette", label: "Trichozette", icon: Newspaper },
  { href: "/members/messages", label: "Messages", icon: MessageCircle },
  { href: "/members/people", label: "People", icon: Search },
  { href: "/members/assistant", label: "Assistant", icon: Sparkles },
  { href: "/members/perks", label: "Member perks", icon: Gift },
  { href: "/members/referrals", label: "Referrals", icon: HeartHandshake },
  { href: "/members/refer", label: "Invite colleagues", icon: UserPlus },
];

const mobileTabs = [
  { href: "/members", label: "Home", icon: Home, exact: true },
  { href: "/members/community", label: "Community", icon: MessagesSquare },
  { href: "/members/learn", label: "Learn", icon: BookOpen },
  { href: "/members/events", label: "Events", icon: CalendarDays },
  { href: "/members/profile", label: "Me", icon: UserRound },
];

export function MemberShell({
  children,
  name,
  unread = 0,
  referrals = 0,
  isAdmin = false,
  business = false,
}: {
  children: React.ReactNode;
  name?: string | null;
  unread?: number;
  /** New client referrals waiting for an answer. */
  referrals?: number;
  isAdmin?: boolean;
  /** Business and Premium Business accounts get a link to their business portal. */
  business?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-rule bg-paper lg:flex">
        <div className="px-6 pt-7 pb-8">
          <Link href="/members" aria-label="Your community">
            <BrandMark size="sm" sub />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3" aria-label="Member">
          <ul className="flex flex-col gap-0.5">
            {primary.map(({ href, label, icon: Icon, exact }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href, exact) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                    isActive(href, exact) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] stroke-[1.6]" />
                  {label}
                  {href === "/members/referrals" && referrals > 0 && (
                    <span className="ml-auto rounded-full bg-ink px-1.5 text-[11px] font-semibold text-paper" aria-label={`${referrals} new`}>
                      {referrals > 9 ? "9+" : referrals}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {business && (
            <Link
              href="/members/business"
              aria-current={isActive("/members/business") ? "page" : undefined}
              className={cn(
                "mt-6 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[15px] transition-colors",
                isActive("/members/business")
                  ? "border-ink bg-ink text-paper"
                  : "border-rule text-ink-2 hover:border-ink/40 hover:text-ink"
              )}
            >
              <Building2 className="h-[18px] w-[18px] stroke-[1.6]" /> Your business
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/studio"
              className="mt-6 flex items-center gap-3 rounded-xl border border-rule px-3 py-2.5 text-[15px] text-ink-2 hover:border-ink/40 hover:text-ink"
            >
              <LayoutDashboard className="h-[18px] w-[18px] stroke-[1.6]" /> Studio
            </Link>
          )}
        </nav>
        <div className="border-t border-rule p-3">
          <Link
            href="/members/profile"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              isActive("/members/profile") ? "bg-paper-2" : "hover:bg-paper-2"
            )}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-3 text-xs font-semibold">
              {(name || "M").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{name || "Member"}</span>
              <span className="block text-xs text-muted-foreground">Profile and settings</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-xl lg:ml-64">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/members" className="lg:hidden" aria-label="Your community">
            <BrandMark size="xs" />
          </Link>
          <form action="/members/people" className="hidden flex-1 max-w-md lg:block" role="search">
            <label className="flex items-center gap-2 rounded-full border border-rule bg-card px-4 h-9 text-sm">
              <Search className="h-4 w-4 opacity-50" />
              <span className="sr-only">Search members</span>
              <input name="q" placeholder="Search members by name, city or specialism" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
            </label>
          </form>
          <div className="flex items-center gap-1">
            <Link
              href="/members/messages"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2 lg:hidden"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5 stroke-[1.6]" />
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

      <div className="pb-24 lg:ml-64 lg:pb-0">{children}</div>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur-xl pb-safe lg:hidden"
        aria-label="Member"
      >
        <ul className="grid grid-cols-5">
          {mobileTabs.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href, exact) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  isActive(href, exact) ? "text-ink" : "text-muted-foreground"
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
