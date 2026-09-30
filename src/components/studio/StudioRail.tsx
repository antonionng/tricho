"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CalendarRange,
  Inbox,
  ListChecks,
  Mail,
  MessagesSquare,
  Users,
  UserPlus,
  Handshake,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";

const items = [
  { href: "/studio", label: "Inbox", icon: Inbox, exact: true, badge: true },
  { href: "/studio/month", label: "This month", icon: CalendarRange },
  { href: "/studio/members", label: "Members", icon: Users },
  { href: "/studio/listings", label: "Listings", icon: ListChecks },
  { href: "/studio/invite", label: "Invite", icon: UserPlus },
  { href: "/studio/partners", label: "Partners", icon: Handshake },
  { href: "/studio/community", label: "Community", icon: MessagesSquare },
  { href: "/studio/events", label: "Events", icon: CalendarDays },
  { href: "/studio/subscribers", label: "Subscribers", icon: Mail },
  { href: "/studio/agents", label: "Agents", icon: Bot },
];

export function StudioRail({ inboxCount }: { inboxCount: number }) {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-rule bg-paper lg:flex">
        <div className="px-6 pt-7 pb-2">
          <Link href="/studio" aria-label="Studio inbox">
            <BrandMark size="sm" />
          </Link>
          <p className="label mt-3 text-muted-foreground">Studio</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pt-5" aria-label="Studio">
          <ul className="flex flex-col gap-0.5">
            {items.map(({ href, label, icon: Icon, exact, badge }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active(href, exact) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
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
            ))}
          </ul>
        </nav>
        <div className="border-t border-rule p-3">
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
          <Link href="/studio" className="flex items-baseline gap-2" aria-label="Studio inbox">
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
