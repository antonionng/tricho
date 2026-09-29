import { prisma } from "../src/lib/prisma";

async function main() {
  const hq = await prisma.user.upsert({
    where: { email: "hq@trichollective.com" },
    update: { name: "Trichollective HQ", role: "admin" },
    create: {
      email: "hq@trichollective.com",
      name: "Trichollective HQ",
      role: "admin",
    },
  });

  await prisma.trichologistProfile.upsert({
    where: { userId: hq.id },
    update: { profession: "clinical", listingStatus: "listed" },
    create: {
      userId: hq.id,
      profession: "clinical",
      listingStatus: "listed",
      specialization: "Network education",
      location: "London, UK",
      bio: "Trichollective HQ — education and community stewardship.",
    },
  });

  const education = [
    {
      title: "How this network refers",
      summary: "Stylist to trichologist to doctor — a shared map so clients are not bounced around.",
      audience: "everyone",
      kind: "guide",
      sortOrder: 1,
      body: `Clients move between cosmetic, clinical, and medical care. A clear handoff protects them and you.

1. Cosmetic scope: styling, tension, breakage from practices, everyday comfort. Refer on when shedding is diffuse and unexplained, patches appear, or there is pain, scarring, or systemic symptoms.
2. Clinical scope: structured history, scalp exam, differentials to consider, baseline bloods discussion, and written referral when needed.
3. Medical scope: investigation, treatment decisions, and urgent pathways.

Write the reason for referral in one paragraph. Include duration, pattern, treatments already tried, and what you are worried about. Avoid diagnosis language if you are not the diagnosing clinician.`,
    },
    {
      title: "How to write a listing clients can trust",
      summary: "Name, city, profession, and one honest line about who you see.",
      audience: "everyone",
      kind: "guide",
      sortOrder: 2,
      body: `A good listing is short and specific.

- Use the name clients will search for.
- State your profession clearly (cosmetic, clinical, or medical).
- One city is better than a vague region.
- Specialisation should describe who you see, not a sales claim.
- Skip star ratings and invented testimonials.

If you only want to be found, use the free listing form. Membership adds rooms, Learn, and Tricho-AI — it is a different product.`,
    },
    {
      title: "When shedding is a salon problem — and when it is a referral",
      summary: "A chair-side filter for stylists without diagnosing.",
      audience: "cosmetic",
      kind: "protocol",
      sortOrder: 10,
      body: `Start with history you can take safely: duration, recent illness or stress, new medications, pregnancy or postpartum, tight styles, chemical services, and how much hair they see in the brush.

Stay in salon scope when the story fits traction, breakage, or product build-up and the scalp looks calm.

Refer when you see sudden patches, scarring, pain, pustules, systemic symptoms, paediatric complexity, or when shedding is diffuse and unexplained for months. Say what you observed. Do not name a medical diagnosis.`,
    },
    {
      title: "Traction and styling — what to say without diagnosing",
      summary: "Language that protects the client relationship and the referral pathway.",
      audience: "cosmetic",
      kind: "guide",
      sortOrder: 11,
      body: `Describe what you see: thinning at the hairline, broken hairs, tension from styles. Offer lower-tension options. If the pattern worries you, refer to a trichologist or GP with a short note of duration and what you changed in the chair.`,
    },
    {
      title: "A first-consult structure",
      summary: "A practical order of questions and observations for trichology consults.",
      audience: "clinical",
      kind: "protocol",
      sortOrder: 20,
      body: `1. Presenting concern and timeline.
2. Pattern: diffuse, patterned, patchy, scarring or non-scarring.
3. Triggers: illness, meds, postpartum, nutrition, styling.
4. Scalp and hair exam notes.
5. Red flags to escalate.
6. Plan: education, investigations to discuss with GP, review timing, referral letter if needed.

Document uncertainty. Prefer “consistent with” language over certainty you do not have.`,
    },
    {
      title: "Ferritin and common bloods in plain language",
      summary: "How to talk about baseline bloods without overclaiming.",
      audience: "clinical",
      kind: "guide",
      sortOrder: 21,
      body: `Ferritin, full blood count, thyroid function, and vitamin D are common discussion points in unexplained shedding. They are not a diagnosis on their own.

Explain why you are suggesting bloods, what each might relate to in general terms, and that interpretation sits with the client’s GP or doctor. Reassess after treating identified deficiencies rather than promising regrowth on a timeline you cannot guarantee.`,
    },
    {
      title: "Red flags that leave the room",
      summary: "Symptoms that should not stay in a cosmetic or routine clinical pathway alone.",
      audience: "clinical",
      kind: "protocol",
      sortOrder: 22,
      body: `Escalate promptly for sudden patchy loss, scarring alopecia signs, severe pain or pustules, systemic illness, unexplained weight loss, or paediatric cases outside your competence. Write what you saw and why you are referring. Urgency belongs in the first sentence.`,
    },
    {
      title: "What a useful trichology letter contains",
      summary: "A letter template doctors can actually act on.",
      audience: "medical",
      kind: "referral",
      sortOrder: 30,
      body: `Include: presenting complaint and duration; exam findings; differentials considered; investigations already done; treatments tried; specific question for the recipient; urgency.

Avoid long narrative. One page is enough. Attach photos only with consent.`,
    },
    {
      title: "When the scalp is the presenting complaint",
      summary: "A short orientation for doctors receiving hair and scalp referrals.",
      audience: "medical",
      kind: "guide",
      sortOrder: 31,
      body: `Ask about timing, pattern, scarring, itch or pain, systemic symptoms, and medications. Separate cosmetic traction stories from inflammatory or scarring processes. Trichology input can help with structured history and patient education while medical investigation proceeds.`,
    },
    {
      title: "Client note: telogen timing",
      summary: "A white-label explanation members can adapt for clients.",
      audience: "everyone",
      kind: "talk-note",
      sortOrder: 40,
      body: `Hair often sheds weeks to months after a trigger such as illness, stress, surgery, or postpartum change. That delay is why the story can feel confusing.

This note is education, not a diagnosis. Your clinician will explain what applies to you, what to monitor, and whether bloods or referral are needed.`,
    },
    {
      title: "GP note: low ferritin discussion",
      summary: "A short companion note when ferritin is low and GP review is needed.",
      audience: "everyone",
      kind: "referral",
      sortOrder: 41,
      body: `Dear GP,

I am writing regarding unexplained hair shedding. Ferritin was reported low at [value]. I would be grateful for your review of iron status and any related investigations you consider appropriate.

Duration of shedding: [ ]. Pattern: [ ]. Other relevant history: [ ].

Thank you.`,
    },
  ];

  for (const piece of education) {
    const existing = await prisma.educationPiece.findFirst({
      where: { title: piece.title },
    });
    if (existing) {
      await prisma.educationPiece.update({
        where: { id: existing.id },
        data: piece,
      });
    } else {
      await prisma.educationPiece.create({ data: piece });
    }
  }

  const threads = [
    {
      space: "everyone",
      title: "Start here — introduce yourself",
      category: "discussion",
      pinned: true,
      content:
        "Welcome. Share who you are, where you practise, and whether you are cosmetic, clinical, or medical. One line is enough.",
    },
    {
      space: "cosmetic",
      title: "Start here — traction questions from the chair",
      category: "discussion",
      pinned: true,
      content:
        "What language are you using when a client’s hairline looks thinned from tension styles? How do you decide it is time to refer?",
    },
    {
      space: "clinical",
      title: "Start here — ferritin case",
      category: "discussion",
      pinned: true,
      content:
        "Diffuse shedding for four months after a febrile illness. Ferritin is 18. How are people framing the consult and the bloods follow-up?",
    },
    {
      space: "medical",
      title: "Start here — what makes a useful referral letter",
      category: "referral",
      pinned: true,
      content:
        "What do you actually need in a trichology letter to act quickly? Length, photos, bloods, urgency wording — what helps and what gets ignored?",
    },
  ];

  for (const thread of threads) {
    const existing = await prisma.communityPost.findFirst({
      where: { title: thread.title, authorId: hq.id },
    });
    if (!existing) {
      await prisma.communityPost.create({
        data: { ...thread, authorId: hq.id },
      });
    } else {
      await prisma.communityPost.update({
        where: { id: existing.id },
        data: { pinned: true, content: thread.content, space: thread.space },
      });
    }
  }

  const exchange = [
    {
      title: "Ferritin referral note",
      description:
        "A one-page note members can send with a client when ferritin is low and a GP review is needed.",
      type: "professional_service",
    },
    {
      title: "First-consult structure",
      description:
        "A printable order of questions and observations for trichology consults.",
      type: "professional_service",
    },
    {
      title: "Client education: telogen timing",
      description:
        "A short client-facing explanation of delayed shedding after a trigger.",
      type: "professional_service",
    },
  ];

  for (const item of exchange) {
    const existing = await prisma.exchangeItem.findFirst({
      where: { title: item.title },
    });
    if (!existing) {
      await prisma.exchangeItem.create({
        data: { ...item, businessId: hq.id },
      });
    }
  }

  console.log("Seed complete", {
    hq: hq.email,
    education: education.length,
    threads: threads.length,
    exchange: exchange.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
