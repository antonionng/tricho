"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CreditCard,
  Home,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/BrandMark";

const links = [
  { href: "/members", label: "Home", icon: Home, exact: true },
  { href: "/members/community", label: "Rooms", icon: MessagesSquare },
  { href: "/members/learn", label: "Learn", icon: BookOpen },
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/members/assistant", label: "Tricho-AI", icon: Sparkles },
  { href: "/members/exchange", label: "Exchange", icon: Building2 },
  { href: "/members/billing", label: "Billing", icon: CreditCard },
];

export function MemberShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/members">
            <BrandMark size="sm" />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="text-sm text-muted-foreground truncate max-w-[140px]">
            {name || "Member"}
          </div>
        </div>
        <div className="lg:hidden border-t border-black/10 overflow-x-auto">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-2xl px-3 py-1.5 text-xs whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
