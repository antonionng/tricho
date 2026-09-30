import { generateText, Output } from "ai";
import type { z } from "zod";
import { site } from "@/config/site";

export const AGENT_MODEL = process.env.TRICHO_AGENT_MODEL || "anthropic/claude-sonnet-5.5";

export const BANNED_WORDS = ["unlock", "elevate", "seamless", "empower", "journey", "delve"];

/** House rules every agent writes under. */
export const HOUSE_RULES = `You write for Trichollective, a closed, paid community for cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, founded and run by ${site.founderFull}. Everything you write is a draft that ${site.founder} reviews before it goes anywhere.

Facts you can rely on (never contradict them, and don't add others about the organisation's history):
- Trichollective began with in-person conferences at ${site.originPlace}. It did not begin in Dublin.
- Past conferences: ${site.pastGatherings.map((g) => `${g.title}, ${new Date(g.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}, ${g.venue}`).join("; ")}. Gatherings are not on a fixed schedule; never call them quarterly.
- The online platform launches at ${site.launch.title} on ${new Date(site.launch.startsAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" })} at ${site.launch.venue}. Tickets: ${site.launch.ticketUrl}
- The next gathering after that is in ${site.next.city} (${site.next.status.toLowerCase()}).

House style:
- British English spelling and usage.
- Warm, clear and plain. Write in complete sentences. Speak to professionals as peers.
- No emoji. No exclamation marks.
- Never use these words: ${BANNED_WORDS.join(", ")}.
- Never diagnose, and never make medical or treatment claims. When health is involved, point people to their GP, a dermatologist or a qualified trichologist.
- Never invent statistics, studies, figures or quotes, and never put words in a real person's mouth.
- Never name or identify community members unless the prompt explicitly gives you their name to use.
- Output plain text only. Separate paragraphs with a blank line. Use lines starting with "## " for subheadings. No Markdown bold, italics or links.`;

export function aiAvailable() {
  return !!process.env.AI_GATEWAY_API_KEY;
}

/** Light clean-up so the output follows the house rules even if the model slips. */
export function tidy(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/!/g, ".")
    .replace(/\.\.+/g, ".")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Free-text generation through the Vercel AI Gateway. Returns null when no
 * AI key is configured or the call fails, so every caller has a template fallback.
 */
export async function generate(system: string, prompt: string): Promise<string | null> {
  if (!aiAvailable()) return null;
  try {
    const { text } = await generateText({
      model: AGENT_MODEL,
      system: `${HOUSE_RULES}\n\n${system}`,
      prompt,
    });
    const cleaned = tidy(text);
    return cleaned || null;
  } catch (error) {
    console.error("[agents] generate failed, using the template instead", error);
    return null;
  }
}

/** Structured generation with a zod schema. Returns null without a key or on failure. */
export async function generateStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string
): Promise<T | null> {
  if (!aiAvailable()) return null;
  try {
    const { output } = await generateText({
      model: AGENT_MODEL,
      system: `${HOUSE_RULES}\n\n${system}`,
      prompt,
      output: Output.object({ schema }),
    });
    return (output as T) ?? null;
  } catch (error) {
    console.error("[agents] structured generate failed, using the fallback instead", error);
    return null;
  }
}
