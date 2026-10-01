/** Immersive reading: no site header or footer. The edition brings its own chrome. */
export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return <main id="main">{children}</main>;
}
