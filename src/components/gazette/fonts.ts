import localFont from "next/font/local";

/** Trichozette's own typography: a Didone for headlines, a book serif for reading. Bundled, not fetched. */
export const bodoni = localFont({
  variable: "--font-bodoni",
  display: "swap",
  src: [
    { path: "../../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-standard-normal.woff2", weight: "400 900", style: "normal" },
    { path: "../../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-standard-italic.woff2", weight: "400 900", style: "italic" },
  ],
});

export const serif = localFont({
  variable: "--font-serif-body",
  display: "swap",
  src: [
    { path: "../../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-standard-normal.woff2", weight: "200 900", style: "normal" },
    { path: "../../../node_modules/@fontsource-variable/source-serif-4/files/source-serif-4-latin-standard-italic.woff2", weight: "200 900", style: "italic" },
  ],
});

export const gazetteFonts = `${bodoni.variable} ${serif.variable}`;
