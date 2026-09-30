import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/members", "/studio", "/api", "/login", "/welcome", "/directory/claim", "/certificates"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
