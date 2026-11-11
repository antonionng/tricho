"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/hub", label: "For you" },
  { href: "/hub/saved", label: "Saved" },
  { href: "/hub/enquiries", label: "Enquiries" },
  { href: "/hub/profile", label: "Profile" },
  { href: "/hub/settings", label: "Settings" },
  { href: "/directory", label: "Find a professional" },
];

export function HubNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hub" className="mx-auto max-w-5xl overflow-x-auto px-4 sm:px-6 lg:px-10">
      <ul className="flex gap-1 pb-2">
        {LINKS.map((l) => {
          const active = l.href === "/hub" ? pathname === "/hub" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3 text-sm",
                  active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
