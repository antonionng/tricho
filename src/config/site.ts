export const site = {
  name: "Trichollective",
  wordmarkSub: "Online",
  tagline: "A stronger hair industry, together",
  description:
    "Trichollective is the membership community for cosmetic, clinical and medical hair and scalp professionals: a year-round community, courses, a public directory and gatherings across Ireland and the UK.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  /** Founder and organiser of the Trichollective conferences. */
  founder: "Karley",
  founderFull: "Karley Weir",
  founderBio:
    "Karley Weir is a trichologist with more than twenty years in the hair industry, ten of them in trichology. She founded Trichollective to bring cosmetic, clinical and medical professionals into the same room, and organises every conference herself.",
  founderPractice: { name: "K Trichology", url: "https://ktrichology.co.uk" },
  /** Where the gatherings began. */
  origin: "Whittlebury Hall",
  originPlace: "Whittlebury Hall in England",
  /** The gathering where the online platform launches. */
  launch: {
    title: "Trichollective Dublin",
    city: "Dublin",
    venue: "Killashee Hotel, Kilcullen Road, Naas",
    startsAt: "2026-10-05T09:30:00+01:00",
    endsAt: "2026-10-05T18:00:00+01:00",
    ticketUrl: "https://www.eventbrite.co.uk/e/trichollective-dublin-tickets-1992021489900",
  },
  /** Real past conferences, newest first. */
  pastGatherings: [
    {
      title: "Trichollective Conference",
      date: "2026-06-15",
      venue: "Whittlebury Park Hotel & Spa, Northamptonshire",
      topics: [
        "Hair biology",
        "Patient perspectives",
        "Non-surgical hair restoration",
        "Building a UK trichology database for clinical decision-making and research",
      ],
      speakers: [
        { name: "Charlotte Knibbs RIT", role: "Consultant Trichologist, Verve Hair Loss Specialists", topic: "Visible difference, patient-centred care and epidermolysis bullosa" },
      ],
      review: { label: "Read the Institute of Trichologists' review", url: "https://instituteoftrichologists.co.uk/trichollective-conference-review/" },
    },
    {
      title: "Trichology and Hair Professional Collective Conference",
      date: "2026-01-19",
      venue: "Whittlebury Hall, Northamptonshire",
      topics: [],
      speakers: [],
      review: null,
    },
  ] as {
    title: string;
    date: string;
    venue: string;
    topics: string[];
    speakers: { name: string; role: string; topic: string }[];
    review: { label: string; url: string } | null;
  }[],
  /** The next gathering after the launch. */
  next: { city: "Los Angeles", status: "Date to be confirmed" },
  /** Founding offer shown on /founding and the pricing page. */
  founding: {
    places: 200,
    closes: "the end of the founding period",
  },
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@trichollective.com",
  social: [] as { label: string; href: string }[],
};

export type NavItem = { label: string; href: string; description?: string };

export const primaryNav: {
  label: string;
  href: string;
  menu?: { intro: string; image?: string; items: NavItem[] };
}[] = [
  {
    label: "Community",
    href: "/community",
    menu: {
      intro: "Where practitioners from every corner of hair and scalp care meet between gatherings.",
      items: [
        { label: "How the community works", href: "/community", description: "Spaces, chapters, live sessions and the Case Room." },
        { label: "Local chapters", href: "/chapters", description: "Meet the members who practise near you." },
        { label: "Referral network", href: "/community#referrals", description: "Pass a client to the right discipline with confidence." },
        { label: "Founding membership", href: "/founding", description: "The price you join at is the price you keep." },
      ],
    },
  },
  {
    label: "Learn",
    href: "/learn",
    menu: {
      intro: "Practical education written by the people doing the work.",
      items: [
        { label: "Courses", href: "/learn", description: "Short courses with a certificate at the end." },
        { label: "Guides", href: "/guides", description: "Plain-English guides to hair and scalp care." },
        { label: "Glossary", href: "/glossary", description: "The terms clients and colleagues use, explained." },
        { label: "Certification", href: "/certification", description: "What our certificates mean and how to check one." },
      ],
    },
  },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  {
    label: "Trichozette",
    href: "/trichozette",
    menu: {
      intro: "The Trichollective magazine: interactive editions, real news and Karley's column.",
      items: [
        { label: "All editions", href: "/trichozette", description: "Interactive editions with quizzes and checklists." },
        { label: "Latest news", href: "/news", description: "Regulation, treatments and research, with sources." },
        { label: "Journal", href: "/journal", description: "Public guides from Trichozette." },
        { label: "Podcast", href: "/podcast", description: "Conversations from the community." },
      ],
    },
  },
  {
    label: "For business",
    href: "/for-business",
    menu: {
      intro: "Reach a trusted, specialist audience of hair and scalp professionals.",
      items: [
        { label: "Business membership", href: "/for-business", description: "A business page, team seats and job posts." },
        { label: "Partner with us", href: "/partners", description: "Sponsor an issue, an episode or a gathering." },
        { label: "Post a job", href: "/jobs", description: "Hire from the people who already care about scalp health." },
      ],
    },
  },
  { label: "Pricing", href: "/pricing" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Platform",
    items: [
      { label: "Community", href: "/community" },
      { label: "Events", href: "/events" },
      { label: "Trichozette", href: "/trichozette" },
      { label: "News", href: "/news" },
      { label: "Journal", href: "/journal" },
      { label: "Podcast", href: "/podcast" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "For professionals",
    items: [
      { label: "Founding membership", href: "/founding" },
      { label: "Courses", href: "/learn" },
      { label: "Certification", href: "/certification" },
      { label: "Get listed", href: "/directory/list" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "For business",
    items: [
      { label: "Business membership", href: "/for-business" },
      { label: "Partner with us", href: "/partners" },
      { label: "Jobs", href: "/jobs" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Find a professional", href: "/find" },
      { label: "Guides", href: "/guides" },
      { label: "Glossary", href: "/glossary" },
      { label: "About Trichollective", href: "/about" },
    ],
  },
];
