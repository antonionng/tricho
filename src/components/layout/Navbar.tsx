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
import { BrandMark } from "@/components/brand/BrandMark";

const publicNav = [
  { name: "Find someone", href: "/find" },
  { name: "Membership", href: "/join" },
  { name: "Directory", href: "/directory" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="z-10">
            <BrandMark size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "tricho-caps text-[11px] transition-opacity",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "opacity-100"
                    : "opacity-50 hover:opacity-100"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="tricho-caps text-[11px] opacity-50 hover:opacity-100 transition-opacity"
            >
              Sign in
            </Link>
            <Button asChild className="rounded-2xl h-10 px-5 tricho-caps text-[11px]">
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
              <SheetContent side="right" className="bg-background rounded-l-3xl">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <BrandMark size="sm" />
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-5">
                  {publicNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-2xl font-extrabold uppercase tracking-tight"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="tricho-caps opacity-60"
                  >
                    Sign in
                  </Link>
                  <Button asChild className="rounded-2xl mt-2 h-12">
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
