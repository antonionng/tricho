/**
 * The Trichollective design system, from the website's globals.css: warm paper,
 * black ink fading to grey, widely tracked small capitals, hairline rules and a
 * black pill button.
 */
export const colors = {
  paper: "#f4f3f0",
  paper2: "#ecebe7",
  paper3: "#e3e2dd",
  card: "#faf9f7",
  ink: "#0b0b0b",
  ink2: "#3a3a3a",
  /** Small text on paper. Use `mute` only for decoration. */
  muted: "#5c5c59",
  mute: "#8a8a87",
  rule: "#d9d8d3",
  input: "#cfcec8",
  positive: "#2f5d45",
  destructive: "#a1291c",
  onInk: "#faf9f7",
} as const;

export const fonts = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  display: "InterTight_700Bold",
  displaySemibold: "InterTight_600SemiBold",
  /** The Trichozette's magazine headlines. */
  didone: "BodoniModa_500Medium",
  didoneItalic: "BodoniModa_500Medium_Italic",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, pill: 999 } as const;

/** Screen side gutter. */
export const gutter = 20;

export const type = {
  /** Heavy, tight headline, like the poster. */
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 34, letterSpacing: -1.5, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 26, letterSpacing: -0.8, color: colors.ink },
  heading: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.ink2 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted },
  /** Widely tracked small capitals. */
  label: { fontFamily: fonts.sansMedium, fontSize: 11, lineHeight: 15, letterSpacing: 3.2, textTransform: "uppercase" as const, color: colors.muted },
} as const;
