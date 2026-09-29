"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicNav = [
  { name: "Find someone", href: "/find" },
  { name: "Membership", href: "/join" },
  { name: "Directory", href: "/directory" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Trichollective
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Button asChild className="rounded-full h-10 px-5">
              <Link href="/join">Join for £12</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background">
                <SheetHeader>
                  <SheetTitle className="font-display text-left">Trichollective</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4">
                  {publicNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Sign in
                  </Link>
                  <Button asChild className="rounded-full mt-2">
                    <Link href="/join" onClick={() => setIsOpen(false)}>
                      Join for £12
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
