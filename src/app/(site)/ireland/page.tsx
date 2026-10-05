import { LaunchLanding } from "@/components/site/LaunchLanding";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";
import { foundingMemberPlacesLeft } from "@/lib/founding";
import QRCode from "qrcode";

/** The QR shown beside the hero when the page is on a projector. */
const QR_TARGET = "https://www.trichollective.net/ireland?utm_source=ireland";

export const metadata = pageMetadata({
  title: "Welcome to Trichollective Ireland",
  description:
    "You're at Trichollective Ireland. Become a founding member and keep the founding price for as long as you stay, or add your free directory listing.",
  path: "/ireland",
  og: { title: "Welcome to Trichollective Ireland,", sub: "where you can join as a founding member today.", eyebrow: "Monday 5 October", img: images.ed02.src, variant: "photo" },
});

// The founding places left are counted fresh for every visit.
export const dynamic = "force-dynamic";

const when = new Date(site.launch.startsAt).toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Dublin",
});

export default async function IrelandPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  // If the count can't be read, the page still works and simply says places are limited.
  const placesLeft = await foundingMemberPlacesLeft().catch(() => undefined);
  const qrSvg = await QRCode.toString(QR_TARGET, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b0b0b", light: "#00000000" } }).catch(() => null);
  return (
    <LaunchLanding
      source="ireland"
      eyebrow={`${site.launch.title} · ${when}`}
      title="Welcome to Trichollective Ireland,"
      fade="where you can join as a founding member today."
      lede="Founding members join the community, the Case Room and the directory, and keep the founding price for as long as they stay."
      placesLeft={placesLeft}
      cancelled={cancelled === "1"}
      qr={qrSvg ? { svg: qrSvg, shortUrl: "trichollective.net/ireland" } : undefined}
      details={
        <p className="label text-paper/60">
          {site.launch.venue} · 9.30am to 6pm
        </p>
      }
    />
  );
}
