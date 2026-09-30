"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { primaryNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  // Checked in the browser so marketing pages can be served statically.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && setSignedIn(!!s?.user))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus when the route changes (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(null);
    setMobile(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const openItem = primaryNav.find((n) => n.label === open && n.menu);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color] duration-300",
        scrolled || open || mobile
          ? "bg-paper/92 backdrop-blur-xl border-b border-rule"
          : "bg-paper border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 lg:h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Trichollective home">
          <BrandMark size="sm" sub />
        </Link>

        <nav className="hidden xl:block" aria-label="Main" onMouseLeave={leave}>
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.label} onMouseEnter={() => (item.menu ? enter(item.label) : setOpen(null))}>
                {item.menu ? (
                  <button
                    type="button"
                    aria-expanded={open === item.label}
                    aria-controls="mega-menu"
                    onClick={() => setOpen(open === item.label ? null : item.label)}
                    className={cn(
                      "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[14px] transition-colors",
                      active(item.href) || open === item.label ? "text-ink" : "text-ink-2 hover:text-ink"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 opacity-50 transition-transform", open === item.label && "rotate-180")}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex whitespace-nowrap rounded-full px-3 py-2 text-[14px] transition-colors",
                      active(item.href) ? "text-ink" : "text-ink-2 hover:text-ink"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden xl:flex items-center gap-2 whitespace-nowrap">
          <Link
            href={signedIn ? "/members" : "/login"}
            className="rounded-full px-3 py-2 text-[14px] text-ink-2 hover:text-ink"
          >
            {signedIn ? "Your community" : "Sign in"}
          </Link>
          <Button asChild>
            <Link href="/pricing">
              Join the collective <ArrowRight />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="xl:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full"
          aria-label={mobile ? "Close menu" : "Open menu"}
          aria-expanded={mobile}
          onClick={() => setMobile((m) => !m)}
        >
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop mega menu */}
      <div
        id="mega-menu"
        onMouseEnter={() => openItem && enter(openItem.label)}
        onMouseLeave={leave}
        className={cn(
          "absolute inset-x-0 top-full hidden xl:block border-b border-rule bg-paper/97 backdrop-blur-xl transition-all duration-200",
          openItem ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
        )}
      >
        {openItem?.menu && (
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10 px-10 py-10">
            <div className="col-span-4 flex flex-col gap-4 pr-6 border-r border-rule">
              <p className="label text-muted-foreground">{openItem.label}</p>
              <p className="display text-3xl leading-[1.05]">{openItem.menu.intro}</p>
              <Link href={openItem.href} className="mt-auto inline-flex items-center gap-2 text-sm font-medium">
                Explore {openItem.label.toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-2">
              {openItem.menu.items.map((sub) => (
                <li key={sub.href}>
                  <Link
                    href={sub.href}
                    className="group block rounded-2xl p-4 -m-1 transition-colors hover:bg-paper-2"
                  >
                    <span className="flex items-center gap-2 font-medium text-ink">
                      {sub.label}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0" />
                    </span>
                    {sub.description && (
                      <span className="mt-1 block text-sm text-muted-foreground">{sub.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "xl:hidden fixed inset-x-0 top-16 lg:top-[72px] bottom-0 z-40 overflow-y-auto bg-paper transition-opacity duration-200",
          mobile ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
      >
        <nav className="px-4 sm:px-6 pb-40 pt-4" aria-label="Mobile">
          <ul className="divide-y divide-rule border-y border-rule">
            {primaryNav.map((item) => (
              <li key={item.label} className="py-1">
                {item.menu ? (
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 display text-2xl [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown className="h-5 w-5 opacity-40 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="pb-4 flex flex-col gap-1">
                      {item.menu.items.map((sub) => (
                        <li key={sub.href}>
                          <Link href={sub.href} className="block rounded-xl py-2.5 text-[17px] text-ink-2">
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="block py-4 display text-2xl">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="fixed inset-x-0 bottom-0 flex flex-col gap-3 border-t border-rule bg-paper p-4 pb-safe">
            <Button asChild size="lg" className="w-full">
              <Link href="/pricing">
                Join the collective <ArrowRight />
              </Link>
            </Button>
            <Link href={signedIn ? "/members" : "/login"} className="py-2 text-center text-[15px] text-ink-2">
              {signedIn ? "Go to your community" : "Sign in"}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
