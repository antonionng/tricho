import QRCode from "qrcode";
import { site } from "@/config/site";

/**
 * Print-quality QR codes for our own pages only: /qr?path=/dublin&src=dublin
 * Returns an SVG, which stays sharp at any print size.
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

  const svg = await QRCode.toString(target.toString(), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: q.get("tone") === "light" ? "#f4f3f0" : "#0b0b0b", light: "#00000000" },
  });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
