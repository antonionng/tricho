"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Gift,
  HeartPulse,
  BadgeCheck,
  Bot,
  Building2,
  CalendarDays,
  CalendarRange,
  Handshake,
  History,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Mail,
  MailCheck,
  MessagesSquare,
  Mic,
  Newspaper,
  ShieldCheck,
  MessageSquareText,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";
import {
  NAV_GROUP_LABEL,
  NAV_GROUPS,
  navFor,
  type NavGroup,
  STAFF_ROLE_LABEL,
  type NavIcon,
  type Permission,
  type StaffRoleId,
} from "@/config/staff";

const COLLAPSED_KEY = "studio.nav.collapsed";

const ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  inbox: Inbox,
  month: CalendarRange,
  members: Users,
  team: ShieldCheck,
  audit: History,
  listings: ListChecks,
  invite: UserPlus,
  partners: Handshake,
  community: MessagesSquare,
  events: CalendarDays,
  gazette: Newspaper,
  podcast: Mic,
  subscribers: Mail,
  emails: MailCheck,
  agents: Bot,
  crm: Building2,
  verification: BadgeCheck,
  enquiries: MessageSquareText,
  referrals: Gift,
  retention: HeartPulse,
};

export function StudioRail({
  inboxCount,
  perms,
  who,
}: {
  inboxCount: number;
  perms: Permission[];
  who: { name: string; role: StaffRoleId };
}) {
  const pathname = usePathname();
  const items = navFor(perms);
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const groups = NAV_GROUPS.map((g) => ({ g, items: items.filter((i) => i.group === g) })).filter((x) => x.items.length > 0);
  const currentGroup = items.find((i) => active(i.href, i.exact))?.group;

  // Which groups someone has folded away, remembered in this browser. The
  // group holding the current page is always open, whatever was saved.
  const [collapsed, setCollapsed] = useState<NavGroup[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(COLLAPSED_KEY) ?? "[]");
      if (Array.isArray(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after hydration
        setCollapsed(saved.filter((g): g is NavGroup => (NAV_GROUPS as readonly string[]).includes(g)));
      }
    } catch {
      // Storage can be unavailable; every group simply stays open.
    }
  }, []);
  // Keep the current page's tab in view on the phone strip.
  useEffect(() => {
    document
      .querySelector<HTMLElement>('[data-studio-strip] [aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);
  const toggle = (g: NavGroup) =>
    setCollapsed((prev) => {
      const next = prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g];
      try {
        window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // Not remembered, which is fine.
      }
      return next;
    });

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-rule bg-paper lg:flex">
        <div className="px-6 pt-6 pb-1">
          <Link href="/studio" aria-label="Studio overview" className="flex items-baseline gap-2">
            <BrandMark size="sm" />
          </Link>
          <p className="label mt-2 text-muted-foreground">Studio</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pt-1 pb-3" aria-label="Studio">
          {groups.map(({ g, items }) => {
            const isCurrent = g === currentGroup;
            const open = isCurrent || !collapsed.includes(g);
            return (
              <div key={g} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggle(g)}
                  disabled={isCurrent}
                  aria-expanded={open}
                  aria-controls={`studio-nav-${g}`}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-ink disabled:cursor-default disabled:hover:text-muted-foreground"
                >
                  {NAV_GROUP_LABEL[g]}
                  {!isCurrent && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} aria-hidden />}
                </button>
                <ul id={`studio-nav-${g}`} hidden={!open} className="flex flex-col gap-0.5">
                  {items.map(({ href, label, icon, exact, badge }) => {
                    const Icon = ICONS[icon];
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={active(href, exact) ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-1 text-sm transition-colors",
                            active(href, exact) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 stroke-[1.7]" />
                          <span className="flex-1">{label}</span>
                          {badge && inboxCount > 0 && (
                            <span
                              className={cn(
                                "min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-medium tabular-nums",
                                active(href, exact) ? "bg-paper text-ink" : "bg-ink text-paper"
                              )}
                              aria-label={`${inboxCount} waiting`}
                            >
                              {inboxCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-rule px-6 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{who.name}</p>
            <p className="text-xs text-muted-foreground">{STAFF_ROLE_LABEL[who.role]}</p>
          </div>
          <Link
            href="/members"
            aria-label="Back to the member app"
            title="Back to the member app"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rule text-ink-2 hover:bg-paper-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Mobile top bar with a scrolling tab strip */}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 pt-safe px-safe backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/studio" className="flex items-baseline gap-2" aria-label="Studio overview">
            <BrandMark size="xs" />
            <span className="label text-muted-foreground">Studio</span>
          </Link>
          <Link href="/members" className="-mr-2 inline-flex min-h-10 items-center px-2 text-sm text-ink-2 underline-offset-4 hover:underline">
            Member app
          </Link>
        </div>
        <nav data-studio-strip className="no-scrollbar flex gap-1 overflow-x-auto overscroll-x-contain px-3 pb-2" aria-label="Studio">
          {items.map(({ href, label, exact, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href, exact) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-sm",
                active(href, exact) ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
              )}
            >
              {label}
              {badge && inboxCount > 0 ? ` (${inboxCount})` : ""}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
