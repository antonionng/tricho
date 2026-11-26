import type { EmailContent } from "../layout";
import { firstNameOf } from "./members";
import { ADVENT_DAYS, type AdventDoor } from "@/content/advent";
import { doorDateLabel, isClaimable } from "@/lib/advent";

/**
 * The 12 Days of Christmas emails: the daily "today's door" email, sent each
 * morning from 12 to 23 December by scripts/send-advent-daily.ts, and the
 * confirmation a person gets when they claim a gift.
 */

type Email = { subject: string; content: EmailContent };

function doorUrl(siteUrl: string, door: AdventDoor, source: string) {
  return `${siteUrl}/christmas?door=${door.day}&utm_source=${source}&utm_campaign=12-days`;
}

/** Sent the moment someone claims a gift, so the code is in their inbox when they need it. */
export function adventClaimEmail(p: { name: string | null; door: AdventDoor }): Email {
  const d = p.door;
  const brand = d.brand?.name ?? "Trichollective";
  return {
    subject: `Your gift from ${brand}: ${d.headline}`,
    content: {
      preheader: d.code ? `Your code is ${d.code}, and here is how to use it.` : "Here is how to use your gift.",
      eyebrow: `12 Days of Christmas, day ${d.day}`,
      heading: d.title,
      body: [`Hello ${firstNameOf(p.name)},`, `You claimed today's gift from ${brand}, so here it is to keep.`, d.body].join("\n\n"),
      code: d.code,
      facts: [
        ...(d.redeem ? ([["How to use it", d.redeem]] as [string, string][]) : []),
        ...(d.terms ? ([["Terms", d.terms]] as [string, string][]) : []),
      ],
      factsHeading: "Your gift",
      cta: { label: d.cta.label, href: d.cta.href.startsWith("/") ? `/christmas/go/${d.day}` : d.cta.href },
      secondary: { label: "See every door that is open", href: "/christmas" },
      reason: "You receive this because you claimed a gift in the Trichollective 12 Days of Christmas.",
    },
  };
}

/** The morning email for one door. The code is never in the email: it is claimed on the site. */
export function adventDailyEmail(p: { name: string | null; door: AdventDoor; siteUrl: string }): Email {
  const d = p.door;
  const brand = d.brand?.name;
  const claimable = isClaimable(d);
  const subject = claimable
    ? `Day ${d.day}: ${d.headline} from ${brand}`
    : d.kind === "charity"
      ? `Day ${d.day}: ${d.title}`
      : `Day ${d.day} of ${ADVENT_DAYS}: ${d.title}`;
  const left = ADVENT_DAYS - d.day;
  return {
    subject,
    content: {
      preheader: claimable ? `Open today's door to claim your code from ${brand}.` : "Today's door is open, and it only takes a minute.",
      eyebrow: `12 Days of Christmas · ${doorDateLabel(d.day, "long")}`,
      image: "headSpa",
      heading: d.title,
      body: [
        `Hello ${firstNameOf(p.name)},`,
        d.body,
        claimable
          ? "Open today's door on Trichollective and press Claim to see your code. It is free for everyone with a Trichollective account, and we will email you a copy to keep."
          : null,
        left > 0
          ? `There ${left === 1 ? "is one more door" : `are ${left} more doors`} to open before Christmas, and a new one opens every morning.`
          : "This was the last door, and every one of the twelve stays open until the new year. Have a lovely Christmas.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      facts: d.terms ? [["Terms", d.terms]] : undefined,
      cta: { label: claimable ? "Open today's door and claim" : "Open today's door", href: doorUrl(p.siteUrl, d, "email") },
      cobrand: brand && d.brand?.logoUrl && d.kind === "brand" ? { name: brand, logoUrl: d.brand.logoUrl.startsWith("/") ? `${p.siteUrl}${d.brand.logoUrl}` : d.brand.logoUrl, url: d.brand.website } : undefined,
      reason:
        "You receive this because you have a Trichollective account or asked for our emails. The 12 Days of Christmas is one email a day until 23 December.",
    },
  };
}

/** Sent once before the first door, to say what is coming. */
export function adventLaunchEmail(p: { name: string | null; siteUrl: string }): Email {
  return {
    subject: "12 Days of Christmas starts on Saturday 12 December",
    content: {
      preheader: "A gift a day for hair and scalp professionals, from brands we trust.",
      eyebrow: "12 Days of Christmas",
      image: "headSpa",
      heading: "Twelve days of gifts for the people who look after hair and scalps start on 12 December.",
      body: [
        `Hello ${firstNameOf(p.name)},`,
        "From Saturday 12 to Wednesday 23 December we are opening one door a day on Trichollective. Behind each one is an offer from a brand we trust, something to learn or a little help for the year ahead.",
        "## How it works",
        [
          "- A new door opens every morning, and we will email you when it does.",
          "- Open the door on Trichollective and press Claim to see your code.",
          "- Codes are free for everyone with a Trichollective account, including free accounts.",
        ].join("\n"),
        "Thank you for everything you have done for your clients this year.",
      ].join("\n\n"),
      cta: { label: "See the calendar", href: `${p.siteUrl}/christmas?utm_source=email&utm_campaign=12-days` },
      reason: "You receive this because you have a Trichollective account or asked for our emails.",
    },
  };
}
