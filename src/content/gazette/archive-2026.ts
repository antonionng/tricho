import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";

/*
 * Four years in review: 2026.
 * A retrospective series published on 2026-09-30, covering January to September 2026.
 * Every factual claim is tied to an entry in the edition's `sources` array.
 */

const SRC = {
  mhraFinasteride: {
    label: "GOV.UK (MHRA): MHRA strengthens safety warnings for finasteride and dutasteride, 11 May 2026",
    url: "https://www.gov.uk/government/news/mhra-strengthens-safety-warnings-for-finasteride-and-dutasteride",
  },
  niceDeuruxolitinib: {
    label: "Alopecia UK: NICE recommends deuruxolitinib for adults with severe alopecia areata (TA1178), July 2026",
    url: "https://www.alopecia.org.uk/news/nice-recommends-deuruxolitinib-for-adults-with-severe-alopecia-areata",
  },
  mhraDeuruxolitinib: {
    label: "Hospital Healthcare Europe: Deuruxolitinib approved by MHRA for severe alopecia areata, 17 March 2026",
    url: "https://hospitalhealthcare.com/clinical/dermatology/deuruxolitinib-approved-by-mhra-for-severe-alopecia-areata/",
  },
  fdaBaricitinib: {
    label: "Healio: FDA approves Olumiant for teens with severe alopecia, 28 September 2026",
    url: "https://www.healio.com/news/dermatology/20260928/fda-approves-olumiant-for-teens-with-severe-alopecia",
  },
  bjdAudit: {
    label: "British Journal of Dermatology 195 (Suppl 1): BH31 Ritlecitinib for severe alopecia areata: does regional prescribing match national guidance?, June 2026",
    url: "https://academic.oup.com/bjd/article/195/Supplement_1/ljag086.304/8718533",
  },
  bmjGlp1: {
    label: "BMJ Group: GLP-1 diabetes drugs linked to increased risk of hair loss (The BMJ, target trial emulation), 22 July 2026",
    url: "https://bmjgroup.com/glp-1-diabetes-drugs-linked-to-increased-risk-of-hair-loss/",
  },
  glp1Review: {
    label: "Science Progress: GLP-1 therapies and hair loss: a systematic review of current evidence and implications for counseling, 17 April 2026",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13100445/",
  },
  clascoterone: {
    label: "GEN: Cosmo Pharma eyes 2027 NDA for baldness candidate after positive phase III 12-month data, 21 April 2026",
    url: "https://www.genengnews.com/topics/translational-medicine/cosmo-pharma-eyes-2027-nda-for-baldness-candidate-after-positive-phase-iii-12-month-data/",
  },
  veradermics: {
    label: "BioPharma Dive: Veradermics reports phase 3 data for extended-release oral minoxidil, 27 April 2026",
    url: "https://www.biopharmadive.com/news/veradermics-oral-minoxidil-baldness-hair-loss-study-results/818529/",
  },
  asa: {
    label: "Advertising Standards Authority: Keep your ads a cut above the rest, advertising products and services for hair loss, 9 July 2026",
    url: "https://www.asa.org.uk/news/keep-your-ads-a-cut-above-the-rest-advertising-products-and-services-for-hair-loss.html",
  },
  scotland: {
    label: "Aesthetics Journal: Scottish Parliament passes non-surgical procedures bill, March 2026",
    url: "https://aestheticsjournal.com/news/scottish-parliament-passes-non-surgical-procedures-bill/",
  },
  nhbfScotland: {
    label: "National Hair & Beauty Federation: NHBF responds to Scotland's non-surgical bill, 11 February 2026",
    url: "https://www.nhbf.co.uk/news/nhbf-responds-to-scotlands-non-surgical-bill/",
  },
  nhbfAesthetics: {
    label: "National Hair & Beauty Federation: Aesthetics hub, non-surgical cosmetic procedures in England",
    url: "https://www.nhbf.co.uk/advice-and-resources/aesthetic-non-surgical-cosmetic-procedures/",
  },
  nhbfStats: {
    label: "National Hair & Beauty Federation: NHBF industry statistics 2025",
    url: "https://www.nhbf.co.uk/about-the-nhbf/campaigning-for-you/industry-research-reports-and-statistics/nhbf-industry-statistics/",
  },
  oxybenzone: {
    label: "legislation.gov.uk: The Cosmetic Products (Restriction of Chemical Substances) (No. 2) Regulations 2025, in force 21 January 2026",
    url: "https://www.legislation.gov.uk/uksi/2025/901/made",
  },
  omnibus: {
    label: "HPRA: Omnibus Act VIII, new substances restricted or prohibited in cosmetics from May 2026",
    url: "https://www.hpra.ie/regulation/cosmetics/cosmetics-regulation/updates-to-restricted-and-prohibited-ingredients-in-cosmetic-products/omnibus-act-viii---new-substances-added-to-the-list-of-ingredients-restricted-or-prohibited-in-cosmetics-from-may-2026",
  },
  formaldehydeEu: {
    label: "EUR-Lex: Commission Regulation (EU) 2022/1181 on the labelling of formaldehyde releasers",
    url: "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32022R1181",
  },
  formaldehydeEuSummary: {
    label: "ChemLinked: EU lowers the labelling threshold for formaldehyde releasers in cosmetics",
    url: "https://cosmetic.chemlinked.com/news/cosmetic-news/eu-lowers-the-labelling-threshold-for-formaldehyde-releasers-in-cosmetics-regulation",
  },
  fdaFormaldehyde: {
    label: "CNN: FDA misses deadline on proposed ban on formaldehyde in hair-straightening products, 5 January 2026",
    url: "https://www.cnn.com/2026/01/05/health/hair-straightening-formaldehyde-fda-deadline",
  },
  irishFillers: {
    label: "The Irish Times: Concerns over health risks of dermal fillers prompt calls for regulation, 3 February 2026",
    url: "https://www.irishtimes.com/health/2026/02/03/concerns-over-health-risks-of-dermal-fillers-prompt-calls-for-regulation/",
  },
  icam: {
    label: "Irish Medical Times: Introduce safeguards before serious issue becomes widespread, warn cosmetic doctors, 22 September 2026",
    url: "https://www.imt.ie/news/introduce-safeguards-before-serious-issue-become-widespread-warn-cosmetic-doctors-22-09-2026/",
  },
  euFillers: {
    label: "European Commission: Dermal fillers tested in EU market surveillance campaign, 9 March 2026",
    url: "https://single-market-economy.ec.europa.eu/news/dermal-fillers-tested-eu-market-surveillance-campaign-2026-03-09_en",
  },
  kline: {
    label: "Kline: The scalp care boom, are brands finding growth from the root up?, 25 March 2026",
    url: "https://klinegroup.com/beauty-and-wellbeing/professional-hair-care/the-scalp-care-boom-are-brands-unlocking-growth-from-the-root-up/",
  },
  traction: {
    label: "International Journal of Women's Dermatology: Feasibility of a culturally tailored traction alopecia prevention curriculum in a diverse urban middle school, August 2026",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13502852/",
  },
  iotConference: {
    label: "The Institute of Trichologists: Trichollective Conference review, June 2026",
    url: "https://instituteoftrichologists.co.uk/trichollective-conference-review/",
  },
  iotPresident: {
    label: "The Institute of Trichologists: Dr Sharon Wong appointed President, 19 January 2026",
    url: "https://instituteoftrichologists.co.uk/dr-sharon-wong/",
  },
  iotNcfe: {
    label: "The Institute of Trichologists: NCFE annual inspection outstanding, 8 April 2026",
    url: "https://instituteoftrichologists.co.uk/ncfe-annual-inspection-outstanding/",
  },
};

export const archive2026: Edition[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. 2026 in review
  // ─────────────────────────────────────────────────────────────
  {
    number: 202601,
    slug: "2026-in-review",
    title: "2026 in review",
    fade: "What changed, and what it asks of us.",
    theme: "Four years in review",
    standfirst:
      "A look back at the year hair and scalp care changed across the cosmetic chair, the trichology clinic and the consulting room, from new medicines to new law.",
    coverImageKey: "ed05",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2026",
    focus: "review",
    pages: [
      {
        kind: "letter",
        title: "Looking back at 2026",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2026. It belongs to Four years in review, a retrospective series published on 30 September 2026, in which we step back from the monthly news and ask what really changed. Trichozette is new, so these are not back issues. They are a considered look at a year, written with a little distance, with every factual claim tied to a source listed at the end of the edition.",
          },
          {
            type: "p",
            text: "For Trichollective, 2026 is also the year the community began. It started with a conference at Whittlebury Hall on 19 January, met again at Whittlebury Park on 15 June, and launches at Trichollective Ireland on 5 October. The months around those meetings were busy ones for all three of the fields we bring together.",
          },
          {
            type: "p",
            text: "In medicine, a second JAK inhibitor for severe alopecia areata was licensed in the UK and then recommended by NICE, and the warnings on finasteride were strengthened. In cosmetic practice, Scotland passed a law on non-surgical procedures, the advertising regulator set out how hair-loss claims should be made, and ingredient rules tightened in Great Britain and the EU. In trichology, the Institute of Trichologists appointed a new President and discussed plans for a UK trichology database.",
          },
          {
            type: "p",
            text: "The pages that follow set out those changes, what they mean in practice and the education each discipline needs because of them. There are questions to answer along the way. The three field editions for 2026 go into more depth for the cosmetic, clinical and medical reader.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The year in brief",
        title: "Three fields, one year of change",
        standfirst:
          "New medicines, new law and new evidence. The shifts of 2026 that anyone who works with hair and scalp should know about.",
        imageKey: "ed13",
        blocks: [
          {
            type: "p",
            text: "For hair and scalp professionals, 2026 is best remembered for the quieter changes that alter what happens in a consultation: which treatments a doctor can offer, which claims a salon can make, which ingredients a product may contain and which questions a client is likely to ask.",
          },
          { type: "h", text: "In the consulting room" },
          {
            type: "p",
            text: "The biggest medical story concerned alopecia areata. In March the MHRA approved deuruxolitinib, an oral JAK inhibitor, for adults with severe alopecia areata, on the strength of two phase 3 trials that enrolled 1,223 people with at least half of their scalp hair lost. In July NICE published final guidance recommending it for adults, the second medicine it has recommended for the condition after ritlecitinib in 2024. At the end of September the US FDA extended baricitinib to adolescents aged 12 and over, a decision that does not change UK licensing but that families may well ask about.",
          },
          {
            type: "p",
            text: "In May the MHRA strengthened product information for finasteride 1 mg, used for male pattern hair loss, to make clear that sexual dysfunction may contribute to mood disorders, and added a precautionary warning about mood changes to dutasteride. In July a large observational study in The BMJ linked GLP-1 receptor agonists, widely used for weight loss, to a higher risk of non-scarring hair loss in adults with type 2 diabetes.",
          },
          { type: "h", text: "At the chair" },
          {
            type: "p",
            text: "For cosmetic professionals the year was about rules. On 17 March the Scottish Parliament passed a law bringing treatments such as toxin, fillers, laser treatments, chemical peels and microneedling under healthcare oversight in registered premises, and banning them for under-18s, with the main requirements expected from September 2027. England's own licensing scheme was still being developed. In July the ASA and CAP published guidance on advertising hair-loss products and services.",
          },
          {
            type: "list",
            items: [
              "In Great Britain, new limits on the UV filter oxybenzone in cosmetic products took effect on 21 January.",
              "In the EU, including Ireland, Regulation (EU) 2026/78 added substances classed as carcinogenic, mutagenic or toxic to reproduction to the restricted and prohibited lists from 1 May, with no sell-through period.",
              "Also in the EU, older stock that did not carry the warning releases formaldehyde at the lower labelling threshold could no longer be sold after 31 July.",
            ],
          },
          { type: "h", text: "In the trichology clinic" },
          {
            type: "p",
            text: "Trichology, which is not statutorily regulated in the UK or Ireland, spent the year strengthening its own standards. The Institute of Trichologists appointed Dr Sharon Wong as President in January, reported in April that its Level 5 Diploma in Clinical Trichology had received the top grade at its NCFE inspection for the fourth year running, and used its June conference to discuss a UK trichology database to support clinical decisions and research.",
          },
          {
            type: "pull",
            text: "For hair and scalp professionals, 2026 is best remembered for the quieter changes that alter what happens in a consultation.",
          },
          {
            type: "callout",
            title: "A note on what we left out",
            text: "Where we could not confirm a date, figure or detail from a regulator, professional body, journal or major news outlet, we left it out.",
          },
          {
            type: "p",
            text: "The common thread is referral. New medicines help only if clients with severe alopecia areata reach a dermatologist. New warnings protect people only if the person who hears about low mood passes it on. New law works only if practitioners understand where their scope ends. The rest of this edition looks at each of those in turn.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "One year, three chairs",
        intro:
          "The same year of change, seen from the cosmetic chair, the trichology clinic and the medical consulting room, and what each discipline might do differently because of it.",
        views: [
          {
            discipline: "cosmetic",
            heading: "What changed at the chair",
            blocks: [
              {
                type: "p",
                text: "For head spa therapists and stylists, the practical changes of 2026 were about what you may offer, what you may say and what you may sell. Scotland's new law brings skin-piercing treatments such as microneedling into a regulated framework, the ASA set out the line between cosmetic and medicinal claims about hair loss, and ingredient limits changed on both sides of the Irish Sea.",
              },
              {
                type: "p",
                text: "You are also likely to meet more clients who are shedding. Weight-loss medicines are widely used, and the 2026 evidence links GLP-1 medicines to non-scarring hair loss. Your role is not to name a cause but to notice, to record what you see with the client's consent and to suggest that the client speaks to the prescriber or GP.",
              },
              {
                type: "checklist",
                title: "Worth checking this autumn",
                items: [
                  "Whether any treatment you offer pierces the skin, and how the rules in your nation treat it",
                  "Whether your website or social posts claim to prevent, cure or reverse hair loss",
                  "Whether retail stock with UV filters or formaldehyde-releasing preservatives meets current rules",
                  "Whether you have a named trichologist and a GP route for referrals",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "What changed in the clinic",
            blocks: [
              {
                type: "p",
                text: "Trichology is not statutorily regulated in the UK or Ireland, so the profession's standing rests on its professional bodies, its qualifications and the quality of its referrals. In 2026 the Institute of Trichologists appointed a new President, kept the top NCFE grade for its diploma and discussed a national database to support clinical decisions and research.",
              },
              {
                type: "p",
                text: "Clinically, the year sharpened two conversations. Clients on GLP-1 medicines who present with diffuse shedding need a careful history and a clear route back to the prescriber. Clients with severe patchy loss now have a second NHS medicine to discuss with a dermatologist, so a timely referral matters more than it did.",
              },
              {
                type: "quiz",
                question:
                  "A client on a weight-loss injection describes diffuse shedding that began a few months after rapid weight loss. What is the most appropriate step for a trichologist?",
                options: [
                  "Advise the client to stop the injection until the shedding settles",
                  "Take a full history, examine, and encourage the client to discuss it with the prescriber or GP",
                  "Suggest the client asks for a JAK inhibitor",
                  "Reassure the client that weight-loss medicines do not affect hair",
                ],
                answer: 1,
                explain:
                  "A trichologist can take a history and examine, but decisions about prescribed medicines belong to the prescriber. The 2026 evidence links GLP-1 medicines to non-scarring hair loss, which reviewers most often describe as telogen effluvium, so the client should raise it with the prescriber or GP.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "What changed in the consulting room",
            blocks: [
              {
                type: "p",
                text: "For GPs, dermatologists and aesthetic doctors and nurses, 2026 brought a second licensed JAK inhibitor for adults with severe alopecia areata and NICE guidance recommending it, alongside ritlecitinib. A June audit of six regional dermatology centres found ritlecitinib prescribing largely in line with national guidance, with room to improve psychological assessment and the consistent use of severity scoring.",
              },
              {
                type: "p",
                text: "The year also added to the safety picture. Finasteride and dutasteride product information changed in May, and The BMJ's July study adds hair loss to the conversations worth having when GLP-1 treatment begins. For those in aesthetics, Scotland's new law and the Irish calls for filler regulation point the same way: closer oversight of who injects, and where.",
              },
              {
                type: "reveal",
                prompt:
                  "Does the FDA's September decision on baricitinib for adolescents change what can be prescribed in the UK?",
                answer:
                  "No. It is a US regulatory decision and does not change UK licensing. Families may ask about it, and a dermatologist is the right person to discuss the options available here.",
              },
            ],
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "2026 at a glance",
        rows: [
          { label: "19 January", value: "The Institute of Trichologists announces Dr Sharon Wong as its President. Trichollective's first conference meets at Whittlebury Hall." },
          { label: "21 January", value: "New limits on oxybenzone in cosmetic products take effect in Great Britain." },
          { label: "17 March", value: "The Scottish Parliament passes its law on non-surgical cosmetic procedures. The MHRA approves deuruxolitinib for adults with severe alopecia areata." },
          { label: "1 May", value: "Regulation (EU) 2026/78 applies across the EU, restricting or prohibiting further CMR substances in cosmetics." },
          { label: "11 May", value: "The MHRA strengthens safety warnings for finasteride and dutasteride." },
          { label: "15 June", value: "The Trichollective Conference meets at Whittlebury Park, with discussion of a UK trichology database." },
          { label: "9 July", value: "The ASA and CAP publish guidance on advertising hair-loss products and services." },
          { label: "15 July", value: "NICE publishes final guidance TA1178 recommending deuruxolitinib for adults with severe alopecia areata." },
          { label: "22 July", value: "The BMJ publishes a study linking GLP-1 receptor agonists to a higher risk of hair loss in adults with type 2 diabetes." },
          { label: "28 September", value: "The US FDA approves baricitinib for adolescents aged 12 and over with severe alopecia areata." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed09",
        caption:
          "A year in which the scalp came under closer scrutiny, from the treatments offered in salons to the medicines prescribed for hair loss.",
      },
      {
        kind: "article",
        kicker: "In practice",
        title: "What 2026 means for your practice",
        standfirst:
          "Four checks to make, whichever chair you sit in, and the red flags that have not changed at all.",
        imageKey: "ed16",
        blocks: [
          {
            type: "p",
            text: "A year of change is only useful if it alters what we do on a Tuesday afternoon. Here is what 2026 asks of each discipline in practical terms, and the parts of practice that stay exactly the same.",
          },
          { type: "h", text: "Check your words" },
          {
            type: "p",
            text: "The ASA and CAP guidance published in July draws a clear line. Claims that a product or service prevents, cures or reverses hair loss are medicinal and need a marketing authorisation from the MHRA. Claims such as reduces hair loss or strengthens hair may be acceptable when backed by robust evidence. Prescription-only medicines, including finasteride and oral minoxidil, must not be advertised to the public, although a clinic may promote a consultation. Before-and-after images must reflect typical outcomes, and testimonials do not replace clinical evidence.",
          },
          {
            type: "p",
            text: "That applies to everyone with a website or a social account: salons, head spas, trichology clinics and medical practices alike. It is worth reading your own pages with the guidance beside you.",
          },
          {
            type: "quiz",
            question: "Under the ASA and CAP guidance, which of these claims is most likely to be treated as medicinal?",
            options: ["Strengthens hair", "Reduces hair breakage when brushing", "Reverses hair loss", "Leaves hair feeling thicker"],
            answer: 2,
            explain:
              "Claims to prevent, cure or reverse hair loss are medicinal and need a marketing authorisation. The other claims may be acceptable if they are supported by robust evidence.",
          },
          { type: "h", text: "Check your menu" },
          {
            type: "p",
            text: "If you work in Scotland and offer anything that pierces the skin, including scalp microneedling, look at how the new law treats it well before the main requirements take effect. In England the licensing scheme was still being developed during 2026, with a stated priority on restricting the highest-risk procedures first. In Ireland, the question of who may inject dermal fillers remained under discussion.",
          },
          { type: "h", text: "Check your shelves" },
          {
            type: "p",
            text: "Retail stock has its own rules. In Great Britain, cosmetic products other than general skin, face, hand and lip products, which includes hair products, are now limited to 0.5% oxybenzone, and the sell-through period for older stock ended on 21 July. In the EU, Regulation (EU) 2026/78 applied from 1 May with no sell-through period. Ask suppliers to confirm compliance in writing.",
          },
          { type: "h", text: "Check your referrals" },
          {
            type: "list",
            items: [
              "Severe patchy or total hair loss: suggest a GP appointment with a view to dermatology assessment, as NHS options widened in 2026.",
              "Low mood or sexual side effects in someone taking finasteride: encourage them to speak to the prescriber promptly.",
              "New shedding after starting a weight-loss medicine: encourage a conversation with the prescriber or GP.",
              "Thinning at the hairline in someone who wears tight styles: suggest lower-tension styling and early assessment.",
            ],
          },
          { type: "pull", text: "A year of change is only useful if it alters what we do on a Tuesday afternoon." },
          {
            type: "callout",
            title: "Red flags that did not change",
            text: "Some signs call for prompt medical assessment in any year: sudden or rapidly progressing hair loss; a scalp that is painful, burning, scarred or shiny; pustules or weeping; hair loss with weight loss, fever or feeling unwell; and any mention of thoughts of self-harm. Refer to a GP or dermatologist, and direct anyone at immediate risk to urgent help.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "How well do you know 2026?",
        intro: "Three questions drawn from the year's verified facts. Choose an answer to see the explanation.",
        blocks: [
          {
            type: "quiz",
            question: "Which medicine did NICE recommend in July 2026 for adults with severe alopecia areata?",
            options: ["Baricitinib", "Deuruxolitinib", "Clascoterone", "Dutasteride"],
            answer: 1,
            explain:
              "NICE's final guidance TA1178, published on 15 July 2026, recommends deuruxolitinib for adults with severe alopecia areata. It is the second medicine NICE has recommended for the condition, after ritlecitinib in 2024.",
          },
          {
            type: "quiz",
            question: "When did the Scottish Parliament pass its law on non-surgical cosmetic procedures?",
            options: ["19 January 2026", "17 March 2026", "1 May 2026", "15 July 2026"],
            answer: 1,
            explain:
              "MSPs passed the bill on 17 March 2026. Its main requirements, including the ban for under-18s and healthcare oversight in registered premises, are expected to apply from September 2027.",
          },
          {
            type: "quiz",
            question: "What did the MHRA change about finasteride 1 mg in May 2026?",
            options: [
              "It withdrew the medicine from the UK market",
              "It made the medicine available without a prescription",
              "It updated product information to say sexual dysfunction may contribute to mood disorders",
              "It restricted the medicine to people over 50",
            ],
            answer: 2,
            explain:
              "The MHRA updated product information to make clear that sexual dysfunction may contribute to mood disorders, added a precautionary warning on mood to dutasteride, and kept the patient alert cards introduced in 2024.",
          },
        ],
      },
    ],
    sources: [
      SRC.mhraDeuruxolitinib,
      SRC.niceDeuruxolitinib,
      SRC.fdaBaricitinib,
      SRC.bjdAudit,
      SRC.mhraFinasteride,
      SRC.bmjGlp1,
      SRC.scotland,
      SRC.nhbfAesthetics,
      SRC.asa,
      SRC.oxybenzone,
      SRC.omnibus,
      SRC.formaldehydeEu,
      SRC.formaldehydeEuSummary,
      SRC.irishFillers,
      SRC.iotPresident,
      SRC.iotNcfe,
      SRC.iotConference,
      SRC.glp1Review,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Cosmetic, 2026
  // ─────────────────────────────────────────────────────────────
  {
    number: 202602,
    slug: "2026-cosmetic",
    title: "Cosmetic, 2026",
    fade: "New rules at the chair.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2026 for head spa therapists, stylists and cosmetic practitioners, from new law and advertising guidance to ingredient limits, and the education that change now asks of us.",
    coverImageKey: "ed18",
    coverTone: "dark",
    audience: ["cosmetic"],
    published: "2026-09-30",
    series: "archive",
    period: "2026",
    focus: "cosmetic",
    pages: [
      {
        kind: "letter",
        title: "Looking back from the chair",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2026 from the cosmetic side of hair and scalp care. It is part of Four years in review, a retrospective series published on 30 September 2026. Trichozette is new, so this is not an archive of old issues but a single, considered account of the year, with sources listed at the end.",
          },
          {
            type: "p",
            text: "For head spa therapists, stylists, barbers and cosmetic practitioners, 2026 was a year in which the rules caught up with the work. Scotland passed a law on non-surgical procedures that reaches treatments some scalp clinics offer. The advertising regulator explained how hair-loss claims should be made. Ingredient limits changed in Great Britain and across the EU, which matters for anyone who retails products in Ireland as well as in Britain.",
          },
          {
            type: "p",
            text: "It was also a year in which clients' medicines began to show up at the basin. The evidence linking weight-loss medicines to shedding grew, and the cosmetic professional is often the first person to notice. That makes observation, record-keeping and referral more important than ever.",
          },
          {
            type: "p",
            text: "None of this is meant to alarm. Most of what changed rewards good practice that many members already follow. Read the articles, try the questions at the end, and bring your own experience of the year to the community.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Regulation",
        title: "The rulebook moved",
        standfirst:
          "Scotland legislated, England kept drafting, Ireland kept debating and the advertising regulator spoke plainly about hair loss. What 2026 changed for the cosmetic practitioner.",
        imageKey: "ed07",
        blocks: [
          {
            type: "p",
            text: "For years, the regulation of non-surgical cosmetic treatments in the UK and Ireland has been discussed more than it has been decided. In 2026, one nation decided, and the others moved closer. For anyone whose treatment menu has grown beyond cutting, colouring and cleansing, it was a year to pay attention.",
          },
          { type: "h", text: "Scotland passes its law" },
          {
            type: "p",
            text: "On 17 March 2026 the Scottish Parliament passed the Non-surgical Procedures and Functions of Medical Reviewers (Scotland) Bill. The treatments it covers include botulinum toxin, dermal fillers, laser treatments, chemical peels and microneedling. They will be banned for anyone under 18, and restricted to registered settings such as clinics registered with Healthcare Improvement Scotland, with a professional registered with the GMC, NMC, GDC or GPhC on site. The main requirements are expected to apply from September 2027.",
          },
          {
            type: "p",
            text: "Microneedling is the item to note. Some head spas and scalp clinics offer it as a scalp treatment. If you practise in Scotland and your menu includes anything that pierces the skin, now is the time to find out how the new framework applies to you, rather than in the summer of 2027.",
          },
          {
            type: "p",
            text: "Before the vote, in February, the National Hair & Beauty Federation set out the sector's position. It supported regulation that improves consumer safety but argued that standards should rest on demonstrated competence rather than professional background alone, and asked for portfolio routes, affordable supervision models, transitional support and consistency across the UK.",
          },
          { type: "h", text: "England and Ireland" },
          {
            type: "p",
            text: "England's licensing scheme remained in development during 2026. The approach set out by government, as summarised by the NHBF, is tiered: the highest-risk procedures restricted to qualified healthcare professionals in settings registered with the Care Quality Commission, and lower-risk procedures under local authority licensing, with the highest-risk treatments prioritised first. In Ireland, the Irish College of Aesthetic Medicine warned in February that the law does not define who is appropriately trained to inject dermal fillers, and in September renewed its call for safeguards.",
          },
          { type: "pull", text: "In 2026, one nation decided, and the others moved closer." },
          { type: "h", text: "What you may say about hair loss" },
          {
            type: "p",
            text: "On 9 July the ASA and CAP published guidance on advertising hair-loss products and services. The points most relevant to the cosmetic chair are these.",
          },
          {
            type: "list",
            items: [
              "Claims to prevent, cure or reverse hair loss are medicinal and need a marketing authorisation.",
              "Claims such as reduces hair loss or strengthens hair may be acceptable with robust evidence.",
              "Ads should not blur different types of hair loss, such as alopecia areata, telogen effluvium and androgenetic alopecia.",
              "Before-and-after images must show genuine, typical outcomes.",
              "Testimonials do not replace clinical evidence.",
            ],
          },
          {
            type: "callout",
            title: "A quick audit",
            text: "Read your website, booking pages and last month of social posts as if you were the regulator. Remove any claim that a treatment prevents, cures or reverses hair loss, and check that every image reflects a typical result.",
          },
          {
            type: "reveal",
            prompt: "Can a salon advertise a scalp treatment by saying it treats telogen effluvium?",
            answer:
              "The ASA guidance notes that products cannot treat chronic telogen effluvium and warns against generalising across types of hair loss. A claim to treat a hair-loss condition would be medicinal. Describe what the service does for the scalp and hair, and refer anyone who is shedding.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Ingredients",
        title: "What is in the bottle",
        standfirst:
          "Three ingredient changes took effect in 2026, and a fourth failed to arrive in the United States. What retailers and colourists in Britain and Ireland need to know.",
        imageKey: "ed10",
        blocks: [
          {
            type: "p",
            text: "Salons are retailers as well as service providers. The products on your shelves and in your back bar are governed by cosmetic law, and in 2026 that law changed in several places at once. Because Britain and the EU now set their rules separately, a salon group with sites in both Britain and Ireland, or a business that buys stock from the EU, needs to keep both sets in view.",
          },
          { type: "h", text: "Great Britain: oxybenzone" },
          {
            type: "p",
            text: "On 21 January 2026 new concentration limits for the UV filter oxybenzone, also listed as benzophenone-3, came into force in Great Britain, following scientific advice about potential risks to health. Face, hand and lip products and general skin products have their own higher limits. All other cosmetic products, which includes hair products that carry UV protection, are limited to 0.5%. Products placed on the market before 21 January could be sold until 21 July 2026.",
          },
          { type: "h", text: "The EU: Omnibus VIII and formaldehyde" },
          {
            type: "p",
            text: "In the EU, including Ireland, Commission Regulation (EU) 2026/78, known as Omnibus Act VIII, applied from 1 May 2026. It adds 18 substances classified as carcinogenic, mutagenic or toxic to reproduction to the lists of prohibited or restricted cosmetic ingredients. The HPRA notes there is no sell-through period, so affected products had to leave the shelves before that date.",
          },
          {
            type: "p",
            text: "Separately, 31 July 2026 marked the end of the transition under Regulation (EU) 2022/1181. Products containing formaldehyde releasers must now carry the warning releases formaldehyde when the formaldehyde released in the finished product exceeds 0.001%, far lower than the previous 0.05% threshold. Older stock labelled under the old threshold could be made available only until that date.",
          },
          {
            type: "list",
            items: [
              "Ask each supplier to confirm, in writing, that products meet the rules where you sell them.",
              "Check UV-protecting hair products for oxybenzone if you retail in Great Britain.",
              "Read labels for the releases formaldehyde warning if you retail in Ireland.",
              "Keep supplier confirmations with your product records.",
            ],
          },
          { type: "h", text: "Straighteners and smoothing treatments" },
          {
            type: "p",
            text: "In the United States, the FDA missed its 31 December 2025 target to propose a ban on formaldehyde and formaldehyde-releasing chemicals in hair straightening and smoothing products, after several earlier delays, and said the rule remained a priority. The concern centres on cancer risk and on the heavy marketing of these products to Black women. In Britain and Ireland, the practical lesson for stylists is to know exactly what is in any smoothing product you use, to read its safety information and to work with good ventilation.",
          },
          { type: "pull", text: "Salons are retailers as well as service providers." },
          {
            type: "callout",
            title: "Why this matters at the basin",
            text: "Ingredient rules exist because of safety evidence. If a client reports stinging, burning or a reaction after a service or product, stop, record what was used and suggest the client sees a pharmacist or GP. Report suspected reactions to the product's supplier.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "Cosmetic 2026 at a glance",
        rows: [
          { label: "5 January", value: "Reports confirm the US FDA missed its 31 December 2025 target to propose a ban on formaldehyde in hair straighteners." },
          { label: "21 January", value: "New oxybenzone limits for cosmetic products take effect in Great Britain." },
          { label: "3 February", value: "Irish doctors and politicians call for regulation of who may inject dermal fillers." },
          { label: "11 February", value: "The NHBF sets out the hair and beauty sector's position on Scotland's non-surgical bill." },
          { label: "9 March", value: "The European Commission reports on an EU market surveillance campaign that tested hyaluronic acid dermal fillers." },
          { label: "17 March", value: "The Scottish Parliament passes its law on non-surgical cosmetic procedures, including microneedling." },
          { label: "1 May", value: "Omnibus Act VIII applies across the EU, with no sell-through period." },
          { label: "9 July", value: "The ASA and CAP publish guidance on advertising hair-loss products and services." },
          { label: "31 July", value: "The EU transition ends for the lower formaldehyde-releaser warning threshold." },
          { label: "22 September", value: "The Irish College of Aesthetic Medicine renews its call for safeguards on injectables." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed15",
        caption:
          "The cosmetic professional sees the scalp more often than anyone else. In 2026 that made careful observation, and a good referral route, part of the job.",
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Head spa, shedding and where your role ends",
        standfirst:
          "Scalp care kept growing in 2026, and so did the number of clients arriving with questions about their hair. The education every cosmetic practitioner now needs.",
        imageKey: "ed02",
        blocks: [
          {
            type: "p",
            text: "Scalp care has moved from an add-on to a service in its own right. Market research published by Kline in March 2026, based on US salon data, found scalp treatment services grew by 9% in the first three quarters of 2025 compared with the year before, and described head spas as gaining ground in premium salons and dedicated scalp studios. The figures are American, but anyone who has watched treatment menus in Britain and Ireland will recognise the direction.",
          },
          {
            type: "p",
            text: "More scalp appointments mean more opportunities to notice change, and more clients who ask what their scalp or hair is telling them. That is a responsibility as well as an opportunity.",
          },
          { type: "h", text: "The shedding client" },
          {
            type: "p",
            text: "In July The BMJ published a study of adults with type 2 diabetes that found GLP-1 receptor agonists were associated with a higher risk of non-scarring hair loss than two other types of diabetes medicine. An April systematic review of 24 studies described telogen effluvium, a temporary, diffuse shedding that follows a physical or psychological stress, as the most likely mechanism, linked to rapid weight loss and nutrition rather than direct harm from the drug.",
          },
          {
            type: "p",
            text: "Telogen effluvium is worth understanding. Each hair follicle cycles through growth, transition and rest. A significant stress can push more follicles into the resting phase at once, and the shedding usually shows two to three months later. That delay is why clients rarely connect the two, and why a gentle question about recent illness, childbirth, weight change or new medicines is useful.",
          },
          { type: "pull", text: "More scalp appointments mean more opportunities to notice change." },
          { type: "h", text: "The tension question" },
          {
            type: "p",
            text: "A pilot study published in August 2026 tested a short classroom programme on traction alopecia, the hair loss caused by prolonged pulling from tight styles. Awareness rose sharply after the session, but the authors noted it did not consistently translate into intent to change styling. The lesson for stylists is that information alone is rarely enough; practical alternatives, offered kindly and early, matter more.",
          },
          {
            type: "list",
            items: [
              "Notice and record, with consent, where thinning or shedding appears.",
              "Ask open questions about recent changes in health, weight and medicines, without guessing a cause.",
              "Offer lower-tension alternatives when the hairline looks strained.",
              "Suggest a trichologist or GP, and put the suggestion in writing if the client wishes.",
            ],
          },
          {
            type: "callout",
            title: "Where your role ends",
            text: "Cosmetic professionals do not diagnose or advise on medicines. Refer promptly to a GP or dermatologist if you see patches of complete hair loss, a red, scaly, weeping, painful or scarred scalp, pustules, or rapid loss, or if the client seems unwell or distressed.",
          },
          {
            type: "quiz",
            question: "A client mentions she started a weight-loss injection four months ago and is now shedding. What is the best response at the chair?",
            options: [
              "Tell her the injection is causing the shedding",
              "Suggest she stops the injection",
              "Acknowledge her concern, note what you see with her consent, and suggest she discusses it with the prescriber or GP",
              "Recommend a scalp treatment course to stop the shedding",
            ],
            answer: 2,
            explain:
              "You can listen, observe and refer, but you cannot name a cause or advise on a medicine. Any claim that a treatment will stop shedding would also be a medicinal claim.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Put it into practice",
        title: "Your 2026 checks",
        intro: "A checklist for the salon or head spa, and two questions to test what you have read.",
        blocks: [
          {
            type: "checklist",
            title: "Before the end of the year",
            items: [
              "Read your advertising against the ASA and CAP hair-loss guidance",
              "Check whether any treatment you offer pierces the skin and how the rules in your nation treat it",
              "Ask suppliers to confirm product compliance in Great Britain or the EU",
              "Check smoothing products for formaldehyde-releasing ingredients and review ventilation",
              "Agree a referral route with a local trichologist and know how clients can reach their GP",
              "Record scalp observations only with the client's consent",
            ],
          },
          {
            type: "quiz",
            question: "From what date did Omnibus Act VIII apply to cosmetic products sold in Ireland?",
            options: ["21 January 2026", "1 May 2026", "31 July 2026", "September 2027"],
            answer: 1,
            explain:
              "Commission Regulation (EU) 2026/78 applied across the EU from 1 May 2026, with no sell-through period for affected products.",
          },
          {
            type: "quiz",
            question: "Which of these treatments is named among those covered by Scotland's new law on non-surgical procedures?",
            options: ["Scalp massage", "Microneedling", "Blow-drying", "Hair colouring"],
            answer: 1,
            explain:
              "The treatments covered include microneedling, alongside toxin, fillers, laser treatments and chemical peels. Services that do not pierce or ablate the skin, such as massage and colouring, are not among those listed.",
          },
        ],
      },
    ],
    sources: [
      SRC.scotland,
      SRC.nhbfScotland,
      SRC.nhbfAesthetics,
      SRC.irishFillers,
      SRC.icam,
      SRC.euFillers,
      SRC.asa,
      SRC.oxybenzone,
      SRC.omnibus,
      SRC.formaldehydeEu,
      SRC.formaldehydeEuSummary,
      SRC.fdaFormaldehyde,
      SRC.kline,
      SRC.bmjGlp1,
      SRC.glp1Review,
      SRC.traction,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Clinical, 2026
  // ─────────────────────────────────────────────────────────────
  {
    number: 202603,
    slug: "2026-clinical",
    title: "Clinical, 2026",
    fade: "Standards without statute.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2026 for trichologists and hair and scalp clinicians: a new President for the Institute, a proposed national database, new evidence on shedding and a wider set of medical options to refer towards.",
    coverImageKey: "ed04",
    coverTone: "dark",
    audience: ["clinical"],
    published: "2026-09-30",
    series: "archive",
    period: "2026",
    focus: "clinical",
    pages: [
      {
        kind: "letter",
        title: "Looking back from the clinic",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2026 from the trichology clinic. It is part of Four years in review, a retrospective series published on 30 September 2026. It is not a reprint of earlier issues, since Trichozette is new, but an account of the year with every factual claim sourced at the end.",
          },
          {
            type: "p",
            text: "Trichology is not statutorily regulated in the UK or Ireland. That makes the work of professional bodies, the quality of qualifications and the reliability of referral relationships central to how the profession is seen. In 2026 each of those moved forward. The Institute of Trichologists appointed a new President in January, its diploma kept its top inspection grade in April, and in June the conference at Whittlebury Park discussed a UK trichology database.",
          },
          {
            type: "p",
            text: "The clinical picture changed too. The evidence linking weight-loss medicines to shedding grew considerably, and the medical options for severe alopecia areata widened. Both make the trichologist's history-taking and referral judgement more valuable, not less.",
          },
          {
            type: "p",
            text: "We hope this edition is useful for revision as much as reading. The questions at the end are designed for that.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The profession",
        title: "A year of standards",
        standfirst:
          "Without statutory regulation, trichology relies on its professional bodies to set the bar. In 2026 the Institute of Trichologists raised it in three ways.",
        imageKey: "ed12",
        blocks: [
          {
            type: "p",
            text: "Anyone in the UK or Ireland may call themselves a trichologist. There is no statutory register, and the title is not protected in law. That is a neutral fact, but it has consequences. Clients and referrers must rely on membership of a professional body, the qualification behind it and the practitioner's own record. It is why the developments of 2026 matter beyond the membership lists.",
          },
          { type: "h", text: "A new President" },
          {
            type: "p",
            text: "On 19 January 2026, the day Trichollective's first conference met at Whittlebury Hall, the Institute of Trichologists announced the appointment of Dr Sharon Wong as its President. The Institute said the appointment reflected its aim of raising standards, strengthening professional recognition and closer working between the hair, health and medical professions.",
          },
          { type: "h", text: "A qualification under inspection" },
          {
            type: "p",
            text: "In April the Institute reported that its Level 5 Diploma in Clinical Trichology had received the top grade at its annual NCFE inspection for the fourth consecutive year. For clients and referrers trying to judge a trichologist's training, external inspection of the qualification is one of the few objective signals available.",
          },
          { type: "h", text: "A proposed national database" },
          {
            type: "p",
            text: "The Institute's review of the Trichollective Conference at Whittlebury Park on 15 June described sessions on hair biology, patient perspectives, non-surgical hair restoration and research development. It also reported discussion of the development of a UK trichology database to support clinical decision-making and strengthen research within the profession. A session on the psychosocial impact of visible difference and on hair and scalp problems in epidermolysis bullosa, a rare genetic skin condition, showed how much trichology can offer people with complex needs.",
          },
          {
            type: "pull",
            text: "External inspection of the qualification is one of the few objective signals available.",
          },
          {
            type: "p",
            text: "A shared database would be a significant step for a profession whose evidence has often been held in individual case notes. It also raises questions every contributing practitioner should be ready to answer.",
          },
          {
            type: "list",
            items: [
              "Is client consent for data use recorded clearly and specifically?",
              "Are observations recorded in a consistent, structured way?",
              "Are photographs taken under repeatable conditions?",
              "Is data stored securely and in line with data protection law?",
            ],
          },
          {
            type: "callout",
            title: "Explaining your standing to a client",
            text: "A clear, neutral description helps: trichology is not statutorily regulated in the UK or Ireland; you hold a named qualification and belong to a named professional body; you do not diagnose medical disease or prescribe; and you will refer to a GP or dermatologist when that is needed.",
          },
          {
            type: "reveal",
            prompt: "Why might a national trichology database matter to a GP or dermatologist?",
            answer:
              "Structured, consistent data could strengthen the evidence behind trichological advice and make referral letters more useful, supporting the clinical decision-making the Institute described.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Shedding and the new medicines",
        standfirst:
          "The evidence linking GLP-1 medicines to hair loss grew in 2026. What it shows, what it does not, and how to take the history.",
        imageKey: "ed06",
        blocks: [
          {
            type: "p",
            text: "Few clinical questions changed as quickly in 2026 as the link between weight-loss medicines and hair loss. By the summer a trichologist could expect to meet clients taking GLP-1 receptor agonists who were worried about shedding, and to be asked whether the medicine was to blame.",
          },
          { type: "h", text: "What the evidence showed" },
          {
            type: "p",
            text: "In April a systematic review in Science Progress brought together 24 studies. It reported that semaglutide and tirzepatide showed the highest incidence of hair loss among GLP-1 therapies, that women appeared disproportionately affected, and that hair loss appeared to be dose-related for semaglutide. The authors suggested the main mechanism was telogen effluvium driven by rapid weight loss, calorie restriction and nutritional deficiency, rather than direct drug toxicity, and noted wide differences between studies and a lack of dermatological confirmation in most cases.",
          },
          {
            type: "p",
            text: "In July The BMJ published a target trial emulation using records from the University of Pennsylvania Health System. Adults with type 2 diabetes who started a GLP-1 receptor agonist had a higher risk of alopecia than those who started an SGLT-2 inhibitor or a DPP-4 inhibitor. The association was specific to non-scarring alopecia. The study was observational and could not assess severity, duration or reversibility.",
          },
          { type: "pull", text: "The medicine may be relevant, but it is rarely the whole story." },
          { type: "h", text: "Taking the history" },
          {
            type: "p",
            text: "Telogen effluvium typically appears two to three months after a trigger, as more follicles than usual move into the resting phase and are then shed. The medicine may be relevant, but it is rarely the whole story. A good history looks for every candidate trigger and for signs that something else is going on.",
          },
          {
            type: "list",
            items: [
              "Timing: when shedding began relative to starting treatment and to weight change.",
              "Pattern: diffuse shedding, or thinning concentrated at the crown or parting that may suggest androgenetic alopecia unmasked by shedding.",
              "Diet: how much and how varied the client is eating, and any restrictive eating.",
              "Other triggers: illness, surgery, childbirth, bereavement or other new medicines.",
              "Scalp: any inflammation, scaling or scarring that would point away from simple shedding.",
            ],
          },
          {
            type: "callout",
            title: "Stay within scope",
            text: "Do not advise a client to stop, change or start a prescribed medicine. Encourage them to discuss the shedding with the prescriber or GP, who can consider nutrition, blood tests and the treatment plan. Refer promptly if there is scarring, inflammation, rapid loss or any concern about disordered eating.",
          },
          {
            type: "quiz",
            question: "What did the April 2026 systematic review identify as the most likely mechanism for hair loss with GLP-1 therapies?",
            options: [
              "Scarring inflammation around the follicle",
              "Telogen effluvium linked to rapid weight loss and nutrition",
              "Direct destruction of hair follicles by the drug",
              "An autoimmune reaction resembling alopecia areata",
            ],
            answer: 1,
            explain:
              "The authors pointed to telogen effluvium linked to rapid weight loss, calorie restriction and nutritional deficiency, rather than direct drug toxicity, while noting the limits of the evidence.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "Clinical 2026 at a glance",
        rows: [
          { label: "19 January", value: "The Institute of Trichologists announces Dr Sharon Wong as President. Trichollective meets at Whittlebury Hall." },
          { label: "17 March", value: "The MHRA approves deuruxolitinib for adults with severe alopecia areata." },
          { label: "8 April", value: "The Institute's Level 5 Diploma in Clinical Trichology receives the top NCFE grade for a fourth year." },
          { label: "17 April", value: "A systematic review of 24 studies on GLP-1 therapies and hair loss is published in Science Progress." },
          { label: "11 May", value: "The MHRA strengthens safety warnings for finasteride and dutasteride." },
          { label: "15 June", value: "The Trichollective Conference at Whittlebury Park discusses a UK trichology database." },
          { label: "9 July", value: "The ASA and CAP publish guidance on advertising hair-loss products and services." },
          { label: "15 July", value: "NICE recommends deuruxolitinib for adults with severe alopecia areata (TA1178)." },
          { label: "22 July", value: "The BMJ publishes a study linking GLP-1 receptor agonists to a higher risk of non-scarring hair loss." },
          { label: "14 August", value: "A pilot study of a traction alopecia prevention curriculum is published in the International Journal of Women's Dermatology." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed01",
        caption:
          "Tension can build quietly over years. Traction alopecia is preventable, and early advice is where trichology does some of its most useful work.",
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Traction, scarring and the case for early referral",
        standfirst:
          "New research on preventing traction alopecia, and a reminder of why early assessment matters most when hair loss may scar.",
        imageKey: "ed11",
        blocks: [
          {
            type: "p",
            text: "Some hair loss can recover; some cannot. The most important judgement a trichologist makes is often not what a condition is but how quickly it needs medical eyes. In 2026 new work on traction alopecia was a reminder that prevention and early action are where the difference is made.",
          },
          { type: "h", text: "Traction alopecia: awareness is not enough" },
          {
            type: "p",
            text: "In August the International Journal of Women's Dermatology published a pilot study of a 45-minute, culturally tailored programme on traction alopecia delivered in a diverse urban middle school in the United States. Before the session, only 11.4% of students had heard of traction alopecia; afterwards, 91.4% reported better understanding. Yet the authors noted that increased awareness did not consistently translate into an intention to change styling.",
          },
          {
            type: "p",
            text: "That finding is familiar from the clinic. Traction alopecia arises from prolonged pulling on the hair from tight braids, weaves, extensions, ponytails and similar styles. Early on it is usually reversible if the tension stops; over time it can become permanent. Advice works best when it respects why a client chooses a style and offers a practical alternative rather than a prohibition.",
          },
          { type: "pull", text: "Some hair loss can recover; some cannot." },
          { type: "h", text: "When hair loss may scar" },
          {
            type: "p",
            text: "Scarring alopecias, such as frontal fibrosing alopecia and lichen planopilaris, destroy follicles, and lost hair cannot regrow. They need prompt assessment by a dermatologist. A trichologist is well placed to notice the signs, and trichoscopy can help describe them, but diagnosis and treatment belong in medical hands.",
          },
          {
            type: "list",
            items: [
              "Loss of follicle openings, or smooth, shiny skin where hair used to be.",
              "Redness or scaling around individual follicles.",
              "Itching, burning, pain or tenderness in an area of loss.",
              "A receding frontal hairline, sometimes with loss of the eyebrows.",
              "Pustules, crusting or tufts of several hairs from one opening.",
            ],
          },
          {
            type: "callout",
            title: "Refer the same week",
            text: "Where you see signs that suggest scarring, refer to a GP with a request for dermatology assessment, or directly to a dermatologist where that route exists. Describe what you saw, where, and for how long. Do not promise that hair will return.",
          },
          {
            type: "quiz",
            question: "What did the August 2026 pilot study find about a traction alopecia education session?",
            options: [
              "It had no effect on students' understanding",
              "Understanding improved, but awareness did not consistently lead to an intent to change styling",
              "Every student stopped wearing tight styles",
              "It showed traction alopecia is always permanent",
            ],
            answer: 1,
            explain:
              "Most students reported better understanding, but the authors noted awareness did not consistently translate into behavioural intent, which is why practical alternatives matter.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Clinical reasoning",
        title: "Test your judgement",
        intro: "Three questions on the clinical changes of 2026, and a checklist for your next consultation.",
        blocks: [
          {
            type: "quiz",
            question: "Which statement about trichology in the UK and Ireland is accurate?",
            options: [
              "It is regulated by the GMC",
              "It is not statutorily regulated, so professional bodies and qualifications carry weight",
              "It is regulated by the HCPC",
              "It became statutorily regulated in 2026",
            ],
            answer: 1,
            explain:
              "Trichology is not statutorily regulated in the UK or Ireland. Membership of a professional body and an inspected qualification help clients and referrers judge a practitioner.",
          },
          {
            type: "quiz",
            question: "A client with extensive patchy hair loss asks about the medicine NICE recommended in July 2026. What should a trichologist do?",
            options: [
              "Explain how to obtain it online",
              "Say that nothing can be done",
              "Refer to a GP with a view to dermatology assessment, where suitability can be discussed",
              "Suggest a supplement instead",
            ],
            answer: 2,
            explain:
              "Deuruxolitinib is a prescription-only medicine recommended for adults with severe alopecia areata. Suitability is a specialist decision, so the right step is a timely referral.",
          },
          {
            type: "quiz",
            question: "In The BMJ's July 2026 study, which type of hair loss was specifically associated with GLP-1 receptor agonists?",
            options: ["Scarring alopecia", "Non-scarring alopecia", "Traction alopecia", "Hair shaft breakage"],
            answer: 1,
            explain:
              "The association was specific to non-scarring alopecia, where follicles remain intact. The study could not assess severity, duration or reversibility.",
          },
          {
            type: "checklist",
            title: "At your next consultation",
            items: [
              "Ask about new medicines, including weight-loss treatments, and recent weight change",
              "Ask about styling habits and tension at the hairline",
              "Look for signs of scarring or inflammation",
              "Record consent before photographing or recording data",
              "Explain your scope and when you will refer",
            ],
          },
        ],
      },
    ],
    sources: [
      SRC.iotPresident,
      SRC.iotNcfe,
      SRC.iotConference,
      SRC.glp1Review,
      SRC.bmjGlp1,
      SRC.traction,
      SRC.mhraDeuruxolitinib,
      SRC.niceDeuruxolitinib,
      SRC.mhraFinasteride,
      SRC.asa,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Medical, 2026
  // ─────────────────────────────────────────────────────────────
  {
    number: 202604,
    slug: "2026-medical",
    title: "Medical, 2026",
    fade: "New options, new warnings.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2026 for GPs, dermatologists and aesthetic doctors and nurses: a second NHS medicine for severe alopecia areata, strengthened finasteride warnings, new evidence on GLP-1 medicines and hair, and tighter oversight of injectables.",
    coverImageKey: "ed14",
    coverTone: "dark",
    audience: ["medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2026",
    focus: "medical",
    pages: [
      {
        kind: "letter",
        title: "Looking back from the consulting room",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2026 from the medical side of hair and scalp care. It is part of Four years in review, a retrospective series published on 30 September 2026. Trichozette is new, so this is a single account of the year rather than a collection of earlier issues, and the sources behind every claim are listed at the end.",
          },
          {
            type: "p",
            text: "For clinicians, 2026 was a year of more choice and more caution. Adults with severe alopecia areata gained a second NICE-recommended medicine. Product information for finasteride and dutasteride was strengthened. A large observational study added hair loss to the conversations worth having when GLP-1 treatment begins. In aesthetics, Scotland legislated, and doctors in Ireland called for safeguards on injectables.",
          },
          {
            type: "p",
            text: "Many of the people who first raise these concerns will not be in your consulting room. They will be at the salon basin or in a trichology clinic. The value of a community like ours is that those conversations reach you sooner and better described.",
          },
          {
            type: "p",
            text: "This edition does not give doses or treatment protocols. It sets out what changed, where to read the primary guidance and how the other two disciplines are likely to meet the same patients.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Alopecia areata",
        title: "A second NHS option for severe alopecia areata",
        standfirst:
          "Deuruxolitinib was licensed in March and recommended by NICE in July. What changed, what an audit found about ritlecitinib, and what the US did for adolescents.",
        imageKey: "ed08",
        blocks: [
          {
            type: "p",
            text: "Until 2024 there was no NICE-recommended medicine for severe alopecia areata. By the end of July 2026 there were two. For a condition that carries a heavy psychological burden and that many patients have been told cannot be treated, that is a real shift, and one that primary care needs to know about.",
          },
          { type: "h", text: "Licensing and appraisal" },
          {
            type: "p",
            text: "On 17 March 2026 the MHRA approved deuruxolitinib, an oral JAK inhibitor, for adults with severe alopecia areata. The approval rested on the THRIVE-AA1 and THRIVE-AA2 phase 3 trials, which together enrolled 1,223 people aged 18 to 65 with at least 50% scalp hair loss lasting more than six months. The most common side effects reported in at least 5% of patients were headache, acne and raised creatine phosphokinase.",
          },
          {
            type: "p",
            text: "NICE published final guidance, TA1178, on 15 July 2026, recommending deuruxolitinib for adults with severe alopecia areata, including alopecia totalis and universalis. Alopecia UK reported that eligible patients in England and Wales should be able to discuss it with specialist dermatology teams from mid-August, though local implementation may vary, and that the Scottish Medicines Consortium had not yet decided. Ritlecitinib, recommended by NICE in 2024, remains the other option.",
          },
          { type: "h", text: "How prescribing is going" },
          {
            type: "p",
            text: "An audit presented in the British Journal of Dermatology in June examined ritlecitinib prescribing across six regional dermatology centres. It found prescribing largely aligned with national guidance, but identified room to improve psychological assessment and the consistent use of severity scoring at the points where decisions to continue are made.",
          },
          {
            type: "pull",
            text: "By the end of July 2026 there were two.",
          },
          { type: "h", text: "Across the Atlantic" },
          {
            type: "p",
            text: "On 28 September the US FDA approved baricitinib for people aged 12 and over with severe alopecia areata, based on the BRAVE-AA-PEDS trial. It is the second JAK inhibitor available to adolescents in the US, after ritlecitinib. The decision does not change UK licensing, and the medicine carries a boxed warning in the US covering serious infections, mortality, malignancy, major cardiovascular events and thrombosis.",
          },
          {
            type: "list",
            items: [
              "Recognise severe disease and refer promptly to dermatology.",
              "Ask about mood and quality of life, and offer psychological support.",
              "Explain that JAK inhibitors need specialist assessment and monitoring.",
              "Point patients to reputable support, such as Alopecia UK.",
            ],
          },
          {
            type: "callout",
            title: "For primary care",
            text: "The decision on JAK inhibitor treatment is made by specialists. The most useful thing a GP can do is refer patients with severe or rapidly progressing alopecia areata in good time, with a note of extent, duration and psychological impact.",
          },
          {
            type: "reveal",
            prompt: "What did the June 2026 audit suggest services could do better?",
            answer:
              "Psychological assessment, and the consistent use of severity scoring at treatment checkpoints to inform decisions about continuing.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Safety",
        title: "Finasteride, dutasteride and the words we use",
        standfirst:
          "The MHRA strengthened its warnings in May, and the advertising regulator set out how prescription-only hair-loss medicines may and may not be promoted.",
        imageKey: "ed17",
        blocks: [
          {
            type: "p",
            text: "Finasteride has been part of hair-loss care for decades, and its safety information has been revisited more than once. In 2026 the UK regulator revisited it again, and the advertising regulator addressed how it is marketed. Together they shape both the prescribing conversation and the way clinics present themselves.",
          },
          { type: "h", text: "What the MHRA changed" },
          {
            type: "p",
            text: "On 11 May 2026 the MHRA updated the product information for finasteride 1 mg, used for male pattern hair loss, to make clear that sexual dysfunction may contribute to mood disorders and can occur with or without mood changes. It added a precautionary warning to dutasteride noting that mood alterations have been reported with finasteride, a medicine of the same class. The changes followed a European review and advice from the Commission on Human Medicines. The patient alert cards introduced in 2024 remain in place.",
          },
          {
            type: "list",
            items: [
              "Prescribers should discuss the safety information so that patients can make an informed decision.",
              "Patients who experience depression or suicidal thoughts should stop treatment and seek medical advice.",
              "Suspected adverse effects should be reported through the Yellow Card scheme.",
            ],
          },
          {
            type: "pull",
            text: "They shape both the prescribing conversation and the way clinics present themselves.",
          },
          { type: "h", text: "What the ASA said" },
          {
            type: "p",
            text: "On 9 July the ASA and CAP published guidance on advertising hair-loss products and services. Prescription-only medicines, including finasteride and oral minoxidil, must not be advertised to the public. Website homepages should not name them, and ads must not give the impression that consumers can choose or access prescription treatments directly. Clinics may advertise a hair-loss consultation. Celebrities may not promote medicines, before-and-after images must reflect typical outcomes, and testimonials do not replace clinical evidence.",
          },
          {
            type: "p",
            text: "The guidance also noted common failings in evidence, including reliance on study abstracts rather than full data, unrelated studies and small uncontrolled samples. That is a useful checklist for any clinic reviewing its own claims.",
          },
          {
            type: "callout",
            title: "The conversation beyond the consulting room",
            text: "Patients may mention low mood or sexual side effects to a stylist or trichologist before they tell a prescriber. It helps when colleagues in those disciplines know to encourage a prompt conversation with the prescriber, and when your practice makes that conversation easy.",
          },
          {
            type: "quiz",
            question: "Under the 2026 ASA and CAP guidance, what may a hair-loss clinic advertise to the public?",
            options: [
              "Named prescription-only medicines on its homepage",
              "A hair-loss consultation",
              "A celebrity endorsement of minoxidil",
              "Testimonials as proof that treatment works",
            ],
            answer: 1,
            explain:
              "Clinics may advertise consultations but not prescription-only medicines. Celebrities may not promote medicines, and testimonials do not replace clinical evidence.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "Medical 2026 at a glance",
        rows: [
          { label: "17 March", value: "The MHRA approves deuruxolitinib for adults with severe alopecia areata. Scotland passes its law on non-surgical procedures." },
          { label: "17 April", value: "A systematic review in Science Progress examines 24 studies on GLP-1 therapies and hair loss." },
          { label: "21 April", value: "Twelve-month phase 3 data are reported for topical clascoterone in male pattern hair loss." },
          { label: "27 April", value: "Phase 3 results are reported for an extended-release oral minoxidil in development for male pattern hair loss." },
          { label: "11 May", value: "The MHRA strengthens safety warnings for finasteride and dutasteride." },
          { label: "June", value: "A BJD audit finds ritlecitinib prescribing largely aligned with national guidance." },
          { label: "9 July", value: "The ASA and CAP publish guidance on advertising hair-loss products and services." },
          { label: "15 July", value: "NICE publishes TA1178, recommending deuruxolitinib." },
          { label: "22 July", value: "The BMJ links GLP-1 receptor agonists to a higher risk of non-scarring alopecia in type 2 diabetes." },
          { label: "28 September", value: "The US FDA approves baricitinib for adolescents with severe alopecia areata." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed03",
        caption:
          "New evidence and new medicines arrived in 2026. The questions patients bring about their hair arrived faster still.",
      },
      {
        kind: "article",
        kicker: "Evidence and pressures",
        title: "The pipeline, the injections and the injectables",
        standfirst:
          "Two androgenetic alopecia candidates reported phase 3 data, GLP-1 medicines came under scrutiny for hair loss, and oversight of aesthetic injectables tightened.",
        blocks: [
          {
            type: "p",
            text: "Beyond alopecia areata, three threads ran through the medical year: new candidates for androgenetic alopecia, the hair effects of GLP-1 medicines and the regulation of aesthetic injectables. Patients are likely to ask about all three.",
          },
          { type: "h", text: "The androgenetic alopecia pipeline" },
          {
            type: "p",
            text: "In April Cosmo Pharmaceuticals reported 12-month results from the SCALP 1 and SCALP 2 phase 3 trials of topical clascoterone solution, which enrolled 1,465 men at 51 centres in the US and Europe. Men who continued treatment had better target area hair counts than those switched to placebo at six months, and long-term safety was reported as comparable to vehicle. The company plans to apply to the FDA and the EMA in early 2027. Later that month Veradermics reported phase 3 results for VDPHL01, an extended-release oral minoxidil, showing more hair growth than placebo at six months with no cardiac adverse events reported.",
          },
          {
            type: "p",
            text: "Neither product was licensed for hair loss in the UK or EU by September 2026. Patients who ask should be told that both remain investigational.",
          },
          { type: "h", text: "GLP-1 medicines and hair" },
          {
            type: "p",
            text: "The BMJ's July target trial emulation, using records from the University of Pennsylvania Health System, found adults with type 2 diabetes who started a GLP-1 receptor agonist had a higher risk of alopecia than those starting an SGLT-2 or DPP-4 inhibitor, around 7 compared with 5 cases per 1,000 person-years against SGLT-2 inhibitors. The association was specific to non-scarring alopecia. An April systematic review pointed to telogen effluvium linked to rapid weight loss and nutrition as the likely mechanism.",
          },
          {
            type: "pull",
            text: "Patients who ask should be told that both remain investigational.",
          },
          { type: "h", text: "Injectables under scrutiny" },
          {
            type: "list",
            items: [
              "Scotland's law, passed on 17 March, will require a GMC, NMC, GDC or GPhC registrant on site for covered procedures in registered settings, with main requirements expected from September 2027.",
              "An EU market surveillance campaign reported in March tested 17 hyaluronic acid dermal filler samples from nine countries; all passed sterility testing, but four lacked required warnings, markings or instructions.",
              "In September the Irish College of Aesthetic Medicine called for safeguards, citing HPRA detentions of about 10,000 dosage units of botulinum toxin, hyaluronidase and lidocaine in the three years to 2024.",
            ],
          },
          {
            type: "callout",
            title: "Counselling at the start of GLP-1 treatment",
            text: "It is reasonable to mention that some people notice temporary shedding during rapid weight loss, to support adequate nutrition and to invite patients to report hair changes. Shedding with scalp inflammation, scarring or patchy loss needs assessment in its own right.",
          },
          {
            type: "quiz",
            question: "What was the regulatory status of clascoterone for hair loss in the UK in September 2026?",
            options: [
              "Licensed and recommended by NICE",
              "Available over the counter",
              "Investigational, with applications to the FDA and EMA planned for early 2027",
              "Withdrawn on safety grounds",
            ],
            answer: 2,
            explain:
              "Clascoterone reported phase 3 data in 2026 but was not licensed for hair loss in the UK or EU. The company plans FDA and EMA applications in early 2027.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The medical year in questions",
        intro: "Three questions on the medical changes of 2026, and a checklist for the clinic.",
        blocks: [
          {
            type: "quiz",
            question: "Which trials supported the MHRA's approval of deuruxolitinib?",
            options: ["BRAVE-AA-PEDS", "THRIVE-AA1 and THRIVE-AA2", "SCALP 1 and SCALP 2", "ALLEGRO"],
            answer: 1,
            explain:
              "The THRIVE-AA1 and THRIVE-AA2 phase 3 trials enrolled 1,223 adults with severe alopecia areata. BRAVE-AA-PEDS supported the US adolescent approval of baricitinib, and SCALP 1 and 2 studied clascoterone.",
          },
          {
            type: "quiz",
            question: "Which medicine received a new precautionary warning about mood changes from the MHRA in May 2026?",
            options: ["Minoxidil", "Dutasteride", "Ritlecitinib", "Spironolactone"],
            answer: 1,
            explain:
              "The MHRA added a precautionary warning to dutasteride, noting that mood alterations have been reported with finasteride, a medicine of the same class.",
          },
          {
            type: "quiz",
            question: "What did Alopecia UK report about Scotland when NICE recommended deuruxolitinib?",
            options: [
              "The Scottish Medicines Consortium had already rejected it",
              "The Scottish Medicines Consortium had not yet made a decision",
              "Scotland automatically follows NICE guidance",
              "It was only available in Scotland",
            ],
            answer: 1,
            explain:
              "At the time of NICE's decision, the Scottish Medicines Consortium had not yet made a decision on deuruxolitinib.",
          },
          {
            type: "checklist",
            title: "For the clinic this autumn",
            items: [
              "Update patient information on finasteride and dutasteride",
              "Review referral criteria for severe alopecia areata",
              "Mention possible shedding when starting GLP-1 treatment",
              "Check your website against the ASA and CAP hair-loss guidance",
              "Report suspected adverse effects through the Yellow Card scheme",
            ],
          },
        ],
      },
    ],
    sources: [
      SRC.mhraDeuruxolitinib,
      SRC.niceDeuruxolitinib,
      SRC.bjdAudit,
      SRC.fdaBaricitinib,
      SRC.mhraFinasteride,
      SRC.asa,
      SRC.clascoterone,
      SRC.veradermics,
      SRC.bmjGlp1,
      SRC.glp1Review,
      SRC.scotland,
      SRC.euFillers,
      SRC.icam,
    ],
  },
];
