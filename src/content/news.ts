export type NewsItem = {
  id: string; // kebab-case
  headline: string; // your own neutral headline
  summary: string; // 2–3 sentences
  whyItMatters: string; // one sentence for practitioners
  date: string; // ISO date (YYYY-MM-DD) or YYYY-MM if day unknown
  source: string; // outlet name
  url: string;
  disciplines: ("cosmetic" | "clinical" | "medical")[];
  topics: (
    | "hair-loss"
    | "regulation"
    | "products"
    | "devices"
    | "research"
    | "head-spa"
    | "business"
    | "events"
  )[];
};

/** Verified news items, newest first. Sources checked on 2026-09-30. */
export const news: NewsItem[] = [
  {
    id: "fda-baricitinib-adolescents-alopecia-areata",
    headline: "FDA extends baricitinib approval to adolescents with severe alopecia areata",
    summary:
      "The US Food and Drug Administration has approved baricitinib (Olumiant, Lilly) for people aged 12 and over with severe alopecia areata, making it the second JAK inhibitor available to this age group in the US. The decision was based on the BRAVE-AA-PEDS phase 3 trial, in which the best responses were seen in patients treated within a year of onset. The medicine carries a boxed warning covering serious infections, malignancy, cardiovascular events and thrombosis.",
    whyItMatters:
      "This is a US decision and does not change UK licensing, but families may ask about it; JAK inhibitors are prescription-only, so refer to a dermatologist.",
    date: "2026-09-28",
    source: "Healio",
    url: "https://www.healio.com/news/dermatology/20260928/fda-approves-olumiant-for-teens-with-severe-alopecia",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "regulation"],
  },
  {
    id: "icam-ireland-aesthetic-safeguards-warning",
    headline: "Irish aesthetic doctors call for safeguards on injectables before harms spread",
    summary:
      "The incoming president of the Irish College of Aesthetic Medicine has urged Ireland to introduce regulatory safeguards for Botox and dermal fillers, pointing to recent harms in the UK linked to unlicensed products. The HPRA detained around 10,000 dosage units of botulinum toxin, hyaluronidase and lidocaine in the three years to 2024. The college is setting up a practitioner register, a postgraduate training pathway and a complications clinic.",
    whyItMatters:
      "Salons and clinics in Ireland that host or refer for injectables should expect closer scrutiny of who performs these treatments and where.",
    date: "2026-09-22",
    source: "Irish Medical Times",
    url: "https://www.imt.ie/news/introduce-safeguards-before-serious-issue-become-widespread-warn-cosmetic-doctors-22-09-2026/",
    disciplines: ["medical", "cosmetic"],
    topics: ["regulation"],
  },
  {
    id: "nice-recommends-deuruxolitinib-ta1178",
    headline: "NICE recommends deuruxolitinib for adults with severe alopecia areata",
    summary:
      "NICE published final guidance (TA1178) on 15 July 2026 recommending deuruxolitinib (Leqselvi), a JAK inhibitor tablet, for adults with severe alopecia areata in England. It is the second medicine NICE has recommended for this condition, after ritlecitinib in 2024. Alopecia UK noted that the Scottish Medicines Consortium had not yet made a decision.",
    whyItMatters:
      "Clients with severe patchy or total hair loss now have a second NHS route to consider; this is prescription-only, so refer to a GP for dermatology assessment.",
    date: "2026-07-15",
    source: "Alopecia UK",
    url: "https://www.alopecia.org.uk/news/nice-recommends-deuruxolitinib-for-adults-with-severe-alopecia-areata",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "regulation"],
  },
  {
    id: "asa-cap-hair-loss-advertising-guidance",
    headline: "ASA and CAP publish guidance on advertising hair-loss products and services",
    summary:
      "The advertising regulator has set out how the codes apply to hair-loss marketing, including the line between medicinal claims, such as preventing or curing hair loss, and cosmetic claims backed by robust evidence. Prescription-only medicines such as finasteride and oral minoxidil must not be advertised to the public, although clinics may promote consultations. Before-and-after images must reflect typical outcomes and testimonials cannot stand in for clinical evidence.",
    whyItMatters:
      "Anyone marketing hair-loss treatments, products or consultations online should check their claims and imagery against this guidance.",
    date: "2026-07-09",
    source: "Advertising Standards Authority",
    url: "https://www.asa.org.uk/news/keep-your-ads-a-cut-above-the-rest-advertising-products-and-services-for-hair-loss.html",
    disciplines: ["cosmetic", "clinical", "medical"],
    topics: ["regulation", "business", "hair-loss"],
  },
  {
    id: "trichollective-conference-2026-review",
    headline: "Institute of Trichologists reviews Trichollective Conference at Whittlebury Park",
    summary:
      "The Institute of Trichologists has published a review of its Trichollective Conference, held at Whittlebury Park on 15 June 2026. Sessions covered hair biology, patient perspectives, non-surgical hair restoration and plans for a UK trichology database to support clinical decisions and research. Consultant trichologist Charlotte Knibbs RIT spoke on the psychosocial impact of visible difference and on hair and scalp problems in epidermolysis bullosa.",
    whyItMatters:
      "The proposed UK trichology database and the focus on rare conditions signal where professional development and data sharing in trichology are heading.",
    date: "2026-06-23",
    source: "The Institute of Trichologists",
    url: "https://instituteoftrichologists.co.uk/trichollective-conference-review/",
    disciplines: ["clinical"],
    topics: ["events", "research"],
  },
  {
    id: "mhra-finasteride-dutasteride-warnings-2026",
    headline: "MHRA strengthens warnings on finasteride and dutasteride",
    summary:
      "The MHRA has updated product information for finasteride 1 mg, used for male pattern hair loss, to make clear that sexual dysfunction may contribute to mood disorders. A precautionary warning about mood changes has also been added to dutasteride. The changes follow a European review and advice from the Commission on Human Medicines, and the patient alert cards introduced in 2024 remain in place.",
    whyItMatters:
      "Clients taking finasteride who mention low mood or sexual side effects should be encouraged to speak to their prescriber promptly; prescription-only, so do not advise on stopping or starting.",
    date: "2026-05-11",
    source: "GOV.UK (MHRA)",
    url: "https://www.gov.uk/government/news/mhra-strengthens-safety-warnings-for-finasteride-and-dutasteride",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "regulation"],
  },
  {
    id: "clascoterone-12-month-phase-3-data",
    headline: "Twelve-month data support topical clascoterone for male pattern hair loss",
    summary:
      "Cosmo Pharmaceuticals reported 12-month results from its SCALP 1 and SCALP 2 phase 3 trials of clascoterone 5% solution, which enrolled 1,465 men across the US and Europe. Men who stayed on treatment for a year had better hair counts than those switched to placebo at six months, and long-term safety was similar to vehicle. The company plans a US application in early 2027 and a European application to the EMA.",
    whyItMatters:
      "Clascoterone is not licensed for hair loss in the UK or EU, so clients should be told it is still investigational if they ask about it.",
    date: "2026-04-21",
    source: "GEN (Genetic Engineering & Biotechnology News)",
    url: "https://www.genengnews.com/topics/translational-medicine/cosmo-pharma-eyes-2027-nda-for-baldness-candidate-after-positive-phase-iii-12-month-data/",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "research"],
  },
  {
    id: "iot-ncfe-inspection-outstanding-2026",
    headline: "Institute of Trichologists diploma rated outstanding by NCFE for fourth year",
    summary:
      "The Institute of Trichologists reports that its Level 5 Diploma in Clinical Trichology received the top grade at its annual NCFE inspection. It is the fourth consecutive year the qualification has achieved the highest rating.",
    whyItMatters:
      "Useful context for anyone weighing trichology training routes or checking the standing of a practitioner's qualification.",
    date: "2026-04-08",
    source: "The Institute of Trichologists",
    url: "https://instituteoftrichologists.co.uk/ncfe-annual-inspection-outstanding/",
    disciplines: ["clinical"],
    topics: ["business"],
  },
  {
    id: "scotland-passes-non-surgical-procedures-bill",
    headline: "Scottish Parliament passes law regulating non-surgical cosmetic procedures",
    summary:
      "MSPs voted on 17 March 2026 to pass the Non-surgical Procedures and Functions of Medical Reviewers (Scotland) Bill. Covered treatments, including toxin, fillers, microneedling, some chemical peels and laser treatments, will be banned for under-18s and restricted to premises registered with Healthcare Improvement Scotland under oversight from a GMC, NMC, GDC or GPhC registrant. The main requirements are expected to apply from September 2027.",
    whyItMatters:
      "Salons and head spas in Scotland offering skin-piercing treatments such as scalp microneedling should review whether these fall within the new rules.",
    date: "2026-03-18",
    source: "Aesthetics Journal",
    url: "https://aestheticsjournal.com/news/scottish-parliament-passes-non-surgical-procedures-bill/",
    disciplines: ["cosmetic", "medical"],
    topics: ["regulation", "business"],
  },
  {
    id: "mhra-approves-deuruxolitinib",
    headline: "MHRA approves deuruxolitinib for severe alopecia areata in adults",
    summary:
      "The MHRA has approved deuruxolitinib (Leqselvi), an oral JAK inhibitor, for adults with severe alopecia areata. Approval was based on the THRIVE-AA1 and THRIVE-AA2 phase 3 trials, which included 1,223 patients with at least 50% scalp hair loss. At the time of approval a NICE appraisal was still pending.",
    whyItMatters:
      "Adds a second licensed JAK inhibitor option for adults in the UK; prescription-only, so refer to a doctor.",
    date: "2026-03-17",
    source: "Hospital Healthcare Europe",
    url: "https://hospitalhealthcare.com/clinical/dermatology/deuruxolitinib-approved-by-mhra-for-severe-alopecia-areata/",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "regulation"],
  },
  {
    id: "nhbf-response-scotland-non-surgical-bill",
    headline: "NHBF sets out hair and beauty sector position on Scotland's non-surgical bill",
    summary:
      "The National Hair & Beauty Federation said it supports consumer safety regulation but wants standards based on demonstrated competence rather than professional titles alone. It described the bill's two-tier model, with higher-risk procedures under healthcare oversight and lower-risk procedures licensed by local authorities. The federation called for fair supervision models and transitional support for legitimate businesses.",
    whyItMatters:
      "Shows how the main hair and beauty trade body is engaging with UK regulation that may affect salon treatment menus.",
    date: "2026-02-11",
    source: "National Hair & Beauty Federation",
    url: "https://www.nhbf.co.uk/news/nhbf-responds-to-scotlands-non-surgical-bill/",
    disciplines: ["cosmetic"],
    topics: ["regulation", "business"],
  },
  {
    id: "ireland-dermal-filler-regulation-calls",
    headline: "Calls grow in Ireland to regulate who can inject dermal fillers",
    summary:
      "The Irish College of Aesthetic Medicine has warned that Irish law does not define who is appropriately trained to administer dermal fillers, which can be bought online and injected without qualifications. The programme for government commits to examining filler administration, with a Health Research Board review expected in the first half of 2026 before the Department of Health considers options.",
    whyItMatters:
      "Irish practitioners should watch for proposals that could restrict filler work to healthcare professionals.",
    date: "2026-02-03",
    source: "The Irish Times",
    url: "https://www.irishtimes.com/health/2026/02/03/concerns-over-health-risks-of-dermal-fillers-prompt-calls-for-regulation/",
    disciplines: ["cosmetic", "medical"],
    topics: ["regulation"],
  },
  {
    id: "gb-oxybenzone-cosmetics-restriction",
    headline: "New limits on oxybenzone in cosmetics take effect in Great Britain",
    summary:
      "Revised concentration limits for the UV filter oxybenzone (benzophenone-3) in cosmetic products came into force in Great Britain on 21 January 2026, following scientific advice on potential health risks. Most product types other than general skin, face, hand and lip products, which would include hair products, are limited to 0.5%. Products placed on the market before that date may be sold until 21 July 2026.",
    whyItMatters:
      "Salons retailing hair products with UV protection should check stock with suppliers once the sell-through period ends.",
    date: "2026-01-21",
    source: "legislation.gov.uk",
    url: "https://www.legislation.gov.uk/uksi/2025/901/made",
    disciplines: ["cosmetic"],
    topics: ["products", "regulation"],
  },
  {
    id: "iot-new-president-sharon-wong",
    headline: "Dr Sharon Wong appointed President of the Institute of Trichologists",
    summary:
      "The Institute of Trichologists has appointed Dr Sharon Wong as its President. She succeeds Professor Andrew Messenger, who stepped down after 17 years in the role. The Institute said the appointment reflects a commitment to closer working between hair, health and medical professions.",
    whyItMatters:
      "Signals continued links between trichology and medicine, which matters for referral pathways.",
    date: "2026-01-19",
    source: "The Institute of Trichologists",
    url: "https://instituteoftrichologists.co.uk/dr-sharon-wong/",
    disciplines: ["clinical", "medical"],
    topics: ["business"],
  },
  {
    id: "fda-misses-formaldehyde-straightener-deadline",
    headline: "FDA misses another deadline on formaldehyde ban in hair straighteners",
    summary:
      "The US FDA did not meet its 31 December 2025 target to propose a rule banning formaldehyde and related chemicals in hair-straightening products, after several earlier delays. The agency said the rule remained a priority. The concern centres on cancer risk and on disproportionate exposure among Black women.",
    whyItMatters:
      "Formaldehyde is already banned in cosmetics in the UK and EU, but stylists should still check smoothing products for formaldehyde-releasing ingredients and ensure good ventilation.",
    date: "2026-01-05",
    source: "CNN",
    url: "https://www.cnn.com/2026/01/05/health/hair-straightening-formaldehyde-fda-deadline",
    disciplines: ["cosmetic"],
    topics: ["products", "regulation"],
  },
  {
    id: "hair-straightener-acute-kidney-injury-review",
    headline: "Review links some hair-straightening treatments to acute kidney injury",
    summary:
      "A systematic review in the World Journal of Nephrology examined 36 episodes of acute kidney injury in 34 women after hair-straightening treatments. Many involved products marketed as formaldehyde-free, several containing glyoxylic acid, and most kidney biopsies showed calcium oxalate crystals. All patients recovered, most without dialysis.",
    whyItMatters:
      "Stylists offering smoothing treatments should know that formaldehyde-free does not mean risk-free, and clients who feel unwell afterwards should seek medical care.",
    date: "2025-12-25",
    source: "World Journal of Nephrology (via PMC)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12754416/",
    disciplines: ["cosmetic", "medical"],
    topics: ["products", "research"],
  },
  {
    id: "clascoterone-phase-3-topline-results",
    headline: "Topical clascoterone meets main goals in two phase 3 hair-loss trials",
    summary:
      "Cosmo Pharmaceuticals announced that clascoterone 5% solution, a topical androgen receptor inhibitor, improved target-area hair counts compared with vehicle in both SCALP 1 and SCALP 2. Side effects were similar to vehicle. If approved, it would be the first new mechanism for androgenetic alopecia in more than 30 years.",
    whyItMatters:
      "Worth knowing when clients ask about new treatments, but it remains investigational for hair loss.",
    date: "2025-12-03",
    source: "Dermatology Times",
    url: "https://www.dermatologytimes.com/view/clascoterone-5-delivers-strong-phase-3-hair-growth-results",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "research"],
  },
  {
    id: "hair-straighteners-non-reproductive-cancers-study",
    headline: "US cohort study links chemical straightener use with some non-reproductive cancers",
    summary:
      "An analysis of more than 46,000 women in the US Sister Study, published in the Journal of the National Cancer Institute, found that recent use of chemical hair straighteners was associated with higher rates of pancreatic and thyroid cancer. The authors noted limits, including exposure measured only at baseline and no information on specific product ingredients.",
    whyItMatters:
      "Supports careful product selection, ventilation and informed client conversations about relaxers, without overstating what an observational study can show.",
    date: "2025-12-03",
    source: "Dermatology Times",
    url: "https://www.dermatologytimes.com/view/hair-relaxers-tied-to-higher-risk-of-non-reproductive-cancers-according-to-nih-study",
    disciplines: ["cosmetic", "medical"],
    topics: ["products", "research"],
  },
  {
    id: "bad-alopecia-areata-living-guideline-2025",
    headline: "BAD publishes 2025 update of its alopecia areata living guideline",
    summary:
      "The British Association of Dermatologists' living guideline for alopecia areata has been updated in the British Journal of Dermatology, with evidence reviewed up to July 2025. The update adds recommendations on diagnostic testing, stopping JAK inhibitors and patient safety, and amends eleven existing ones. The development group included a GP, a psychologist and patient representatives.",
    whyItMatters:
      "This is the UK reference standard for managing alopecia areata and a useful basis for referral letters and client information.",
    date: "2025-11-14",
    source: "British Journal of Dermatology",
    url: "https://academic.oup.com/bjd/advance-article/doi/10.1093/bjd/ljaf452/8322888",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "research"],
  },
  {
    id: "dandruff-scalp-microbiome-severity-sex",
    headline: "Study finds scalp microbiome differs by dandruff severity and sex",
    summary:
      "Researchers from Unilever R&D compared the scalp microbiome of 112 adults and found that more severe dandruff was associated with less Cutibacterium acnes and more Staphylococcus capitis, Corynebacterium and Malassezia restricta. Men showed a profile resembling severe dandruff even at lower clinical severity. The work was published as a British Journal of Dermatology supplement and was industry-funded.",
    whyItMatters:
      "Supports the view of dandruff as a wider microbial imbalance, relevant to scalp assessments and head spa treatment planning.",
    date: "2025-10-21",
    source: "British Journal of Dermatology",
    url: "https://academic.oup.com/bjd/article/193/Supplement_2/ii32/8294184",
    disciplines: ["clinical", "cosmetic"],
    topics: ["research", "head-spa"],
  },
  {
    id: "gb-methyl-salicylate-cosmetics-restriction",
    headline: "Methyl salicylate limits for cosmetics, including hair products, come into force",
    summary:
      "New Great Britain limits on methyl salicylate in cosmetic products took effect on 30 September 2025. For hair products the maximum is 0.06% in non-spray products and 0.009% in sprays and aerosols. Products already on the market could be sold until 31 March 2026.",
    whyItMatters:
      "Salons retailing hair products should confirm with suppliers that stock complies now that the sell-through period has ended.",
    date: "2025-09-30",
    source: "legislation.gov.uk",
    url: "https://www.legislation.gov.uk/uksi/2025/413/made",
    disciplines: ["cosmetic"],
    topics: ["products", "regulation"],
  },
  {
    id: "mhra-unlicensed-botulinum-toxin-botulism",
    headline: "MHRA investigates illegal Botox after botulism cases in England",
    summary:
      "The MHRA's Criminal Enforcement Unit opened investigations after 41 confirmed botulism cases were reported in England between June and August 2025. Unlicensed toxin had been given in homes, hair salons and by mobile services, often by untrained people. More than 4,700 vials of unlicensed botulinum toxin have been seized since May 2023.",
    whyItMatters:
      "Salon owners should not allow unlicensed toxin treatments on their premises; botulinum toxin is prescription-only and needs a medical consultation.",
    date: "2025-08-30",
    source: "GOV.UK (MHRA)",
    url: "https://www.gov.uk/government/news/mhra-crackdown-on-illegal-botox-after-victims-left-seriously-ill",
    disciplines: ["cosmetic", "medical"],
    topics: ["regulation", "business"],
  },
  {
    id: "lllt-minoxidil-meta-analysis-2025",
    headline: "Meta-analyses reach mixed conclusions on adding low-level laser to minoxidil",
    summary:
      "A meta-analysis of seven randomised trials in Lasers in Medical Science found that low-level laser therapy combined with topical minoxidil gave modest gains in hair density and diameter over minoxidil alone, with similar side effects. A smaller January 2025 meta-analysis of four trials in the Journal of Dermatological Treatment found no significant difference. The evidence base remains small and varied.",
    whyItMatters:
      "Practitioners offering LED or laser caps should describe them as a possible add-on with limited evidence, not a stand-alone cure.",
    date: "2025-08-19",
    source: "Lasers in Medical Science",
    url: "https://link.springer.com/article/10.1007/s10103-025-04593-7",
    disciplines: ["clinical", "cosmetic", "medical"],
    topics: ["devices", "research", "hair-loss"],
  },
  {
    id: "england-cosmetic-procedures-crackdown",
    headline: "Government sets out licensing plans for non-surgical cosmetic procedures in England",
    summary:
      "The UK government announced that the highest-risk procedures, such as non-surgical Brazilian butt lifts, will be limited to qualified healthcare professionals in CQC-registered settings. Botox and fillers will fall under a local authority licensing scheme with training, safety and insurance standards, and the government intends to restrict high-risk procedures for under-18s. A further public consultation was promised for early 2026.",
    whyItMatters:
      "Salons and clinics in England offering skin-piercing treatments should prepare for licensing requirements under the Health and Care Act 2022.",
    date: "2025-08-06",
    source: "GOV.UK (DHSC)",
    url: "https://www.gov.uk/government/news/crackdown-on-unsafe-cosmetic-procedures-to-protect-the-public",
    disciplines: ["cosmetic", "medical"],
    topics: ["regulation", "business"],
  },
  {
    id: "iot-psa-accredited-register",
    headline: "Institute of Trichologists register accredited by the Professional Standards Authority",
    summary:
      "The Institute of Trichologists has been accredited under the Professional Standards Authority's Accredited Registers programme. Registrants who meet its standards can now use the Accredited Register Quality Mark. Accreditation covers governance, standards, education and complaints handling, but does not mean the PSA endorses particular treatments.",
    whyItMatters:
      "Gives clients and referring doctors an independent check on a trichologist's registration.",
    date: "2025-06-24",
    source: "The Institute of Trichologists",
    url: "https://instituteoftrichologists.co.uk/the-institute-of-trichologists-awarded-quality-mark-and-have-been-accredited-by-professional-standards-authority/",
    disciplines: ["clinical"],
    topics: ["regulation", "business"],
  },
  {
    id: "asa-ruling-oral-minoxidil-google-ad",
    headline: "ASA rules against online clinic's Google ad for oral minoxidil",
    summary:
      "The ASA upheld a complaint about a Google ad from Menwell Ltd, trading as Manual, promoting oral minoxidil with a monthly price. Oral minoxidil is a prescription-only medicine licensed in the UK only for some types of high blood pressure, so it cannot be advertised to the public.",
    whyItMatters:
      "Clinics may advertise hair-loss consultations but must not name or promote prescription-only treatments in public-facing ads.",
    date: "2025-06-04",
    source: "Advertising Standards Authority",
    url: "https://www.asa.org.uk/rulings/menwell-ltd-a25-1277445-menwell-ltd.html",
    disciplines: ["medical", "clinical"],
    topics: ["regulation", "business", "hair-loss"],
  },
  {
    id: "ishrs-2025-practice-census",
    headline: "ISHRS census reports younger patients and more black-market hair transplant repairs",
    summary:
      "The International Society of Hair Restoration Surgery's 2025 census found that most first-time surgical patients were aged 20 to 35 and that female surgical patients rose by 16.5% between 2021 and 2024. Some 59% of members said illicit hair transplant clinics operate in their cities, and repairs of black-market procedures averaged 10% of cases.",
    whyItMatters:
      "Clients considering cheap transplant packages abroad should be encouraged to check who will operate and what aftercare is available, and to see a doctor about complications.",
    date: "2025-05-13",
    source: "International Society of Hair Restoration Surgery",
    url: "https://ishrs.org/2025-practice-census-results/",
    disciplines: ["medical", "clinical", "cosmetic"],
    topics: ["hair-loss", "business"],
  },
  {
    id: "ema-finasteride-suicidal-ideation-review",
    headline: "EMA confirms suicidal thoughts as a side effect of finasteride",
    summary:
      "The European Medicines Agency's safety committee confirmed suicidal ideation as a side effect of finasteride tablets, with most reports involving the 1 mg dose used for hair loss. A patient card will be added to 1 mg packs and product information updated on mood changes and sexual dysfunction. The agency concluded that benefits continue to outweigh risks.",
    whyItMatters:
      "Relevant to Irish and EU clients and to the later UK update; prescription-only, so direct any concerns to the prescriber.",
    date: "2025-05-08",
    source: "European Medicines Agency",
    url: "https://www.ema.europa.eu/en/news/measures-minimise-risk-suicidal-thoughts-finasteride-dutasteride-medicines",
    disciplines: ["medical", "clinical"],
    topics: ["hair-loss", "regulation"],
  },
];
