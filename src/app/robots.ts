import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "Bingbot",
  "DuckAssistBot", "MistralAI-User", "CCBot",
];

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
  const disallow = ["/members", "/studio", "/api", "/login", "/welcome", "/directory/claim", "/certificates"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Named so it is clear we want to be read and cited by AI search and assistants. A named group replaces "*", so it repeats the private paths.
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt", "/llms-full.txt"], disallow },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
