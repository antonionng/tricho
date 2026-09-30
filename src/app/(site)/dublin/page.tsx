import { LaunchLanding } from "@/components/site/LaunchLanding";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";

export const metadata = pageMetadata({
  title: "Welcome to Trichollective Dublin",
  description:
    "You're at Trichollective Dublin. Add your free founding listing, become a founding member at the founding price, or open Trichozette.",
  path: "/dublin",
  og: { title: "Welcome to Trichollective Dublin,", sub: "where you can join the founding directory today.", eyebrow: "Monday 5 October", img: images.ed02.src, variant: "photo" },
});

const when = new Date(site.launch.startsAt).toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Dublin",
});

export default function DublinPage() {
  return (
    <LaunchLanding
      source="dublin"
      eyebrow={`${site.launch.title} · ${when}`}
      title="Welcome to Trichollective Dublin,"
      fade="where you can join the founding directory before the first talk."
      lede="From today you can bring cases to colleagues, refer across disciplines and be found by the public, all year round. Here is everything you need to join from your phone."
      details={
        <p className="label text-paper/60">
          {site.launch.venue} · 9.30am to 6pm
        </p>
      }
    />
  );
}
