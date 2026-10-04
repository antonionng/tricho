import QRCode from "qrcode";
import { site } from "@/config/site";

/**
 * Print-quality QR codes for our own pages only: /qr?path=/ireland&src=ireland
 * Returns an SVG by default, which stays sharp at any print size. Add format=png
 * (and size, in pixels: default 1024, at most 4096) for slides and screens.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const path = q.get("path") || "/";
  if (!path.startsWith("/") || path.startsWith("//")) {
    return new Response("Only paths on this site are allowed", { status: 400 });
  }
  const src = (q.get("src") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  const target = new URL(path, site.url);
  if (src) target.searchParams.set("utm_source", src);
  const light = q.get("tone") === "light";

  if (q.get("format") === "png") {
    const requested = Number.parseInt(q.get("size") || "", 10);
    const width = Number.isFinite(requested) ? Math.min(4096, Math.max(64, requested)) : 1024;
    const png = await QRCode.toBuffer(target.toString(), {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      width,
      // PNGs go on slides, so they get a solid background that shows on any theme.
      color: light ? { dark: "#f4f3f0", light: "#0b0b0b" } : { dark: "#0b0b0b", light: "#ffffff" },
    });
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  }

  const svg = await QRCode.toString(target.toString(), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: light ? "#f4f3f0" : "#0b0b0b", light: "#00000000" },
  });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
