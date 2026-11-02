import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "what-trichoscopy-can-and-cannot-tell-you",
  title: "What trichoscopy can and cannot tell you about the scalp",
  description:
    "How trichoscopy works, what a scalp camera shows during a consultation, where its limits are, and how to use the images in case notes and referrals.",
  category: "scalp-health",
  audience: "both",
  tags: ["trichoscopy", "scalp camera", "consultation", "case notes", "dermoscopy"],
  author: "editorial",
  published: "2026-10-07",
  reviewer: null,
  image: "hairDetail",
  standfirst:
    "A scalp camera has become a standard part of many trichology and head spa consultations. Used well, it helps clients see what you see and gives you a record to compare over time. Used carelessly, it can look like a diagnosis when it is not.",
  answer:
    "Trichoscopy uses a magnifying camera or dermatoscope to look closely at hair shafts, follicle openings, blood vessels and the skin of the scalp. It helps a practitioner describe what they see, compare changes over time and decide when to refer. It cannot diagnose a condition on its own, and some findings need a doctor and sometimes a biopsy to confirm.",
  takeaways: [
    "Trichoscopy is a way of looking closely, not a test that gives an answer by itself.",
    "The most useful features are differences in hair thickness, follicle openings, broken hairs, scale and redness.",
    "Standard photographs taken in the same way each visit are what make trichoscopy useful for tracking progress.",
    "Missing follicle openings or redness around follicles are reasons to refer to a doctor.",
  ],
  body: `
## What is trichoscopy?

[Trichoscopy](/glossary/trichoscopy) is the close examination of the hair and scalp using magnification. In dermatology it is done with a dermatoscope, a handheld magnifier with its own light. In trichology and head spa practice it is often done with a digital scalp camera that shows the image on a screen, so the client can see it too.

Trichoscopy has become an important part of hair and scalp assessment because it shows detail that cannot be seen with the naked eye, without any discomfort for the client.

## What can you see with a scalp camera?

Magnified images show several features that help you describe what is happening on a client's scalp:

- **Hair shaft thickness.** A mix of thick and fine hairs in the same area can be a sign of miniaturisation, which is seen in pattern hair loss.
- **Follicle openings.** Healthy scalp shows regular openings, often with more than one hair growing from each. Areas without openings are an important finding.
- **Broken and short hairs.** Hairs that are broken off at different lengths can point to breakage from styling, or to conditions that need a doctor.
- **Scale and flaking.** The colour, size and spread of scale can help you describe dryness, build-up or inflammation.
- **Redness and blood vessels.** Redness, especially around follicles, can be a sign of inflammation.
- **Product and sebum.** Build-up from products and oil is easy to see and to show the client.

## What can trichoscopy not tell you?

Trichoscopy shows what the scalp looks like, not why. Two very different conditions can look similar under magnification, and many hair and scalp problems need a medical history, blood tests or a biopsy to diagnose.

That means a trichoscopy image should never be presented to a client as a diagnosis. It is better to describe what you see and what it might suggest, and to explain when that means a doctor should take a look.

Trichoscopy also cannot show what is happening inside the body. Hair shedding linked to illness, iron deficiency, thyroid problems or hormonal changes may look like healthy scalp under the camera even though the client is losing more hair than usual.

## Which findings mean a client should see a doctor?

Refer the client to their GP before treatment if trichoscopy shows:

- Areas with no visible follicle openings, especially if the skin looks smooth or shiny.
- Redness, scale or tiny bumps clustered around follicles at the edge of a patch of hair loss.
- Pustules, crusting or open areas.
- Broken hairs and scale in a child, which can be a sign of scalp ringworm.
- A pigmented spot or lesion that is new, irregular or changing.

You can find a fuller list in our post on [red flags in a hair and scalp consultation](/blog/red-flags-in-a-hair-and-scalp-consultation).

## How do you take trichoscopy images you can compare?

The value of trichoscopy grows when you can compare images from one visit to the next. To make images comparable:

- Choose the same areas each time, for example the centre parting at the crown, the front hairline and each temple.
- Use the same magnification and lighting settings.
- Measure from fixed landmarks so you return to the same spot.
- Make sure hair is in a similar state at each visit, for example clean and dry.
- Record the date and the area with each image.

Ask for the client's written consent before taking or keeping photographs, explain how they will be stored and who will see them, and keep them securely, because images linked to someone's health are sensitive personal data.

## How do you use trichoscopy in a referral?

When you refer a client, a short written note with one or two labelled images can help the GP or dermatologist understand what prompted the referral. Describe what you saw rather than naming a condition, and give the client a copy.

If a client is nervous about what a scalp camera involves, our guide to [a first trichology appointment](/guides/first-trichology-appointment) explains it in plain English.

Many trichologists say that sharing images this way builds trust with local doctors, which makes future referrals quicker for their clients.
`,
  faqs: [
    {
      q: "Is trichoscopy the same as dermoscopy?",
      a: "Trichoscopy is dermoscopy of the hair and scalp. The term is used when a dermatoscope or similar magnifying camera is used specifically to examine hair, follicles and scalp skin.",
    },
    {
      q: "Does trichoscopy hurt?",
      a: "No. The camera or dermatoscope rests gently on the scalp or hovers just above it. It does not break the skin.",
    },
    {
      q: "Can trichoscopy diagnose alopecia?",
      a: "Trichoscopy can show features that suggest certain types of hair loss, and dermatologists use it to support a diagnosis. On its own it is not a diagnosis, and a trichologist or therapist should describe findings and refer when needed.",
    },
    {
      q: "How often should trichoscopy images be repeated?",
      a: "It depends on the reason for monitoring. Hair grows slowly, so changes in density are usually compared over several months rather than weeks.",
    },
  ],
  sources: [
    { label: "DermNet: Trichoscopy", url: "https://dermnetnz.org/topics/trichoscopy" },
    { label: "DermNet: Female pattern hair loss", url: "https://dermnetnz.org/topics/female-pattern-hair-loss" },
    { label: "NHS: Ringworm", url: "https://www.nhs.uk/conditions/ringworm/" },
    { label: "NHS: Hair loss", url: "https://www.nhs.uk/conditions/hair-loss/" },
  ],
  related: {
    guides: ["first-trichology-appointment", "scalp-care-basics"],
    glossary: ["trichoscopy", "androgenetic-alopecia", "scarring-alopecia", "seborrhoeic-dermatitis"],
    discipline: "clinical",
  },
};
