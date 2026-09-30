import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/config/site";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";
import { isPreviewDemo } from "@/lib/env";

// Fonts are bundled from npm (@fontsource-variable) so builds never depend on fetching Google Fonts.
const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-standard-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-standard-italic.woff2", weight: "100 900", style: "italic" },
  ],
});

const interTight = localFont({
  variable: "--font-inter-tight",
  display: "swap",
  src: [{ path: "../../node_modules/@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    images: [{ url: "/og?title=Join%20early.&sub=Be%20in%20the%20founding%20directory.", width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f4f3f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body
        className={`${inter.variable} ${interTight.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}
      >
        {isPreviewDemo() && (
          <div className="relative z-[100] bg-ink px-4 py-1.5 text-center text-[12px] text-paper">
            You&apos;re viewing a preview of Trichollective Online. People and listings shown here are sample content, not real members.
          </div>
        )}
        {children}
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </body>
    </html>
  );
}
