/**
 * Adds Little Lady Locks as a charity we support: a free Premium page, published, with its
 * logo on the homepage. Safe to run again. It writes straight to the database, so nobody is
 * emailed. "Managed by" stays empty until Ashley's sign-in email is added in the Studio.
 *   npx tsx scripts/add-little-lady-locks.ts                       # local database
 *   ENV_FILE=.env npx tsx scripts/add-little-lady-locks.ts --live  # live database
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

const slug = "little-lady-locks";
const page = {
  name: "Little Lady Locks",
  tier: "premium",
  kind: "charity",
  // One of the standard categories, so the charity can edit its own page later.
  category: "Hair systems and wigs",
  blurb:
    "Little Lady Locks is a UK children's charity that gives free wigs, hair systems and headwear to children and young people up to 18 with hair loss.",
  tagline: "Little Lady Locks gives every child in the UK with hair loss a free, custom-made wig and the confidence that comes with it.",
  story: [
    "## Every child deserves to feel like themselves again.",
    "Ashley Higgins spent years as a hair loss specialist, and her adult clients kept telling her the same thing. Losing their hair as children had led to bullying, and there had been almost no help for them at the time.",
    "In 2018 she fitted hair systems for two girls, Harper and Ruba, aged five and fifteen. Seeing how much it changed their lives, she founded Little Lady Locks in Manchester so that no child would have to go without.",
    "Today the charity fits wigs and hair systems for children and young people up to the age of 18, free of charge, wherever they live in the UK.",
  ].join("\n\n"),
  highlights: [
    { value: "20", label: "children helped every month" },
    { value: "£500", label: "to make and fit one custom wig" },
    { value: "12", label: "ponytails to make a single wig" },
    { value: "£0", label: "cost to every family, every time" },
  ],
  offerings: [
    { title: "Custom human-hair wigs", body: "Full lace wigs are made from donated hair and matched to the child's own colour and texture." },
    { title: "Hair systems and toppers", body: "Partial wigs, toppers and integration pieces are fitted for children with patchy or thinning hair." },
    { title: "Hair systems for boys", body: "Short, natural hair systems give boys a cut that looks just like their friends'." },
    { title: "Headbands, hats and turbans", body: "Headbands with hair attached, beanies and soft turbans help children through chemotherapy and early hair loss." },
    { title: "Fitting and aftercare", body: "Every child gets a fitting, a care kit and a new piece and accessory every twelve months as they grow." },
  ],
  sections: [
    {
      eyebrow: "For your clinic or salon",
      title: "Become a Hair Fairy and turn your clinic into a donation point.",
      body: "Hair Fairies are hair professionals who collect hair for Little Lady Locks and tell their clients about the charity. It costs nothing, and it gives every client who has a long cut a way to change a child's life.",
      steps: [
        "Email the charity with your name, your role, your clinic or salon name and address, your logo and your social handles.",
        "Collect hair from clients who are cutting at least 7 inches, and human-hair extensions of 14 inches or more.",
        "Send your first donation and receive your Hair Fairy pack, with a certificate, a membership number and promotional material.",
        "Appear on the Hair Fairy locator, so families and donors near you can find your clinic.",
      ],
      ctaLabel: "See the Hair Fairy map",
      ctaUrl: "https://www.littleladylocks.com/pages/store-locator",
    },
    {
      eyebrow: "Donate hair",
      title: "Every donated ponytail becomes part of a child's wig.",
      body: "Post donations to Little Lady Locks, 107 Wickentree Lane, Failsworth, Manchester M35 9AY.",
      steps: [
        "Natural hair: cut at least 7 inches, make sure it is completely dry, and tie it into ponytails with hair bobbles.",
        "Include a hair donation form with your name and email, so the donor receives a certificate.",
        "Extensions: human hair only, new or used, at least 14 inches, brushed free of tangles and tied in a bundle.",
        "Synthetic, matted or very damaged hair can't be used.",
      ],
      ctaLabel: "Read the full donation guide",
      ctaUrl: "https://www.littleladylocks.com/pages/donate-hair",
    },
    {
      eyebrow: "Give",
      title: "Sponsor a piece of a child's confidence.",
      body: "Every amount pays for something specific, and every family receives it free of charge.",
      steps: [
        "£50 pays for a customised hat and headband.",
        "£150 pays for colouring and repairs for a wig.",
        "£300 pays for a topper hair system.",
        "£500 pays for a full custom lace wig.",
      ],
      ctaLabel: "Donate to Little Lady Locks",
      ctaUrl: "https://www.littleladylocks.com/products/please-donate",
    },
  ],
  ctaLabel: "Become a Hair Fairy",
  ctaUrl: "#section-1",
  logoUrl: "/partners/little-lady-locks/logo.png",
  coverUrl: "/partners/little-lady-locks/cover.webp",
  accentColor: "#D4007A",
  charityNumber: "1195950",
  website: "https://www.littleladylocks.com/",
  publicEmail: "info@littleladylocks.com",
  publicPhone: "0161 879 6809",
  isFounding: false,
  published: true,
  hidden: false,
};

const photos = [
  { url: "/partners/little-lady-locks/girls.webp", caption: "A new long wig, with a photo from before her fitting." },
  { url: "/partners/little-lady-locks/boys.webp", caption: "A natural hair system for a boy, with a photo from before." },
];

async function main() {
  const partner = await prisma.partner.upsert({
    where: { slug },
    // Never touches who manages the page, so re-running can't undo Ashley's access.
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
    kind: "other",
    category: page.category,
    website: page.website,
    phone: page.publicPhone,
    addressLine1: "107 Wickentree Lane",
    city: "Failsworth, Manchester",
    postcode: "M35 9AY",
    country: "United Kingdom",
    description: "Children's hair loss charity, registered charity 1195950. Supported free of charge with a Premium page.",
    socials: { instagram: "littleladylocks", facebook: "https://www.facebook.com/littleladylocksuk/" },
    tags: ["charity"],
    stage: "won" as const,
    source: "studio",
    interest: "premium",
  };
  await prisma.organisation.upsert({
    where: { partnerId: partner.id },
    update: org,
    create: { ...org, partnerId: partner.id },
  });

  console.log(`Little Lady Locks is ${partner.published ? "live" : "saved"} at /partners/${slug}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
