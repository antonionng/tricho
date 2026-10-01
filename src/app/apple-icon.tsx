import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen and share icon: the T of Trichollective on ink, drawn as shapes to match icon.svg. */
export default function AppleIcon() {
  // Same geometry as icon.svg, scaled from its 512 grid.
  const k = 180 / 512;
  const bar = { position: "absolute", background: "#f4f3f0" } as const;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0b0b0b" }}>
        <div style={{ ...bar, left: 128 * k, top: 120 * k, width: 256 * k, height: 76 * k }} />
        <div style={{ ...bar, left: 218 * k, top: 120 * k, width: 76 * k, height: 272 * k }} />
      </div>
    ),
    size
  );
}
