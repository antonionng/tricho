"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "The Gazette", href: "/magazine" },
  { name: "Audio Dispatch", href: "/podcast" },
  { name: "The Registry", href: "/events" },
  { name: "The Directory", href: "/directory" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#D1D0CB]/95 backdrop-blur-sm overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center z-10">
              <span className="text-2xl font-sans font-extrabold tracking-tighter uppercase flex items-baseline">
                <span className="text-black">Tricho</span>
                <span className="text-[#6A6A6A]">llective</span>
                <span className="text-[#6A6A6A]">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-none items-center space-x-6 lg:space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "tricho-caps transition-opacity hover:opacity-50 whitespace-nowrap",
                  pathname === item.href ? "opacity-100" : "opacity-60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex flex-1 items-center justify-end space-x-4 z-10">
            <Link 
              href="/login" 
              className="tricho-caps opacity-60 hover:opacity-100 transition-opacity"
            >
              Sign In
            </Link>
            <Button asChild className="tricho-caps h-10 px-6 bg-black text-white hover:bg-black/80 rounded-none border-none">
              <Link href="/join">Membership</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-black">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full bg-white border-none">
                <SheetHeader>
                  <SheetTitle className="text-left font-sans font-extrabold uppercase tracking-tighter">
                    <span className="text-black">Tricho</span>
                    <span className="text-[#6A6A6A]">llective</span>
                    <span className="text-[#6A6A6A]">.</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-8 mt-12 text-center">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-3xl font-sans font-extrabold uppercase transition-opacity",
                        pathname === item.href ? "opacity-100" : "opacity-40"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-8 flex flex-col space-y-4">
                    <Button asChild variant="outline" className="tricho-caps w-full border-black rounded-none h-14">
                      <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button asChild className="tricho-caps w-full bg-black text-white rounded-none h-14">
                      <Link href="/join" onClick={() => setIsOpen(false)}>Join Now</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
