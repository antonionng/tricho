import { LaunchLanding } from "@/components/site/LaunchLanding";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";

export const metadata = pageMetadata({
  title: "Welcome to Trichollective Dublin",
  description:
    "You're at Trichollective Dublin, where the online collective begins. Add your free founding listing, become a founding member or open Trichozette.",
  path: "/dublin",
  og: { title: "Welcome to Trichollective Dublin,", sub: "where the online collective begins.", eyebrow: "Monday 5 October", img: images.ed02.src, variant: "photo" },
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
      fade="where the online collective begins."
      lede="Today we open Trichollective to everyone who cares for hair and scalp, all year round. Here is everything you need to join in from your phone, before the first talk has even started."
      details={
        <p className="label text-paper/60">
          {site.launch.venue} · 9.30am to 6pm
        </p>
      }
    />
  );
}
