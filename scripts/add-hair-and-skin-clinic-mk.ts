/**
 * Adds The Hair & Skin Clinic MK as a gifted Premium page: every Premium feature, free of charge,
 * with no partner or sponsor wording, found through its own page and directory search only.
 * Safe to run again. It writes straight to the database, so nobody is emailed, and "Managed by"
 * stays empty until the clinic's sign-in email is added in the Studio.
 *   npx tsx scripts/add-hair-and-skin-clinic-mk.ts                       # local database
 *   ENV_FILE=.env npx tsx scripts/add-hair-and-skin-clinic-mk.ts --live  # live database
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = (process.env.DATABASE_URL ?? "").replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && !process.argv.includes("--live")) {
  console.error("This points at a live database. Add --live if that's intended.");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } }) });

const slug = "the-hair-and-skin-clinic-mk";
const dir = `/partners/${slug}`;
const site = "https://www.thehairandskinclinicmk.org";

const page = {
  name: "The Hair & Skin Clinic MK",
  tier: "premium",
  kind: "gifted",
  category: "Clinic services",
  blurb:
    "The Hair & Skin Clinic MK brings hair loss, trichology, skin, aesthetics and wellbeing specialists together in one clinic near Milton Keynes.",
  tagline:
    "A team of hair, skin and wellbeing specialists near Milton Keynes who treat the whole person, not just the condition.",
  story: [
    "## Care for the person, not just the condition.",
    "The Hair & Skin Clinic MK was founded during the pandemic by Mark and Tina Periclis, who saw how little support there was for people whose hair loss or skin condition was affecting their quality of life.",
    "Their own experiences of hair loss through grief, alopecia, chemotherapy and skin conditions shaped a clinic where hair, skin, nutrition and wellbeing specialists work together under one roof.",
    "The clinic sits in converted barns in the Buckinghamshire countryside at Sherington, and has a particular focus on supporting people through and after cancer treatment.",
  ].join("\n\n"),
  highlights: [
    { value: "10", label: "specialists working together" },
    { value: "40+", label: "years in hair, for founder Mark Periclis" },
    { value: "10+", label: "years in trichology" },
    { value: "240", label: "men at the clinic's prostate screening day" },
  ],
  offerings: [
    { title: "Hair loss clinic", body: "Finding the underlying cause of hair loss and building a treatment plan around each client." },
    { title: "Hair loss after cancer", body: "Support for clients whose hair has been affected by chemotherapy and other cancer treatment." },
    { title: "Trichology", body: "Hair and scalp assessments and holistic treatment plans with the clinic's trichologist." },
    { title: "Wigs and hair replacement", body: "Wig fitting and hair replacement systems, fitted and styled in clinic." },
    { title: "Scalp micropigmentation", body: "Scalp micropigmentation alongside semi-permanent brows, lips and eyeliner." },
    { title: "Skin clinic", body: "Treatment for acne, eczema, psoriasis, rosacea and skin affected by chemotherapy or radiotherapy." },
    { title: "Aesthetics", body: "Aesthetic treatments delivered by a qualified NHS nurse prescriber." },
    { title: "Nutrition and blood tests", body: "Functional medicine with a pharmacist, and private blood tests for vitamin deficiencies." },
    { title: "Barbering", body: "A full barber room, with appointments booked through the clinic's app." },
  ],
  sections: [
    {
      eyebrow: "Meet the team",
      title: "Specialists in hair, skin and wellbeing, all under one roof.",
      body: "Every client can be referred across the team, so hair, skin, nutrition and emotional wellbeing are looked at together.",
      steps: [
        "Mark Periclis and Tina Periclis, Managing Directors. Mark has more than 40 years in hair, and Tina more than 18 in NHS and private healthcare.",
        "Karley Weir, Trichologist and Wig Fitter, with more than 22 years in the hair industry.",
        "Nickie, Aesthetics Specialist and NHS Nurse Prescriber.",
        "Charlotte Lucas, Functional Medicine, a pharmacist with an MSc in Nutritional Medicine.",
        "Denise Lander, Scalp Micropigmentation, and Jade Clark, Skin Therapist.",
        "Florence King, Advanced Haematology Nurse Practitioner, and Penny Mitchell, Cancer Wellness Mentor.",
      ],
      ctaLabel: "Meet the whole team",
      ctaUrl: `${site}/meet-the-team`,
    },
    {
      eyebrow: "In the community",
      title: "A clinic that shows up for Milton Keynes.",
      steps: [
        "A free prostate screening day at the clinic, attended by 240 men.",
        "Free haircuts for people experiencing homelessness, with Unity MK.",
        "An open day for the MK Stoma Support Group.",
      ],
    },
    {
      eyebrow: "Getting started",
      title: "Start with a free consultation.",
      body: "Get in touch to arrange a free initial consultation, and the team will point you to the right specialist.",
      ctaLabel: "Contact the clinic",
      ctaUrl: `${site}/contact`,
    },
  ],
  ctaLabel: "Book a free consultation",
  ctaUrl: `${site}/contact`,
  logoUrl: `${dir}/logo.png`,
  coverUrl: `${dir}/cover.webp`,
  accentColor: "#097747",
  charityNumber: null,
  website: `${site}/`,
  publicEmail: "contact@thehairandskinclinicmk.org",
  publicPhone: "07775 656665",
  isFounding: false,
  published: true,
  hidden: false,
};

const photos = [
  { url: `${dir}/treatment.webp`, caption: "The treatment room." },
  { url: `${dir}/salon.webp`, caption: "The hair and scalp treatment room." },
  { url: `${dir}/shelves.webp`, caption: "Reception and the clinic's product range." },
  { url: `${dir}/barber.webp`, caption: "The barber room." },
  { url: `${dir}/monogram.webp`, caption: "The Hair & Skin Clinic MK." },
];

async function main() {
  const partner = await prisma.partner.upsert({
    where: { slug },
    // Never touches who manages the page, so re-running can't undo the clinic's access.
    update: page,
    create: { ...page, slug, ownerEmail: null, contactEmail: null },
  });

  // Committed images (no uploaded file behind them), replaced each run so the order stays as above.
  await prisma.profilePhoto.deleteMany({ where: { partnerId: partner.id, fileId: null } });
  await prisma.profilePhoto.createMany({
    data: photos.map((p, i) => ({ ...p, partnerId: partner.id, sortOrder: i })),
  });

  const org = {
    name: page.name,
    kind: "clinic",
    category: page.category,
    website: page.website,
    phone: page.publicPhone,
    email: page.publicEmail,
    addressLine1: "1 Mercer's Manor Barns",
    city: "Sherington, Newport Pagnell",
    postcode: "MK16 9PU",
    country: "United Kingdom",
    description: "Hair, skin and wellbeing clinic near Milton Keynes. Given a free Premium page.",
    socials: { instagram: "thehairandskinclinicmk", facebook: "https://www.facebook.com/thehairandskinclinicmk" },
    tags: ["gifted-premium"],
    stage: "won" as const,
    source: "studio",
    interest: "premium",
  };
  await prisma.organisation.upsert({
    where: { partnerId: partner.id },
    update: org,
    create: { ...org, partnerId: partner.id },
  });

  console.log(`${page.name} is ${partner.published ? "live" : "saved"} at /partners/${slug}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
