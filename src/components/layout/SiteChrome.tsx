"use client";

import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/components/layout/Navbar";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMemberArea =
    pathname.startsWith("/members") || pathname.startsWith("/admin");

  return (
    <>
      {!isMemberArea && <PublicNavbar />}
      <main>{children}</main>
    </>
  );
}
