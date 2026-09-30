import { LaunchLanding } from "@/components/site/LaunchLanding";
import { pageMetadata } from "@/lib/seo";
import { images } from "@/content/images";

export const metadata = pageMetadata({
  title: "Early access and your free directory listing",
  description:
    "Thanks for commenting TRICHO. Claim your early access to Trichollective and add your free founding directory listing today.",
  path: "/tricho",
  og: { title: "Thank you for commenting TRICHO,", sub: "your early access is ready.", eyebrow: "Trichollective Online", img: images.heroPortrait.src, variant: "photo" },
});

export default function TrichoPage() {
  return (
    <LaunchLanding
      source="instagram"
      eyebrow="Trichollective Online"
      title="Thank you for commenting TRICHO,"
      fade="your early access is ready."
      lede="As promised, here is early access to Trichollective and your free place in the founding directory, for cosmetic, clinical and medical hair and scalp professionals."
      image={images.heroPortrait}
    />
  );
}
