import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";

/*
 * Four years in review: 2024.
 * A retrospective series published on the platform in September 2026.
 * Every dated or numerical claim below comes from a source listed in the
 * edition's `sources` array.
 */

const SRC = {
  niceTa958: {
    label: "NICE, TA958: Ritlecitinib for treating severe alopecia areata in people 12 years and over (2024)",
    url: "https://www.nice.org.uk/guidance/ta958",
  },
  eprNice: {
    label: "European Pharmaceutical Review, NICE recommends first medicine for severe alopecia areata (22 February 2024)",
    url: "https://www.europeanpharmaceuticalreview.com/news/214186/nice-recommends-first-medicine-for-severe-alopecia-areata/",
  },
  badRitlecitinib: {
    label: "British Association of Dermatologists and British Hair and Nail Society, Ritlecitinib for alopecia areata: professional guidance supplementary to NICE TA958 (July 2024)",
    url: "https://cdn.bad.org.uk/uploads/2024/07/01005430/Ritlecitinib-for-alopecia-areata-supplementary-guidance-26.06.24.pdf",
  },
  badGuideline: {
    label: "Harries MJ et al., British Association of Dermatologists living guideline for managing people with alopecia areata 2024, British Journal of Dermatology (online 21 October 2024)",
    url: "https://doi.org/10.1093/bjd/ljae385",
  },
  badGuidelineNews: {
    label: "British Association of Dermatologists, New living guideline for managing people with alopecia areata",
    url: "https://www.bad.org.uk/new-british-association-of-dermatologists-living-guideline-for-managing-people-with-alopecia-areata",
  },
  niceTa926: {
    label: "NICE, TA926: Baricitinib for treating severe alopecia areata (October 2023)",
    url: "https://www.nice.org.uk/guidance/ta926",
  },
  sunLeqselvi: {
    label: "Sun Pharma, U.S. FDA approves LEQSELVI (deuruxolitinib) for severe alopecia areata (25 July 2024)",
    url: "https://sunpharma.com/wp-content/uploads/2024/07/Sunpharma-LEQSELVI-Approval-Scenario-Press-Release.pdf",
  },
  naafLeqselvi: {
    label: "National Alopecia Areata Foundation, FDA approves LEQSELVI for adults with severe alopecia areata",
    url: "https://www.naaf.org/news/fda-approves-leqselvi-deuruxolitinib-for-adults-with-severe-alopecia-areata/",
  },
  mhraFinasteride: {
    label: "MHRA, Drug Safety Update: Finasteride, reminder of the risk of psychiatric side effects and of sexual side effects (April 2024)",
    url: "https://www.gov.uk/drug-safety-update/finasteride-reminder-of-the-risk-psychiatric-side-effects-and-of-sexual-side-effects-which-may-persist-after-discontinuation-of-treatment",
  },
  pracFinasteride: {
    label: "FAMHP (Belgium), PRAC October 2024: EMA starts safety review of medicines containing finasteride and dutasteride",
    url: "https://www.famhp.be/en/news/prac_october_2024_the_ema_started_safety_review_of_medicines_containing_finasteride_and",
  },
  aifaFinasteride: {
    label: "AIFA, EMA starts safety review of finasteride and dutasteride medicines (4 October 2024)",
    url: "https://www.aifa.gov.it/documents/20142/2209305/2024.10.04_com-EMA_finasteride-dutasteride_EN.pdf",
  },
  emaMinoxidil: {
    label: "EMA/CMDh, Minoxidil (topical formulation): scientific conclusions and amendments to the product information (PSUSA/00002067/202310, 2024)",
    url: "https://www.ema.europa.eu/en/documents/psusa/minoxidil-topical-formulation-cmdh-scientific-conclusions-grounds-variation-amendments-product-information-timetable-implementation-psusa-00002067-202310_en.pdf",
  },
  jamaMinoxidil: {
    label: "Penha MA et al., Oral minoxidil vs topical minoxidil for male androgenetic alopecia: a randomized clinical trial, JAMA Dermatology (2024)",
    url: "https://jamanetwork.com/journals/jamadermatology/fullarticle/2817326",
  },
  nprFormaldehyde: {
    label: "NPR, The FDA misses its own deadline to propose a ban on formaldehyde from hair products (8 May 2024)",
    url: "https://www.wwno.org/npr-news/2024-05-08/the-fda-misses-its-own-deadline-to-propose-a-ban-on-formaldehyde-from-hair-products",
  },
  nprFormaldehydeJuly: {
    label: "NPR, The FDA misses its deadline again to propose a ban on formaldehyde in hair products (20 July 2024)",
    url: "https://www.houstonpublicmedia.org/npr/2024/07/20/g-s1-12400/the-fda-misses-its-deadline-again-to-propose-a-ban-on-formaldehyde-in-hair-products/",
  },
  euReg996: {
    label: "Commission Regulation (EU) 2024/996 of 3 April 2024 amending the Cosmetics Regulation (EUR-Lex)",
    url: "https://eur-lex.europa.eu/eli/reg/2024/996/oj/eng",
  },
  ulReg996: {
    label: "UL Solutions, EU updates Annexes II, III, V and VI to the Cosmetics Regulation (2024)",
    url: "https://www.ul.com/news/eu-updates-annexes-ii-iii-v-and-vi-cosmetics-regulation",
  },
  asaNuman: {
    label: "Advertising Standards Authority, Ruling on Vir Health Ltd t/a Numan (6 March 2024)",
    url: "https://www.asa.org.uk/rulings/vir-health-ltd-a22-1178070-vir-health-ltd.html",
  },
  nhbfStats: {
    label: "National Hair & Beauty Federation, NHBF industry statistics",
    url: "https://www.nhbf.co.uk/about-the-nhbf/campaigning-for-you/industry-research-reports-and-statistics/nhbf-industry-statistics/",
  },
  scotNews: {
    label: "Scottish Government, Regulation and licensing of non-surgical cosmetic procedures (20 December 2024)",
    url: "https://www.gov.scot/news/regulation-and-licensing-of-non-surgical-cosmetic-procedures/",
  },
  scotConsult: {
    label: "Scottish Government consultation, Regulation of non-surgical cosmetic procedures (20 December 2024 to 14 February 2025)",
    url: "https://consult.gov.scot/healthcare-quality-and-improvement/regulation-of-non-surgical-cosmetic-procedures/",
  },
  psaIot: {
    label: "Professional Standards Authority, Accredited register: Institute of Trichologists",
    url: "https://www.professionalstandards.org.uk/organisations-we-oversee/find-a-register/institute-trichologists",
  },
  ijdCurly: {
    label: "Updates on disorders in curly hair, International Journal of Dermatology (online 15 April 2024)",
    url: "https://doi.org/10.1111/ijd.17184",
  },
  regenReview: {
    label: "Regenerative medicine in the treatment of specific dermatologic disorders: a systematic review of randomized controlled clinical trials, Stem Cell Research & Therapy (18 June 2024)",
    url: "https://doi.org/10.1186/s13287-024-03800-6",
  },
};

export const archive2024: Edition[] = [
  // ─────────────────────────────────────────────────────────────
  // 2024 in review
  // ─────────────────────────────────────────────────────────────
  {
    number: 202401,
    slug: "2024-in-review",
    title: "2024 in review",
    fade: "The year the evidence caught up.",
    theme: "Four years in review",
    standfirst:
      "A retrospective on 2024: the first NHS-recommended medicine for severe alopecia areata, louder warnings on finasteride, new cosmetic ingredient limits and a sharper line on advertising claims.",
    coverImageKey: "ed03",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2024",
    focus: "review",
    pages: [
      {
        kind: "letter",
        title: "Looking back at 2024",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2024. Trichozette did not exist then, and neither did Trichollective, which began with a conference at Whittlebury Hall in January 2026. This is a retrospective, written in 2026 as part of a series we call Four years in review, and it is here because the changes of that year still shape what happens in salons, clinics and consulting rooms today.",
          },
          {
            type: "p",
            text: "Looking back, 2024 was the year the evidence caught up with the conversation. For a long time, clients with severe alopecia areata had heard about new tablets without being able to get them on the NHS. In 2024 that changed. For a long time, the side effects of finasteride had been discussed more on forums than in consulting rooms. In 2024 the regulators in the UK and Europe took a firmer line. The cosmetic side of our work saw its own shifts, from new limits on everyday ingredients to a clear ruling that a hair-loss advert must not imply a guaranteed result.",
          },
          {
            type: "p",
            text: "We have tried to be careful. Every dated event and every figure in this edition comes from a regulator, a professional body, a journal or a reputable news outlet, and the sources are listed at the end. Where we could not confirm something, we left it out. Where a story continued beyond 2024, we stop at the end of the year.",
          },
          {
            type: "p",
            text: "Read the lead article first for the shape of the year. The pages after it take the same events and ask what they mean for the cosmetic chair, the trichology clinic and the medical consulting room, and then test what you have taken in. The three companion editions go deeper into each field.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The year",
        title: "What really changed in 2024",
        standfirst:
          "New medicines, firmer warnings, tighter ingredient rules and a line drawn under guaranteed results. The year's biggest shifts across all three fields.",
        imageKey: "ed09",
        blocks: [
          {
            type: "p",
            text: "Most years in hair and scalp care are made of small steps. 2024 had a handful of larger ones, and they landed in all three of our fields at once. Some were medical, some regulatory and some commercial, but they share a theme: claims about hair were asked to meet a higher standard of evidence and honesty.",
          },
          { type: "h", text: "Alopecia areata reaches the NHS" },
          {
            type: "p",
            text: "In February 2024 NICE issued final draft guidance recommending ritlecitinib, an oral JAK inhibitor, for severe alopecia areata in people aged 12 and over, followed by final guidance, TA958, in March. It was the first time NICE had recommended a medicine for severe alopecia areata; baricitinib had been appraised in October 2023 and was not recommended on cost-effectiveness grounds. In July, the British Association of Dermatologists and the British Hair and Nail Society published supplementary guidance on how to put the recommendation into practice, and in October the BAD living guideline for alopecia areata appeared online. Across the Atlantic, the US Food and Drug Administration approved a further JAK inhibitor, deuruxolitinib, for adults with severe alopecia areata on 25 July.",
          },
          { type: "h", text: "Firmer words on finasteride and minoxidil" },
          {
            type: "p",
            text: "In April the MHRA reminded prescribers that finasteride has been associated with depression, suicidal thoughts and sexual dysfunction, that sexual side effects have in some cases persisted after treatment stopped, and that a patient card would be placed in every pack. In October the European Medicines Agency's safety committee began its own review of finasteride and dutasteride. Minoxidil came under scrutiny too: European regulators added a warning that infants had developed excess body hair after skin contact with a carer's application site.",
          },
          { type: "pull", text: "Claims about hair were asked to meet a higher standard of evidence and honesty." },
          { type: "h", text: "The cosmetic rulebook moves" },
          {
            type: "list",
            items: [
              "In March the Advertising Standards Authority ruled that a television advert combining a money-back offer with the words clinically proven implied a guaranteed result for a hair-loss medicine, which the code forbids.",
              "In April the European Commission adopted Regulation (EU) 2024/996, setting new limits for vitamin A derivatives, arbutin and several other cosmetic ingredients, phased in from 2025.",
              "Through the year, the US FDA repeatedly missed its own target dates to propose a ban on formaldehyde in hair straightening and smoothing products.",
              "In December the Scottish Government opened a consultation on licensing non-surgical cosmetic procedures, with an age limit of 18.",
            ],
          },
          {
            type: "callout",
            title: "A note on scope",
            text: "Some of these stories are American or European rather than British or Irish. We include them because products, clients and evidence cross borders, and because they shaped the questions UK and Irish clients brought into salons and clinics.",
          },
          { type: "h", text: "What connects them" },
          {
            type: "p",
            text: "Each change asked the same thing of professionals: be precise about what a treatment or product can and cannot do, know its risks, and know when to pass the client on. That is the thread the rest of this edition follows.",
          },
          {
            type: "quiz",
            question: "Which was the first medicine NICE recommended for severe alopecia areata?",
            options: ["Baricitinib", "Ritlecitinib", "Deuruxolitinib", "Oral minoxidil"],
            answer: 1,
            explain:
              "NICE recommended ritlecitinib in TA958 in 2024. Baricitinib had been appraised in 2023 and was not recommended. Deuruxolitinib was approved in the United States, not appraised by NICE, that year.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "One year, three chairs",
        intro:
          "The same year looked different from the salon, the trichology clinic and the consulting room. Here is how each discipline might read 2024, and what each should take from it.",
        views: [
          {
            discipline: "cosmetic",
            heading: "At the chair: words carry weight",
            blocks: [
              {
                type: "p",
                text: "For stylists and head spa therapists, the most practical lesson of 2024 came from an advertising ruling, not a laboratory. The ASA found that pairing a refund offer with a claim of clinical proof implied that a hair-loss treatment was guaranteed to work. The ruling concerned a medicine, but the principle is one every salon can apply: do not promise regrowth, and be careful that offers and wording do not promise it for you.",
              },
              {
                type: "p",
                text: "The year also brought new ingredient limits in the EU and continued uncertainty about formaldehyde in smoothing treatments. Knowing what is in the products you use and sell, and reading the label rather than the marketing, became part of the job.",
              },
              {
                type: "quiz",
                question:
                  "A salon wants to advertise a scalp treatment with a full refund if hair does not regrow. What is the safest approach?",
                options: [
                  "Advertise it as clinically proven with a refund, as long as the refund is honoured",
                  "Avoid any wording or offer that implies regrowth is guaranteed",
                  "Use the offer only on social media, where the code does not apply",
                  "Add small print saying results may vary",
                ],
                answer: 1,
                explain:
                  "The 2024 ASA ruling showed that an offer can imply a guarantee even when the words are cautious. Advertising codes apply to social media too, and small print does not cure a misleading overall impression.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "In the clinic: severity has a number",
            blocks: [
              {
                type: "p",
                text: "For trichologists, 2024 made one tool much more important. NHS access to ritlecitinib depends on severity, and the BAD and BHNS guidance defined severe alopecia areata as at least 50 per cent scalp hair loss, measured with the Severity of Alopecia Tool, or SALT. Clients referred with clear, dated photographs and an estimate of extent arrive at the dermatologist better prepared.",
              },
              {
                type: "p",
                text: "Trichology is not statutorily regulated in the UK or Ireland, so the value a trichologist adds lies in careful history-taking, good records and timely referral. The Institute of Trichologists' register was accredited by the Professional Standards Authority in December 2023, making 2024 its first full year as an accredited register.",
              },
              {
                type: "checklist",
                title: "A referral note for suspected alopecia areata",
                items: [
                  "Date of onset and how quickly it has progressed",
                  "Estimated proportion of scalp affected, with dated photographs",
                  "Whether eyebrows, eyelashes, beard or nails are involved",
                  "The effect on the client's mood and daily life, in their own words",
                  "Any previous treatments and how the client responded",
                ],
              },
            ],
          },
          {
            discipline: "medical",
            heading: "In the consulting room: ask first, then monitor",
            blocks: [
              {
                type: "p",
                text: "For GPs, dermatologists and aesthetic prescribers, 2024 sharpened two conversations. The MHRA asked prescribers to ask about any history of depression or suicidal thoughts before prescribing finasteride, and to monitor for psychiatric and sexual side effects. The new JAK inhibitor pathway added screening, monitoring and a clear review point to the dermatology workload.",
              },
              {
                type: "p",
                text: "Both changes reward good communication. Patients who understand the risks, and who know that regrowth may be lost when a JAK inhibitor is stopped, make better-informed choices and are more likely to report problems early.",
              },
              {
                type: "reveal",
                prompt:
                  "Under the 2024 MHRA advice, what should a patient taking finasteride for hair loss do if they develop depression or suicidal thoughts?",
                answer:
                  "Stop finasteride for hair loss immediately and contact their doctor as soon as possible. The MHRA also suggested patients tell friends and family they are taking it, as others may notice changes in mood first.",
              },
            ],
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "2024 at a glance",
        rows: [
          { label: "22 February", value: "NICE issues final draft guidance recommending ritlecitinib for severe alopecia areata from age 12." },
          { label: "6 March", value: "The ASA upholds a complaint that a TV advert implied a hair-loss medicine was guaranteed to work." },
          { label: "3 April", value: "The European Commission adopts Regulation (EU) 2024/996, limiting vitamin A, arbutin and other cosmetic ingredients." },
          { label: "April", value: "The MHRA issues a Drug Safety Update on finasteride and announces a patient card for every pack." },
          { label: "April", value: "The US FDA misses its own target date to propose a ban on formaldehyde in hair straighteners." },
          { label: "June", value: "European regulators agree a warning on infant hypertrichosis after contact with topical minoxidil." },
          { label: "July", value: "The BAD and BHNS publish guidance supplementary to NICE TA958 on ritlecitinib." },
          { label: "25 July", value: "The US FDA approves deuruxolitinib for adults with severe alopecia areata." },
          { label: "4 October", value: "The EMA announces a safety review of finasteride and dutasteride." },
          { label: "20 December", value: "Scotland opens a consultation on licensing non-surgical cosmetic procedures." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed09",
        caption:
          "Evidence, honesty and referral: the three threads that ran through 2024 in every part of hair and scalp care.",
      },
      {
        kind: "article",
        kicker: "In practice",
        title: "What 2024 means for practice",
        standfirst:
          "The regulatory headlines of 2024 translate into a few habits that every hair and scalp professional can adopt, whatever their discipline.",
        blocks: [
          {
            type: "p",
            text: "Regulatory news can feel distant from a working day. A NICE appraisal or an EMA review rarely names a salon or a trichology clinic. Yet the changes of 2024 touch every part of our work, because clients hear about them, ask about them and sometimes arrive already taking the medicines concerned.",
          },
          { type: "h", text: "Know what your clients may be taking" },
          {
            type: "p",
            text: "Finasteride and minoxidil are widely used, and many clients buy them online. After 2024, it is worth knowing the headlines. Finasteride carries warnings about mood and sexual side effects, and the MHRA asked that patients receive a card explaining them. Topical minoxidil carries a European warning about infants developing excess body hair after contact with a carer's treated scalp. None of this is for a stylist or trichologist to manage, but noticing and signposting is part of good care.",
          },
          { type: "h", text: "Record what you see" },
          {
            type: "p",
            text: "The new NHS pathway for severe alopecia areata depends on measuring the extent of hair loss. The BAD guidance even suggests that, for people already on a JAK inhibitor privately, clinicians may estimate earlier severity from images or the patient's description. Dated photographs, taken with consent under consistent light, can help a client later on.",
          },
          { type: "pull", text: "Noticing and signposting is part of good care, whatever your discipline." },
          { type: "h", text: "Say only what you can support" },
          {
            type: "p",
            text: "The ASA ruling of March 2024 is a reminder that the overall impression matters as much as the words. It applies to medicine adverts directly, but the same principle runs through advertising codes generally. Clinics and salons that avoid promising results protect their clients and their own reputations.",
          },
          {
            type: "list",
            items: [
              "Describe what a service involves, not what it will achieve.",
              "Check that offers, such as refunds, do not imply a guaranteed result.",
              "Keep product claims to what the manufacturer can support.",
              "When a client asks about a prescription medicine, refer them to a pharmacist, GP or dermatologist.",
            ],
          },
          {
            type: "callout",
            title: "Red flags that always need a medical opinion",
            text: "Sudden or patchy hair loss, scalp pain, burning or tenderness, redness with scaling that does not settle, pustules, scarring or shiny patches, and hair loss with weight change, fatigue or other symptoms of being unwell. Refer to a GP or dermatologist.",
          },
          {
            type: "p",
            text: "Above all, 2024 showed the value of each discipline knowing where its work ends. A client with severe patchy loss needs a dermatologist, a client worried about a medicine needs a prescriber, and a client who simply wants a healthy scalp routine may need nothing more than a skilled cosmetic professional. The companion editions look at each field in more depth.",
          },
          {
            type: "reveal",
            prompt: "Why might dated photographs taken in the salon or clinic help a client with alopecia areata later on?",
            answer:
              "NHS access to ritlecitinib depends on severity, measured by the extent of scalp hair loss. Where a client has already started treatment privately, the BAD guidance suggests earlier severity can be estimated from images or the patient's description.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "How well do you know 2024?",
        intro: "Three questions drawn from the facts in this edition. Answer, then read the explanation.",
        blocks: [
          {
            type: "quiz",
            question: "What did the MHRA announce in April 2024 alongside its finasteride safety reminder?",
            options: [
              "A ban on online sales of finasteride",
              "A patient card in every finasteride pack",
              "A new minimum age for prescribing",
              "Mandatory blood tests before starting treatment",
            ],
            answer: 1,
            explain:
              "The MHRA said a patient card would be introduced in all finasteride packs, highlighting the risk of sexual and psychiatric side effects.",
          },
          {
            type: "quiz",
            question: "Why did the ASA rule against a hair-loss medicine advert in March 2024?",
            options: [
              "It used a celebrity endorsement",
              "It did not show the price",
              "Its refund offer, combined with a claim of clinical proof, implied a guaranteed result",
              "It was broadcast before the watershed",
            ],
            answer: 2,
            explain:
              "The ASA found that the refund offer, presented alongside the words clinically proven, gave the impression that the effects were proven and guaranteed.",
          },
          {
            type: "quiz",
            question: "What age limit did the Scottish Government propose in its December 2024 consultation on non-surgical cosmetic procedures?",
            options: ["16", "18", "21", "No age limit"],
            answer: 1,
            explain: "The consultation proposed that non-surgical cosmetic procedures should only be carried out on people aged 18 and over.",
          },
        ],
      },
    ],
    sources: [
      SRC.niceTa958,
      SRC.eprNice,
      SRC.niceTa926,
      SRC.badRitlecitinib,
      SRC.badGuideline,
      SRC.sunLeqselvi,
      SRC.mhraFinasteride,
      SRC.pracFinasteride,
      SRC.emaMinoxidil,
      SRC.asaNuman,
      SRC.euReg996,
      SRC.ulReg996,
      SRC.nprFormaldehyde,
      SRC.scotConsult,
      SRC.psaIot,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Cosmetic, 2024
  // ─────────────────────────────────────────────────────────────
  {
    number: 202402,
    slug: "2024-cosmetic",
    title: "Cosmetic, 2024",
    fade: "Claims, chemicals and the chair.",
    theme: "Four years in review",
    standfirst:
      "What changed in 2024 for stylists, barbers, head spa therapists and cosmetic practitioners: advertising limits, ingredient rules, the formaldehyde question and the start of licensing in Scotland.",
    coverImageKey: "ed16",
    coverTone: "dark",
    audience: ["cosmetic"],
    published: "2026-09-30",
    series: "archive",
    period: "2024",
    focus: "cosmetic",
    pages: [
      {
        kind: "letter",
        title: "The chair in 2024",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2024 from the cosmetic chair. Trichozette was not published then; it is a retrospective, written in 2026 as part of our Four years in review series, for the stylists, barbers, colourists, head spa therapists and cosmetic practitioners who make up much of Trichollective.",
          },
          {
            type: "p",
            text: "The cosmetic side of hair and scalp care rarely makes headlines, but 2024 brought several changes that reached the salon floor. An advertising ruling drew a clear line under implied guarantees. The European Union tightened limits on several common cosmetic ingredients. In the United States, a promised ban on formaldehyde in smoothing products kept slipping, which left salons elsewhere asking what was in the bottles on their own shelves. At the end of the year, Scotland set out how it might license non-surgical cosmetic procedures.",
          },
          {
            type: "p",
            text: "The industry itself kept growing. The National Hair & Beauty Federation's figures published in 2024 showed business numbers up by 1,240, or 2.5 per cent, on the year before, with turnover of about 5.8 billion pounds for 2023 to 2024. More businesses means more competition, and more reason to be precise about what we offer.",
          },
          {
            type: "p",
            text: "The pages that follow set out what changed, then turn to the education that matters because of it: smoothing chemistry, advertising, and tension on the hairline. Every factual claim is sourced at the end.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The rulebook",
        title: "Four changes that reached the salon floor",
        standfirst:
          "An advertising ruling, new ingredient limits, a stalled ban and a licensing consultation. What each meant for cosmetic professionals.",
        imageKey: "ed15",
        blocks: [
          {
            type: "p",
            text: "Salons and head spas are shaped by rules they rarely read in full. In 2024, four developments were worth knowing about, even for those whose working day is spent entirely at the basin and the chair.",
          },
          { type: "h", text: "1. No implied guarantees" },
          {
            type: "p",
            text: "On 6 March 2024 the Advertising Standards Authority upheld a complaint about a television advert for a hair-loss medicine. The advert offered a full refund if hair did not grow back within a set period and described the product as clinically proven. The ASA concluded that the combination was likely to give viewers the impression that the effects were proven and guaranteed, which the broadcast code does not allow for medicines. Refunds are not banned in themselves; the problem was the overall impression.",
          },
          { type: "h", text: "2. New ingredient limits in the EU" },
          {
            type: "p",
            text: "On 3 April 2024 the European Commission adopted Regulation (EU) 2024/996. It set maximum concentrations for vitamin A derivatives such as retinol, restricted alpha-arbutin, arbutin, kojic acid, genistein and daidzein, and tightened rules on triclosan, triclocarban and 4-methylbenzylidene camphor. The limits phase in from 2025. For Irish salons, and for UK businesses that sell into the EU, this matters for leave-on scalp and skin products.",
          },
          { type: "pull", text: "Refunds are not banned in themselves; the problem was the overall impression." },
          { type: "h", text: "3. The formaldehyde ban that did not arrive" },
          {
            type: "p",
            text: "The US Food and Drug Administration had set April 2024 as its target to propose a ban on formaldehyde and formaldehyde-releasing chemicals in hair straightening and smoothing products. It missed that date, and NPR reported in July that it had missed a later target too. The next page looks at what that means for the chair.",
          },
          { type: "h", text: "4. Scotland sets out a licensing model" },
          {
            type: "p",
            text: "On 20 December 2024 the Scottish Government opened a consultation, running to 14 February 2025, on regulating non-surgical cosmetic procedures that pierce or penetrate the skin. It proposed three risk-based groups:",
          },
          {
            type: "list",
            items: [
              "Group 1, the lowest-risk procedures, carried out by trained practitioners in licensed premises or settings regulated by Healthcare Improvement Scotland.",
              "Group 2, more invasive procedures, in regulated settings under the supervision of an appropriate healthcare professional.",
              "Group 3, the highest-risk procedures, performed only by an appropriate healthcare professional.",
              "An age limit of 18 for all non-surgical cosmetic procedures.",
            ],
          },
          {
            type: "callout",
            title: "Why this matters beyond Scotland",
            text: "Most head spa and styling services do not pierce the skin and fall outside these proposals. But practitioners who add scalp microneedling or similar services should follow licensing proposals across the UK and Ireland closely, and check their insurance and training.",
          },
          {
            type: "quiz",
            question: "What was the main problem the ASA identified in the March 2024 hair-loss advert?",
            options: [
              "Refund offers are banned for all medicines",
              "The product was not licensed in the UK",
              "The refund offer and clinically proven claim together implied a guaranteed result",
              "The advert did not name the active ingredient",
            ],
            answer: 2,
            explain:
              "The ASA made clear that refunds are not prohibited in themselves. It was the combination with a claim of clinical proof that implied a guarantee.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Smoothing treatments and the formaldehyde question",
        standfirst:
          "The US ban kept slipping through 2024. What cosmetic professionals should understand about formaldehyde, labels and ventilation.",
        imageKey: "ed08",
        blocks: [
          {
            type: "p",
            text: "Chemical smoothing and straightening treatments remain popular, and many clients ask for them by brand name. In 2024 the products behind those names were under scrutiny in the United States, where the FDA had said it would propose a ban on formaldehyde and formaldehyde-releasing ingredients in straightening products. By the end of the year the proposal had still not been published.",
          },
          { type: "h", text: "What was reported" },
          {
            type: "p",
            text: "NPR, reporting in May 2024, noted that more than 150 hair-straightening products on sale contained formaldehyde, and that New York health investigators had found the chemical in products labelled formaldehyde-free or natural. The same report cited a 2022 study by the US National Institutes of Health which linked frequent use of chemical straighteners to a higher risk of uterine cancer. The FDA told NPR in April that it was still developing the rule.",
          },
          { type: "h", text: "Why it matters at the chair" },
          {
            type: "p",
            text: "Formaldehyde is a well-known irritant. When heated during a smoothing service it can be released into the air, which affects the stylist, other staff and clients nearby as well as the person in the chair. Short-term exposure is associated with irritation of the eyes, nose and throat. Stylists perform these services many times a year, so their exposure can be greater than any single client's.",
          },
          { type: "pull", text: "A label that says formaldehyde-free is not the same as a product that is." },
          {
            type: "list",
            items: [
              "Read the full ingredient list and the safety data sheet, not just the front of the pack.",
              "Look for formaldehyde releasers as well as formaldehyde itself, and ask the supplier if unsure.",
              "Work in a well-ventilated space and follow the manufacturer's instructions on heat.",
              "Record which product was used, on whom, and any reaction reported.",
              "Stop and refer if a client reports breathing difficulty, severe scalp burning or blistering.",
            ],
          },
          {
            type: "callout",
            title: "When to decline the service",
            text: "Do not apply chemical smoothing to a scalp that is broken, inflamed, weeping or sore. A client with an unexplained scaly, red or painful scalp should see a GP or pharmacist before any chemical service.",
          },
          {
            type: "p",
            text: "None of this means every smoothing product is unsafe, or that UK and Irish rules mirror American ones. It means that in 2024 the burden shifted towards the professional to know what they are using. That is a reasonable expectation of any skilled trade.",
          },
          {
            type: "reveal",
            prompt: "Why might a stylist's exposure to formaldehyde be greater than a single client's?",
            answer:
              "Heating a smoothing product can release formaldehyde into the air, and a stylist may perform the service many times a year, often in the same room, while each client is exposed only during their own appointment.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The cosmetic year at a glance",
        rows: [
          { label: "6 March", value: "The ASA rules that a refund offer plus a clinically proven claim implied a guaranteed hair-loss result." },
          { label: "3 April", value: "Regulation (EU) 2024/996 sets new limits for vitamin A, arbutin, kojic acid and other ingredients." },
          { label: "April", value: "The US FDA misses its target to propose a formaldehyde ban in hair straighteners." },
          { label: "15 April", value: "A review of disorders in curly hair, including traction alopecia, is published online." },
          { label: "June", value: "European regulators agree a warning on infant hypertrichosis after contact with topical minoxidil." },
          { label: "July", value: "NPR reports that the FDA has missed a further target date on formaldehyde." },
          { label: "2024", value: "NHBF figures show business numbers up 1,240, or 2.5 per cent, with turnover of about 5.8 billion pounds." },
          { label: "20 December", value: "Scotland opens a consultation on licensing non-surgical cosmetic procedures." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed07",
        caption:
          "Braids, weaves and tight styles can be worn safely. The risk lies in sustained tension, and the stylist is often the first to see it.",
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Tension, texture and the hairline",
        standfirst:
          "A 2024 review of disorders in curly hair put traction alopecia in plain view. What the stylist can notice, and when to refer.",
        imageKey: "ed01",
        blocks: [
          {
            type: "p",
            text: "In April 2024 the International Journal of Dermatology published a review of hair disorders that commonly occur in people with curly, textured hair, including traction alopecia, central centrifugal cicatricial alopecia and acquired trichorrhexis nodosa. It noted that traction alopecia can arise from high-tension hairstyles that are presumed to be protective, and that hairstyling practices likely contribute to both traction alopecia and breakage.",
          },
          {
            type: "p",
            text: "For cosmetic professionals this is directly relevant. Braiders, loc technicians, extension specialists and stylists see the hairline more often than anyone else, and early traction alopecia is usually reversible when tension is reduced. Later, it may not be.",
          },
          { type: "h", text: "What to look for" },
          {
            type: "list",
            items: [
              "Thinning or recession at the temples, edges or above the ears.",
              "Small bumps, redness or tenderness around the roots of tightly styled hair.",
              "A fringe of short, fine hairs remaining along the front margin, which the review describes as a common sign.",
              "Clients who report headaches or soreness after a new install.",
            ],
          },
          { type: "pull", text: "Early traction alopecia is usually reversible when tension is reduced. Later, it may not be." },
          { type: "h", text: "What to do" },
          {
            type: "p",
            text: "The priority is to reduce tension without judgement. Many clients choose these styles for good reasons, including protecting fragile hair. Suggest looser installs, lighter extensions, rotating the parting and taking breaks between styles. Never braid over a sore, inflamed or broken scalp.",
          },
          {
            type: "callout",
            title: "When to refer",
            text: "Shiny, smooth patches where follicles are no longer visible, persistent itching or burning at the crown, spreading loss, or loss that does not improve after tension is reduced all need assessment by a GP, dermatologist or trichologist. Some scarring alopecias affect the crown in people with textured hair and need medical diagnosis.",
          },
          {
            type: "p",
            text: "The stylist cannot diagnose, but the stylist can notice, record with consent, and change the service. That is often enough to prevent permanent loss.",
          },
          {
            type: "p",
            text: "It also helps to talk about the hairline early, before there is a problem. A short conversation at a first appointment about how tight is too tight, and what soreness after an install means, gives the client permission to speak up later. Clients who know the signs are more likely to come back before thinning becomes established, and more likely to trust the stylist who raised it.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The cosmetic year in practice",
        intro: "A checklist to use in the salon, and three questions on what changed in 2024.",
        blocks: [
          {
            type: "checklist",
            title: "Before a chemical or high-tension service",
            items: [
              "Scalp checked for soreness, redness, broken skin or scaling",
              "Full ingredient list and safety data sheet read for any smoothing product",
              "Room ventilation checked for heated chemical services",
              "Hairline checked for thinning at the edges before a tight style",
              "Client told what the service does, with no promise of results",
              "Consent recorded, and any previous reaction noted",
            ],
          },
          {
            type: "quiz",
            question: "Which EU regulation adopted on 3 April 2024 set new limits for retinol and arbutin in cosmetics?",
            options: [
              "Regulation (EU) 2024/996",
              "Regulation (EC) 1223/2009",
              "Regulation (EU) 2017/745",
              "Directive 76/768/EEC",
            ],
            answer: 0,
            explain:
              "Regulation (EU) 2024/996 amended the main Cosmetics Regulation, 1223/2009, to add the new limits. 2017/745 is the Medical Devices Regulation, and 76/768/EEC was the old Cosmetics Directive.",
          },
          {
            type: "quiz",
            question: "What did New York investigators find, according to NPR's May 2024 report?",
            options: [
              "That formaldehyde had been banned in New York salons",
              "That products labelled formaldehyde-free or natural contained formaldehyde",
              "That formaldehyde was only present in professional products",
              "That smoothing products released no formaldehyde when heated",
            ],
            answer: 1,
            explain: "The report said investigators had found formaldehyde in products labelled formaldehyde-free or natural. Read the full label and the safety data sheet.",
          },
          {
            type: "quiz",
            question: "In the Scottish proposals, who could perform Group 3, the highest-risk procedures?",
            options: [
              "Any trained practitioner in licensed premises",
              "A beauty therapist under remote supervision",
              "Only an appropriate healthcare professional",
              "Anyone over 18",
            ],
            answer: 2,
            explain: "Group 3 procedures would be performed only by appropriate healthcare professionals, in settings regulated by Healthcare Improvement Scotland.",
          },
        ],
      },
    ],
    sources: [
      SRC.asaNuman,
      SRC.euReg996,
      SRC.ulReg996,
      SRC.nprFormaldehyde,
      SRC.nprFormaldehydeJuly,
      SRC.scotNews,
      SRC.scotConsult,
      SRC.nhbfStats,
      SRC.ijdCurly,
      SRC.emaMinoxidil,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Clinical, 2024
  // ─────────────────────────────────────────────────────────────
  {
    number: 202403,
    slug: "2024-clinical",
    title: "Clinical, 2024",
    fade: "Measure, record, refer.",
    theme: "Four years in review",
    standfirst:
      "What 2024 changed for trichologists: a severity threshold for NHS treatment of alopecia areata, a new living guideline, trichoscopy in textured hair and a sober look at regenerative claims.",
    coverImageKey: "ed04",
    coverTone: "dark",
    audience: ["clinical"],
    published: "2026-09-30",
    series: "archive",
    period: "2024",
    focus: "clinical",
    pages: [
      {
        kind: "letter",
        title: "The clinic in 2024",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2024 from the trichology clinic. It is a retrospective, written in 2026 for our Four years in review series; Trichozette did not exist in 2024, and Trichollective's own story starts in January 2026.",
          },
          {
            type: "p",
            text: "For trichologists, 2024 was a year when the medical world drew clearer lines, and that made the clinical role easier to describe. NICE recommended the first medicine for severe alopecia areata, and dermatologists published guidance on exactly how severity should be measured. The British Association of Dermatologists released a living guideline for alopecia areata that will be updated as evidence changes. Published research gave practical help on trichoscopy in curly and textured hair.",
          },
          {
            type: "p",
            text: "Trichology is not statutorily regulated in the UK or Ireland. The Institute of Trichologists' register was accredited by the Professional Standards Authority in December 2023, so 2024 was its first full year as an accredited register. Accreditation is a voluntary quality mark, not statutory regulation, and it is one reason careful records, honest limits and good referral relationships matter so much.",
          },
          {
            type: "p",
            text: "The pages that follow explain what changed and what it means for consultation, documentation and referral. Every factual claim is sourced at the end.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Alopecia areata",
        title: "Severity has a number now",
        standfirst:
          "NHS access to the first recommended medicine for severe alopecia areata depends on measured scalp loss. Why the trichologist's notes suddenly matter more.",
        imageKey: "ed13",
        blocks: [
          {
            type: "p",
            text: "In March 2024 NICE published TA958, recommending ritlecitinib for severe alopecia areata in people aged 12 and over, following final draft guidance in February. It was the first time NICE had recommended a medicine for severe alopecia areata. Prescribing sits with dermatology, not trichology, but the recommendation changed what a good trichology referral looks like.",
          },
          { type: "h", text: "How severity was defined" },
          {
            type: "p",
            text: "In July, guidance from the British Association of Dermatologists and the British Hair and Nail Society, developed with Alopecia UK, set out how clinicians should apply the NICE decision. It defined severe alopecia areata as at least 50 per cent scalp hair loss, for example a Severity of Alopecia Tool (SALT) score of 50 or more. It also recognised that the percentage alone does not capture the whole burden of the condition.",
          },
          {
            type: "list",
            items: [
              "Limited loss was described as 1 to 20 per cent of the scalp, moderate as 21 to 49 per cent, and severe as 50 to 100 per cent.",
              "Moderate disease could be rated severe if there was a negative psychological impact, noticeable eyebrow or eyelash involvement, an inadequate response after at least six months of treatment, or a diffusely positive pull test suggesting rapid progression.",
              "The guidance advised against using disease duration to decide eligibility.",
              "Treatment response is reviewed at week 36, and patients should be told that regrowth is likely to be lost if treatment stops.",
            ],
          },
          { type: "pull", text: "The percentage alone does not capture the whole burden of the condition." },
          { type: "h", text: "What this means in the clinic" },
          {
            type: "p",
            text: "A trichologist is often the professional who sees a client with alopecia areata most regularly. Accurate, dated records of extent, of eyebrow and eyelash involvement, and of the effect on the client's life can help the dermatologist. The guidance even notes that, where someone started a JAK inhibitor privately, earlier severity may be estimated from images or the patient's description.",
          },
          {
            type: "p",
            text: "In October 2024 the BAD's living guideline for managing alopecia areata appeared online in the British Journal of Dermatology. A living guideline is designed to be updated as new evidence emerges, so it is worth checking the current version rather than relying on memory.",
          },
          {
            type: "callout",
            title: "Stay within scope",
            text: "Trichologists do not diagnose alopecia areata for NHS treatment decisions or recommend prescription medicines. Refer to a GP or dermatologist, share your records with consent, and support the client while they wait.",
          },
          {
            type: "quiz",
            question:
              "Under the 2024 BAD and BHNS guidance, a client has 35 per cent scalp loss and has lost most of their eyebrows. How might their severity be rated?",
            options: [
              "Limited, because it is under 50 per cent",
              "Moderate, with no adjustment possible",
              "Severe, because noticeable eyebrow involvement can raise moderate disease by one level",
              "It cannot be rated without a biopsy",
            ],
            answer: 2,
            explain:
              "Moderate disease (21 to 49 per cent) may be rated severe if one or more additional factors are present, including noticeable involvement of the eyebrows or eyelashes. The final rating is for the dermatologist.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Trichoscopy",
        title: "Reading curly and textured hair",
        standfirst:
          "A 2024 review brought together what trichoscopy shows in traction alopecia, central centrifugal cicatricial alopecia and breakage in curly hair.",
        imageKey: "ed18",
        blocks: [
          {
            type: "p",
            text: "In April 2024 the International Journal of Dermatology published a review of disorders that commonly occur in curly, textured hair, particularly in people of African descent. It covered central centrifugal cicatricial alopecia (CCCA), traction alopecia and acquired trichorrhexis nodosa, and noted that curly hair has distinct properties that can make diagnosis and treatment harder.",
          },
          { type: "h", text: "What the review described" },
          {
            type: "list",
            items: [
              "In CCCA, perifollicular halos were seen more often than perifollicular redness or scale.",
              "CCCA has been linked to uterine fibroids, type 2 diabetes and fibroproliferation.",
              "Traction alopecia often shows a fringe sign, and trichoscopy may show miniaturised follicles, hair casts and the flambeau sign.",
              "Styling practices likely contribute to traction alopecia and trichorrhexis nodosa; the evidence on chemical relaxers and heat in CCCA is mixed.",
              "Frontal fibrosing alopecia may present differently in curly hair.",
            ],
          },
          { type: "pull", text: "Trichoscopy supports assessment; it does not replace medical diagnosis." },
          { type: "h", text: "Using it well" },
          {
            type: "p",
            text: "Trichoscopy is a valuable tool in a trichology clinic, but its findings should be recorded and interpreted with care. Lighting, magnification and hair density all affect what is seen, and curly hair can hide the scalp surface. Photographing the same areas at each visit makes change easier to track.",
          },
          {
            type: "p",
            text: "Where the findings suggest a scarring process, the priority is prompt referral. Scarring alopecias destroy follicles, and early treatment by a dermatologist offers the best chance of limiting permanent loss. A biopsy may be needed, and that is a medical decision.",
          },
          {
            type: "callout",
            title: "Refer promptly",
            text: "Loss of follicular openings, perifollicular halos at the crown, itching, burning or tenderness, and spreading loss in a client with textured hair all warrant referral to a dermatologist. Do not wait to see whether it settles.",
          },
          {
            type: "p",
            text: "The review also stressed hair care. Gentle handling, reduced tension, and caution with heat and chemicals can reduce breakage and traction, and trichologists are well placed to give that advice alongside the stylist.",
          },
          {
            type: "p",
            text: "Finally, trichoscopy images are clinical records. Store them securely, label them with the date, site and magnification, and share them with the client's consent when you refer. A dermatologist who can compare your images with their own examination has more to work with than one who hears only a description.",
          },
          {
            type: "reveal",
            prompt: "Which trichoscopic finding did the 2024 review describe as more common in CCCA than perifollicular redness or scale?",
            answer: "Perifollicular halos. The review noted they were more commonly seen than perifollicular erythema or scale in CCCA.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The clinical year at a glance",
        rows: [
          { label: "22 February", value: "NICE issues final draft guidance recommending ritlecitinib for severe alopecia areata." },
          { label: "March", value: "NICE publishes TA958, the first recommendation of a medicine for severe alopecia areata." },
          { label: "15 April", value: "A review of disorders in curly hair, with trichoscopy findings, is published online." },
          { label: "June", value: "JAMA Dermatology publishes a trial comparing oral and topical minoxidil in men." },
          { label: "18 June", value: "A systematic review of regenerative treatments, including PRP, in skin and hair disorders is published." },
          { label: "July", value: "BAD and BHNS guidance defines severe alopecia areata for the NHS pathway." },
          { label: "21 October", value: "The BAD living guideline for alopecia areata appears online." },
          { label: "2024", value: "The Institute of Trichologists completes its first full year as a PSA-accredited register." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed13",
        caption: "Consistent light, the same angles and dated records: the quiet disciplines that made a trichology referral count in 2024.",
      },
      {
        kind: "article",
        kicker: "Evidence",
        title: "Regenerative claims and what the trials show",
        standfirst:
          "Platelet-rich plasma and oral minoxidil were talked about constantly in 2024. What the published evidence of that year said, and how to discuss it.",
        blocks: [
          {
            type: "p",
            text: "Clients arrive at trichology clinics having read about platelet-rich plasma, exosomes, stem cells and oral minoxidil. In 2024 two publications gave clinicians firmer ground for those conversations.",
          },
          { type: "h", text: "A review of regenerative treatments" },
          {
            type: "p",
            text: "In June 2024 Stem Cell Research & Therapy published a systematic review of randomised controlled trials of regenerative treatments in skin and hair disorders. It included 64 studies with 2,888 participants. Androgenetic alopecia was the most studied condition, and PRP was the most common approach used for it. The authors concluded that regenerative medicine holds promise and called for more clinical trials to validate their findings.",
          },
          {
            type: "p",
            text: "That is a measured conclusion. Promise is not proof, and trials vary widely in how treatments are prepared and delivered. Clients deserve to hear that plainly.",
          },
          {
            type: "p",
            text: "The review also covered a wide range of conditions beyond hair, including vitiligo, melasma and acne, and only some of the included trials concerned alopecia. When a client quotes a headline figure, it is worth asking which condition, which preparation and which comparison it came from before drawing any conclusion for their own scalp.",
          },
          { type: "h", text: "Oral versus topical minoxidil" },
          {
            type: "p",
            text: "In 2024 JAMA Dermatology published what its authors described as the first double-blind randomised trial comparing oral minoxidil with topical minoxidil in men with androgenetic alopecia. The single-centre study in Brazil enrolled 90 men and followed them for 24 weeks. Oral minoxidil did not show superiority over topical minoxidil overall, although photographic assessment favoured it at the vertex. Excess body hair was the most common side effect in the oral group, reported by 49 per cent.",
          },
          { type: "pull", text: "Promise is not proof, and clients deserve to hear that plainly." },
          { type: "h", text: "Talking to clients" },
          {
            type: "list",
            items: [
              "Explain what the evidence shows and where it is limited, without promising results.",
              "Make clear that oral minoxidil is a prescription decision for a doctor, not a trichologist.",
              "Ask about all medicines and supplements, including those bought online.",
              "Record what the client has tried and for how long, to share with their GP or dermatologist.",
            ],
          },
          {
            type: "callout",
            title: "Red flags before any treatment discussion",
            text: "Sudden or patchy loss, scalp pain or burning, signs of scarring, or hair loss with weight change, fatigue, irregular periods or other symptoms need medical assessment first. Refer to a GP or dermatologist.",
          },
          {
            type: "reveal",
            prompt: "In the 2024 JAMA Dermatology trial, which area of the scalp showed a photographic advantage for oral minoxidil?",
            answer:
              "The vertex. Oral minoxidil was not superior overall, and not on the frontal scalp, but photographic assessment favoured it at the vertex.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The clinical year in practice",
        intro: "A documentation checklist and three questions on the facts of 2024.",
        blocks: [
          {
            type: "checklist",
            title: "A consultation record that helps a dermatologist",
            items: [
              "Onset, pattern and speed of hair loss, in the client's own words",
              "Estimated percentage of scalp affected, with dated photographs",
              "Eyebrow, eyelash, beard and nail involvement",
              "Trichoscopy findings, with images and magnification noted",
              "All medicines and supplements, including those bought online",
              "Effect on mood and daily life",
              "Red flags checked, and referral made where present",
            ],
          },
          {
            type: "quiz",
            question: "At what point did the 2024 BAD and BHNS guidance say ritlecitinib treatment response should be reviewed?",
            options: ["Week 12", "Week 24", "Week 36", "Week 52"],
            answer: 2,
            explain: "The guidance says clinicians should review treatment response at week 36, recording the absolute SALT score.",
          },
          {
            type: "quiz",
            question: "How many randomised trials were included in the June 2024 systematic review of regenerative treatments?",
            options: ["12", "28", "64", "150"],
            answer: 2,
            explain: "The review included 64 studies with 2,888 participants. Androgenetic alopecia was the most studied condition.",
          },
          {
            type: "quiz",
            question: "What is the regulatory status of trichology in the UK and Ireland?",
            options: [
              "It is statutorily regulated by the General Medical Council",
              "It is not statutorily regulated; some registers are voluntarily accredited",
              "It is regulated by the Health and Care Professions Council",
              "It is regulated by local authorities",
            ],
            answer: 1,
            explain:
              "Trichology is not statutorily regulated. The Institute of Trichologists' register has been accredited by the Professional Standards Authority since December 2023, which is a voluntary scheme.",
          },
        ],
      },
    ],
    sources: [
      SRC.niceTa958,
      SRC.eprNice,
      SRC.badRitlecitinib,
      SRC.badGuideline,
      SRC.badGuidelineNews,
      SRC.ijdCurly,
      SRC.regenReview,
      SRC.jamaMinoxidil,
      SRC.psaIot,
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // Medical, 2024
  // ─────────────────────────────────────────────────────────────
  {
    number: 202404,
    slug: "2024-medical",
    title: "Medical, 2024",
    fade: "New options, clearer warnings.",
    theme: "Four years in review",
    standfirst:
      "What 2024 changed for GPs, dermatologists and aesthetic doctors and nurses: JAK inhibitors for alopecia areata, the MHRA and EMA on finasteride, and new evidence and warnings on minoxidil.",
    coverImageKey: "ed14",
    coverTone: "dark",
    audience: ["medical"],
    published: "2026-09-30",
    series: "archive",
    period: "2024",
    focus: "medical",
    pages: [
      {
        kind: "letter",
        title: "The consulting room in 2024",
        blocks: [
          {
            type: "p",
            text: "This edition looks back at 2024 from the medical consulting room. It is a retrospective, written in 2026 for our Four years in review series. Trichozette was not published in 2024, and nothing here should be read as contemporary advice from that year.",
          },
          {
            type: "p",
            text: "For doctors, nurses and pharmacists working with hair and scalp, 2024 brought both new options and clearer warnings. NICE recommended ritlecitinib for severe alopecia areata, the first medicine it had recommended for the condition. The MHRA issued a Drug Safety Update on finasteride and a patient card for every pack. The EMA opened a review of finasteride and dutasteride. Minoxidil, the most familiar hair medicine of all, gained a new European warning and a notable randomised trial.",
          },
          {
            type: "p",
            text: "This edition does not give doses and is not a substitute for the current product information, NICE guidance or the BAD guideline. Guidance may have moved on since 2024, so always check the latest version before prescribing.",
          },
          {
            type: "p",
            text: "Our aim is to set the year in context and to help medical members work well with the cosmetic and clinical colleagues who so often see these patients first. Every factual claim is sourced at the end.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Safety",
        title: "Finasteride: the year the warnings got louder",
        standfirst:
          "The MHRA asked prescribers to ask first and monitor throughout, and put a card in every pack. Then the EMA opened its own review.",
        imageKey: "ed17",
        blocks: [
          {
            type: "p",
            text: "Finasteride has been prescribed for male pattern hair loss for decades, and increasingly supplied through online services. In 2024 regulators on both sides of the Channel turned their attention to its psychiatric and sexual side effects.",
          },
          { type: "h", text: "The MHRA's April update" },
          {
            type: "p",
            text: "In its April 2024 Drug Safety Update, the MHRA reminded healthcare professionals that finasteride has been associated with depression, suicidal thoughts and sexual dysfunction, and that patients have reported sexual dysfunction persisting after treatment stopped. The update followed a safety review prompted by patients' concerns that these effects were not widely known. The MHRA had received 426 Yellow Card reports of sexual dysfunction and 281 of depressed mood disorders and suicidal or self-injurious behaviours up to 5 April 2024, across both strengths.",
          },
          {
            type: "list",
            items: [
              "Before prescribing, ask about any history of depression or suicidal ideation.",
              "Advise patients taking finasteride for hair loss to stop immediately and contact their doctor if they develop depression or suicidal thoughts.",
              "Monitor for psychiatric and sexual side effects during treatment.",
              "A patient card would be introduced in all finasteride packs.",
              "Report suspected adverse reactions through the Yellow Card scheme.",
            ],
          },
          { type: "pull", text: "Patients may not notice changes in their own mood; the people around them often do." },
          {
            type: "p",
            text: "The MHRA also suggested that patients tell friends and family they are taking finasteride, because others may notice mood changes first. That is practical advice worth passing on, especially for patients who obtain the medicine online with little face-to-face contact.",
          },
          {
            type: "p",
            text: "The MHRA noted that the product information already described these risks, but that they were not well known among prescribers and patients. The problem it identified was awareness, not a new signal, which is why the response centred on a reminder and a card rather than a change to the licence.",
          },
          { type: "h", text: "The EMA review" },
          {
            type: "p",
            text: "On 4 October 2024 the European Medicines Agency announced that its Pharmacovigilance Risk Assessment Committee had begun a review of finasteride and dutasteride following concerns about suicidal ideation and behaviour. The review covered both hair-loss and prostate indications. Its outcome lies beyond the end of 2024 and outside this edition.",
          },
          {
            type: "callout",
            title: "Working with cosmetic and clinical colleagues",
            text: "Stylists and trichologists often hear first that a client has started finasteride bought online. A clear, non-judgemental route back to a prescriber, and a shared understanding of the warning signs, helps patients act early.",
          },
          {
            type: "quiz",
            question: "What did the MHRA's April 2024 update ask prescribers to do before prescribing finasteride?",
            options: [
              "Check liver function",
              "Ask about any history of depression or suicidal ideation",
              "Confirm the diagnosis by biopsy",
              "Obtain written consent from a second clinician",
            ],
            answer: 1,
            explain: "The advice was to ask patients about any history of depression or suicidal ideation, and then to monitor for psychiatric and sexual side effects.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Alopecia areata",
        title: "JAK inhibitors arrive on the NHS",
        standfirst:
          "Ritlecitinib became the first NICE-recommended medicine for severe alopecia areata in 2024, with a BAD pathway and a living guideline alongside it.",
        imageKey: "ed05",
        blocks: [
          {
            type: "p",
            text: "Severe alopecia areata had long been one of dermatology's most frustrating conditions to treat on the NHS. In October 2023 NICE did not recommend baricitinib, citing uncertain cost-effectiveness. In February 2024 it issued final draft guidance recommending ritlecitinib, an oral JAK inhibitor, for severe alopecia areata in people aged 12 and over, and published final guidance, TA958, in March.",
          },
          { type: "h", text: "Putting it into practice" },
          {
            type: "p",
            text: "In July 2024 the British Association of Dermatologists and the British Hair and Nail Society, with Alopecia UK, published supplementary guidance. It said ritlecitinib should be available routinely through general dermatology clinics, noted acceptance by the Scottish Medicines Consortium, and set out how to assess severity and response.",
          },
          {
            type: "list",
            items: [
              "Severe disease is at least 50 per cent scalp loss, or 21 to 49 per cent with an additional factor such as psychological impact or eyebrow and eyelash involvement.",
              "Psychological assessment is recommended at initiation, including suicide risk, using suitable tools; the DLQI does not always capture the impact of hair loss.",
              "Disease duration should not be used to decide eligibility.",
              "Response should be reviewed at week 36, with an absolute SALT score of 20 or less as the target used in the trial.",
              "Patients should be told before starting that regrowth is likely to be lost if treatment stops.",
            ],
          },
          { type: "pull", text: "Regrowth is likely to be lost when treatment stops, and patients need to hear that before they start." },
          { type: "h", text: "A living guideline, and a US approval" },
          {
            type: "p",
            text: "On 21 October 2024 the BAD living guideline for managing people with alopecia areata was published online in the British Journal of Dermatology. As a living guideline, it is intended to be updated as evidence emerges. In the United States, the FDA approved deuruxolitinib, a JAK1 and JAK2 inhibitor, for adults with severe alopecia areata on 25 July 2024, based on two phase 3 trials that enrolled 1,220 patients in total.",
          },
          {
            type: "callout",
            title: "Before and during treatment",
            text: "JAK inhibitors require screening and monitoring set out in the product information and specialist guidance. Check the current summary of product characteristics and the latest BAD guidance, which may have changed since 2024.",
          },
          {
            type: "reveal",
            prompt: "Why did the BAD guidance advise against using disease duration to decide eligibility for ritlecitinib?",
            answer:
              "Although trials showed lower response rates with longer-standing severe disease, the guidance said there was insufficient evidence to base access on duration, and clinical experience had shown regrowth in people who would have been excluded from trials.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "The medical year at a glance",
        rows: [
          { label: "22 February", value: "NICE issues final draft guidance recommending ritlecitinib for severe alopecia areata from age 12." },
          { label: "March", value: "NICE publishes TA958." },
          { label: "April", value: "MHRA Drug Safety Update on finasteride, with a patient card for all packs." },
          { label: "June", value: "JAMA Dermatology prints a randomised trial of oral versus topical minoxidil in men." },
          { label: "June", value: "European regulators agree a warning on infant hypertrichosis after contact with topical minoxidil." },
          { label: "July", value: "BAD and BHNS publish supplementary guidance on ritlecitinib." },
          { label: "25 July", value: "The US FDA approves deuruxolitinib for adults with severe alopecia areata." },
          { label: "4 October", value: "The EMA announces a review of finasteride and dutasteride." },
          { label: "10 October", value: "Deadline for EU marketing authorisation holders to submit the minoxidil label changes." },
          { label: "21 October", value: "The BAD living guideline for alopecia areata is published online." },
        ],
      },
      {
        kind: "image",
        imageKey: "ed05",
        caption: "New options and clearer warnings: 2024 asked more of every conversation about hair-loss medicines.",
      },
      {
        kind: "article",
        kicker: "Minoxidil",
        title: "Minoxidil: a trial and a warning",
        standfirst:
          "The most familiar hair-loss medicine gained a head-to-head trial and a new European warning about infants in 2024.",
        imageKey: "ed11",
        blocks: [
          {
            type: "p",
            text: "Minoxidil is so familiar that it is easy to overlook. In 2024 two developments gave clinicians reason to look again: a randomised trial comparing oral and topical use, and a European safety warning about accidental exposure of infants.",
          },
          { type: "h", text: "Oral versus topical" },
          {
            type: "p",
            text: "Interest in low-dose oral minoxidil for androgenetic alopecia has grown quickly, often ahead of the evidence. In 2024 JAMA Dermatology published what its authors described as the first double-blind randomised trial comparing oral with topical minoxidil in men with androgenetic alopecia. Ninety men at a single centre in Brazil were followed for 24 weeks. Oral minoxidil did not show superiority over topical minoxidil overall. Photographic assessment favoured oral treatment at the vertex but not the frontal scalp. Excess body hair affected 49 per cent of the oral group and headache 14 per cent.",
          },
          {
            type: "p",
            text: "Oral minoxidil was developed as a blood pressure medicine, its use for hair loss is a prescribing decision for a doctor, and a single, short trial in one population cannot settle the question. It does, however, give clinicians a balanced answer for patients who assume a tablet must work better than a solution.",
          },
          { type: "pull", text: "A single, short trial cannot settle the question, but it gives clinicians a balanced answer." },
          { type: "h", text: "Infants and carers" },
          {
            type: "p",
            text: "In June 2024 European regulators agreed a change to the product information for topical minoxidil. The EU safety committee considered a causal link between hypertrichosis in infants and inadvertent topical exposure to be at least a reasonable possibility, based on spontaneous reports, some with a close temporal relationship and improvement once exposure stopped.",
          },
          {
            type: "list",
            items: [
              "The new warning says hypertrichosis has been reported in infants after skin contact with a carer's minoxidil application site.",
              "The hair growth reversed within months once the infant was no longer exposed.",
              "Contact between children and treated areas should be avoided.",
              "Packaging was to carry a do not ingest warning, in view of accidental ingestion reports.",
            ],
          },
          {
            type: "callout",
            title: "A question worth asking",
            text: "When a parent brings an infant with unexplained excess body hair, ask whether anyone in the household uses topical minoxidil. When prescribing or recommending minoxidil to new parents, mention the risk of contact.",
          },
          {
            type: "p",
            text: "The warning applied to products authorised in EU member states, including Ireland, with label changes submitted by October 2024. UK prescribers should check current UK product information.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "The medical year in practice",
        intro: "A counselling checklist and three questions on the facts of 2024.",
        blocks: [
          {
            type: "checklist",
            title: "Counselling a patient starting a hair-loss medicine",
            items: [
              "History of depression or suicidal thoughts asked about, where relevant",
              "Psychiatric and sexual side effects explained, including the possibility of persistence",
              "Patient card or leaflet given and discussed",
              "Advice to tell friends and family, who may notice mood changes first",
              "For topical minoxidil, advice to avoid contact between treated areas and children",
              "Realistic expectations set, with no promise of results",
              "Follow-up and Yellow Card reporting explained",
            ],
          },
          {
            type: "quiz",
            question: "In the 2024 JAMA Dermatology trial, what was the most common adverse effect in the oral minoxidil group?",
            options: ["Headache", "Hypertrichosis", "Palpitations", "Ankle swelling"],
            answer: 1,
            explain: "Hypertrichosis affected 49 per cent of the oral group, and headache 14 per cent.",
          },
          {
            type: "quiz",
            question: "Which regulator began a review of finasteride and dutasteride in October 2024?",
            options: ["The MHRA", "The US FDA", "The European Medicines Agency", "The Health Products Regulatory Authority"],
            answer: 2,
            explain: "The EMA's Pharmacovigilance Risk Assessment Committee started the review, announced on 4 October 2024.",
          },
          {
            type: "quiz",
            question: "Why did NICE not recommend baricitinib for severe alopecia areata in October 2023?",
            options: [
              "It was not clinically effective",
              "Its cost-effectiveness estimates were uncertain and higher than NICE normally accepts",
              "It was not licensed in Great Britain",
              "It had been withdrawn for safety reasons",
            ],
            answer: 1,
            explain:
              "NICE concluded baricitinib was clinically effective compared with placebo, but its cost-effectiveness estimates were uncertain and above what NICE normally considers acceptable.",
          },
        ],
      },
    ],
    sources: [
      SRC.mhraFinasteride,
      SRC.pracFinasteride,
      SRC.aifaFinasteride,
      SRC.niceTa958,
      SRC.eprNice,
      SRC.niceTa926,
      SRC.badRitlecitinib,
      SRC.badGuideline,
      SRC.sunLeqselvi,
      SRC.naafLeqselvi,
      SRC.jamaMinoxidil,
      SRC.emaMinoxidil,
    ],
  },
];
