import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "adding-head-spa-to-your-salon",
  title: "Adding head spa to your salon: what to check first",
  description:
    "Training, insurance, licensing, consultation forms and contraindications to check before you add head spa treatments to a salon or clinic in the UK or Ireland.",
  category: "head-spa",
  audience: "professional",
  tags: ["head spa", "salon business", "insurance", "consultation", "contraindications", "training"],
  author: "editorial",
  published: "2026-10-05",
  reviewer: null,
  image: "headSpa",
  standfirst:
    "Head spa has become one of the most requested new services in salons across Ireland and the UK. Done well, it brings in new clients and longer appointments. This checklist covers what to put in place before your first booking.",
  answer:
    "Before adding head spa to a salon, check that you and your team have proper training, that your insurance covers scalp treatments and massage, and whether your local council needs a licence. Put a written consultation and contraindication form in place, set clear hygiene routines, and decide how you will refer clients whose scalp needs a medical opinion.",
  takeaways: [
    "Training should cover consultation, contraindications and hygiene, not only massage technique.",
    "Ask your insurer in writing whether head spa, scalp massage and any devices are covered.",
    "Some councils license massage and special treatments, so check before you advertise.",
    "Describe head spa honestly as relaxation and scalp care, never as a treatment for hair loss.",
  ],
  body: `
## Why are salons adding head spa?

Clients increasingly want time for themselves as well as a great finish, and head spa sits between the two. A head spa session is longer than a standard wash, focuses on the scalp and is designed to be relaxing in its own right. For salons it can fill quieter times in the diary, attract clients who would not book a cut and colour, and give experienced team members a new skill.

Because the name is used loosely, head spa can mean anything from an extended wash at the basin to a 90-minute treatment in a dedicated room. Deciding what your version includes is the first step.

## What training does your team need?

Massage technique is only part of a safe head spa. Look for training that also covers:

- How to run a consultation and take a basic health history.
- Contraindications, and when to postpone or adapt a treatment.
- Recognising scalp changes that should be seen by a doctor.
- Hygiene, including cleaning of tools, basins, towels and any devices.
- Using any scalp camera, steamer or water system you plan to buy.
- How to talk about results honestly.

Keep records of who has completed which training. Your insurer may ask for them.

## Does your insurance cover head spa?

Many salon insurance policies cover hairdressing services but not massage or scalp treatments. Before you take a booking, ask your insurer in writing whether your policy covers head spa, scalp and neck massage, and any equipment or products you plan to use. Check that every team member who will deliver the service is named or covered, and that their training meets the insurer's requirements.

## Do you need a licence for head spa?

Licensing rules depend on where you work. In parts of the UK, including many London boroughs, councils license massage and some other special treatments, and head spa may fall under that. Rules differ between councils and between the UK and Ireland, so contact your local council or authority, describe exactly what your treatment includes and keep a record of their answer.

## What should go on a head spa consultation form?

A written consultation form helps you spot anyone who should not have the treatment yet, and gives you a record if anything goes wrong. Ask about:

- Recent or current scalp conditions, and any treatment the client is using.
- Allergies and sensitivities, including to fragrances and essential oils.
- Recent surgery, injury or procedures on the head, neck or face, including hair transplants and cosmetic injections.
- Medical conditions that affect circulation, blood pressure, the skin or the nervous system, and any medicines that thin the blood.
- Pregnancy, and any advice the client has been given by their midwife or doctor.
- What the client hopes to get from the session.

Ask the client to sign and date the form, and review it at each visit.

## Which clients should postpone a head spa?

As a general guide, postpone the treatment and suggest the client speaks to their GP or the professional treating them if they have:

- Broken skin, open sores, pustules or signs of infection on the scalp.
- Sudden or patchy hair loss that has not been checked by a doctor.
- Scaly patches with broken hairs, especially in children, which can be a sign of scalp ringworm.
- A recent hair transplant, surgery or injury in the area.
- A fever or feel unwell.

Our post on [red flags in a hair and scalp consultation](/blog/red-flags-in-a-hair-and-scalp-consultation) has a fuller list you can share with your team.

## How should you describe head spa to clients?

Head spa is a relaxation and scalp-care treatment. It can leave the scalp feeling clean and comfortable and the client feeling rested. It is not a medical treatment, and it should not be advertised as curing hair loss, dandruff, psoriasis or any other condition, or as a way to detox the scalp.

Honest descriptions protect you from complaints and build trust with clients who will come back because the experience matched what you promised. If a client asks about hair loss, a good answer is to explain what head spa can do and to suggest they see a trichologist or their GP for the hair loss itself.

## How can a referral network support your head spa service?

The salons that grow their head spa service fastest often have a trichologist they can refer to and who refers back. When a head spa therapist notices something that needs a closer look, a quick referral reassures the client and keeps them coming back for the relaxation side of the service.

Trichollective members include head spa therapists, trichologists and doctors across Ireland and the UK, and the [directory](/directory) helps clients find the right person. You can read more about the treatment itself in our guide, [what is a Japanese head spa](/guides/what-is-japanese-head-spa).
`,
  faqs: [
    {
      q: "Do I need a qualification to offer head spa?",
      a: "There is no single legal qualification for head spa in the UK or Ireland, but your insurer and, in some areas, your council may require proof of training. Choose training that covers consultation, contraindications and hygiene as well as technique.",
    },
    {
      q: "Can head spa help with hair loss?",
      a: "Head spa is a relaxation and scalp-care treatment, not a treatment for hair loss. Clients with hair loss should be encouraged to see a trichologist or their GP.",
    },
    {
      q: "How long is a typical head spa appointment?",
      a: "Sessions vary from around 30 minutes for an extended wash and massage to 90 minutes or more for a full treatment with cleansing, massage and conditioning.",
    },
    {
      q: "Should head spa therapists use a scalp camera?",
      a: "A scalp camera can help clients see product build-up and how their scalp looks before and after. Therapists should describe what they see rather than diagnose, and refer when they notice changes that need a doctor.",
    },
  ],
  sources: [
    { label: "NHS: Ringworm", url: "https://www.nhs.uk/conditions/ringworm/" },
    { label: "NHS: Hair loss", url: "https://www.nhs.uk/conditions/hair-loss/" },
    { label: "HSE: Hair loss", url: "https://www2.hse.ie/conditions/hair-loss/" },
  ],
  related: {
    guides: ["what-is-japanese-head-spa", "how-to-choose-a-head-spa"],
    glossary: ["head-spa", "trichoscopy", "trichologist"],
    discipline: "cosmetic",
  },
};
