"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bot,
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
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";
import {
  NAV_GROUP_LABEL,
  navFor,
  STAFF_ROLE_LABEL,
  type NavIcon,
  type NavItem,
  type Permission,
  type StaffRoleId,
} from "@/config/staff";

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
  const groups = (["run", "publish", "people", "settings"] as NavItem["group"][])
    .map((g) => ({ g, items: items.filter((i) => i.group === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-rule bg-paper lg:flex">
        <div className="px-6 pt-7 pb-2">
          <Link href="/studio" aria-label="Studio overview">
            <BrandMark size="sm" />
          </Link>
          <p className="label mt-3 text-muted-foreground">Studio</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pt-3" aria-label="Studio">
          {groups.map(({ g, items }) => (
            <div key={g} className="pt-3">
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {NAV_GROUP_LABEL[g]}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map(({ href, label, icon, exact, badge }) => {
                  const Icon = ICONS[icon];
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active(href, exact) ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition-colors",
                          active(href, exact) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] stroke-[1.6]" />
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
          ))}
        </nav>
        <div className="border-t border-rule p-3">
          <p className="truncate px-3 pt-1 text-sm text-ink">{who.name}</p>
          <p className="px-3 pb-2 text-xs text-muted-foreground">{STAFF_ROLE_LABEL[who.role]}</p>
          <Link
            href="/members"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the member app
          </Link>
        </div>
      </aside>

      {/* Mobile top bar with a scrolling tab strip */}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/studio" className="flex items-baseline gap-2" aria-label="Studio overview">
            <BrandMark size="xs" />
            <span className="label text-muted-foreground">Studio</span>
          </Link>
          <Link href="/members" className="text-sm text-ink-2 underline-offset-4 hover:underline">
            Member app
          </Link>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Studio">
          {items.map(({ href, label, exact, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href, exact) ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm",
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
