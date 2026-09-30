import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";

// Shared sources, reused across the 2025 volume.
const S = {
  ema: {
    label: "European Medicines Agency: Measures to minimise risk of suicidal thoughts with finasteride and dutasteride medicines (8 May 2025)",
    url: "https://www.ema.europa.eu/en/news/measures-minimise-risk-suicidal-thoughts-finasteride-dutasteride-medicines",
  },
  cpe: {
    label: "Community Pharmacy England: MHRA Drug Safety Update on finasteride and dutasteride (notes UK patient cards introduced in 2024)",
    url: "https://cpe.org.uk/our-news/mhra-drug-safety-update-finasteride-and-dutasteride-updated-safety-warnings/",
  },
  govuk: {
    label: "GOV.UK: Crackdown on unsafe cosmetic procedures to protect the public (6 August 2025)",
    url: "https://www.gov.uk/government/news/crackdown-on-unsafe-cosmetic-procedures-to-protect-the-public",
  },
  govscot: {
    label: "Scottish Government: Greater safety for non-surgical procedures (9 October 2025)",
    url: "https://www.gov.scot/news/greater-safety-for-non-surgical-procedures/",
  },
  hpraTpo: {
    label: "HPRA: TPO prohibited in cosmetics from 1 September 2025",
    url: "https://www.hpra.ie/news-events/news/article/tpo-added-to-european-union-list-of-prohibited-ingredients",
  },
  anses: {
    label: "Premium Beauty News: French agency confirms glyoxylic acid warning on hair straightening products (24 January 2025)",
    url: "https://www.premiumbeautynews.com/en/hair-straightening-french-agency,25110",
  },
  nhbf: {
    label: "National Hair & Beauty Federation: NHBF Industry Statistics 2025",
    url: "https://www.nhbf.co.uk/about-the-nhbf/campaigning-for-you/industry-research-reports-and-statistics/nhbf-industry-statistics/",
  },
  bjd2025: {
    label: "British Journal of Dermatology: BAD living guideline for managing people with alopecia areata 2025 (published online 14 November 2025)",
    url: "https://academic.oup.com/bjd/article/194/2/e56/8322888",
  },
  badPage: {
    label: "British Association of Dermatologists: living guideline for managing people with alopecia areata",
    url: "https://www.bad.org.uk/new-british-association-of-dermatologists-living-guideline-for-managing-people-with-alopecia-areata",
  },
  nihr: {
    label: "NIHR Innovation Observatory: Health Technology Briefing, deuruxolitinib for alopecia areata (April 2025)",
    url: "https://io.nihr.ac.uk/wp-content/uploads/2025/04/20545-Deuruxolitinib-for-Alopecia-Areata-V1.0-APR2025-NON-CONF.pdf",
  },
  alopeciaUk: {
    label: "Alopecia UK: FDA approves deuruxolitinib",
    url: "https://www.alopecia.org.uk/news/fda-approves-deuruxolitinib",
  },
  psaReview: {
    label: "Professional Standards Authority: Accredited Registers condition review, Institute of Trichologists (4 July 2025)",
    url: "https://www.professionalstandards.org.uk/sites/default/files/attachments/Condition%20Review%20Report%20-%20IOT%20-%20July%202025.pdf",
  },
  psaRegister: {
    label: "Professional Standards Authority: Institute of Trichologists accredited register",
    url: "https://www.professionalstandards.org.uk/organisations-we-oversee/find-a-register/institute-trichologists",
  },
  congress: {
    label: "Institute of Trichologists: World Congress of Trichology 2025",
    url: "https://trichologists.org.uk/trichology-world-congress-2025-home/",
  },
  iotSurvey: {
    label: "Institute of Trichologists: Patient Experience Survey results (1 October 2025)",
    url: "https://instituteoftrichologists.co.uk/we-are-delighted-to-share-the-results-of-the-recent-iot-patient-experience-survey/",
  },
  glp1Review: {
    label: "Cureus: Hair loss associated with GLP-1 receptor agonist use, a systematic review (16 September 2025)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12530271/",
  },
  glp1Letter: {
    label: "Journal of Cosmetic Dermatology: Alopecia and semaglutide, connecting the dots for patient safety (15 March 2025)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11909624/",
  },
  kline: {
    label: "Kline: The scalp care boom (US salon data, Q1 to Q3 2025)",
    url: "https://klinegroup.com/beauty-and-wellbeing/professional-hair-care/the-scalp-care-boom-are-brands-unlocking-growth-from-the-root-up/",
  },
  asa: {
    label: "ASA and CAP: Advertising products and services for hair loss",
    url: "https://www.asa.org.uk/news/keep-your-ads-a-cut-above-the-rest-advertising-products-and-services-for-hair-loss.html",
  },
};

export const archive2025: Edition[] = [
  // ─────────────────────────────────────────────────────────────
  // 2025 in review
  // ─────────────────────────────────────────────────────────────
  {
    number: 202501,
    slug: "2025-in-review",
    title: "2025 in review",
    fade: "The year the rules caught up.",
    theme: "Four years in review",
    standfirst:
      "A look back at the year that tightened the rules on cosmetic procedures, sharpened the warnings on finasteride and set out when to offer JAK inhibitors for alopecia areata.",
    coverImageKey: "ed09",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2025",
    focus: "review",
    pages: [
      {
        kind: "letter",
        title: "Looking back at 2025",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2025. Trichozette did not exist that year, and neither did Trichollective: our story begins with a conference at Whittlebury Hall in January 2026. But almost everything our members discussed in that first room had its roots in the twelve months before it, so we have gone back to see what really changed.",
          },
          {
            type: "p",
            text: "It is part of a retrospective series, Four years in review, published together in September 2026. Each year has four editions: this overview, and one each for the cosmetic, clinical and medical fields. Every factual claim is drawn from a regulator, a professional body, a journal or a reputable publication, and the sources are listed at the end.",
          },
          {
            type: "p",
            text: "2025 was a year in which the rules caught up with practice. Governments in England and Scotland set out how non-surgical cosmetic procedures would be regulated. Europe's medicines regulator confirmed a psychiatric side effect of finasteride. The British Association of Dermatologists updated its living guideline on alopecia areata. A French safety agency warned about an ingredient in hair straighteners, and the European Union banned a common gel-nail chemical.",
          },
          {
            type: "p",
            text: "None of these developments belongs to one discipline alone. A client who asks a stylist about a straightening treatment, a trichologist about shedding, or a GP about a hair-loss tablet deserves an answer that reflects what changed. We hope this volume helps, and that the quizzes at the back test you properly.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The year in brief",
        title: "The shifts that mattered",
        standfirst:
          "Across the salon, the clinic and the consulting room, 2025 was defined less by new treatments than by clearer rules about who may do what, and with what warnings.",
        imageKey: "ed04",
        blocks: [
          {
            type: "p",
            text: "If you had to summarise 2025 for hair and scalp professionals in one sentence, it would be this: regulators spent the year drawing lines. Some lines were about who may carry out a procedure, some about what a product may contain, and some about what a patient must be told before taking a medicine.",
          },
          { type: "h", text: "Who may do what" },
          {
            type: "p",
            text: "On 6 August 2025 the UK Government set out its plans for England. The highest-risk non-surgical procedures, such as the non-surgical Brazilian butt lift, would be restricted to qualified healthcare professionals working for providers registered with the Care Quality Commission. Botulinum toxin, lip fillers and facial dermal fillers would come under a local authority licensing system, with practitioners required to meet safety, training and insurance standards. The Government also planned restrictions on high-risk procedures for under-18s and promised a public consultation in early 2026.",
          },
          {
            type: "p",
            text: "Scotland moved in the same direction. On 9 October 2025 the Scottish Government introduced the Non-surgical Procedures and Functions of Medical Reviewers (Scotland) Bill, creating offences for providing such procedures outside premises where appropriate healthcare professionals are available, or to anyone under 18.",
          },
          { type: "h", text: "What goes into products" },
          {
            type: "list",
            items: [
              "In January 2025 the French agency ANSES concluded that it is highly probable that glyoxylic acid in hair-straightening products can cause acute kidney injury, advised avoiding such products and called for a European risk assessment.",
              "From 1 September 2025 the gel-nail ingredient TPO was prohibited in all cosmetic products sold in the European Union, including those for professional use, after its classification as a CMR substance.",
            ],
          },
          { type: "h", text: "What patients must be told" },
          {
            type: "p",
            text: "On 8 May 2025 the European Medicines Agency's safety committee confirmed suicidal thoughts as a side effect of finasteride tablets, with frequency unknown, and asked for a patient card in packs of the lower-strength tablet used for hair loss. It concluded that the benefits still outweigh the risks for approved uses. In the UK, patient cards had already been introduced in 2024.",
          },
          {
            type: "pull",
            text: "Regulators spent the year drawing lines: who may carry out a procedure, what a product may contain, and what a patient must be told.",
          },
          {
            type: "p",
            text: "For alopecia areata, the British Association of Dermatologists published its 2025 living guideline online on 14 November. It strongly recommends offering licensed oral JAK inhibitors to adults and to young people aged 12 and over with severe disease, and asks clinicians to discuss the medicines regulator's safety warnings with patients who are older or have relevant risk factors.",
          },
          { type: "h", text: "The professions themselves" },
          {
            type: "p",
            text: "Trichology remained outside statutory regulation in the UK and Ireland. The Institute of Trichologists, whose register is accredited by the Professional Standards Authority, held the World Congress of Trichology at the Royal College of Physicians in London on 28 and 29 September. The NHBF's 2025 statistics described a hair, barbering and beauty sector of about 50,400 registered businesses, most of them very small.",
          },
          {
            type: "callout",
            title: "Why it matters now",
            text: "Many of these changes are still being implemented. Licensing schemes, consultations and product rules announced in 2025 shape what members can offer, and what they must say, in 2026 and beyond.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "One year, three chairs",
        intro:
          "The same twelve months looked different from the salon, the trichology clinic and the consulting room. Here is what 2025 asked of each.",
        views: [
          {
            discipline: "cosmetic",
            heading: "In the salon and head spa",
            blocks: [
              {
                type: "p",
                text: "For cosmetic practitioners, 2025 was a year to read ingredient lists and scope statements more carefully. The warning from France about glyoxylic acid in straightening products, and the European ban on TPO in nail gels, were reminders that a product being on sale does not settle whether it is safe for every client or every setting.",
              },
              {
                type: "p",
                text: "The plans for England and the Bill in Scotland mostly concern injectables and higher-risk procedures rather than hair services. Even so, they signal where regulation is heading: towards training, insurance, premises standards and age limits. Salons and head spas that already work that way will find the transition easier.",
              },
              {
                type: "checklist",
                title: "A 2025 housekeeping list",
                items: [
                  "Check straightening products for glyoxylic acid and read the manufacturer's precautions",
                  "In Ireland, confirm that no nail products containing TPO remain in use",
                  "Review your insurance and training records",
                  "Keep a clear referral route to a trichologist or GP",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "In the trichology clinic",
            blocks: [
              {
                type: "p",
                text: "For trichologists, 2025 was about standards and evidence. The Professional Standards Authority reviewed the Institute of Trichologists' progress against the conditions attached to its accredited register, and one of the original conditions asked the Institute to be clear with the public about the limits of the evidence for trichology.",
              },
              {
                type: "p",
                text: "Clinically, weight-loss medicines raised a pressing question in 2025: can they cause shedding? Published reviews found the evidence conflicting, which is exactly where a careful history and a timely referral earn their keep.",
              },
              {
                type: "reveal",
                prompt: "Is trichology statutorily regulated in the UK or Ireland?",
                answer: "No. Trichology is not statutorily regulated in either country. Some registers, such as the Institute of Trichologists' register, are accredited by the Professional Standards Authority, which is a form of oversight but not statutory regulation.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "In the consulting room",
            blocks: [
              {
                type: "p",
                text: "For GPs, dermatologists and aesthetic doctors and nurses, two documents defined the year. The European safety review of finasteride confirmed suicidal thoughts as a side effect, and the BAD's 2025 alopecia areata guideline set out when licensed JAK inhibitors should be offered and what safety conversation should accompany them.",
              },
              {
                type: "p",
                text: "For those working in aesthetics, the English and Scottish announcements pointed to a future in which the most invasive procedures sit firmly with regulated healthcare professionals and registered premises, and in which prescribers carry clear responsibility for what follows a prescription.",
              },
              {
                type: "quiz",
                question: "What did the EMA's safety committee conclude about the overall balance of benefits and risks for finasteride in May 2025?",
                options: [
                  "The benefits no longer outweigh the risks for hair loss",
                  "The benefits continue to outweigh the risks for all approved uses",
                  "The medicine should be restricted to hospital prescribing",
                  "No conclusion could be reached",
                ],
                answer: 1,
                explain:
                  "The committee confirmed suicidal thoughts as a side effect but concluded that the benefits continue to outweigh the risks for all approved uses, with added warnings and a patient card.",
              },
            ],
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "2025 at a glance",
        rows: [
          {
            label: "21 January 2025",
            value: "ANSES in France finds it highly probable that glyoxylic acid in hair-straightening products can cause acute kidney injury.",
          },
          {
            label: "February 2025",
            value: "The baseline BAD living guideline on alopecia areata appears in the February issue of the British Journal of Dermatology.",
          },
          {
            label: "April 2025",
            value: "An NIHR horizon-scanning briefing notes that deuruxolitinib has no UK or EU marketing authorisation for any use.",
          },
          {
            label: "8 May 2025",
            value: "The EMA confirms suicidal thoughts as a side effect of finasteride and asks for a patient card in hair-loss packs.",
          },
          {
            label: "4 July 2025",
            value: "The Professional Standards Authority publishes a condition review of the Institute of Trichologists' accredited register.",
          },
          {
            label: "6 August 2025",
            value: "The UK Government sets out plans to license injectables and restrict the highest-risk procedures in England.",
          },
          {
            label: "1 September 2025",
            value: "TPO is prohibited in all cosmetic products in the European Union, including professional nail gels.",
          },
          {
            label: "28 to 29 September 2025",
            value: "The World Congress of Trichology is held at the Royal College of Physicians, London.",
          },
          {
            label: "9 October 2025",
            value: "The Scottish Government introduces its Bill to regulate non-surgical procedures.",
          },
          {
            label: "14 November 2025",
            value: "The BAD's 2025 living guideline on alopecia areata is published online.",
          },
        ],
      },
      {
        kind: "image",
        imageKey: "ed03",
        caption:
          "Most of 2025's changes happened on paper, in guidelines, bills and product rules. Their effects reach the chair, the clinic and the consulting room.",
      },
      {
        kind: "article",
        kicker: "For practice",
        title: "What 2025 means on a Monday morning",
        standfirst:
          "Headlines fade quickly. Here is what the year's changes mean, in practical terms, for each discipline and for the way we refer to one another.",
        imageKey: "ed07",
        blocks: [
          {
            type: "p",
            text: "Looking back from 2026, it is tempting to treat the events of 2025 as news that has already been absorbed. Much of it has not. Consultations, licensing schemes and guideline updates take years to settle into everyday practice, and many clients will not have heard of any of them.",
          },
          { type: "h", text: "For cosmetic practitioners" },
          {
            type: "p",
            text: "The most immediate lesson is to know your products. A straightening treatment is a chemical service, and the French warning on glyoxylic acid shows that a formula can be widely sold before its risks are fully assessed. Read labels, follow manufacturers' precautions and keep records of what you used on whom. In Ireland, the TPO ban took effect without a period to use up old stock.",
          },
          { type: "h", text: "For trichologists" },
          {
            type: "p",
            text: "The PSA's review of the Institute of Trichologists' register focused on complaints handling and on being clear about the evidence. That is a useful standard for any practitioner, registered or not: be precise about what trichology can and cannot do, and put your complaints process in writing.",
          },
          { type: "h", text: "For medical colleagues" },
          {
            type: "list",
            items: [
              "Ask about mood and any history of depression before prescribing finasteride, and tell patients to stop and seek advice if low mood or suicidal thoughts appear.",
              "Use the 2025 BAD guideline when discussing JAK inhibitors for severe alopecia areata, including the safety conversation for older patients and those with risk factors.",
              "Consider medicines such as weight-loss drugs when a patient presents with new shedding.",
            ],
          },
          {
            type: "pull",
            text: "Be precise about what your discipline can and cannot do, and put it in writing.",
          },
          { type: "h", text: "For all of us" },
          {
            type: "p",
            text: "Many of the year's changes depend on one discipline passing information to another. A stylist who notices that a client's mood has changed since starting a hair-loss tablet, or a trichologist who hears that a client has lost weight quickly, may hold the detail that matters most to the prescriber. Referral letters that record what was seen, when, and with the client's consent, make that information useful.",
          },
          {
            type: "callout",
            title: "Red flags, whatever the year",
            text: "Sudden or patchy hair loss, a painful, inflamed or scarring scalp, hair loss with feeling unwell, weight loss or fever, and any mention of low mood or thoughts of self-harm all need prompt referral to a GP or dermatologist. If someone is at immediate risk, contact emergency services.",
          },
          {
            type: "p",
            text: "The three field editions that follow go deeper. Each explains what changed for that discipline in 2025 and the education that follows from it.",
          },
          {
            type: "reveal",
            prompt: "Did England's August 2025 announcement change the law immediately?",
            answer: "No. It set out the Government's plans, including licensing for injectables and restrictions on the highest-risk procedures, and promised a public consultation in early 2026. New rules depend on further regulations.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "How well do you know 2025?",
        intro: "Three questions drawn from the verified events in this edition.",
        blocks: [
          {
            type: "quiz",
            question: "Which ingredient in hair-straightening products did France's ANSES link to acute kidney injury in January 2025?",
            options: ["Formaldehyde", "Glyoxylic acid", "Ammonium thioglycolate", "Keratin protein"],
            answer: 1,
            explain:
              "ANSES concluded it is highly probable that glyoxylic acid can cause acute kidney injury, advised avoiding such products and called for a European risk assessment.",
          },
          {
            type: "quiz",
            question: "Under the plans for England announced in August 2025, who would be allowed to carry out the highest-risk procedures, such as a non-surgical BBL?",
            options: [
              "Any practitioner holding a local authority licence",
              "Qualified healthcare professionals working for CQC-registered providers",
              "Beauty therapists with a Level 4 qualification",
              "Anyone with product liability insurance",
            ],
            answer: 1,
            explain:
              "The highest-risk procedures would be restricted to qualified healthcare professionals working for providers registered with the Care Quality Commission. Lower-risk injectables would come under local authority licensing.",
          },
          {
            type: "quiz",
            question: "What did the BAD's 2025 living guideline recommend for people aged 12 and over with severe alopecia areata?",
            options: [
              "Topical minoxidil as first-line treatment",
              "Avoiding all systemic treatment",
              "Offering licensed oral JAK inhibitors",
              "Scalp micropigmentation before any medical treatment",
            ],
            answer: 2,
            explain:
              "The guideline strongly recommends offering licensed oral JAK inhibitors to adults and to young people aged 12 and over with severe alopecia areata, with a discussion of safety warnings.",
          },
        ],
      },
    ],
    sources: [S.govuk, S.govscot, S.anses, S.hpraTpo, S.ema, S.cpe, S.bjd2025, S.badPage, S.nihr, S.psaReview, S.psaRegister, S.congress, S.nhbf],
  },

  // ─────────────────────────────────────────────────────────────
  // Cosmetic, 2025
  // ─────────────────────────────────────────────────────────────
  {
    number: 202502,
    slug: "2025-cosmetic",
    title: "Cosmetic, 2025",
    fade: "Read the label, know the line.",
    theme: "Four years in review",
    standfirst:
      "What changed for head spa therapists, stylists and cosmetic practitioners in 2025, from straightener chemistry to licensing plans, and the education that follows.",
    coverImageKey: "ed16",
    coverTone: "dark",
    audience: ["cosmetic"],
    published: "2026-09-30",
    series: "archive",
    period: "2025",
    focus: "cosmetic",
    pages: [
      {
        kind: "letter",
        title: "The cosmetic year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2025 from the salon chair and the head spa bed. It is part of our Four years in review series, written in 2026; Trichozette did not exist in 2025, and we are not pretending otherwise. What we have done is gather the developments that mattered to cosmetic practitioners that year and check each one against its source.",
          },
          {
            type: "p",
            text: "Two themes stand out. The first is chemistry: a French safety agency warned about glyoxylic acid in straightening products, and the European Union banned the nail-gel ingredient TPO. The second is scope: England and Scotland both set out how non-surgical cosmetic procedures would be regulated, with training, insurance, premises and age limits at the centre.",
          },
          {
            type: "p",
            text: "Neither theme is about head spa or hairdressing alone, and that is the point. Cosmetic practitioners work closer to the scalp than almost anyone, and the rules around them are tightening. The best preparation is sound education: knowing your products, knowing your limits and knowing whom to call.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Products",
        title: "Straighteners, nail gels and the limits of 'on sale'",
        standfirst:
          "Two chemical stories from 2025 carry the same lesson for anyone who applies products to a client's hair or scalp: availability is not the same as assessment.",
        imageKey: "ed02",
        blocks: [
          {
            type: "p",
            text: "In January 2025 the French Agency for Food, Environmental and Occupational Health and Safety, ANSES, published an opinion on hair-straightening products containing glyoxylic acid. It concluded that it is highly probable that the substance can cause acute kidney injury, likely by passing through the scalp into the bloodstream and forming calcium oxalate crystals in the kidney.",
          },
          {
            type: "p",
            text: "ANSES advised against using straightening products that contain glyoxylic acid and called for an assessment at European level that could limit or prohibit it. At the time, glyoxylic acid had never been assessed by the EU and was not regulated in European cosmetics. Reporting on the opinion noted that Israel had banned the substance in 2022 after documenting cases of kidney injury.",
          },
          { type: "h", text: "The TPO ban" },
          {
            type: "p",
            text: "From 1 September 2025, trimethylbenzoyl diphenylphosphine oxide, known as TPO, was prohibited in all cosmetic products in the European Union. TPO helps UV nail gels and hybrid polishes harden under a lamp. It had previously been permitted for professional use only, but its classification as a CMR substance, one that may cause cancer, genetic damage or harm to reproduction, triggered a full ban. Ireland's HPRA told salons to check ingredient lists, stop using affected products and dispose of stock; there was no period to use up old supplies. Great Britain has a separate system for cosmetics and set its own timetable.",
          },
          {
            type: "pull",
            text: "A product being on sale does not settle whether it is safe for every client or every setting.",
          },
          { type: "h", text: "What this means at the backwash" },
          {
            type: "list",
            items: [
              "Read the full ingredient list of every chemical service product, not only the front label.",
              "Follow the manufacturer's instructions on application, timing, ventilation and rinsing exactly.",
              "Record the product and batch used for each client, so that you can answer questions later.",
              "Watch regulators and trade bodies for safety notices, and act on them promptly.",
              "Never apply a chemical service to a broken, inflamed or sore scalp.",
            ],
          },
          {
            type: "p",
            text: "None of this requires a cosmetic practitioner to become a toxicologist. It requires the habit of checking. When a client asks whether a treatment is safe, the honest answer is often that it has been sold widely, that the manufacturer's precautions must be followed, and that regulators are still reviewing some ingredients.",
          },
          {
            type: "callout",
            title: "If a client feels unwell",
            text: "If a client reports feeling unwell after a chemical service, especially with symptoms such as nausea, vomiting or reduced urine, advise them to seek medical advice promptly and tell the clinician which product was used. Do not try to assess it yourself.",
          },
          {
            type: "quiz",
            question: "Why was TPO banned in EU cosmetics from 1 September 2025?",
            options: [
              "It caused scalp burns in salon trials",
              "It was classified as a CMR substance",
              "It was found to damage hair keratin",
              "Manufacturers withdrew it voluntarily",
            ],
            answer: 1,
            explain:
              "TPO was classified as a CMR category 1B substance, which triggers prohibition under the EU Cosmetics Regulation, with no exception for professional use.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The cosmetic year at a glance",
        rows: [
          { label: "21 January 2025", value: "ANSES links glyoxylic acid in hair straighteners to a highly probable risk of acute kidney injury." },
          { label: "First half of 2025", value: "The NHBF records a net gain of 1,088 hair, barbering and beauty premises, led by barbershops, beauty salons and nail salons." },
          { label: "6 August 2025", value: "The UK Government sets out plans for licensing injectables and restricting the highest-risk procedures in England." },
          { label: "1 September 2025", value: "TPO is prohibited in all cosmetic products in the European Union, including professional nail gels." },
          { label: "9 October 2025", value: "The Scottish Government introduces a Bill to regulate non-surgical procedures, including an under-18s offence." },
          { label: "Q1 to Q3 2025", value: "Kline reports that scalp treatment services in US salons grew 9% on the same period of 2024." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed15",
        caption:
          "The cosmetic practitioner sees the scalp more often than anyone. In 2025, knowing what goes onto it, and where one's scope ends, mattered more than ever.",
      },
      {
        kind: "article",
        kicker: "Scope and the sector",
        title: "Licensing, age limits and the growth of scalp care",
        standfirst:
          "The regulation announced in 2025 mostly concerns injectables. Its direction of travel, and the sector's own numbers, still matter to every salon and head spa.",
        imageKey: "ed18",
        blocks: [
          {
            type: "p",
            text: "On 6 August 2025 the UK Government announced its plans for non-surgical cosmetic procedures in England. Botulinum toxin, lip fillers and facial dermal fillers would come under local authority licensing, with practitioners required to meet safety, training and insurance standards. The highest-risk procedures would be limited to qualified healthcare professionals working for CQC-registered providers, and there would be restrictions on high-risk procedures for under-18s unless authorised by a healthcare professional. A consultation was promised for early 2026.",
          },
          {
            type: "p",
            text: "In Scotland, the Bill introduced on 9 October 2025 covers procedures such as botulinum toxin injections, dermal fillers and thread lifts, and creates offences for providing them outside premises where appropriate healthcare professionals are available, or to anyone under 18. Healthcare Improvement Scotland would gain powers to enter premises where it suspects an offence.",
          },
          { type: "h", text: "Why hair professionals should care" },
          {
            type: "p",
            text: "Head spa rituals, scalp massage and hair services were not the focus of these plans. But many salons also offer aesthetic treatments, and the principles are transferable: proof of training, adequate insurance, suitable premises and extra care with young clients.",
          },
          {
            type: "list",
            items: [
              "Training: keep certificates and records of continuing education in one place.",
              "Insurance: check that your policy names every service you offer.",
              "Premises: hygiene and record-keeping standards are easier to show if already written down.",
              "Age: have a clear policy on services for under-18s and on parental consent.",
            ],
          },
          { type: "h", text: "A sector of small businesses" },
          {
            type: "p",
            text: "The NHBF's 2025 statistics describe around 50,400 hair, barbering and beauty businesses registered for VAT or PAYE across the UK, generating about £6.1 billion in turnover. Around 81% employ fewer than five people, and nearly two thirds turn over less than £100,000 a year. Most new rules will land on very small teams with little administrative support.",
          },
          {
            type: "pull",
            text: "Most new rules will land on very small teams with little administrative support.",
          },
          {
            type: "p",
            text: "Scalp care is also growing as a service. Kline's US data show scalp treatment services in salons up 9% in the first three quarters of 2025 compared with 2024. We did not find comparable UK figures for 2025, so we make no claim about British demand.",
          },
          {
            type: "callout",
            title: "Growth brings responsibility",
            text: "A head spa therapist who looks closely at a scalp every week will see redness, scaling, patches and thinning. Noticing is valuable; naming a cause is not your role. Record what you see with consent and suggest a trichologist or GP.",
          },
          {
            type: "reveal",
            prompt: "Can a salon advertise a prescription-only hair-loss medicine to the public?",
            answer: "No. Prescription-only medicines must not be advertised to the public. CAP's guidance on hair-loss advertising notes that clinics may advertise a consultation, but not the prescription treatment itself.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Education",
        title: "Scalp checks for the cosmetic chair",
        intro:
          "Evergreen education prompted by 2025: what to look for, what to ask and when to stop and refer.",
        blocks: [
          {
            type: "checklist",
            title: "Before any chemical service",
            items: [
              "The client's scalp is intact, with no cuts, sores or inflammation",
              "You have read the full ingredient list and the manufacturer's precautions",
              "You have asked about previous reactions and recent medical treatment",
              "Product and batch are recorded on the client card",
              "The client understands the aftercare and whom to contact if they feel unwell",
            ],
          },
          {
            type: "quiz",
            question: "A head spa client has a round, completely smooth bald patch that she noticed a fortnight ago. What is the right response?",
            options: [
              "Recommend a stimulating scalp serum and rebook in a month",
              "Tell her it is alopecia areata and will grow back",
              "Note it with her consent and suggest she sees her GP or a trichologist",
              "Massage the area more firmly to improve circulation",
            ],
            answer: 2,
            explain:
              "Sudden, patchy hair loss is a reason to refer. The cosmetic role is to notice, record with consent and suggest the right professional, not to name a cause or promise regrowth.",
          },
          {
            type: "reveal",
            prompt: "Which scalp signs should make a cosmetic practitioner pause a service and refer?",
            answer: "Pain, marked redness, pus, bleeding, widespread scaling, sudden or patchy hair loss, a shiny scarred area where follicles seem absent, or a client who appears unwell. Suggest a GP or dermatologist, and a trichologist for non-urgent concerns.",
          },
        ],
      },
    ],
    sources: [S.anses, S.hpraTpo, S.govuk, S.govscot, S.nhbf, S.kline, S.asa],
  },

  // ─────────────────────────────────────────────────────────────
  // Clinical, 2025
  // ─────────────────────────────────────────────────────────────
  {
    number: 202503,
    slug: "2025-clinical",
    title: "Clinical, 2025",
    fade: "Standards, evidence and the weight-loss question.",
    theme: "Four years in review",
    standfirst:
      "What changed for trichologists in 2025: a review of register standards, a world congress in London, and a new generation of clients on weight-loss medicines.",
    coverImageKey: "ed13",
    coverTone: "dark",
    audience: ["clinical"],
    published: "2026-09-30",
    series: "archive",
    period: "2025",
    focus: "clinical",
    pages: [
      {
        kind: "letter",
        title: "The clinical year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2025 from the trichology clinic. It belongs to our Four years in review series, published in 2026, and every event in it has been checked against a source listed at the end.",
          },
          {
            type: "p",
            text: "Trichology is not statutorily regulated in the UK or Ireland. That fact frames everything in this edition. Without a statutory regulator, standards are set by professional bodies, by accredited registers and by each practitioner's own habits. In 2025 those standards were examined closely: the Professional Standards Authority published a review of the Institute of Trichologists' register, and the Institute gathered the field in London for the World Congress of Trichology.",
          },
          {
            type: "p",
            text: "Clinically, the year brought a question that trichologists increasingly hear: could my weight-loss injection be making my hair fall out? The honest answer, in 2025, was that the evidence was mixed. This edition explains why, and what a careful consultation looks like while the science settles.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Standards",
        title: "A register under review",
        standfirst:
          "In a field without statutory regulation, accredited registers and professional bodies carry the weight of public trust. In 2025 that weight was examined.",
        imageKey: "ed05",
        blocks: [
          {
            type: "p",
            text: "The Institute of Trichologists holds a register that is accredited by the Professional Standards Authority, the body that oversees the statutory health regulators and runs the Accredited Registers programme. Accreditation is not statutory regulation. It means the register has been assessed against the PSA's standards for governance, complaints handling, education and public information.",
          },
          {
            type: "p",
            text: "When the PSA accredited the Institute's register, it attached eight conditions. On 4 July 2025 it published a condition review. The Institute had met the first six conditions; the seventh and eighth had not been met, and the PSA set three new conditions and five recommendations.",
          },
          { type: "h", text: "What the review asked for" },
          {
            type: "list",
            items: [
              "A clearer appeals process for complaint outcomes, with independent lay members on appeals panels.",
              "Clarity that the Institute, not the complainant, is responsible for investigating and presenting complaints.",
              "Consistent complaints policies, with clear separation of decision-making roles.",
              "Recommendations on gathering feedback from service users and reviewing the time limit for complaints.",
            ],
          },
          {
            type: "p",
            text: "One of the original conditions is worth every trichologist's attention: the Institute was asked to make its public information about the evidence for trichology clear about the limitations of that evidence. It is a standard that applies to any practitioner, on any register or none.",
          },
          {
            type: "pull",
            text: "Be clear about what the evidence shows, and equally clear about what it does not.",
          },
          { type: "h", text: "Congress and patient voice" },
          {
            type: "p",
            text: "On 28 and 29 September 2025 the Institute held the World Congress of Trichology at the Royal College of Physicians in London, bringing together trichologists, students, hair restoration practitioners and hair-loss specialists. On 1 October it published the results of a patient experience survey of its registered trichologists, reporting a high level of satisfaction. The published summary did not give percentages, so we do not quote any.",
          },
          {
            type: "callout",
            title: "Scope, stated plainly",
            text: "Trichologists take histories, examine the hair and scalp, advise on care and refer. They do not prescribe medicines or diagnose systemic disease. Where a medical cause is possible, the client needs a GP or dermatologist.",
          },
          {
            type: "reveal",
            prompt: "What does accreditation by the Professional Standards Authority mean for a trichology register?",
            answer: "It means the register has been assessed against the PSA's Standards for Accredited Registers and is subject to ongoing review. It does not make trichology a statutorily regulated profession, and it does not create a protected title in law.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The clinical year at a glance",
        rows: [
          { label: "February 2025", value: "The baseline BAD living guideline on alopecia areata appears in print in the British Journal of Dermatology." },
          { label: "15 March 2025", value: "A letter in the Journal of Cosmetic Dermatology argues that a link between semaglutide and alopecia is plausible but unproven." },
          { label: "8 May 2025", value: "The EMA confirms suicidal thoughts as a side effect of finasteride, a medicine many trichology clients already take." },
          { label: "4 July 2025", value: "The PSA publishes its condition review of the Institute of Trichologists' accredited register." },
          { label: "16 September 2025", value: "A systematic review in Cureus finds conflicting evidence on GLP-1 receptor agonists and hair loss." },
          { label: "28 to 29 September 2025", value: "World Congress of Trichology, Royal College of Physicians, London." },
          { label: "1 October 2025", value: "The Institute of Trichologists publishes its patient experience survey results." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed12",
        caption:
          "A careful history is the trichologist's most important instrument. In 2025 it increasingly included the question: are you taking anything for weight loss?",
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Shedding in the age of weight-loss medicines",
        standfirst:
          "Clients taking GLP-1 medicines were asking about their hair in 2025. The literature was mixed, which makes a careful consultation more important, not less.",
        imageKey: "ed11",
        blocks: [
          {
            type: "p",
            text: "Telogen effluvium is a diffuse shedding that typically follows a trigger by around two to three months. Illness, childbirth, surgery, significant stress, some medicines and rapid weight loss are all recognised triggers. The shedding usually settles once the trigger has passed, although it can take months, and a proportion of people develop longer-running shedding.",
          },
          {
            type: "p",
            text: "In 2025, the trigger many clients asked about was a GLP-1 receptor agonist such as semaglutide or tirzepatide. A letter in the Journal of Cosmetic Dermatology in March described emerging reports and possible mechanisms, including rapid weight loss and nutritional deficiency, but concluded that causality had not been established. A systematic review published in Cureus in September found conflicting evidence: some studies reported an association with hair loss, while others reported regrowth.",
          },
          { type: "h", text: "What a careful history covers" },
          {
            type: "list",
            items: [
              "When the shedding started, and what happened in the three months before it.",
              "Any new medicines, including weight-loss injections bought privately.",
              "How much weight has been lost, and how quickly.",
              "Diet, including whether meals are being skipped because of reduced appetite.",
              "Other symptoms, such as tiredness, feeling cold, palpitations or changes in periods.",
            ],
          },
          {
            type: "pull",
            text: "The literature was mixed, which makes a careful consultation more important, not less.",
          },
          {
            type: "p",
            text: "The trichologist's role is to take that history, examine the scalp, explain the hair cycle in plain language and refer when needed. It is not to advise stopping a prescribed medicine. A client who wonders whether their medicine is responsible should raise it with the prescriber, and a short, factual letter from the trichologist can help that conversation.",
          },
          { type: "h", text: "Telling telogen effluvium from its mimics" },
          {
            type: "p",
            text: "Diffuse shedding can unmask or coexist with pattern hair loss, and it can be confused with diffuse alopecia areata. Trichoscopy helps, but it does not replace referral when the picture is uncertain.",
          },
          {
            type: "callout",
            title: "When to refer",
            text: "Refer to a GP if shedding comes with weight loss that is rapid or unexplained, fatigue, symptoms suggesting thyroid disease or anaemia, or low mood. Refer to a dermatologist, via the GP where needed, for patchy loss, scalp inflammation or any sign of scarring.",
          },
          {
            type: "quiz",
            question: "A client on a GLP-1 medicine reports diffuse shedding that began about three months after rapid weight loss. What is the most appropriate step?",
            options: [
              "Advise her to stop the injection until the shedding settles",
              "Take a full history, examine the scalp and suggest she discuss it with her prescriber",
              "Tell her the medicine has caused permanent hair loss",
              "Recommend a high-dose supplement regime",
            ],
            answer: 1,
            explain:
              "A trichologist should not advise stopping a prescribed medicine or promise an outcome. A careful history and examination, with a referral to the prescriber, is the safe route.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Practice",
        title: "Clinical reasoning, 2025",
        intro: "Test your judgement on scope, evidence and referral.",
        blocks: [
          {
            type: "quiz",
            question: "Which statement about trichology in the UK and Ireland is accurate?",
            options: [
              "It is regulated by the General Medical Council",
              "It is not statutorily regulated; some registers are accredited by the PSA",
              "It became statutorily regulated in 2025",
              "It is regulated by the HPRA in Ireland",
            ],
            answer: 1,
            explain:
              "Trichology is not statutorily regulated in either country. The Institute of Trichologists' register is accredited by the Professional Standards Authority, which is oversight rather than statutory regulation.",
          },
          {
            type: "checklist",
            title: "Your own 2025 standards check",
            items: [
              "My public information is clear about the limits of the evidence",
              "My complaints process is written down and shared with clients",
              "I ask every client about new medicines, including weight-loss treatments",
              "I ask about mood when a client is taking finasteride",
              "I have a named GP or dermatology route for urgent referrals",
            ],
          },
          {
            type: "reveal",
            prompt: "A client taking finasteride mentions that she has felt low since starting it. What should you do?",
            answer: "Take it seriously. Advise her to contact her prescriber promptly, as the EMA advises patients to stop and seek medical advice if low mood or suicidal thoughts occur. If she is at immediate risk, contact emergency services.",
          },
        ],
      },
    ],
    sources: [S.psaReview, S.psaRegister, S.congress, S.iotSurvey, S.glp1Letter, S.glp1Review, S.ema, S.badPage],
  },

  // ─────────────────────────────────────────────────────────────
  // Medical, 2025
  // ─────────────────────────────────────────────────────────────
  {
    number: 202504,
    slug: "2025-medical",
    title: "Medical, 2025",
    fade: "Clearer warnings, firmer guidance.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2025 for GPs, dermatologists and aesthetic doctors and nurses: the finasteride review, the BAD's alopecia areata guideline, and new rules for aesthetic practice.",
    coverImageKey: "ed14",
    coverTone: "dark",
    audience: ["medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2025",
    focus: "medical",
    pages: [
      {
        kind: "letter",
        title: "The medical year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2025 from the consulting room. It is part of our Four years in review series, written in 2026, and each development is referenced to a regulator, guideline or journal.",
          },
          {
            type: "p",
            text: "For medical colleagues, 2025 brought two documents that changed conversations with patients. In May, the European Medicines Agency's safety committee confirmed suicidal thoughts as a side effect of finasteride. In November, the British Association of Dermatologists published its 2025 living guideline on alopecia areata, with a strong recommendation to offer licensed JAK inhibitors for severe disease.",
          },
          {
            type: "p",
            text: "For aesthetic doctors and nurses, the year was about the future shape of regulation, with plans for England and a Bill in Scotland. This edition sets out what was decided, what was only proposed, and what follows for safe, well-documented practice. It contains no dosing advice; prescribers should rely on the product information and current guidance.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Guidance",
        title: "Alopecia areata: the 2025 living guideline",
        standfirst:
          "The BAD's update made a clear recommendation on JAK inhibitors, and an equally clear one on the safety conversation that should come with them.",
        imageKey: "ed01",
        blocks: [
          {
            type: "p",
            text: "The British Association of Dermatologists manages its alopecia areata guideline as a living document, updated as evidence emerges. The baseline iteration appeared in the February 2025 issue of the British Journal of Dermatology. The 2025 update was published online on 14 November 2025, based on literature surveillance up to 11 July 2025.",
          },
          { type: "h", text: "What the 2025 update says" },
          {
            type: "list",
            items: [
              "Offer licensed oral JAK inhibitors to adults with severe alopecia areata, and to children and young people aged 12 and over with severe disease.",
              "Recognise that the time to an adequate response varies, and that evaluation may need to extend up to 18 months, case by case.",
              "Discuss the MHRA's safety updates on JAK inhibitors, including increased risks of venous thromboembolism, major cardiovascular events and cancer, with people over 65 or with relevant risk factors.",
              "Offer self-help and patient support for mild psychological distress, and formal psychological intervention for moderate to severe distress.",
            ],
          },
          {
            type: "p",
            text: "The update added eleven new recommendations and amended eleven others. The BAD also published supplementary guidance on ritlecitinib, developed with the British Hair and Nail Society and Alopecia UK. Ritlecitinib is the JAK inhibitor recommended by NICE for severe alopecia areata in people aged 12 and over.",
          },
          {
            type: "pull",
            text: "A clear recommendation to offer treatment, and an equally clear one on the safety conversation that should come with it.",
          },
          { type: "h", text: "A treatment not yet here" },
          {
            type: "p",
            text: "Deuruxolitinib, a third JAK inhibitor for severe alopecia areata, had been approved in the United States in July 2024. An NIHR Innovation Observatory briefing in April 2025 recorded that it had no marketing authorisation in the UK or EU for any indication at that time.",
          },
          { type: "h", text: "The psychological burden" },
          {
            type: "p",
            text: "The guideline's emphasis on psychological support reflects what patients report. The NIHR briefing notes a UK study finding higher rates of depression and anxiety in people with alopecia areata. Asking about mood is part of good care, whatever treatment is chosen.",
          },
          {
            type: "callout",
            title: "Referral routes",
            text: "Most people with severe alopecia areata will be assessed in secondary care. Primary care can help by documenting extent and duration, checking for associated autoimmune conditions where indicated, and asking about mood and function before referral.",
          },
          {
            type: "quiz",
            question: "According to the 2025 BAD guideline, how long may evaluation of response to a JAK inhibitor need to extend, case by case?",
            options: ["Four weeks", "Twelve weeks", "Up to 18 months", "Five years"],
            answer: 2,
            explain:
              "The guideline notes that time to an adequate response varies between individuals and that evaluation may need to extend up to 18 months, case by case.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The medical year at a glance",
        rows: [
          { label: "February 2025", value: "The baseline BAD alopecia areata living guideline appears in the British Journal of Dermatology." },
          { label: "April 2025", value: "The NIHR Innovation Observatory notes that deuruxolitinib has no UK or EU marketing authorisation." },
          { label: "8 May 2025", value: "The EMA confirms suicidal thoughts as a side effect of finasteride and adds a patient card to hair-loss packs." },
          { label: "6 August 2025", value: "The UK Government sets out plans to restrict the highest-risk procedures to healthcare professionals in CQC-registered providers." },
          { label: "16 September 2025", value: "A systematic review finds conflicting evidence on GLP-1 receptor agonists and hair loss." },
          { label: "9 October 2025", value: "The Scottish Government introduces its Bill to regulate non-surgical procedures." },
          { label: "14 November 2025", value: "The BAD's 2025 alopecia areata living guideline is published online." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed17",
        caption:
          "A prescription for hair loss is also a conversation. In 2025 the warnings that belong in it became clearer.",
      },
      {
        kind: "article",
        kicker: "Safety and aesthetics",
        title: "Finasteride warnings and the new shape of aesthetic regulation",
        standfirst:
          "A European safety review sharpened the conversation about finasteride, while England and Scotland set out how the riskiest cosmetic procedures would be controlled.",
        imageKey: "ed10",
        blocks: [
          {
            type: "p",
            text: "On 8 May 2025 the European Medicines Agency announced the outcome of its safety committee's review of finasteride and dutasteride. The committee confirmed suicidal thoughts as a side effect of finasteride tablets, at both strengths, with frequency unknown. It identified 313 cases of suicidal ideation linked to finasteride in the European safety database.",
          },
          {
            type: "p",
            text: "A link with dutasteride was not established, but a warning about mood changes was added as a precaution because the two medicines work in the same way. Packs of the lower-strength finasteride tablet used for hair loss would carry a patient card. Product information would also note that sexual side effects may contribute to mood changes. The committee concluded that benefits continue to outweigh risks for all approved uses. In the UK, patient cards for finasteride had been introduced in 2024.",
          },
          { type: "h", text: "What that means for prescribing conversations" },
          {
            type: "list",
            items: [
              "Ask about any history of depression or suicidal thoughts before starting treatment.",
              "Explain that the medicine should be stopped, and medical advice sought promptly, if low mood or suicidal thoughts occur.",
              "Discuss sexual side effects openly, and their possible effect on mood.",
              "Make sure the patient knows about the alert card and has read it.",
            ],
          },
          {
            type: "pull",
            text: "A warning only protects a patient who has heard it, understood it and knows what to do.",
          },
          { type: "h", text: "Aesthetic practice" },
          {
            type: "p",
            text: "On 6 August 2025 the UK Government announced that the highest-risk non-surgical procedures in England, such as the non-surgical BBL, would be restricted to qualified healthcare professionals working for CQC-registered providers, with CQC enforcement once the rules take effect. Botulinum toxin and fillers would come under local authority licensing. In Scotland, the Bill introduced on 9 October 2025 would make it an offence to provide such procedures outside premises where appropriate healthcare professionals are available, or to under-18s.",
          },
          {
            type: "callout",
            title: "Plans, not yet law",
            text: "In 2025, England's approach was a statement of intent with a consultation to follow in 2026, and Scotland's was a Bill before Parliament. Practitioners should follow current law and their regulator's guidance, and watch for the final rules.",
          },
          {
            type: "reveal",
            prompt: "Why is a medicines safety warning relevant to colleagues outside medicine?",
            answer: "Stylists, head spa therapists and trichologists often see patients more often than prescribers do. If they know that low mood can be a side effect of finasteride, they can encourage a client to contact their prescriber promptly.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The medical year in three questions",
        intro: "Check your recall of the 2025 guidance, and your judgement.",
        blocks: [
          {
            type: "quiz",
            question: "What did the EMA's safety committee conclude about dutasteride in May 2025?",
            options: [
              "It confirmed suicidal thoughts as a common side effect",
              "A link was not established, but a precautionary warning on mood changes would be added",
              "It should be withdrawn from the market",
              "It was found to be safer than placebo",
            ],
            answer: 1,
            explain:
              "A link between dutasteride and suicidal thoughts was not established, but because it works in the same way as finasteride, a precautionary warning about mood changes was added.",
          },
          {
            type: "quiz",
            question: "Which patients does the 2025 BAD guideline single out for a discussion of MHRA safety updates on JAK inhibitors?",
            options: [
              "Everyone under 18",
              "People over 65 or with relevant risk factors",
              "Only people with patchy alopecia areata",
              "Only people who have used topical steroids",
            ],
            answer: 1,
            explain:
              "The guideline advises discussing the MHRA's safety updates, covering venous thromboembolism, cardiovascular events and cancer, with people over 65 or with relevant risk factors.",
          },
          {
            type: "checklist",
            title: "Before a hair-loss consultation ends",
            items: [
              "Mood has been asked about and documented",
              "Red flags for scarring or systemic disease have been considered",
              "The patient knows which side effects to report and to whom",
              "Any trichologist or cosmetic colleague involved has been updated with consent",
            ],
          },
        ],
      },
    ],
    sources: [S.ema, S.cpe, S.bjd2025, S.badPage, S.nihr, S.alopeciaUk, S.govuk, S.govscot, S.glp1Review],
  },
];
