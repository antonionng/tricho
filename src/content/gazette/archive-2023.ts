import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";
const PUBLISHED = "2026-09-30";

// Sources shared across the 2023 volume. Every factual claim in these editions traces to one of these.
const SRC = {
  fdaRitlecitinib: {
    label: "Pfizer: FDA approves LITFULO (ritlecitinib) for adults and adolescents with severe alopecia areata, 23 June 2023",
    url: "https://www.pfizer.com/news/press-release/press-release-detail/fda-approves-pfizers-litfulotm-ritlecitinib-adults-and",
  },
  ritlecitinibFirstApproval: {
    label: "Ritlecitinib: First Approval (Drugs, 2023), PubMed Central",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10556173/",
  },
  ecRitlecitinib: {
    label: "Business Wire: European Commission approves LITFULO for adolescents and adults with severe alopecia areata, September 2023",
    url: "https://www.businesswire.com/news/home/20230918672148/en/European-Commission-Approves-Pfizers-LITFULO-for-Adolescents-and-Adults-With-Severe-Alopecia-Areata",
  },
  mhraRitlecitinib: {
    label: "European Pharmaceutical Review: MHRA authorises alopecia treatment, 3 November 2023",
    url: "https://www.europeanpharmaceuticalreview.com/news/mhra-authorises-alopecia-treatment/188336.article",
  },
  niceBaricitinib: {
    label: "NICE TA926: Baricitinib for treating severe alopecia areata (October 2023)",
    url: "https://www.nice.org.uk/guidance/ta926",
  },
  smcBaricitinib: {
    label: "Scottish Medicines Consortium: August 2023 decisions news release",
    url: "https://scottishmedicines.org.uk/about-us/latest-update/august-2023-decisions-news-release",
  },
  sunDeuruxolitinib: {
    label: "Sun Pharma: US FDA filing acceptance of the new drug application for deuruxolitinib, October 2023",
    url: "https://sunpharma.com/wp-content/uploads/2023/10/Sun-Pharma-Announces-US-FDA-Filing-Acceptance-for-Deuruxolitnib.pdf",
  },
  mhraJak: {
    label: "MHRA Drug Safety Update: Janus kinase (JAK) inhibitors, new measures to reduce risks, 26 April 2023",
    url: "https://www.gov.uk/drug-safety-update/janus-kinase-jak-inhibitors-new-measures-to-reduce-risks-of-major-cardiovascular-events-malignancy-venous-thromboembolism-serious-infections-and-increased-mortality",
  },
  allegro: {
    label: "Immunotherapy (2023): plain language summary of the ALLEGRO-2b/3 trial of ritlecitinib, originally published in The Lancet",
    url: "https://pubmed.ncbi.nlm.nih.gov/37403610/",
  },
  ldom: {
    label: "JAAD International (2023): Safety and tolerability of low-dose oral minoxidil monotherapy in female pattern hair loss",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10483043/",
  },
  ffa: {
    label: "Archives of Dermatological Research (2023): Frontal fibrosing alopecia and personal care product use, a systematic review and meta-analysis",
    url: "https://doi.org/10.1007/s00403-023-02604-7",
  },
  traction: {
    label: "Clinical and Experimental Dermatology (2023): Traction alopecia, presentation, management and outcomes in a diverse urban population",
    url: "https://doi.org/10.1093/ced/llad154",
  },
  covidTe: {
    label: "Life (2023): SARS-CoV-2 infection, a trigger factor for telogen effluvium",
    url: "https://doi.org/10.3390/life13071576",
  },
  psaIot: {
    label: "Professional Standards Authority: Quality Mark awarded to the Institute of Trichologists, 14 December 2023",
    url: "https://www.professionalstandards.org.uk/news-and-updates/news/professional-standards-authority-awards-quality-mark-institute-trichologists",
  },
  worldTrichology: {
    label: "World Trichology Conference 2023, Royal Society of Medicine, London (Institute of Trichologists and International Association of Trichologists)",
    url: "https://hair2023.org/",
  },
  dhscConsultation: {
    label: "DHSC: The licensing of non-surgical cosmetic procedures in England, consultation (2 September to 28 October 2023)",
    url: "https://www.gov.uk/government/consultations/licensing-of-non-surgical-cosmetic-procedures/the-licensing-of-non-surgical-cosmetic-procedures-in-england",
  },
  asaGetDhi: {
    label: "ASA Ruling on GET DHI Hair Clinic, 11 October 2023",
    url: "https://www.asa.org.uk/rulings/get-dhi-hair-clinic-a23-1199875-getdhi.html",
  },
  asaRoundUp: {
    label: "DWF: ASA rulings round-up, 11 October 2023",
    url: "https://dwfgroup.com/en/news-and-insights/insights/2023/10/asa-rulings-round-up-11-october-2023",
  },
  euMicroplastics: {
    label: "European Commission: Regulation (EU) 2023/2055, restriction of microplastics intentionally added to products",
    url: "https://single-market-economy.ec.europa.eu/sectors/chemicals/reach/restrictions/commission-regulation-eu-20232055-restriction-microplastics-intentionally-added-products_en",
  },
  euAllergens: {
    label: "EUR-Lex: Commission Regulation (EU) 2023/1545 on the labelling of fragrance allergens in cosmetic products",
    url: "https://eur-lex.europa.eu/eli/reg/2023/1545/oj/eng",
  },
  euOmnibus: {
    label: "EUR-Lex: Commission Regulation (EU) 2023/1490 (CMR substances in cosmetic products)",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1490",
  },
  fdaFormaldehyde: {
    label: "NPR: The FDA misses its own deadline to propose a ban on formaldehyde from hair products (May 2024, covering the October 2023 announcement)",
    url: "https://www.wwno.org/npr-news/2024-05-08/the-fda-misses-its-own-deadline-to-propose-a-ban-on-formaldehyde-from-hair-products",
  },
  nhbf: {
    label: "NHBF: Industry statistics (2023 findings)",
    url: "https://www.nhbf.co.uk/about-the-nhbf/campaigning-for-you/industry-research-reports-and-statistics/nhbf-industry-statistics/",
  },
  valueOfBeauty: {
    label: "British Beauty Council: Value of Beauty 2023, 26 April 2023",
    url: "https://britishbeautycouncil.com/value-of-beauty-2023-smes-highstreet/",
  },
  scotland: {
    label: "Scottish Government: Regulations for cosmetic procedures, FOI release",
    url: "https://www.gov.scot/publications/foi-202400440374/",
  },
  irelandRte: {
    label: "RTÉ News: 87 Irish complaints to UK cosmetic treatment register, 14 March 2023",
    url: "https://www.rte.ie/news/health/2023/0314/1362056-lip-filler/",
  },
  irelandImt: {
    label: "Irish Medical Times: Calls for increased measures to deal with unregulated use of cosmetic treatments, 25 August 2023",
    url: "https://www.imt.ie/news/calls-for-increased-measures-to-deal-with-unregulated-use-of-cosmetic-treatments-25-08-2023/",
  },
};

export const archive2023: Edition[] = [
  // ─────────────────────────────────────────────────────────────
  // 2023 in review
  // ─────────────────────────────────────────────────────────────
  {
    number: 202301,
    slug: "2023-in-review",
    title: "2023 in review",
    fade: "The year the rules started to move.",
    theme: "Four years in review",
    standfirst:
      "A retrospective look at 2023 across the cosmetic, clinical and medical fields: new medicines for alopecia areata, a licensing consultation for cosmetic procedures in England, and a quality mark for a trichology register.",
    coverImageKey: "ed05",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: PUBLISHED,
    series: "archive",
    period: "2023",
    focus: "review",
    pages: [
      {
        kind: "letter",
        title: "Looking back at 2023",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2023. Trichozette did not exist then, and neither did Trichollective, whose story begins at Whittlebury Hall in January 2026. These are not back issues. They are part of a retrospective series, Four years in review, in which we return to each of the last four years and ask a plain question: what actually changed for the people who look after hair and scalps?",
          },
          {
            type: "p",
            text: "For 2023 the answer is more than you might remember. A second oral medicine for severe alopecia areata was approved in the United States, then in Europe and the UK, while the health technology bodies in England and Scotland declined to fund an earlier one. The government in England opened a consultation on licensing non-surgical cosmetic procedures. Advertising regulators turned their attention to hair transplant clinics. And in December, the Institute of Trichologists' register was accredited by the Professional Standards Authority.",
          },
          {
            type: "p",
            text: "None of these stories stayed in one lane. A licensing proposal written for injectables named scalp treatments too. A medicine approved for dermatologists changed what clients asked their stylists. A register accreditation changed how trichologists could describe themselves. That is why this edition gives each change three readings, one from each discipline.",
          },
          {
            type: "p",
            text: "Every factual claim in this volume comes from a source we have listed at the end. Where we could not verify something, we left it out. Where a story continued into later years, we say so and stop at the edge of 2023. The three field editions that follow go deeper into the cosmetic, clinical and medical detail.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The year",
        title: "The biggest shifts of 2023",
        standfirst:
          "New medicines, new rules and a new mark of assurance. How 2023 changed the ground under all three disciplines.",
        imageKey: "ed01",
        blocks: [
          {
            type: "p",
            text: "Some years are remembered for a single headline. 2023 was different: several slow-moving stories reached a turning point at roughly the same time, and each of them touched more than one discipline. Taken together they explain a good deal about how hair and scalp care looks today.",
          },
          { type: "h", text: "Medicine: a second option, and a question of cost" },
          {
            type: "p",
            text: "On 23 June 2023 the US Food and Drug Administration approved ritlecitinib for severe alopecia areata in people aged 12 and over, the first treatment approved there for adolescents with the condition. The European Commission followed in September, and the MHRA authorised it for the UK in the autumn. Meanwhile, the funding bodies took a harder look at baricitinib, an earlier medicine in the same class. The Scottish Medicines Consortium did not accept it for severe alopecia areata in August, and NICE did not recommend it in October, in both cases because the cost-effectiveness case was uncertain.",
          },
          {
            type: "p",
            text: "In April the MHRA had also issued new safety measures for several JAK inhibitors used in chronic inflammatory conditions. The lesson for everyone was that these medicines are serious, specialist treatments, and not a quick fix to be promised in a salon.",
          },
          { type: "h", text: "Cosmetic practice: licensing on the horizon" },
          {
            type: "p",
            text: "On 2 September the Department of Health and Social Care opened a consultation on a licensing scheme for non-surgical cosmetic procedures in England, to be run by local authorities. It proposed sorting procedures into green, amber and red categories by risk, and a minimum client age of 18. Microneedling and micropigmentation appeared in the green list, platelet-rich plasma therapy in amber and hair restoration surgery in red.",
          },
          {
            type: "pull",
            text: "Several slow-moving stories reached a turning point at roughly the same time.",
          },
          { type: "h", text: "Trichology: a mark of assurance" },
          {
            type: "p",
            text: "On 14 December the Professional Standards Authority accredited the register held by the Institute of Trichologists, with conditions. Accreditation is voluntary assurance of a register's standards, not statutory regulation: trichology is still not statutorily regulated in the UK or Ireland. But it gave the public a clearer way to check a practitioner's standing.",
          },
          {
            type: "list",
            items: [
              "Medical: a second oral option for severe alopecia areata, alongside hard questions about value and safety.",
              "Cosmetic: a proposed licensing scheme in England that named scalp treatments as well as injectables.",
              "Clinical: accreditation of a trichology register, and a busy year of research on scarring and traction hair loss.",
            ],
          },
          {
            type: "callout",
            title: "What this volume does not claim",
            text: "We describe what regulators and researchers published in 2023. We do not say how any medicine or treatment will work for an individual, and nothing here replaces assessment by a GP, dermatologist or qualified practitioner.",
          },
          {
            type: "p",
            text: "The pages that follow take each story in turn, starting with how the three disciplines saw the same year from their own chairs.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "One year, three chairs",
        intro:
          "The same events of 2023 looked different depending on where you sat. Here is how each discipline might have read them.",
        views: [
          {
            discipline: "cosmetic",
            heading: "From the salon and the head spa",
            blocks: [
              {
                type: "p",
                text: "For stylists and head spa therapists, 2023 was the year regulation started to name the treatments that sit close to their work. The England consultation listed microneedling and micropigmentation among lower-risk procedures that would need a licence, and it proposed a minimum client age of 18. Anyone offering scalp treatments that pierce the skin had reason to pay attention.",
              },
              {
                type: "p",
                text: "Clients also arrived with new questions. News of oral medicines for alopecia areata travelled fast, and the right response in the chair was the same as ever: notice, record with consent, avoid naming a cause, and refer.",
              },
              {
                type: "reveal",
                prompt: "A client with a smooth, round bald patch asks whether she should ask her GP about the new tablets she read about. What is your part?",
                answer:
                  "Your part is to encourage her to see her GP, who can assess the patch and, if appropriate, refer her to a dermatologist. You should not suggest a diagnosis or a treatment, but you can help by noting where the patch is and when you first saw it, with her consent.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "From the trichology clinic",
            blocks: [
              {
                type: "p",
                text: "For trichologists, the headline was the Professional Standards Authority's accreditation of the Institute of Trichologists' register in December. It did not make trichology a statutorily regulated profession, but it did give clients and referrers a recognised quality mark to look for.",
              },
              {
                type: "p",
                text: "The research year was useful too. A meta-analysis linked frontal fibrosing alopecia with facial sunscreen and moisturiser use, while finding no association with the hair products it examined, and a large retrospective study described how traction alopecia presents and how often it improves with follow-up.",
              },
              {
                type: "quiz",
                question: "What did the Professional Standards Authority's December 2023 decision mean for trichology?",
                options: [
                  "Trichology became a statutorily regulated profession",
                  "The Institute of Trichologists' register was accredited, with conditions",
                  "Every trichologist in the UK was individually assessed by the PSA",
                  "Trichologists gained the right to prescribe",
                ],
                answer: 1,
                explain:
                  "The PSA accredited the register, with conditions. Accreditation is voluntary assurance of how a register is run. It is not statutory regulation, and the PSA states that it does not assess the merits of individuals on the register.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "From the consulting room",
            blocks: [
              {
                type: "p",
                text: "For GPs and dermatologists, 2023 brought UK authorisation of ritlecitinib and, at almost the same time, negative funding decisions on baricitinib from the Scottish Medicines Consortium and NICE. Patients who had read about approvals abroad did not always find NHS access waiting for them.",
              },
              {
                type: "p",
                text: "The MHRA's April safety update on JAK inhibitors, covering abrocitinib, baricitinib, upadacitinib and filgotinib, reinforced the need for careful patient selection and a clear conversation about risk.",
              },
              {
                type: "checklist",
                title: "Worth covering when a patient asks about JAK inhibitors",
                items: [
                  "Confirm the diagnosis and its severity",
                  "Explain which medicines are licensed and funded, and which are not",
                  "Discuss the safety measures set out by the MHRA",
                  "Consider psychological support alongside any treatment",
                  "Agree who follows the patient up, and when",
                ],
              },
            ],
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "2023 at a glance",
        rows: [
          { label: "26 April", value: "MHRA issues new measures to reduce serious risks with four JAK inhibitors, including baricitinib" },
          { label: "26 April", value: "British Beauty Council publishes Value of Beauty 2023" },
          { label: "23 June", value: "FDA approves ritlecitinib for severe alopecia areata in people aged 12 and over" },
          { label: "13 to 14 August", value: "World Trichology Conference held at the Royal Society of Medicine, London" },
          { label: "2 September", value: "DHSC opens its consultation on licensing non-surgical cosmetic procedures in England, running to 28 October" },
          { label: "September", value: "European Commission authorises ritlecitinib for severe alopecia areata" },
          { label: "11 October", value: "ASA upholds complaints against hair transplant advertising, including a ruling on GET DHI Hair Clinic" },
          { label: "17 October", value: "EU restriction on intentionally added microplastics begins to apply" },
          { label: "October", value: "NICE does not recommend baricitinib for severe alopecia areata (TA926)" },
          { label: "14 December", value: "Professional Standards Authority accredits the Institute of Trichologists' register" },
        ],
      },
      {
        kind: "image",
        imageKey: "ed12",
        caption: "2023 asked every discipline the same question: what is ours to do, and when do we pass the work on?",
      },
      {
        kind: "article",
        kicker: "Practice",
        title: "What 2023 means for practice",
        standfirst:
          "The events of 2023 are history now, but the habits they call for are not. Five lessons that still hold.",
        imageKey: "ed04",
        blocks: [
          {
            type: "p",
            text: "Looking back is only useful if it changes what we do on Monday morning. Each of the 2023 stories carries a practical lesson, and most of them apply across all three disciplines.",
          },
          { type: "h", text: "Know where your scope ends" },
          {
            type: "p",
            text: "The England licensing consultation sorted procedures by risk and proposed limits on who could perform them. Whatever the final shape of any scheme, the principle is sound: the more invasive the procedure, the more training, insurance and clinical oversight it needs. A head spa therapist, a trichologist and a doctor should each be able to say, in one sentence, which treatments are theirs and which are not.",
          },
          { type: "h", text: "Talk about medicines accurately, or not at all" },
          {
            type: "p",
            text: "New approvals create new questions. Clients may have read that a tablet can regrow hair. The accurate answer is that ritlecitinib was approved for severe alopecia areata, that it is prescribed by specialists after assessment, and that the MHRA has set out safety measures for medicines in the same class. Anyone outside medicine should stop there and refer.",
          },
          {
            type: "pull",
            text: "The more invasive the procedure, the more training, insurance and clinical oversight it needs.",
          },
          { type: "h", text: "Advertise honestly" },
          {
            type: "p",
            text: "In October the Advertising Standards Authority upheld complaints against hair transplant advertising that used exaggerated before-and-after imagery, claimed near-certain success, trivialised surgery and left out the need for a pre-consultation. The same principles apply to a scalp treatment menu or a social media post: no promised results, no pressure, and a clear statement that suitability is assessed first.",
          },
          {
            type: "list",
            items: [
              "Describe what a service involves, not what it will achieve.",
              "Avoid time-limited offers that push clients to decide quickly.",
              "Say that every client is assessed for suitability first.",
              "Keep before-and-after images genuine, typical and consented.",
            ],
          },
          { type: "h", text: "Check registers, and be checkable" },
          {
            type: "p",
            text: "The PSA's accreditation of the Institute of Trichologists' register gave referrers something concrete to check. Every discipline benefits when the people we refer to can show where they are registered and how complaints are handled.",
          },
          {
            type: "callout",
            title: "Red flags that always mean a medical referral",
            text: "Sudden patchy hair loss, a sore, scaly or weeping scalp, loss of hair with scarring or shiny skin, hair loss with weight change, fatigue or other symptoms of illness, and any hair loss in a child. Refer to a GP, who can involve a dermatologist.",
          },
          {
            type: "p",
            text: "None of this is new advice. What 2023 did was make it harder to ignore.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "How well do you know 2023?",
        intro: "Three questions drawn from the verified events of the year. The explanations tell you where each answer comes from.",
        blocks: [
          {
            type: "quiz",
            question: "Which medicine did the FDA approve on 23 June 2023 for severe alopecia areata in people aged 12 and over?",
            options: ["Baricitinib", "Deuruxolitinib", "Ritlecitinib", "Tofacitinib"],
            answer: 2,
            explain:
              "Ritlecitinib was approved by the FDA on 23 June 2023, the first treatment approved there for adolescents with severe alopecia areata. Deuruxolitinib's application was accepted for FDA review in October 2023, and baricitinib had been approved earlier.",
          },
          {
            type: "quiz",
            question: "What minimum client age did the 2023 England consultation on licensing non-surgical cosmetic procedures propose?",
            options: ["16", "18", "21", "No minimum age"],
            answer: 1,
            explain:
              "The consultation proposed a minimum age of 18 for licensed procedures, in line with existing age limits on botulinum toxin, fillers, tattoos and sunbeds.",
          },
          {
            type: "quiz",
            question: "Which body accredited the Institute of Trichologists' register in December 2023?",
            options: [
              "The General Medical Council",
              "The Care Quality Commission",
              "The Health and Care Professions Council",
              "The Professional Standards Authority",
            ],
            answer: 3,
            explain:
              "The Professional Standards Authority accredited the register on 14 December 2023, with conditions, under its voluntary Accredited Registers programme. Trichology remains outside statutory regulation.",
          },
        ],
      },
    ],
    sources: [
      SRC.fdaRitlecitinib,
      SRC.ecRitlecitinib,
      SRC.mhraRitlecitinib,
      SRC.smcBaricitinib,
      SRC.niceBaricitinib,
      SRC.sunDeuruxolitinib,
      SRC.mhraJak,
      SRC.dhscConsultation,
      SRC.asaGetDhi,
      SRC.asaRoundUp,
      SRC.euMicroplastics,
      SRC.psaIot,
      SRC.worldTrichology,
      SRC.ffa,
      SRC.traction,
      SRC.valueOfBeauty,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Cosmetic, 2023
  // ─────────────────────────────────────────────────────────────
  {
    number: 202302,
    slug: "2023-cosmetic",
    title: "Cosmetic, 2023",
    fade: "Licences, labels and honest adverts.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2023 for head spa therapists, stylists and cosmetic practitioners: a licensing consultation in England, new EU ingredient and labelling rules, advertising rulings, and the numbers behind the industry.",
    coverImageKey: "ed16",
    coverTone: "dark",
    audience: ["cosmetic"],
    published: PUBLISHED,
    series: "archive",
    period: "2023",
    focus: "cosmetic",
    pages: [
      {
        kind: "letter",
        title: "The cosmetic year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2023 from the cosmetic chair. It is part of Four years in review, a retrospective series published in 2026. Trichozette was not around in 2023, but the changes that year still shape how stylists, barbers, colourists and head spa therapists work.",
          },
          {
            type: "p",
            text: "Three kinds of change stand out. First, regulation of treatments: England consulted on a licensing scheme for non-surgical cosmetic procedures, Scotland reconvened its expert group, and doctors in Ireland called for tighter rules. Second, regulation of products: the European Union restricted microplastics, banned a further group of substances classed as carcinogenic, mutagenic or toxic to reproduction, and expanded the list of fragrance allergens that must appear on labels. Third, regulation of claims: the Advertising Standards Authority upheld complaints against hair transplant advertising.",
          },
          {
            type: "p",
            text: "Each of those changes comes with something to learn, so this edition pairs the news with education: how to read a label, how to describe a service honestly, and when a scalp needs a medical opinion rather than a treatment.",
          },
          {
            type: "p",
            text: "As always, we stay within the cosmetic scope. Nothing here is a diagnosis, and nothing here promises a result.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Regulation",
        title: "The licence question",
        standfirst:
          "In September 2023 England consulted on licensing non-surgical cosmetic procedures. Several of them sit close to scalp care.",
        imageKey: "ed15",
        blocks: [
          {
            type: "p",
            text: "On 2 September 2023 the Department of Health and Social Care opened a consultation on a licensing scheme for non-surgical cosmetic procedures in England. It ran until 28 October. The power to create such a scheme came from section 180 of the Health and Care Act 2022, and the proposal was that local authorities would license both practitioners and the premises they work from.",
          },
          { type: "h", text: "Green, amber and red" },
          {
            type: "p",
            text: "The consultation proposed sorting procedures into three categories by complexity and risk. Several of the procedures listed will be familiar to anyone who works with the scalp or offers treatments alongside hair services.",
          },
          {
            type: "list",
            items: [
              "Green, the lowest-risk group, included microneedling, micropigmentation (including microblading), LED therapies and non-ablative laser hair removal.",
              "Amber included platelet-rich plasma therapy, botulinum toxin and vitamin injections.",
              "Red, the highest-risk group, included hair restoration surgery and thread lifts.",
            ],
          },
          {
            type: "p",
            text: "The consultation also proposed a minimum age of 18 for licensed procedures, matching existing limits on botulinum toxin, fillers, tattoos and sunbeds.",
          },
          {
            type: "pull",
            text: "Whatever the final shape of a scheme, the direction was clear.",
          },
          { type: "h", text: "Scotland and Ireland" },
          {
            type: "p",
            text: "Scotland was on its own path. The Scottish Cosmetic Interventions Expert Group was reconvened in November 2023 to advise ministers on options for regulating the sector. In Ireland, reporting in March 2023 highlighted that anyone could administer dermal filler, while botulinum toxin could only be prescribed and administered by doctors or dentists. In August, a group of around 30 aesthetic doctors wrote to TDs asking for a regulator, public awareness work and for fillers to be made prescription-only, and raised concern about people from hair, beauty and make-up backgrounds injecting after short courses.",
          },
          {
            type: "callout",
            title: "Looking back, not forward",
            text: "This article describes proposals as they stood in 2023. The government response to the England consultation came later, and anyone planning services should check the current rules rather than rely on a 2023 summary.",
          },
          {
            type: "p",
            text: "For a salon or head spa, the practical point was not the fine detail of any category. It was that procedures which pierce the skin were moving firmly into regulated territory, and that training, insurance, hygiene and consent records would matter more, not less. Whatever the final shape of a scheme, the direction was clear.",
          },
          {
            type: "quiz",
            question: "In the 2023 England consultation, which category was proposed for platelet-rich plasma (PRP) therapy?",
            options: ["Green", "Amber", "Red", "Out of scope"],
            answer: 1,
            explain:
              "PRP therapy was listed in the amber, medium-risk category. Microneedling was listed as green and hair restoration surgery as red.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Products",
        title: "What changed on the shelf",
        standfirst:
          "Microplastics, banned substances and a much longer allergen list. The EU rules of 2023, and what they mean for anyone who reads a product label.",
        imageKey: "ed18",
        blocks: [
          {
            type: "p",
            text: "Three pieces of European Union law made 2023 a busy year for cosmetic ingredients. They apply directly in Ireland as an EU member state, and they shape the products that reach salons across both islands, because many brands formulate for the European market as a whole.",
          },
          { type: "h", text: "Microplastics" },
          {
            type: "p",
            text: "Regulation (EU) 2023/2055, the restriction on intentionally added synthetic polymer microparticles, began to apply on 17 October 2023. Microbeads were restricted straight away. Rinse-off cosmetics, which include most shampoos and conditioners, were given until October 2027 to reformulate, and leave-on products until October 2029.",
          },
          { type: "h", text: "Substances classed as CMR" },
          {
            type: "p",
            text: "Regulation (EU) 2023/1490, known as Omnibus VI, added substances newly classified as carcinogenic, mutagenic or toxic for reproduction to the list of those prohibited in cosmetics. The bans applied from 1 December 2023.",
          },
          { type: "h", text: "Fragrance allergens" },
          {
            type: "p",
            text: "Regulation (EU) 2023/1545 expanded the list of fragrance allergens that must be named individually on labels when present above set thresholds, which are lower for leave-on products than for rinse-off ones. Products placed on the market after 31 July 2026 must comply, and products already on the market have until 31 July 2028.",
          },
          {
            type: "pull",
            text: "A longer allergen list is only useful if someone reads it.",
          },
          {
            type: "list",
            items: [
              "Read the full ingredient list before using a new scalp oil or serum, not only the front of the pack.",
              "Record the products used on each client, so a reaction can be traced.",
              "Ask about known allergies at every consultation, not only the first.",
              "Patch test in line with the manufacturer's instructions for colour services.",
            ],
          },
          {
            type: "callout",
            title: "Across the Atlantic",
            text: "In October 2023 the US Food and Drug Administration announced plans to ban formaldehyde and formaldehyde-releasing chemicals in hair-smoothing and straightening products, with a target of April 2024. No formal rule had appeared by that date. It was a reminder that heat-activated smoothing treatments deserve care, good ventilation and close attention to the product's safety information.",
          },
          {
            type: "p",
            text: "A longer allergen list is only useful if someone reads it. For head spa therapists, whose treatments often involve fragranced oils left on the scalp, the 2023 labelling rules made careful product records a matter of good practice rather than good intentions.",
          },
          {
            type: "reveal",
            prompt: "Why do allergen labelling thresholds differ between leave-on and rinse-off products?",
            answer:
              "A leave-on product stays in contact with the skin for longer, so the same concentration of an allergen gives more exposure. The 2023 rules therefore require labelling at a lower concentration in leave-on products than in rinse-off ones.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The cosmetic year at a glance",
        rows: [
          { label: "14 March", value: "RTÉ reports that anyone in Ireland can administer dermal filler" },
          { label: "26 April", value: "British Beauty Council publishes Value of Beauty 2023" },
          { label: "July", value: "EU adopts new rules on fragrance allergen labelling and further CMR substance bans" },
          { label: "25 August", value: "Irish aesthetic doctors write to TDs seeking regulation of cosmetic treatments" },
          { label: "2 September", value: "England's licensing consultation opens, running to 28 October" },
          { label: "11 October", value: "ASA upholds complaints against hair transplant advertising" },
          { label: "17 October", value: "EU microplastics restriction begins to apply" },
          { label: "October", value: "FDA announces plans to ban formaldehyde in hair-straightening products" },
          { label: "November", value: "Scottish Cosmetic Interventions Expert Group reconvened" },
          { label: "1 December", value: "EU bans on newly classified CMR substances in cosmetics apply" },
        ],
      },
      {
        kind: "image",
        imageKey: "ed07",
        caption: "Tension, heat and chemistry are everyday tools in the salon. 2023 was a year for using them with more care.",
      },
      {
        kind: "article",
        kicker: "Advertising",
        title: "Honest claims, and the business behind them",
        standfirst:
          "The ASA's hair transplant rulings, and what the industry's own numbers said about the people making the claims.",
        imageKey: "ed02",
        blocks: [
          {
            type: "p",
            text: "On 11 October 2023 the Advertising Standards Authority published rulings against advertising for hair transplant surgery, including a paid Facebook advert for a clinic offering procedures in Turkey. All four issues investigated in that ruling were upheld.",
          },
          { type: "h", text: "What the ASA objected to" },
          {
            type: "list",
            items: [
              "Cartoon before-and-after images that exaggerated what the procedure could achieve.",
              "A claim of 99% successful results that was not substantiated.",
              "Presenting surgery alongside hotel and transfer packages in a way that trivialised the decision.",
              "Leaving out the need for a pre-consultation to assess whether the procedure was suitable.",
            ],
          },
          {
            type: "p",
            text: "Other rulings the same day criticised messaging that played on insecurity about hair loss and time-limited discounts that put pressure on people to decide quickly.",
          },
          {
            type: "pull",
            text: "Describe the service, not the outcome.",
          },
          { type: "h", text: "Why this matters beyond surgery" },
          {
            type: "p",
            text: "Salons and head spas do not perform surgery, but the principles are the same for any hair or scalp service. Hair loss is emotionally loaded, and advertising that exploits that worry, or implies a guaranteed result, is exactly what regulators look for. Describe the service, not the outcome. Say that clients are assessed first. Avoid pressure.",
          },
          { type: "h", text: "The businesses behind the adverts" },
          {
            type: "p",
            text: "The National Hair and Beauty Federation's 2023 statistics described an industry of very small businesses. The number of hair and beauty businesses in the UK rose by 870, or 2%, between March 2022 and March 2023, and the industry generated £4.56 billion in turnover in 2022 to 2023. The workforce fell by 7% in 2022, and the number of 16 to 24 year-olds working in the sector fell by 36% between 2019 and 2022. Apprenticeship starts continued to decline in three UK nations.",
          },
          {
            type: "p",
            text: "The British Beauty Council's Value of Beauty 2023 report, published in April, found that the contribution of hair and beauty services to the economy had rebounded to £5.1 billion in 2022, 81% of its 2019 peak.",
          },
          {
            type: "callout",
            title: "A composite example",
            text: "This is an anonymised composite, not a real case. A small salon adds a scalp treatment and advertises it with a stock photo of thick hair and the line 'see the difference'. A better version shows the treatment room, explains what happens during the service, and says that a consultation comes first and that clients with scalp concerns may be referred.",
          },
          {
            type: "quiz",
            question: "Which of these would be most likely to raise concerns under the principles the ASA applied in 2023?",
            options: [
              "Describing each step of a scalp treatment",
              "Stating that every client has a consultation first",
              "A 48-hour discount promising visibly thicker hair",
              "Listing the price and duration of a service",
            ],
            answer: 2,
            explain:
              "A short deadline puts pressure on people to decide, and promising thicker hair implies a guaranteed result. Both were issues in the 2023 rulings.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The cosmetic scalp check",
        intro:
          "The rules changed in 2023, but the basics of a safe scalp service did not. Work through the checklist, then answer two questions.",
        blocks: [
          {
            type: "checklist",
            title: "Before any scalp service",
            items: [
              "Ask about medical conditions, medicines and allergies",
              "Look at the scalp in good light before you begin",
              "Stop if you see broken skin, weeping, heavy scaling or sudden patchy loss",
              "Check the full ingredient list of every product you will use",
              "Record products used and any reaction, with the client's consent",
              "Suggest a GP or trichologist when something is outside your scope",
            ],
          },
          {
            type: "quiz",
            question: "A client has a red, scaly and sore patch on the scalp. What should a head spa therapist do?",
            options: [
              "Carry on with a gentle oil treatment to soothe it",
              "Exfoliate the area to lift the scale",
              "Avoid treating the area and suggest she sees her GP",
              "Recommend a medicated shampoo and review in a month",
            ],
            answer: 2,
            explain:
              "A sore, red or scaly scalp can have several causes, some of which need medical treatment. Avoid treating the area, do not name a cause or product, and suggest the client sees her GP.",
          },
          {
            type: "quiz",
            question: "Until when were rinse-off cosmetics containing microplastics given to reformulate under the 2023 EU restriction?",
            options: ["December 2023", "October 2025", "October 2027", "October 2035"],
            answer: 2,
            explain:
              "Rinse-off cosmetics were given until October 2027. Leave-on products had until October 2029, and some make-up, lip and nail products until October 2035.",
          },
        ],
      },
    ],
    sources: [
      SRC.dhscConsultation,
      SRC.scotland,
      SRC.irelandRte,
      SRC.irelandImt,
      SRC.euMicroplastics,
      SRC.euOmnibus,
      SRC.euAllergens,
      SRC.fdaFormaldehyde,
      SRC.asaGetDhi,
      SRC.asaRoundUp,
      SRC.nhbf,
      SRC.valueOfBeauty,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Clinical, 2023
  // ─────────────────────────────────────────────────────────────
  {
    number: 202303,
    slug: "2023-clinical",
    title: "Clinical, 2023",
    fade: "A register, and a busy research year.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2023 for trichologists: accreditation of the Institute of Trichologists' register, a world conference in London, and research on frontal fibrosing alopecia, traction alopecia and shedding after infection.",
    coverImageKey: "ed09",
    coverTone: "dark",
    audience: ["clinical"],
    published: PUBLISHED,
    series: "archive",
    period: "2023",
    focus: "clinical",
    pages: [
      {
        kind: "letter",
        title: "The clinical year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2023 from the trichology clinic. It belongs to Four years in review, a retrospective series we published in 2026, long after the events it describes. We did not report on 2023 as it happened, but we can look at it now with the benefit of what followed.",
          },
          {
            type: "p",
            text: "For trichologists, 2023 ended with a significant decision. On 14 December the Professional Standards Authority accredited the register held by the Institute of Trichologists. Trichology is not statutorily regulated in the UK or Ireland, and accreditation did not change that, but it gave clients and referrers an independent quality mark to look for.",
          },
          {
            type: "p",
            text: "It was also a useful year for evidence. A meta-analysis examined frontal fibrosing alopecia and personal care products. A study from New York described how traction alopecia presents and how it responds over time. Reviews considered shedding after COVID-19. Each of these touches everyday consultations.",
          },
          {
            type: "p",
            text: "This edition sets out what happened, then turns it into practice: history-taking, trichoscopy habits, and the red flags that mean a GP or dermatologist should see the client.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Standards",
        title: "A quality mark for trichology",
        standfirst:
          "In December 2023 the Professional Standards Authority accredited the Institute of Trichologists' register. What that meant, and what it did not.",
        imageKey: "ed06",
        blocks: [
          {
            type: "p",
            text: "Anyone in the UK or Ireland can call themselves a trichologist. There is no statutory regulator for the profession, no protected title and no legal requirement to hold a particular qualification. That has always made it harder for clients, GPs and salon professionals to know whom to trust.",
          },
          {
            type: "p",
            text: "On 14 December 2023 the Professional Standards Authority for Health and Social Care announced that it had accredited the register held by the Institute of Trichologists. An accreditation panel had met in November to consider the application, and decided to accredit the register with conditions.",
          },
          { type: "h", text: "What accreditation covers" },
          {
            type: "p",
            text: "The PSA's Accredited Registers programme assesses how a register is run. It looks at governance, standard-setting, education and training, complaints handling and the information the register provides to the public. Registers must have transparent complaints processes and be able to remove practitioners for serious wrongdoing.",
          },
          {
            type: "list",
            items: [
              "Practitioners on an accredited register can display the Accredited Registers Quality Mark.",
              "Accreditation is voluntary. It is not statutory regulation.",
              "The PSA states that accreditation does not mean it has assessed the merits of individuals on the register.",
              "Accreditation with conditions means the register must meet further requirements, which the PSA reviews.",
            ],
          },
          {
            type: "pull",
            text: "Accreditation assures how a register is run. It does not assess each practitioner on it.",
          },
          { type: "h", text: "Why it mattered to referrers" },
          {
            type: "p",
            text: "For a GP deciding where to suggest a patient seeks help with shedding, or a stylist wondering whom to recommend, an accredited register offered a practical check: is this person registered, and is there a complaints route if something goes wrong? For trichologists, it offered a way to show that they had signed up to professional and ethical codes.",
          },
          {
            type: "callout",
            title: "Say it accurately",
            text: "It is accurate to say that a practitioner is on a register accredited by the Professional Standards Authority. It is not accurate to say that trichologists are regulated by the PSA, or that the PSA has approved an individual.",
          },
          {
            type: "p",
            text: "In August, the year had already brought trichologists together at scale: the Institute of Trichologists and the International Association of Trichologists held the World Trichology Conference at the Royal Society of Medicine in London on 13 and 14 August, a two-day CPD event with speakers from several countries.",
          },
          {
            type: "quiz",
            question: "Which statement about trichology in the UK after December 2023 is accurate?",
            options: [
              "Trichologist became a protected title",
              "Trichologists became regulated by the PSA",
              "One trichology register was accredited under a voluntary programme",
              "All trichologists had to join the accredited register",
            ],
            answer: 2,
            explain:
              "The Institute of Trichologists' register was accredited under the PSA's voluntary Accredited Registers programme. The title is not protected and trichology remains outside statutory regulation.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Research",
        title: "Three studies worth knowing",
        standfirst:
          "Frontal fibrosing alopecia, traction alopecia and shedding after infection. What 2023's research added to the consultation room.",
        imageKey: "ed03",
        blocks: [
          {
            type: "p",
            text: "Research moves slowly, and single studies rarely settle anything. But three 2023 papers speak directly to questions trichologists hear every week.",
          },
          { type: "h", text: "Frontal fibrosing alopecia and facial products" },
          {
            type: "p",
            text: "A systematic review and meta-analysis in Archives of Dermatological Research pooled nine studies, with 1,248 people with frontal fibrosing alopecia and 1,459 controls. It found significant associations between the condition and use of facial sunscreen and facial moisturiser. It found no association with the hair products it examined, including shampoo, conditioner, hair dye and straightening. An association is not proof of cause, and the cause of frontal fibrosing alopecia remains unknown.",
          },
          { type: "h", text: "Traction alopecia in practice" },
          {
            type: "p",
            text: "A retrospective study in Clinical and Experimental Dermatology looked at 216 patients with traction alopecia at a single centre in the Bronx, New York. Almost all were women and most were Black. On average they had noticed hair loss for 35 months before they were seen, and most had no symptoms. About half attended follow-up, and among those, 42.5% reported improvement.",
          },
          { type: "h", text: "Shedding after COVID-19" },
          {
            type: "p",
            text: "A 2023 review in the journal Life described telogen effluvium after COVID-19 as a diffuse and reversible loss of scalp hair, and stressed that explaining its self-limiting nature helps reduce the distress that can accompany it.",
          },
          {
            type: "pull",
            text: "An association is not proof of cause.",
          },
          {
            type: "list",
            items: [
              "Ask about facial skincare and sunscreen when the frontal hairline is receding, and suggest a GP referral to a dermatologist if scarring is suspected.",
              "Ask about hairstyles, braids, extensions and tension over years, not only recent months.",
              "Ask about illness, fever, surgery and stress in the months before shedding began.",
            ],
          },
          {
            type: "callout",
            title: "Scarring means referral",
            text: "Frontal fibrosing alopecia and other scarring alopecias can cause permanent loss. Loss of follicle openings, redness or scale around follicles, or a receding hairline with eyebrow loss should prompt referral to a dermatologist through the client's GP.",
          },
          {
            type: "p",
            text: "The common thread is the history. Each of these studies rewards careful questions about what the client uses, how they style their hair, and what happened to their health in the months before the problem appeared.",
          },
          {
            type: "reveal",
            prompt: "Traction alopecia patients in the 2023 Bronx study waited a long time before being seen. Why does early recognition matter?",
            answer:
              "Early traction alopecia can improve if tension is reduced, but long-standing traction can lead to permanent, scarring loss. Stylists and trichologists who notice early signs and talk about tension gently can make a real difference.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The clinical year at a glance",
        rows: [
          { label: "April", value: "Meta-analysis on frontal fibrosing alopecia and personal care products published" },
          { label: "23 June", value: "FDA approves ritlecitinib for severe alopecia areata in people aged 12 and over" },
          { label: "July", value: "Review of telogen effluvium after COVID-19 published in Life" },
          { label: "August", value: "Traction alopecia outcomes study published in Clinical and Experimental Dermatology" },
          { label: "13 to 14 August", value: "World Trichology Conference at the Royal Society of Medicine, London" },
          { label: "2 September", value: "England opens a consultation on licensing non-surgical cosmetic procedures" },
          { label: "14 December", value: "PSA accredits the Institute of Trichologists' register, with conditions" },
        ],
      },
      {
        kind: "image",
        imageKey: "ed13",
        caption: "A good consultation starts with time, light and a careful history.",
      },
      {
        kind: "article",
        kicker: "Practice",
        title: "Telogen effluvium, taken properly",
        standfirst:
          "Post-infection shedding was a common reason to see a trichologist in 2023. The basics of assessing it still apply.",
        imageKey: "ed10",
        blocks: [
          {
            type: "p",
            text: "Shedding after illness is not new, but the pandemic made it familiar to many more people. The 2023 review in Life described post-COVID telogen effluvium as diffuse and reversible, and emphasised how much reassurance and explanation matter. For trichologists, the task is to take a careful history, look closely, and know when the picture does not fit.",
          },
          { type: "h", text: "The growth cycle in brief" },
          {
            type: "p",
            text: "Each follicle cycles through a long growing phase (anagen), a short transition (catagen) and a resting phase (telogen) before the hair sheds and a new one grows. A significant stress to the body can push many follicles into telogen at once. Because the resting phase lasts a few months, shedding typically appears some weeks to months after the trigger, which is why clients often do not connect the two.",
          },
          { type: "h", text: "What to ask" },
          {
            type: "list",
            items: [
              "When did the shedding start, and what happened in the three or four months before?",
              "Any illness, high fever, surgery, childbirth, crash dieting or major stress?",
              "Any new or stopped medicines, including hormonal contraception?",
              "Is the loss diffuse, or are there patches, a widening part or a receding hairline?",
              "Any other symptoms such as tiredness, weight change or feeling cold?",
            ],
          },
          {
            type: "pull",
            text: "Shedding typically appears some weeks to months after the trigger.",
          },
          { type: "h", text: "What does not fit" },
          {
            type: "p",
            text: "Telogen effluvium should be diffuse, without scarring, and without an inflamed scalp. Patchy loss, broken hairs, redness, scale, pain, or a pattern that keeps worsening beyond several months all point elsewhere. So does shedding alongside symptoms of wider illness. Trichologists do not diagnose medical conditions or order investigations. When the picture does not fit, the right step is a GP appointment, where blood tests can be considered.",
          },
          {
            type: "callout",
            title: "Red flags",
            text: "Sudden patchy loss, scarring, a painful or inflamed scalp, hair loss in a child, or hair loss with weight loss, fatigue, palpitations or other symptoms of illness. Refer to a GP, who can involve a dermatologist.",
          },
          {
            type: "p",
            text: "Much of the value of a trichology consultation lies in explanation. A client who understands why she is shedding, and what the usual course looks like, is better placed to wait, to notice if things change, and to seek medical help if they do.",
          },
          {
            type: "quiz",
            question: "A client reports heavy diffuse shedding that began about three months after a high fever. Which finding would most suggest something other than telogen effluvium?",
            options: [
              "Hairs with a club-shaped root in the shed sample",
              "A smooth, round patch of complete hair loss",
              "Shedding noticed mostly when washing and brushing",
              "No change in the scalp's appearance",
            ],
            answer: 1,
            explain:
              "A smooth, round patch of complete loss suggests a different process, such as alopecia areata, and warrants referral to a GP. Club-shaped telogen roots, shedding noticed on washing and an unchanged scalp are all consistent with telogen effluvium.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The clinical year, tested",
        intro: "A checklist for your own consultations, and two questions drawn from 2023.",
        blocks: [
          {
            type: "checklist",
            title: "Consultation habits that 2023 reinforced",
            items: [
              "Ask about facial skincare and sunscreen when the hairline is receding",
              "Ask about tension styles and extensions over years, not months",
              "Ask about illness and stress in the months before shedding",
              "Record trichoscopy findings with consent, so change can be tracked",
              "Refer through the GP whenever scarring or illness is suspected",
              "Describe your registration accurately",
            ],
          },
          {
            type: "quiz",
            question: "In the 2023 meta-analysis, which products were significantly associated with frontal fibrosing alopecia?",
            options: [
              "Shampoo and conditioner",
              "Hair dye and straightening treatments",
              "Facial sunscreen and facial moisturiser",
              "Hair gel and mousse",
            ],
            answer: 2,
            explain:
              "The meta-analysis found significant associations with facial sunscreen and facial moisturiser, and none with the hair products it examined. It showed association, not cause.",
          },
          {
            type: "quiz",
            question: "Where was the 2023 World Trichology Conference held?",
            options: [
              "The Royal Society of Medicine, London",
              "The Royal College of Physicians of Ireland, Dublin",
              "The Royal College of Physicians of Edinburgh",
              "Whittlebury Hall, Northamptonshire",
            ],
            answer: 0,
            explain:
              "The Institute of Trichologists and the International Association of Trichologists held the conference at the Royal Society of Medicine in London on 13 and 14 August 2023.",
          },
        ],
      },
    ],
    sources: [
      SRC.psaIot,
      SRC.worldTrichology,
      SRC.ffa,
      SRC.traction,
      SRC.covidTe,
      SRC.fdaRitlecitinib,
      SRC.dhscConsultation,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Medical, 2023
  // ─────────────────────────────────────────────────────────────
  {
    number: 202304,
    slug: "2023-medical",
    title: "Medical, 2023",
    fade: "New licences, hard choices.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2023 for GPs, dermatologists and aesthetic doctors and nurses: ritlecitinib approved in the US, Europe and the UK, negative funding decisions on baricitinib, new JAK inhibitor safety measures, and research on oral minoxidil.",
    coverImageKey: "ed14",
    coverTone: "dark",
    audience: ["medical"],
    published: PUBLISHED,
    series: "archive",
    period: "2023",
    focus: "medical",
    pages: [
      {
        kind: "letter",
        title: "The medical year",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2023 from the consulting room. It is part of Four years in review, a retrospective series published in 2026. Trichozette did not exist in 2023; this is a look back, written with the sources in front of us.",
          },
          {
            type: "p",
            text: "For clinicians who treat hair loss, 2023 was dominated by alopecia areata. Ritlecitinib was approved by the FDA in June, by the European Commission in September and by the MHRA in the autumn. In the same months, the Scottish Medicines Consortium and NICE declined to recommend baricitinib for severe alopecia areata on cost-effectiveness grounds. In April the MHRA had published new measures to reduce serious risks with several JAK inhibitors, and in October the FDA accepted an application for a third medicine in the class, deuruxolitinib.",
          },
          {
            type: "p",
            text: "For aesthetic doctors and nurses, the England consultation on licensing non-surgical cosmetic procedures raised questions about who would be allowed to perform what, including platelet-rich plasma therapy and hair restoration surgery.",
          },
          {
            type: "p",
            text: "This edition sets out those events, then turns to practice: the conversation about JAK inhibitors, the evidence on oral minoxidil as it stood in 2023, and working well with trichologists and cosmetic colleagues. We do not give doses. Prescribing decisions belong to the clinician, using current guidance and the product information.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Alopecia areata",
        title: "Licensed, but not always funded",
        standfirst:
          "In 2023 ritlecitinib reached the UK while funding bodies turned down baricitinib. How the year reshaped the conversation about severe alopecia areata.",
        imageKey: "ed11",
        blocks: [
          {
            type: "p",
            text: "Alopecia areata had long been a frustrating condition to treat. Before the JAK inhibitors, options for severe disease were limited and evidence was often weak. 2023 changed the landscape, although not in a straight line.",
          },
          { type: "h", text: "Ritlecitinib" },
          {
            type: "p",
            text: "On 23 June 2023 the FDA approved ritlecitinib, an oral inhibitor of JAK3 and the TEC kinase family, for severe alopecia areata in people aged 12 and over. It was the first treatment approved in the US for adolescents with the condition. The European Commission granted marketing authorisation in September, following a positive opinion from the EMA's medicines committee in July, and the MHRA authorised it for the UK, as reported in early November.",
          },
          {
            type: "p",
            text: "The approvals rested on the ALLEGRO-2b/3 trial, published in The Lancet, which enrolled 718 people aged 12 and over with at least 50% scalp hair loss. At 24 weeks, 23% of those on the licensed regimen had 20% or less of their scalp without hair, compared with 1.6% on placebo.",
          },
          { type: "h", text: "Baricitinib" },
          {
            type: "p",
            text: "Baricitinib was already licensed for severe alopecia areata in adults, but in 2023 it did not win routine NHS funding. The Scottish Medicines Consortium did not accept it in August because of uncertainty about cost-effectiveness. NICE did not recommend it in October in technology appraisal TA926. NICE noted that the trials showed improved regrowth at 36 weeks compared with placebo, but not a meaningful improvement in most quality-of-life measures, and that cost-effectiveness estimates were uncertain and above what it normally considers acceptable.",
          },
          {
            type: "pull",
            text: "Patients read about approvals. They do not always read about appraisals.",
          },
          {
            type: "list",
            items: [
              "A licence means a medicine can be marketed for an indication.",
              "An NHS funding decision from NICE or the SMC determines whether it is routinely available.",
              "The two can diverge, as they did for baricitinib in 2023.",
            ],
          },
          {
            type: "callout",
            title: "Looking back, not forward",
            text: "This article stops at the end of 2023. NICE's appraisal of ritlecitinib concluded in March 2024, and guidance has moved on since. Check current NICE, SMC and British Association of Dermatologists guidance before advising patients.",
          },
          {
            type: "p",
            text: "In practice, patients read about approvals. They do not always read about appraisals. A clear explanation of what is licensed, what is funded and why helps manage expectations, and patients with severe alopecia areata benefit from dermatology review and from psychological support, whatever their treatment.",
          },
          {
            type: "quiz",
            question: "Why did NICE not recommend baricitinib for severe alopecia areata in October 2023?",
            options: [
              "The trials showed no hair regrowth compared with placebo",
              "It was not licensed for alopecia areata",
              "Cost-effectiveness estimates were uncertain and above what NICE normally accepts",
              "The MHRA had withdrawn it from the UK market",
            ],
            answer: 2,
            explain:
              "NICE found improved regrowth compared with placebo, but uncertain cost-effectiveness above its usual threshold, and no meaningful improvement in most quality-of-life measures.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Safety",
        title: "JAK inhibitors and the safety conversation",
        standfirst:
          "In April 2023 the MHRA set out new measures for several JAK inhibitors. Why they mattered to anyone discussing alopecia areata treatment.",
        imageKey: "ed08",
        blocks: [
          {
            type: "p",
            text: "On 26 April 2023 the MHRA published a Drug Safety Update on Janus kinase inhibitors used for chronic inflammatory disorders. It covered abrocitinib, baricitinib, upadacitinib and filgotinib. The measures followed trial findings in rheumatoid arthritis, particularly with tofacitinib, of increased rates of major cardiovascular events, malignancy, venous thromboembolism, serious infections and death compared with TNF-alpha inhibitors in patients with certain risk factors.",
          },
          { type: "h", text: "What the MHRA advised" },
          {
            type: "list",
            items: [
              "Avoid these medicines in people aged 65 or over, current or long-term past smokers, and people with other cardiovascular or malignancy risk factors, unless there is no suitable alternative.",
              "Use them with caution in people with risk factors for venous thromboembolism.",
              "Use lower doses where the product information allows.",
              "Carry out periodic skin examinations.",
              "Tell patients about the risks and the symptoms to look out for.",
            ],
          },
          {
            type: "pull",
            text: "A serious medicine deserves a serious conversation.",
          },
          { type: "h", text: "Why this matters for hair loss" },
          {
            type: "p",
            text: "Alopecia areata often affects younger people, many of whom will not fall into the higher-risk groups. But the April update was a clear reminder that JAK inhibitors are specialist medicines with real risks, to be started after careful assessment and followed up properly. Any conversation about them in primary care, in a trichology clinic or in the salon should reflect that.",
          },
          { type: "h", text: "A third medicine in review" },
          {
            type: "p",
            text: "On 6 October 2023 Sun Pharma announced that the FDA had accepted its new drug application for deuruxolitinib, an oral inhibitor of JAK1 and JAK2, for adults with moderate to severe alopecia areata, based on two phase 3 trials, THRIVE-AA1 and THRIVE-AA2. The FDA's decision came in 2024, outside the scope of this edition.",
          },
          {
            type: "callout",
            title: "For colleagues outside medicine",
            text: "Trichologists and cosmetic professionals should not recommend or discourage specific medicines. The helpful message is simple: severe or sudden hair loss deserves medical assessment, and treatment choices are made with a GP or dermatologist.",
          },
          {
            type: "p",
            text: "Good shared decision-making covers the likely benefit, the known risks, what monitoring involves, and what happens if treatment is stopped. A serious medicine deserves a serious conversation.",
          },
          {
            type: "reveal",
            prompt: "Which four JAK inhibitors did the MHRA's April 2023 Drug Safety Update cover?",
            answer:
              "Abrocitinib, baricitinib, upadacitinib and filgotinib, when used for chronic inflammatory disorders.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The medical year at a glance",
        rows: [
          { label: "April", value: "Meta-analysis links frontal fibrosing alopecia with facial sunscreen and moisturiser use" },
          { label: "26 April", value: "MHRA Drug Safety Update on JAK inhibitors" },
          { label: "23 June", value: "FDA approves ritlecitinib for severe alopecia areata, age 12 and over" },
          { label: "7 August", value: "SMC does not accept baricitinib for severe alopecia areata" },
          { label: "2 September", value: "England opens its licensing consultation on non-surgical cosmetic procedures" },
          { label: "September", value: "European Commission authorises ritlecitinib" },
          { label: "6 October", value: "FDA accepts the new drug application for deuruxolitinib" },
          { label: "October", value: "NICE does not recommend baricitinib for severe alopecia areata (TA926)" },
          { label: "November", value: "MHRA authorisation of ritlecitinib reported" },
        ],
      },
      {
        kind: "image",
        imageKey: "ed17",
        caption: "Behind every appraisal and safety update is a person deciding what to do about their hair.",
      },
      {
        kind: "article",
        kicker: "Evidence",
        title: "Oral minoxidil, and working across disciplines",
        standfirst:
          "A small 2023 study added to the evidence on low-dose oral minoxidil. Meanwhile, the England licensing consultation raised questions for aesthetic clinicians.",
        blocks: [
          {
            type: "p",
            text: "Oral minoxidil at low doses was widely discussed as an off-label option for hair loss by 2023, and evidence on its safety was still being gathered. We give no doses here: prescribing is a matter for the clinician, using current guidance and the product information.",
          },
          { type: "h", text: "What one 2023 study added" },
          {
            type: "p",
            text: "A retrospective review from the Mayo Clinic, published in JAAD International in August 2023, looked at 25 women with female pattern hair loss treated with low-dose oral minoxidil alone, with ambulatory blood pressure monitoring. Average changes in blood pressure were small and average heart rate rose slightly. Regrowth was seen in 36% of patients, and 20% reported adverse effects including facial hair growth and swelling.",
          },
          {
            type: "p",
            text: "It was a small study without a control group, so it cannot settle questions of safety or benefit on its own. Its value lay in adding ambulatory monitoring data to a growing literature.",
          },
          {
            type: "pull",
            text: "A small study cannot settle questions of safety on its own.",
          },
          { type: "h", text: "Aesthetic practice and the licensing consultation" },
          {
            type: "p",
            text: "The England consultation that opened on 2 September 2023 listed platelet-rich plasma therapy in its amber category and hair restoration surgery in its red category, and sought views on which practitioners should be allowed to perform which procedures. For doctors and nurses offering scalp treatments, it signalled closer scrutiny of premises, training and consent.",
          },
          { type: "h", text: "Working with trichologists and cosmetic colleagues" },
          {
            type: "list",
            items: [
              "Many patients first raise hair loss with a stylist or trichologist, not a doctor.",
              "Clear referral letters from those colleagues save time: onset, pattern, photographs and history.",
              "A short reply, with the patient's consent, helps the referrer support the patient in future.",
              "Trichology is not statutorily regulated. Registration on the PSA-accredited Institute of Trichologists register, from December 2023, offered one check.",
            ],
          },
          {
            type: "callout",
            title: "Red flags in primary care",
            text: "Scarring or inflamed scalp, rapidly progressive or patchy loss, hair loss in a child, signs of systemic illness, or features of androgen excess in women warrant prompt assessment and, where appropriate, dermatology referral.",
          },
          {
            type: "p",
            text: "The strongest lesson of 2023 for clinicians may be the simplest: most people with hair loss see several professionals before they see a doctor. Building good relationships with those colleagues is part of good care.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The medical year, tested",
        intro: "Three questions drawn from the verified events and evidence of 2023.",
        blocks: [
          {
            type: "quiz",
            question: "The ALLEGRO-2b/3 trial behind the ritlecitinib approvals enrolled people with what minimum extent of scalp hair loss?",
            options: ["10%", "25%", "50%", "100%"],
            answer: 2,
            explain:
              "ALLEGRO-2b/3 enrolled 718 people aged 12 and over with at least 50% scalp hair loss.",
          },
          {
            type: "quiz",
            question: "Which of these groups did the MHRA's April 2023 update advise avoiding JAK inhibitors in, unless there is no suitable alternative?",
            options: [
              "People under 18",
              "People aged 65 or over",
              "People with atopic eczema",
              "People with a family history of alopecia areata",
            ],
            answer: 1,
            explain:
              "The MHRA advised avoiding these medicines in people aged 65 or over, current or long-term past smokers and people with other cardiovascular or malignancy risk factors, unless there is no suitable alternative.",
          },
          {
            type: "quiz",
            question: "Which category did the 2023 England licensing consultation propose for hair restoration surgery?",
            options: ["Green", "Amber", "Red", "It was not mentioned"],
            answer: 2,
            explain: "Hair restoration surgery was listed in the red, highest-risk category.",
          },
        ],
      },
    ],
    sources: [
      SRC.fdaRitlecitinib,
      SRC.ritlecitinibFirstApproval,
      SRC.ecRitlecitinib,
      SRC.mhraRitlecitinib,
      SRC.allegro,
      SRC.smcBaricitinib,
      SRC.niceBaricitinib,
      SRC.mhraJak,
      SRC.sunDeuruxolitinib,
      SRC.ldom,
      SRC.ffa,
      SRC.dhscConsultation,
      SRC.psaIot,
    ],
  },
];
