import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trichollective",
    short_name: "Trichollective",
    description: "The community for hair and scalp professionals.",
    start_url: "/members",
    display: "standalone",
    background_color: "#f4f3f0",
    theme_color: "#f4f3f0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
