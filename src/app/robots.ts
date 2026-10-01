import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Previews stay out of search engines, but link-preview bots may read them so shared links unfurl.
  if (process.env.VERCEL_ENV === "preview") {
    return {
      rules: [
        { userAgent: ["facebookexternalhit", "Facebot", "LinkedInBot", "Twitterbot", "WhatsApp", "Slackbot", "TelegramBot", "Discordbot", "Applebot"], allow: "/" },
        { userAgent: "*", disallow: "/" },
      ],
    };
  }
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
