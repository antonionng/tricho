import { Bodoni_Moda, Source_Serif_4 } from "next/font/google";

/** Trichozette's own typography: a Didone for headlines, a book serif for reading. */
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

export const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-body",
  display: "swap",
});

export const gazetteFonts = `${bodoni.variable} ${serif.variable}`;
