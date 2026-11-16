import type { Edition } from "./types";

const KARLEY = "Karley Weir, Founder of Trichollective";

/**
 * Edition 10, November 2026. DRAFT FOR REVIEW: built on feat/trichozette-november for a preview link.
 * Before it goes live:
 *  - Karley approves the letter and sends her notes from the road (page "On the road").
 *  - Karley checks the clinical wording in the LIVDOR feature, then Adam Bond approves it.
 *  - Every news and 2027 item is checked against its source.
 */
export const editionsD: Edition[] = [
  {
    number: 10,
    slug: "ready-for-2027",
    title: "The Christmas edition",
    fade: "Ready for 2027, with twelve gifts for December.",
    theme: "Edition 10 · Christmas 2026",
    supportedBy: { name: "LIVDOR", slug: "livdor", url: "https://www.livdor.com" },
    standfirst:
      "This Christmas edition, brought to you by LIVDOR, looks back at the research, regulation and business news that shaped 2026, and sets out what cosmetic, clinical and medical professionals can do now to be ready for 2027. Plus Adam Bond on laser and LED, an advent calendar for a calmer front desk, and twelve days of small gifts to your practice.",
    coverImageKey: "ed13",
    coverTone: "dark",
    season: "christmas",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-11-23",
    pages: [
      {
        kind: "letter",
        title: "This year we learned that we are stronger when we learn together.",
        blocks: [
          {
            type: "p",
            text: "As this year draws to a close, I keep thinking about the people I have met on the road: in salons, in clinics, at our events and in training rooms up and down the country. Every one of them is carrying the same question into 2027: how do I keep giving my clients the best care while the world around our industry keeps changing?",
          },
          {
            type: "p",
            text: "This edition is our answer to that question. We have gathered the research, regulation and business news that matters most from 2026, and asked what each of us can do now, from the cosmetic chair to the clinic and the consulting room, to start the new year ready.",
          },
          {
            type: "p",
            text: "It is also our Christmas edition, so we have made space for something lighter. Our advent calendar has one small, practical idea for each door, to help your front desk and your team through the busiest weeks of the year.",
          },
          {
            type: "p",
            text: "Thank you for everything you have given this community in its first months online. Wishing you, your teams and your families a peaceful Christmas, and I look forward to learning with you in 2027.",
          },
        ],
        signoff: KARLEY,
      },
      {
        kind: "partner",
        kicker: "Our Christmas partner",
        label: "Partner feature",
        title: "This Christmas edition is brought to you by LIVDOR.",
        standfirst:
          "LIVDOR is a British haircare brand founded by Adam Bond in early 2025, after his own experience of hair loss. As a Founding Premium Partner of Trichollective, LIVDOR supports this Christmas edition of Trichozette.",
        partner: { name: "LIVDOR", slug: "livdor", url: "https://www.livdor.com", ctaLabel: "Visit livdor.com" },
        theme: { paper: "#f4f3f0", ink: "#0f1e35", accent: "#e0463e", onAccent: "#ffffff" },
        imageKey: "livdorLifestyleReading",
        blocks: [
          {
            type: "p",
            text: "Having explored clinic treatments himself, Adam wanted to make laser hair growth technology more accessible for people to use at home. Today he focuses on developing LIVDOR and building relationships with hair and scalp professionals across the UK and Ireland.",
          },
          {
            type: "p",
            text: "Inside this edition, Adam explains the difference between laser and LED devices in plain language, so practitioners have a clear way to talk clients through the technology and set honest expectations.",
          },
          { type: "pull", text: "Adam wanted to make laser hair growth technology more accessible for people to use at home." },
        ],
        facts: [
          { label: "Founder", value: "Adam Bond" },
          { label: "What it is", value: "A laser cap for use at home" },
          { label: "Inside this edition", value: "Laser and LED, explained" },
          { label: "Partner page", value: "trichollective.net/partners/livdor" },
        ],
        disclosure:
          "LIVDOR is a Founding Premium Partner of Trichollective and supports this edition. Trichollective wrote and edited this page and kept editorial control.",
      },
      {
        kind: "perspectives",
        kicker: "Ready for 2027",
        title: "What to do now, from every chair.",
        intro:
          "The same year looks different from the cosmetic chair, the trichology clinic and the medical consulting room. Here is what changed in 2026 and what each of us can do before the new year, with every point linked to its source at the end of this edition.",
        views: [
          {
            discipline: "cosmetic",
            heading: "For the cosmetic chair",
            blocks: [
              {
                type: "p",
                text: "Sixteen more substances were banned from cosmetics in Great Britain from 15 August 2026, and products already on the market may only be sold until 14 February 2027. If you work in Ireland or Northern Ireland, new EU bans apply from 1 February 2027, including two hair colourants.",
              },
              {
                type: "checklist",
                title: "Before February",
                items: [
                  "Ask your suppliers which of your retail and back-bar products are affected, in writing.",
                  "Clear or return affected stock before 14 February 2027 (GB) or 1 February 2027 (EU and Northern Ireland).",
                  "For smoothing and straightening services, ventilate the room, follow the instructions exactly and keep a record of each service.",
                  "If you employ staff, budget for the National Living Wage of £13.21 an hour from April 2027.",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "For the trichology clinic",
            blocks: [
              {
                type: "p",
                text: "Clients are asking new questions. Some are taking finasteride, now carrying stronger MHRA warnings about mood and sexual side effects. Some are using weight-loss injections and have read about a link with hair loss. Others with severe alopecia areata now have more NHS treatment options to ask their dermatologist about.",
              },
              {
                type: "checklist",
                title: "Before January",
                items: [
                  "Ask about medication and mood at consultation, and signpost any concern back to the prescriber.",
                  "Explain that the GLP-1 study found an association in genetic data, not proof that the medicines cause hair loss.",
                  "Refresh your referral notes for severe or rapidly spreading patchy hair loss.",
                  "If you are a sole trader with income over £30,000, choose Making Tax Digital software before 6 April 2027.",
                  "Add a route for data protection complaints to your privacy notice, as the Data (Use and Access) Act now requires.",
                ],
              },
            ],
          },
          {
            discipline: "medical",
            heading: "For the medical consulting room",
            blocks: [
              {
                type: "p",
                text: "NICE recommended deuruxolitinib for adults with severe alopecia areata in July 2026, and the Scottish Medicines Consortium followed in October. The MHRA strengthened its finasteride and dutasteride warnings in May. An extended-release oral minoxidil has reported Phase 3 results in men, but is not yet peer reviewed or approved.",
              },
              {
                type: "checklist",
                title: "Before the new year",
                items: [
                  "Review how patients on finasteride are told about psychiatric and sexual side effects, and how they are followed up.",
                  "Report suspected adverse reactions through the Yellow Card scheme.",
                  "If you perform laser or injectable procedures in England, respond to the government's consultation by 13 January 2027.",
                  "If you practise in Ireland or the EU and use software that makes decisions about patients, note that the AI Act's high-risk rules now apply from 2 December 2027.",
                ],
              },
            ],
          },
        ],
      },
      {
        kind: "partner",
        kicker: "LIVDOR",
        label: "Sponsored partner feature",
        // Every quotation is from Adam Bond's written answers of 12 November 2026, trimmed to whole sentences.
        // Awaiting: Karley's check of the clinical wording, then Adam's approval.
        title: "Laser and LED, explained.",
        standfirst:
          "Clients often ask what the difference is between a laser cap and an LED device. Adam Bond, founder of LIVDOR, answers in plain language, so practitioners have a clear way to explain the technology and set honest expectations.",
        partner: { name: "LIVDOR", slug: "livdor", url: "https://www.livdor.com", ctaLabel: "Visit livdor.com" },
        theme: { paper: "#f4f3f0", ink: "#0f1e35", accent: "#e0463e", onAccent: "#ffffff" },
        imageKey: "livdorCap",
        blocks: [
          { type: "h", text: "The difference, in plain terms" },
          {
            type: "p",
            text: "“The main difference is how the light is delivered,” Adam says. “Lasers produce a more focused, directional beam of light, whereas LEDs produce light that spreads out more widely. Think of it a bit like the difference between a focused beam and a normal torch.”",
          },
          {
            type: "p",
            text: "“Both can be used in hair growth treatments, but they aren't quite the same technology. There has been some encouraging research into both, although laser therapy has been studied extensively for pattern hair loss. At LIVDOR, we've chosen to use 272 laser diodes rather than LEDs, delivering focused red light across the scalp.”",
          },
          { type: "pull", text: "It's not simply a case of more power being better." },
          { type: "h", text: "Three specifications to compare" },
          {
            type: "list",
            items: [
              "Wavelength: “essentially the colour of the light. Red light between 630 and 660nm has been widely studied for hair growth, and LIVDOR uses 650nm.”",
              "Power: “how much light each laser produces. LIVDOR uses 5mW per laser. It's not simply a case of more power being better, though. What matters is delivering the right amount of light over a treatment session.”",
              "Number of lasers: “important for coverage. However, it's not just about having the highest number. How those lasers are positioned and how the light is delivered are equally important.”",
            ],
          },
          { type: "h", text: "What a home routine looks like" },
          {
            type: "p",
            text: "“With LIVDOR, it's really straightforward. You wear the cap for 30 minutes, three times a week,” Adam says. “The biggest thing I always emphasise is consistency. It's a bit like going to the gym. You wouldn't expect to see a difference after one session. It's about building it into your routine and sticking with it over several months.”",
          },
          { type: "h", text: "The most common misunderstanding" },
          {
            type: "p",
            text: "“One of the biggest misunderstandings is that all red light caps are basically the same. They can look very similar from the outside, but the technology inside can be quite different. Some use lasers, some use LEDs and others use a combination. People sometimes assume that more lights or more power automatically means better results, which isn't necessarily true.”",
          },
          {
            type: "callout",
            title: "Before suggesting a home-use device",
            text: "“The first thing is understanding what's causing the hair loss and how advanced it is,” Adam says. “Low-level laser therapy is generally best suited to people with pattern hair thinning where the hair follicles are still active. It isn't creating brand new follicles where they've been permanently lost. Practitioners should also check for any relevant scalp conditions, medications that increase sensitivity to light or other reasons the treatment might not be suitable.”",
          },
          {
            type: "quiz",
            question: "A client says a cap with more lights must work better. What is the most accurate reply?",
            options: [
              "Yes, more diodes always means a better result.",
              "Not necessarily: wavelength, power per diode, placement and consistent use all matter.",
              "Only LED caps are worth considering.",
            ],
            answer: 1,
            explain: "Adam's point is that no single number tells the whole story. Compare wavelength, power and coverage, look at the published research, and make sure the client can keep to the routine.",
          },
        ],
        facts: [
          { label: "Founder", value: "Adam Bond" },
          { label: "Technology", value: "Low-level laser, 272 diodes at 650nm, 5mW per diode" },
          { label: "Routine", value: "30 minutes, three times a week (per LIVDOR's instructions)" },
          { label: "Partner page", value: "trichollective.net/partners/livdor" },
        ],
        disclosure:
          "LIVDOR is a Founding Premium Partner of Trichollective and sponsors this feature. Trichollective wrote and edited it from Adam Bond's written answers and kept editorial control. It describes a product and is not medical advice.",
      },
      {
        kind: "glance",
        kicker: "Dates for your diary",
        title: "The dates that shape the next twelve months.",
        rows: [
          { label: "Fri 25 December 2026", value: "Christmas Day (UK and Ireland)" },
          { label: "Sat 26 December 2026", value: "St Stephen's Day (Ireland)" },
          { label: "Mon 28 December 2026", value: "Boxing Day substitute bank holiday (UK)" },
          { label: "Fri 1 January 2027", value: "New Year's Day. Unfair dismissal protection after six months' service begins" },
          { label: "Mon 4 January 2027", value: "Substitute bank holiday (Scotland)" },
          { label: "Wed 13 January 2027", value: "England's consultation on high-risk cosmetic procedures closes" },
          { label: "Mon 1 February 2027", value: "New EU cosmetic ingredient bans apply (Ireland and Northern Ireland)" },
          { label: "Sun 14 February 2027", value: "Last day to sell existing stock of the 16 newly banned substances (GB)" },
          { label: "Tue 6 April 2027", value: "Making Tax Digital for Income Tax for qualifying income over £30,000" },
          { label: "April 2027", value: "National Living Wage rises to £13.21. Bereavement leave, including pregnancy loss" },
          { label: "October 2027", value: "Flexible working changes under the Employment Rights Act" },
          { label: "Thu 2 December 2027", value: "EU AI Act rules for stand-alone high-risk systems apply" },
        ],
      },
      {
        kind: "interactive",
        kicker: "The Trichozette advent",
        title: "Twelve doors, twelve gifts for your practice.",
        intro:
          "From 1 to 12 December, a new door opens on our townhouse every morning, with a gift behind it: templates for your front desk, a month of membership, a guest ticket for a colleague and more. We'll email you at 7am when each door is ready.",
        blocks: [
          {
            type: "advent",
            title: "The Trichozette advent",
            // Every door ships wrapped. The server fills in each gift on its day (see advent.ts), so the
            // gifts are never in the page's JavaScript before then.
            doors: Array.from({ length: 12 }, (_, i) => ({ day: i + 1, title: "Still wrapped", text: `Opens on ${i + 1} December.`, locked: true })),
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "The twelve days of Christmas",
        title: "Twelve days, twelve small gifts to your practice.",
        intro:
          "From 25 December to 5 January, take one small step a day for your clients, your team and yourself. Tick each one off as you go and watch the lights come on. Your progress stays in your own browser, so you can come back each day.",
        blocks: [
          {
            type: "twelvedays",
            title: "Light the strand",
            days: [
              { title: "Rest", text: "Close the diary, switch off notifications and take a full day away from the business. You will be better for it in January." },
              { title: "Say thank you", text: "Send a short, personal thank-you to every member of your team. Name one thing each of them did this year that made a difference." },
              { title: "Clear the inbox", text: "Answer or archive every message waiting from December, so the first morning back starts with a clean slate." },
              { title: "Read one paper", text: "Pick one item from this edition's news page and read the original source in full, rather than the headline." },
              { title: "Check your stock", text: "List any products affected by the new cosmetic ingredient bans and ask your supplier, in writing, what replaces them." },
              { title: "Update your consultation form", text: "Make sure it asks about current medication, including finasteride and weight-loss injections, and about recent changes in mood or health." },
              { title: "Review your referrals", text: "Write down who you refer to for medical assessment, and check their details are still correct. Share the list with your team." },
              { title: "Re-cost your services", text: "With the National Living Wage rising to £13.21 in April, check that your prices still cover your time, products and team." },
              { title: "Tidy your client notes", text: "Finish any incomplete notes from December. A colleague picking up the record should understand it without asking you." },
              { title: "Plan one masterclass", text: "Choose one Trichollective masterclass or case round to join in the new year, and put it in your diary now." },
              { title: "Reach out to a colleague", text: "Introduce yourself to someone from a different discipline in the community: a hairdresser, a trichologist or a doctor." },
              { title: "Write three goals", text: "Write down three things you want your practice to do better in 2027. Keep them where you will see them every week." },
            ],
          },
          {
            type: "quiz",
            question: "Which of these is your first deadline of 2027?",
            options: [
              "The EU cosmetic ingredient bans on 1 February",
              "Unfair dismissal protection after six months' service, from 1 January",
              "The National Living Wage rise in April",
            ],
            answer: 1,
            explain: "From 1 January 2027, employees gain unfair dismissal protection after six months' service. Review probation periods before then. The EU bans follow on 1 February and the wage rise in April.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "On the road",
        title: "What I heard in salons and clinics across the country this autumn.",
        standfirst:
          "Karley Weir has spent the autumn visiting and training professionals around the country. Here are the questions she was asked most, and what she wants every practice to hear before the new year.",
        imageKey: "ire05",
        blocks: [
          {
            type: "callout",
            title: "Awaiting Karley's notes",
            text: "This page will be written from Karley's own answers about where she has visited and trained, the questions practitioners asked most, and her three priorities for 2027. Her answers were requested on 16 November 2026.",
          },
          { type: "h", text: "Where Karley has been" },
          { type: "p", text: "Places, dates and the number of professionals trained, from Karley's notes." },
          { type: "h", text: "The questions she was asked most" },
          { type: "list", items: ["From Karley's notes.", "From Karley's notes.", "From Karley's notes."] },
          { type: "h", text: "Her three priorities for 2027" },
          { type: "list", items: ["From Karley's notes.", "From Karley's notes.", "From Karley's notes."] },
        ],
      },
      {
        kind: "partner",
        kicker: "Kiera SI",
        title: "Why the front desk decides more of your year than you think.",
        standfirst:
          "Every booking, reminder, rebooking and follow-up passes through the front desk. As clinics plan for 2027, it is worth asking what happens to the calls and messages nobody has time to answer.",
        partner: {
          name: "Kiera SI",
          logo: "/partners/kiera/logo.png",
          invertLogo: true,
          url: "https://kierasi.com",
          ctaLabel: "Visit kierasi.com",
        },
        theme: { paper: "#f4f5ef", ink: "#102126", accent: "#c4f0d6", sans: true },
        imageKey: "ire06",
        blocks: [
          {
            type: "p",
            text: "Most hair and scalp practices are run by people who would rather be with a client than on the phone. That is exactly why the front desk is so easy to overlook. Yet it is where a worried first-time caller decides whether to book, where a regular decides whether to come back, and where a cancellation either becomes an empty chair or a filled one.",
          },
          { type: "h", text: "Three questions to ask before January" },
          {
            type: "checklist",
            title: "Your front desk check-up",
            items: [
              "What happens when the phone rings while everyone is with a client?",
              "Does every client get a confirmation and a reminder, in your own words?",
              "When someone cancels, how quickly can you offer the slot to somebody else?",
              "Does whoever answers know a client's history, or do they start from the beginning?",
              "Is every enquiry followed up, or only the ones somebody remembers?",
            ],
          },
          {
            type: "callout",
            title: "Why reminders matter",
            text: "In 2025, 16 million GP appointments in England were not attended, about 1 in 23. A survey for NHS England found nearly 1 in 4 people had missed an NHS appointment by forgetting or arriving late (NHS England, March 2026). Private practices see the same human habits, which is why a clear confirmation and a timely reminder matter.",
          },
          { type: "pull", text: "A client should not have to start from the beginning every time they call, message or return." },
          {
            type: "p",
            text: "Kiera is a super intelligence front desk for clinics and salons. It answers calls, books into your diary, sends confirmations and reminders in your clinic's voice, and remembers each client's previous conversations, while your team keeps the judgement and the relationship. Clinical decisions are never handed to software.",
          },
        ],
        facts: [
          { label: "Built for", value: "Clinics, hair and scalp practices, salons and independent professionals" },
          { label: "Seen at", value: "Trichollective Ireland, 5 October 2026" },
        ],
        disclosure:
          "Kiera is built by Trichollective co-founder Antonio Giugno. We label this as a partner feature, as we do for every business we have a connection with.",
      },
      {
        kind: "cta",
        kicker: "Happy Christmas",
        title: "Start the new year with colleagues from every discipline.",
        intro:
          "Masterclasses are open to every member, and non-members can buy a £20 guest ticket. Refer a friend and you both get a month free.",
        blocks: [
          {
            type: "p",
            text: "Trichollective brings cosmetic, clinical and medical professionals together, online and in the room. Members read every edition of Trichozette, join masterclasses and case rounds, and can be found in the directory by clients and colleagues.",
          },
          { type: "p", text: "From all of us at Trichollective, a happy Christmas and a healthy new year." },
        ],
        offers: ["account", "member", "business"],
      },
    ],
    sources: [
      { label: "NICE TA1178: deuruxolitinib for severe alopecia areata (15 July 2026)", url: "https://www.nice.org.uk/guidance/ta1178" },
      { label: "Scottish Medicines Consortium: deuruxolitinib SMC2968 (12 October 2026)", url: "https://scottishmedicines.org.uk/medicines-advice/deuruxolitinib-leqselvi-abb-smc2968/" },
      { label: "MHRA Drug Safety Update: finasteride and dutasteride (11 May 2026)", url: "https://www.gov.uk/drug-safety-update/finasteride-and-dutasteride-updated-safety-warnings-for-psychiatric-side-effects-and-sexual-dysfunction" },
      { label: "Practical Dermatology: oral minoxidil Phase 3 (20 October 2026)", url: "https://practicaldermatology.com/news/phase-3-trial-of-oral-minoxidil-formulation-meets-primary-endpoints-in-male-pattern-hair-loss/2488751/" },
      { label: "News-Medical: GLP-1 receptor genetics and male pattern hair loss (3 September 2026)", url: "https://www.news-medical.net/news/20260903/Study-links-popular-weight-loss-drugs-to-increased-male-hair-loss.aspx" },
      { label: "GOV.UK: consultation on high-risk cosmetic procedures in England (21 October 2026)", url: "https://www.gov.uk/government/consultations/restrictions-on-the-performance-of-high-risk-cosmetic-and-wellbeing-procedures-in-england" },
      { label: "legislation.gov.uk: SI 2026/23, cosmetic substances (GB)", url: "https://www.legislation.gov.uk/uksi/2026/23/made" },
      { label: "Coslaw: EU Omnibus IX bans from 1 February 2027 (9 July 2026)", url: "https://coslaw.eu/omnibus-act-ix-new-ingredients-banned-in-the-eu-from-1-february-2027/" },
      { label: "GOV.UK: National Living Wage £13.21 (28 October 2026)", url: "https://www.gov.uk/government/news/lpc-recommendations-take-the-national-living-wage-to-1321" },
      { label: "GOV.UK: Employment Rights Act timeline (5 November 2026)", url: "https://www.gov.uk/government/publications/implementing-the-plan-to-make-work-pay-and-employment-rights-act/plan-to-make-work-pay-and-employment-rights-act-timeline-update" },
      { label: "GOV.UK: Making Tax Digital for Income Tax", url: "https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax" },
      { label: "Kennedys: Data (Use and Access) Act commencement dates", url: "https://www.kennedyslaw.com/en/thought-leadership/article/2026/the-data-use-and-access-act-2025-commencement-dates-and-planned-guidance-for-2026" },
      { label: "White & Case: EU AI Omnibus enters force (July 2026)", url: "https://www.whitecase.com/insight-alert/eu-ai-omnibus-enters-force-amending-ai-act" },
      { label: "NHS England: missed appointments (2 March 2026)", url: "https://www.england.nhs.uk/2026/03/nhs-urges-tap-the-app-as-1-in-4-miss-appointments" },
      { label: "GOV.UK: UK bank holidays", url: "https://www.gov.uk/bank-holidays" },
      { label: "Workplace Relations Commission: public holidays in Ireland", url: "https://www.workplacerelations.ie/en/what_you_should_know/public-holidays" },
      { label: "LIVDOR", url: "https://www.livdor.com" },
      { label: "Kiera SI", url: "https://kierasi.com" },
    ],
  },
];
