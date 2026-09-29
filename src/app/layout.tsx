import type { Metadata } from "next";
import { Geist_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/layout/SiteChrome";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trichollective | Cosmetic, clinical & medical hair professionals",
  description:
    "The year-round home of the Trichollective network: find a professional, join the community, and use Tricho-AI in practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
