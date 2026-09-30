import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen and share icon: the T of Trichollective on ink. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#f4f3f0",
          fontSize: 120,
          fontWeight: 800,
          letterSpacing: -6,
          fontFamily: "sans-serif",
        }}
      >
        T
      </div>
    ),
    size
  );
}
