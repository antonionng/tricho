import type { MetadataRoute } from "next";

/** Lets members add Trichollective to their home screen and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/members",
    name: "Trichollective",
    short_name: "Trichollective",
    description: "The community for hair and scalp professionals.",
    start_url: "/members",
    scope: "/",
    display: "standalone",
    background_color: "#f4f3f0",
    theme_color: "#f4f3f0",
    categories: ["business", "education", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
