/**
 * DEV-ONLY sample data. Refuses to run in production or against a non-local
 * database. Every sample listing is flagged isSample and never shows in production.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient, type Profession } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CHAPTERS, chapterForCountry } from "../src/content/chapters";
import { images, img } from "../src/content/images";

const url = process.env.DATABASE_URL ?? "";
const LIVE_REF = "fbemqtjxislieevgtrkm";
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const previewRef = process.env.SEED_PREVIEW_REF;
const isNamedPreview = !!previewRef && previewRef !== LIVE_REF && url.includes(previewRef);
if (url.includes(LIVE_REF) || (!isLocal && !isNamedPreview)) {
  console.error("Refusing to seed: only a local database or a named preview branch (SEED_PREVIEW_REF) may be seeded, never the live database.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, ""), ssl: isLocal ? false : { rejectUnauthorized: false } }),
});
const day = 24 * 60 * 60 * 1000;

const SAMPLE_LISTINGS: {
  name: string; profession: Profession; city: string; country?: string; specialization: string;
  headline?: string; bio?: string; services?: string[]; claimed?: boolean; verified?: boolean; photo?: keyof typeof images;
}[] = [
  { name: "Aoife Sample", profession: "cosmetic", city: "Dublin", specialization: "Japanese head spa", claimed: true, verified: true, photo: "portraitC",
    headline: "Japanese head spa and scalp care in Dublin 2",
    bio: "I trained in Japanese head spa and opened my studio to give people an hour of real rest with thoughtful scalp care.\n\nI work closely with trichologists in the collective and refer on whenever a client needs more than I offer.",
    services: ["Japanese head spa", "Scalp detox treatment", "Scalp care consultation"] },
  { name: "Niamh Sample", profession: "clinical", city: "Dublin", specialization: "Hair loss and scalp conditions", claimed: true, verified: true, photo: "portraitB",
    headline: "Consultant trichologist for shedding, thinning and scalp conditions",
    bio: "I help people understand what's happening with their hair and build a realistic plan, working alongside their GP when blood tests or treatment are needed.",
    services: ["Trichology consultation", "Trichoscopy", "Follow-up reviews"] },
  { name: "Dr Sample Okafor", profession: "medical", city: "Dublin", specialization: "Dermatology, hair and scalp", claimed: true, photo: "portraitA",
    headline: "Consultant dermatologist with a special interest in hair",
    services: ["Dermatology consultation", "Scalp biopsy", "Treatment plans"] },
  { name: "Ciara Sample", profession: "cosmetic", city: "Cork", specialization: "Scalp treatments and colour" },
  { name: "Sinéad Sample", profession: "clinical", city: "Cork", specialization: "Trichology" },
  { name: "Orla Sample", profession: "cosmetic", city: "Galway", specialization: "Head spa" },
  { name: "Grace Sample", profession: "cosmetic", city: "Belfast", specialization: "Curly and textured hair" },
  { name: "Hannah Sample", profession: "clinical", city: "London", country: "United Kingdom", specialization: "Female pattern hair loss" },
  { name: "Priya Sample", profession: "medical", city: "London", country: "United Kingdom", specialization: "Aesthetic medicine" },
  { name: "Maya Sample", profession: "cosmetic", city: "London", country: "United Kingdom", specialization: "Japanese head spa" },
  { name: "Leah Sample", profession: "clinical", city: "Manchester", country: "United Kingdom", specialization: "Scalp conditions" },
  { name: "Ruth Sample", profession: "cosmetic", city: "Manchester", country: "United Kingdom", specialization: "Salon scalp care" },
];

async function main() {
  // Chapters
  for (const c of CHAPTERS) {
    await prisma.chapter.upsert({
      where: { slug: c.slug },
      update: { city: c.city, country: c.country, blurb: c.blurb },
      create: { slug: c.slug, city: c.city, country: c.country, blurb: c.blurb },
    });
  }
  // Remove chapters from earlier (city-based) builds; members and posts are re-linked below.
  await prisma.chapter.deleteMany({ where: { slug: { notIn: CHAPTERS.map((c) => c.slug) } } });
  const dublin = await prisma.chapter.findUniqueOrThrow({ where: { slug: "ireland" } });
  const countryFor = (city: string) =>
    ({ Belfast: "Northern Ireland", London: "England", Manchester: "England" } as Record<string, string>)[city] ?? "Ireland";

  // Admin (Karley's Studio) and members. Sign in locally with the dev login using these emails.
  const periodEnd = new Date(Date.now() + 30 * day);
  const admin = await prisma.user.upsert({
    where: { email: "karley@example.test" },
    update: { role: "admin" },
    create: { email: "karley@example.test", name: "Karley (sample admin)", role: "admin", plan: "professional", stripeCurrentPeriodEnd: periodEnd, onboardedAt: new Date(), chapterId: dublin.id },
  });

  const users = [];
  for (const [i, l] of SAMPLE_LISTINGS.entries()) {
    const email = `${l.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`;
    const country = countryFor(l.city);
    const chapterInfo = chapterForCountry(country);
    const chapter = chapterInfo ? await prisma.chapter.findUnique({ where: { slug: chapterInfo.slug } }) : null;
    const user = l.claimed || i % 3 === 0
      ? await prisma.user.upsert({
          where: { email },
          update: { chapterId: chapter?.id },
          create: {
            email, name: l.name, role: l.claimed ? "trichologist" : "individual",
            plan: l.claimed ? "professional" : "community", isFounding: true,
            stripeCurrentPeriodEnd: periodEnd, onboardedAt: new Date(), chapterId: chapter?.id,
            profile: { create: { profession: l.profession, location: l.city } },
          },
        })
      : null;
    if (user) users.push(user);

    const slug = `${l.name} ${l.city}`.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await prisma.directoryListing.upsert({
      where: { slug },
      update: { country },
      create: {
        slug, name: l.name, email, profession: l.profession, city: l.city, country,
        specialization: l.specialization, headline: l.headline, bio: l.bio, services: l.services ?? [],
        photoUrl: l.photo ? img(images[l.photo], 800) : null,
        status: "listed", kind: l.claimed ? "member" : "listed", userId: l.claimed ? user?.id : null,
        isVerified: !!l.verified, isFounding: true, isSample: true,
        freeUntil: l.claimed ? null : new Date(Date.now() + (30 + i * 5) * day),
        reviewedAt: new Date(),
      },
    });
  }

  // A pending listing for the Studio review queue
  await prisma.directoryListing.upsert({
    where: { slug: "pending-sample-limerick" },
    update: {},
    create: { slug: "pending-sample-limerick", name: "Pending Sample", email: "pending@example.test", profession: "cosmetic", city: "Limerick", specialization: "Head spa", status: "pending", isSample: true },
  });

  // One test account per user type (sign in with the dev or preview login).
  const england = await prisma.chapter.findUnique({ where: { slug: "england" } });
  await prisma.user.upsert({
    where: { email: "business.sample@example.test" },
    update: { plan: "business", role: "business", stripeCurrentPeriodEnd: periodEnd },
    create: {
      email: "business.sample@example.test", name: "Business Sample (clinic)", role: "business", plan: "business",
      stripeCurrentPeriodEnd: periodEnd, onboardedAt: new Date(), chapterId: england?.id,
      profile: { create: { profession: "brand", location: "London" } },
    },
  });
  // Free account, listing inside its 90-day full-profile trial
  const freeUser = await prisma.user.upsert({
    where: { email: "free.sample@example.test" },
    update: {},
    create: { email: "free.sample@example.test", name: "Free Sample", onboardedAt: new Date(), chapterId: dublin.id, profile: { create: { profession: "cosmetic", location: "Dublin" } } },
  });
  await prisma.directoryListing.upsert({
    where: { slug: "free-sample-dublin" },
    update: { freeUntil: new Date(Date.now() + 60 * day), userId: freeUser.id },
    create: {
      slug: "free-sample-dublin", name: "Free Sample", email: "free.sample@example.test", profession: "cosmetic", city: "Dublin", country: "Ireland",
      specialization: "Head spa and scalp care", headline: "Head spa therapist in Dublin, in the first 90 days of a full profile", services: ["Head spa", "Scalp care"],
      status: "listed", kind: "listed", userId: freeUser.id, isSample: true, freeUntil: new Date(Date.now() + 60 * day), reviewedAt: new Date(),
    },
  });
  // Free account whose trial has ended: basic listing, one enquiry waiting
  const lapsedUser = await prisma.user.upsert({
    where: { email: "lapsed.sample@example.test" },
    update: {},
    create: { email: "lapsed.sample@example.test", name: "Lapsed Sample", onboardedAt: new Date(), chapterId: dublin.id, profile: { create: { profession: "clinical", location: "Cork" } } },
  });
  const lapsedListing = await prisma.directoryListing.upsert({
    where: { slug: "lapsed-sample-cork" },
    update: { freeUntil: new Date(Date.now() - 5 * day), userId: lapsedUser.id },
    create: {
      slug: "lapsed-sample-cork", name: "Lapsed Sample", email: "lapsed.sample@example.test", profession: "clinical", city: "Cork", country: "Ireland",
      specialization: "Trichology", status: "listed", kind: "listed", userId: lapsedUser.id, isSample: true, freeUntil: new Date(Date.now() - 5 * day), reviewedAt: new Date(),
    },
  });
  if ((await prisma.enquiry.count({ where: { listingId: lapsedListing.id } })) === 0) {
    await prisma.enquiry.create({
      data: { listingId: lapsedListing.id, name: "Sample Enquirer", email: "enquirer@example.test", message: "Sample enquiry: I'd like to book a consultation about shedding.", status: "new" },
    });
  }

  // Community posts
  if ((await prisma.communityPost.count()) === 0 && users.length) {
    const posts = [
      { space: "introductions", title: "Hello from Dublin", content: "I run a small head spa studio in Dublin 2 and I've been coming to the gatherings for two years. Looking forward to keeping the conversation going between them." },
      { space: "hair-loss", title: "Explaining telogen timelines", content: "How do you explain the two to three month delay after a trigger to clients who are worried? I've been drawing a simple timeline for them and it seems to help." },
      { space: "head-spa", title: "Water temperature during treatment", content: "What temperature range do you keep the water at during the rinse stage? I'm reviewing our protocol and would love to compare notes." },
      { space: "devices", title: "LED devices: what's the evidence?", content: "A supplier has offered us an LED cap on trial. Before we say yes, what have people read about the evidence, and how are you describing it to clients without overclaiming?" },
      { space: "business", title: "Pricing a 90-minute head spa", content: "We're adding a 90-minute option. How do you price longer treatments compared with your 60-minute menu?" },
      { space: "case-room", title: "Diffuse shedding after illness, normal bloods", content: "Anonymised: client in her 30s, diffuse shedding starting roughly three months after a viral illness. GP bloods normal. Scalp calm. How would you structure follow-up?" },
      { space: "wins", title: "First referral through the network", content: "Referred a client to a dermatologist in the collective last month and heard back yesterday. The client was so grateful. This is exactly why I joined." },
    ];
    for (const [i, p] of posts.entries()) {
      await prisma.communityPost.create({
        data: { ...p, category: "discussion", authorId: users[i % users.length].id, chapterId: i === 0 ? dublin.id : null, createdAt: new Date(Date.now() - (i + 1) * 5 * 3600 * 1000) },
      });
    }
  }

  // Events
  const events = [
    { slug: "trichollective-dublin", title: "Trichollective Dublin", kind: "gathering" as const, summary: "A day connecting cosmetic, clinical and medical professionals to better serve clients, and the launch of Trichollective Online and the founding directory.", startsAt: new Date("2026-10-05T09:30:00+01:00"), endsAt: new Date("2026-10-05T18:00:00+01:00"), city: "Dublin", venue: "Killashee Hotel, Kilcullen Road, Naas", ticketUrl: "https://www.eventbrite.co.uk/e/trichollective-dublin-tickets-1992021489900", chapterId: dublin.id },
    { slug: "masterclass-scalp-consultation", title: "Masterclass: the five-minute scalp check", kind: "masterclass" as const, summary: "A live, practical session for stylists and head spa therapists, with time for questions.", startsAt: new Date(Date.now() + 21 * day), online: true, priceGBP: 20, memberPriceGBP: 0 },
  ];
  for (const e of events) {
    await prisma.event.upsert({ where: { slug: e.slug }, update: { chapterId: e.chapterId ?? null }, create: { ...e, published: true } });
  }

  console.log(`Seeded. Sign in locally with the dev login as ${admin.email} (admin) or any *@example.test member.`);
}

main().finally(() => prisma.$disconnect());
