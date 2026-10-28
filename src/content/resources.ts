/**
 * Practice resources: printable records, guides, templates and client handouts for Professional
 * members. Each one is written here as content and rendered to PDF on request by
 * src/lib/resource-pdf.ts, so every document shares the same look and can be revised in one place.
 *
 * Every resource is a teaching aid, not clinical guidance. The wording keeps practitioners within
 * their training and scope: describe, record and refer, rather than diagnose.
 */

export type ResourceBlock =
  /** The page's main title and a one-line subtitle. */
  | { type: "title"; text: string; sub?: string }
  /** A small section heading. */
  | { type: "h"; text: string }
  | { type: "p"; text: string; muted?: boolean }
  | { type: "ul"; items: string[] }
  /** Term and explanation pairs, set in two columns where they fit. */
  | { type: "defs"; items: { term: string; text: string }[] }
  /** Rows of labelled blanks to write on. A field is a label, or a label with a width share. */
  | { type: "fields"; rows: (string | [string, number])[][] }
  /** A labelled ruled area for free text. */
  | { type: "box"; label: string; lines?: number }
  /** Tick boxes in a row, wrapping as needed. */
  | { type: "checks"; label?: string; items: string[] }
  /** A grid with a header row. Cells left empty are for writing in. */
  | {
      type: "table";
      columns: { label: string; width: number }[];
      rows: { title: string; sub?: string; cells?: string[] }[];
      rowHeight?: number;
    }
  /** Small print: a scoring key, a scope statement or a reminder. */
  | { type: "note"; text: string };

export type ResourceKind = "record" | "guide" | "template" | "handout";

export interface ResourcePage {
  /** Shown in the page header, in capitals: OBSERVATION RECORD, RECORDING GUIDE. */
  label: string;
  blocks: ResourceBlock[];
}

export interface Resource {
  slug: string;
  title: string;
  kind: ResourceKind;
  /** One sentence on the Resources page. */
  summary: string;
  /** What is inside, as short lines. */
  inside: string[];
  /** Who it is written for. */
  audience: "practitioner" | "client";
  orientation: "portrait" | "landscape";
  /** The download's file name, without the extension. */
  filename: string;
  pages: ResourcePage[];
}

export const resourceKindLabel: Record<ResourceKind, string> = {
  record: "Record sheet",
  guide: "Guide",
  template: "Template",
  handout: "Client handout",
};

const SCOPE = "Descriptive teaching document, not a validated diagnostic tool. Work within your training and scope.";

export const resources: Resource[] = [
  {
    slug: "five-minute-scalp-check",
    title: "Five Minute Scalp Check",
    kind: "record",
    summary: "A six-zone observation record for a quick visual and microscope check, with a guide to recording each finding the same way every time.",
    inside: ["Six-zone scoring grid for colour, dryness, oiliness, flakes, coverage and shedding", "Consent, product and image reference fields", "Recording guide and anatomy reference"],
    audience: "practitioner",
    orientation: "landscape",
    filename: "Trichollective_Five_Minute_Scalp_Check",
    pages: [
      {
        label: "Observation record",
        blocks: [
          { type: "title", text: "Five Minute Scalp Check", sub: "Six-zone observation record  |  Visual examination and scalp microscopy" },
          {
            type: "fields",
            rows: [
              [["Client", 0.46], ["Date", 0.2], ["Practitioner", 0.34]],
              ["Main concern / onset"],
              [["Last wash / products", 0.45], ["Symptoms (itch / burn / tenderness)", 0.55]],
            ],
          },
          { type: "checks", label: "Consent", items: ["Examination", "Photographs"] },
          { type: "fields", rows: [[["Microscope magnification", 0.4], ["Image reference", 0.6]]] },
          {
            type: "table",
            rowHeight: 34,
            columns: [
              { label: "Scalp zone", width: 0.19 },
              { label: "Scalp colour", width: 0.11 },
              { label: "Dryness 0–3 / NA", width: 0.1 },
              { label: "Oiliness 0–3 / NA", width: 0.1 },
              { label: "Flakes / areas of plaque", width: 0.14 },
              { label: "Hair coverage", width: 0.12 },
              { label: "Hair shedding", width: 0.1 },
              { label: "Microscope findings / broken hairs", width: 0.14 },
            ],
            rows: [
              { title: "01 Frontal", sub: "Front hairline and behind" },
              { title: "02 Mid-scalp", sub: "Central top" },
              { title: "03 Vertex / crown", sub: "Around posterior whorl" },
              { title: "04 Right temporoparietal", sub: "Temple and side above ear" },
              { title: "05 Left temporoparietal", sub: "Temple and side above ear" },
              { title: "06 Occipital", sub: "Back towards nape" },
            ],
          },
          { type: "note", text: "SCORES   0 none apparent  |  1 mild  |  2 moderate  |  3 marked  |  NA not assessed. Score dryness and oiliness separately." },
          { type: "checks", label: "Outcome", items: ["Routine care advice", "Full consultation", "GP / dermatology assessment"] },
          { type: "fields", rows: [["Advice / reason for referral / follow-up"]] },
          { type: "note", text: "Screening record, not a diagnosis. Use the recording guide on page 2." },
        ],
      },
      {
        label: "Recording guide",
        blocks: [
          { type: "title", text: "Observe. Record. Refer.", sub: "A consistent approach to each of the six scalp zones." },
          {
            type: "defs",
            items: [
              { term: "Scalp colour", text: "Record usual skin tone, red or pink, darker or purple-toned, or other. Note whether changes are localised, widespread or around follicles." },
              { term: "Flakes / areas of plaque", text: "Record colour (white / yellow / other), fine or thick, loose or attached, and dry-looking or greasy-looking. Describe areas of plaque and any crusting separately. Flakes alone do not establish dryness." },
              { term: "Hair coverage", text: "Record no obvious reduction, diffuse reduction, focal patch or uncertain. A quick visual check does not measure percentage hair loss without a baseline or validated method." },
              { term: "Hair shedding", text: "Record hairs coming away during routine handling only; no deliberate pulling. Record broken hairs separately. This is an observation, not a measured shedding rate for the zone." },
              { term: "Microscope findings", text: "Record follicular openings: visible, apparently unoccupied, reduced or absent, or uncertain. Note shaft thickness variation, short hairs, breakage, follicular scale and other findings. An apparently unoccupied opening does not establish a dead follicle." },
              { term: "Images and consistency", text: "Use the client's left and right. With consent, save a labelled image from a repeatable point in each zone. Keep magnification, lighting and location consistent for follow-up." },
              { term: "Further assessment", text: "Suspected loss of follicular openings, sudden or progressing patchy loss, or painful, pustular, crusted or persistently sore areas need further assessment. Suspected scarring warrants prompt medical assessment." },
              { term: "Anatomy reference", text: "These practical teaching zones do not precisely follow bone boundaries. Frontal: frontal bone. Mid-scalp: frontal and parietal. Vertex: mainly parietal. Temporoparietal: temporal and parietal. Occipital: mainly occipital. The vertex is a surface region, not a separate bone." },
            ],
          },
          { type: "note", text: "Descriptive teaching scores; not a validated diagnostic scale. Work within your training and scope." },
        ],
      },
    ],
  },

  {
    slug: "consultation-intake-record",
    title: "Consultation Intake Record",
    kind: "record",
    summary: "The history to take before you look: concern, pattern, hair history, health, medication and consent, with a guide to what each answer tells you.",
    inside: ["Concern, onset and pattern", "Hair, styling and chemical history", "Health, medication, family history and consent", "Questioning guide with escalation points"],
    audience: "practitioner",
    orientation: "portrait",
    filename: "Trichollective_Consultation_Intake_Record",
    pages: [
      {
        label: "Consultation record",
        blocks: [
          { type: "title", text: "Consultation Intake Record", sub: "Client history for a first hair and scalp consultation  |  Complete with the client, before any examination" },
          {
            type: "fields",
            rows: [
              [["Client", 0.46], ["Date of birth", 0.27], ["Date", 0.27]],
              [["Practitioner", 0.4], ["Referred by", 0.3], ["Contact preference", 0.3]],
            ],
          },
          { type: "h", text: "The concern" },
          { type: "box", label: "Main concern, in the client's own words", lines: 2 },
          { type: "fields", rows: [[["Started (month / year)", 0.3], ["Sudden or gradual", 0.3], ["Better, worse or stable", 0.4]]] },
          { type: "checks", label: "Pattern noticed", items: ["Thinning all over", "Thinning at the top or parting", "Receding hairline", "Patches", "Breakage", "Scalp symptoms only"] },
          { type: "checks", label: "Scalp symptoms", items: ["Itch", "Burning", "Tenderness", "Flaking", "Oiliness", "Odour", "Bumps or spots", "None"] },
          { type: "h", text: "Hair history" },
          { type: "fields", rows: [[["Wash frequency", 0.25], ["Shampoo and conditioner", 0.4], ["Leave-in and styling products", 0.35]]] },
          { type: "checks", label: "Services in the last 12 months", items: ["Colour", "Bleach", "Relaxer or perm", "Keratin or smoothing", "Extensions", "Braids / locs / weaves", "Heat styling most days"] },
          { type: "box", label: "Previous treatments tried, and the result", lines: 2 },
          { type: "h", text: "Health" },
          { type: "checks", label: "Diagnosed conditions", items: ["Thyroid", "Iron deficiency or anaemia", "PCOS", "Autoimmune condition", "Diabetes", "Skin condition (eczema, psoriasis)", "Other"] },
          { type: "box", label: "Medication and supplements, including anything started or stopped in the last 12 months", lines: 2 },
          { type: "checks", label: "In the last 12 months", items: ["Illness with fever", "Surgery or anaesthetic", "Childbirth", "Significant weight change", "Major stress or bereavement", "Change in diet", "Started or stopped hormonal contraception"] },
          { type: "fields", rows: [["Family history of hair loss (who, and from what age)"], [["Diet (any exclusions)", 0.45], ["Sleep", 0.25], ["Smoking / alcohol", 0.3]]] },
          { type: "h", text: "Consent and next steps" },
          { type: "checks", label: "Consent given for", items: ["Examination", "Photographs", "Notes kept on file", "Sharing with a referring clinician"] },
          { type: "box", label: "Practitioner summary and plan", lines: 3 },
          { type: "note", text: "This record supports a consultation within your training and scope. It is not a medical history taken by a clinician, and it does not replace one." },
        ],
      },
      {
        label: "Questioning guide",
        blocks: [
          { type: "title", text: "Listen first, then look.", sub: "What each part of the record tells you, and what to escalate." },
          {
            type: "defs",
            items: [
              { term: "Onset and pace", text: "Sudden, patchy or rapid loss points somewhere different from slow thinning over years. Ask what was happening three to four months before the shedding started: illness, surgery, childbirth and sudden weight loss commonly show in the hair after that delay." },
              { term: "Pattern", text: "Where the client notices it and where you observe it may differ, so record both. A widening parting with a preserved hairline, a receding hairline, and a discrete patch each suggest a different line of enquiry." },
              { term: "Scalp symptoms", text: "Itch and flaking are common and often cosmetic. Burning, tenderness, pain, pustules or crusting are not routine findings and warrant medical assessment." },
              { term: "Services and styling", text: "Chemical services, heat and prolonged tension from tight styles, extensions and locs are frequent causes of breakage and of loss at the hairline and temples. Ask how long a style stays in and whether it hurt to install." },
              { term: "Health and medication", text: "Thyroid disease, low iron, polycystic ovary syndrome and autoimmune conditions are all associated with hair changes, and many medicines can affect hair. Note names and timing. Do not advise on dose or stopping; that is for the prescriber." },
              { term: "Family history", text: "Thinning in parents or grandparents, and the age it began, is useful context for patterned hair loss. It does not confirm a diagnosis." },
              { term: "Diet and weight", text: "Restrictive diets, rapid weight loss and bariatric surgery are common contributors. A balanced diet is appropriate general advice. Recommending supplements for a suspected deficiency without a blood test is outside scope for most practitioners." },
              { term: "Consent and records", text: "Explain what you will look at, what you will record and who will see it. Keep notes and photographs securely, for as long as your professional and data protection obligations require, and no longer." },
            ],
          },
          { type: "h", text: "Escalate rather than treat" },
          {
            type: "ul",
            items: [
              "Sudden or progressing patchy loss, or loss where the scalp looks shiny, smooth or scarred",
              "Pain, burning, pustules, crusting, or an area that will not heal",
              "Hair loss alongside tiredness, palpitations, weight change, missed periods or new facial hair",
              "A child with scaly patches and broken hairs: this may be a fungal infection that needs prescribed treatment and is contagious",
              "Anything that leaves you unsure. A short, clear referral letter is better than a guess.",
            ],
          },
          { type: "note", text: SCOPE },
        ],
      },
    ],
  },

  {
    slug: "when-to-refer",
    title: "When to Refer",
    kind: "guide",
    summary: "The findings that should prompt a referral to a GP, dermatologist or trichologist, how urgently, and a referral letter you can fill in and send.",
    inside: ["Prompt and routine referral triggers", "Who to refer to, and why", "How to refer well", "Fill-in referral letter"],
    audience: "practitioner",
    orientation: "portrait",
    filename: "Trichollective_When_To_Refer",
    pages: [
      {
        label: "Referral guide",
        blocks: [
          { type: "title", text: "When to Refer", sub: "Signs that need a GP, dermatologist or other clinician, and how to say so" },
          { type: "p", text: "Most clients you see have a cosmetic concern you can help with. Some do not, and the kindest thing you can do is refer them promptly and well. This guide sets out the findings that should prompt a referral, how urgently, and what to write." },
          { type: "h", text: "Refer promptly, within days" },
          {
            type: "ul",
            items: [
              "Suspected scarring: loss of follicular openings, skin that looks shiny, smooth or thinned, redness or scale tight around the follicles, or pustules. Scarring alopecias can progress, and early treatment protects the hair that remains.",
              "Pustules, crusting, weeping, boils, or an area that is painful, hot or spreading.",
              "A lump, an ulcer or a sore that has not healed in three weeks, or a mole or dark patch on the scalp that is new or changing.",
              "A child with scaly patches, broken hairs or swollen glands at the back of the neck. Suspected tinea capitis needs prescribed oral treatment and is contagious.",
              "Hair loss with symptoms of illness: marked tiredness, palpitations, weight change, fever, joint pain, mouth ulcers or a rash.",
            ],
          },
          { type: "h", text: "Refer routinely" },
          {
            type: "ul",
            items: [
              "Patchy loss with a smooth, non-scarred scalp, especially if it is spreading, affecting eyebrows or nails, or distressing the client.",
              "Diffuse shedding that has continued for more than six months, or that follows a known trigger but is not settling.",
              "Hair loss in a woman with irregular periods, acne, or new facial or body hair.",
              "Any client you suspect has an iron, thyroid or other deficiency. A blood test interpreted by a clinician settles it; a supplement guessed at does not.",
              "A client whose distress about their hair is out of proportion, or who may be restricting food. Refer with care and compassion.",
              "Medication that may be affecting hair. The prescriber decides whether it is worth changing, and the client should not stop on your advice.",
            ],
          },
          { type: "h", text: "Where to" },
          {
            type: "defs",
            items: [
              { term: "GP (general practitioner)", text: "The usual first route in the UK and Ireland. The GP can arrange blood tests, prescribe, and refer on to dermatology." },
              { term: "Dermatologist", text: "For suspected scarring alopecia, inflammatory scalp disease, skin lesions, and patchy loss that is not settling. NHS access is through the GP; private dermatologists accept direct referrals." },
              { term: "Registered trichologist", text: "For a full trichological consultation, microscopy and a management plan, where your own scope stops at screening." },
              { term: "Pharmacist", text: "For advice on medicated shampoos and over-the-counter treatments the client can start today." },
            ],
          },
          { type: "h", text: "How to refer well" },
          {
            type: "ul",
            items: [
              "Tell the client plainly what you have seen and why it is worth a second opinion. Avoid naming a diagnosis you cannot make.",
              "Write it down. A short letter, carried by the client or emailed with consent, is taken more seriously than a verbal suggestion.",
              "Describe, do not diagnose: where, for how long, what it looks like, what the client has noticed, what you measured, and whether photographs are available.",
              "Keep a copy and note the date. Follow up at the next appointment.",
            ],
          },
          { type: "note", text: "Teaching document, not clinical guidance. Work within your training and scope." },
        ],
      },
      {
        label: "Referral letter",
        blocks: [
          { type: "title", text: "Referral letter", sub: "Fill in and print on your letterhead, or copy into an email." },
          {
            type: "fields",
            rows: [
              [["Date", 0.25], ["To (clinician or practice)", 0.35], ["From (name, title, practice)", 0.4]],
              [["Re: client name", 0.4], ["Date of birth", 0.25], ["Client contact", 0.35]],
            ],
          },
          { type: "p", text: "Dear colleague," },
          { type: "p", text: "I saw the above client for a hair and scalp consultation on the date below. I am writing to ask you to assess them because of the findings I describe here." },
          { type: "fields", rows: [[["Date seen", 0.3], ["Number of visits", 0.3], ["Images available (yes / no)", 0.4]]] },
          { type: "box", label: "Client's concern and history: onset, duration, pattern, symptoms, relevant health and medication", lines: 4 },
          { type: "box", label: "What I observed: zones affected, scalp appearance, flakes or plaque, coverage, shedding, microscopy", lines: 4 },
          { type: "box", label: "Reason for referral: the specific finding that prompted it, and how urgent I believe it is", lines: 3 },
          { type: "box", label: "What I have advised in the meantime", lines: 2 },
          { type: "p", text: "I would be grateful for your assessment. With the client's consent I am happy to share images and notes, and to receive your advice so that we can support them together." },
          { type: "p", text: "Yours sincerely," },
          { type: "fields", rows: [[["Signature", 0.3], ["Name and registration or membership", 0.4], ["Phone / email", 0.3]]] },
          { type: "checks", label: "Client consent", items: ["Consent to share this letter and images given", "Copy given to client"] },
          { type: "note", text: "Describe what you saw, and leave the diagnosis to the clinician." },
        ],
      },
    ],
  },

  {
    slug: "hair-pull-test-and-shedding-diary",
    title: "Hair Pull Test and Shedding Diary",
    kind: "record",
    summary: "A standardised gentle traction test recorded across five sites, plus a two-week shedding diary for the client to bring back.",
    inside: ["Step-by-step pull test method", "Five-site result grid with root type and broken shafts", "14-day client shedding diary"],
    audience: "practitioner",
    orientation: "portrait",
    filename: "Trichollective_Hair_Pull_Test_And_Shedding_Diary",
    pages: [
      {
        label: "Assessment record",
        blocks: [
          { type: "title", text: "Hair Pull Test Record", sub: "A standardised gentle traction test across five sites  |  Record the result, not a diagnosis" },
          {
            type: "fields",
            rows: [
              [["Client", 0.46], ["Date", 0.2], ["Practitioner", 0.34]],
              [["Days since last wash", 0.3], ["Last brushed or combed", 0.35], ["Product in hair (yes / no)", 0.35]],
            ],
          },
          { type: "h", text: "Method" },
          {
            type: "ul",
            items: [
              "Explain the test and gain consent. It should not hurt.",
              "Take a group of around 50 to 60 hairs between thumb and first two fingers, close to the scalp.",
              "Apply slow, gentle, steady traction from root to tip. No tugging and no twisting.",
              "Count the hairs that come away. Note whether each has a root, and whether it is a club (bulb) root or a tapered one, or is a broken shaft with no root.",
              "Repeat at each site. Keep the pressure the same at every site and at every visit.",
            ],
          },
          {
            type: "table",
            rowHeight: 34,
            columns: [
              { label: "Site", width: 0.28 },
              { label: "Hairs removed", width: 0.13 },
              { label: "Club (bulb) root", width: 0.14 },
              { label: "Tapered or thin root", width: 0.15 },
              { label: "Broken shafts", width: 0.13 },
              { label: "Notes", width: 0.17 },
            ],
            rows: [
              { title: "Frontal", sub: "Behind the hairline" },
              { title: "Vertex / crown", sub: "Around the whorl" },
              { title: "Right temporoparietal", sub: "Above the ear" },
              { title: "Left temporoparietal", sub: "Above the ear" },
              { title: "Occipital", sub: "Towards the nape" },
            ],
          },
          { type: "note", text: "A widely used teaching threshold is more than 10% of the hairs sampled (around six or more of 60) coming away at a site. Results vary with washing, brushing and technique, so interpret alongside the history and compare like with like at follow-up." },
          { type: "checks", label: "Overall impression", items: ["Within usual range", "Increased at some sites", "Increased at all sites", "Broken hairs predominate", "Uncertain"] },
          { type: "box", label: "Comment and plan", lines: 2 },
          { type: "note", text: "Screening observation, not a diagnosis. Work within your training and scope." },
        ],
      },
      {
        label: "Client diary",
        blocks: [
          { type: "title", text: "Shedding diary", sub: "For the client to keep for two weeks, then bring to the next appointment" },
          { type: "p", text: "Counting shed hairs gives both of us a clearer picture than memory does. Please keep this for 14 days. Wash and style your hair exactly as you normally would. The aim is a true picture, not a good score." },
          { type: "h", text: "How to count" },
          {
            type: "ul",
            items: [
              "On wash days, collect the hairs from the plughole, your hands and the towel. Count them and write the number in the Wash column.",
              "Every day, collect the hairs from your brush or comb and your pillow. Count them and write the number in the Brush / pillow column.",
              "Count whole hairs that have come away, not short broken pieces. If you can, note broken pieces separately.",
              "Do not change anything else about your routine during the two weeks.",
            ],
          },
          {
            type: "table",
            rowHeight: 19,
            columns: [
              { label: "Day", width: 0.09 },
              { label: "Date", width: 0.14 },
              { label: "Washed?", width: 0.1 },
              { label: "Wash count", width: 0.13 },
              { label: "Brush / pillow count", width: 0.18 },
              { label: "Notes (illness, stress, new product)", width: 0.36 },
            ],
            rows: Array.from({ length: 14 }, (_, i) => ({ title: `Day ${i + 1}` })),
          },
          { type: "fields", rows: [[["Total hairs over 14 days", 0.5], ["Average per day", 0.5]]] },
          { type: "note", text: "Shed counts vary between people and across the year, so one fortnight is a starting point for a conversation, not a verdict." },
        ],
      },
    ],
  },

  {
    slug: "home-care-plan",
    title: "Home Care Plan",
    kind: "handout",
    summary: "A plan you write for the client at the end of a consultation, with a second page of plain-English home care advice they can keep.",
    inside: ["What we found today", "Routine grid: product, how and how often", "When to get in touch sooner", "Client page on washing, handling, tension, diet and patience"],
    audience: "client",
    orientation: "portrait",
    filename: "Trichollective_Home_Care_Plan",
    pages: [
      {
        label: "Client handout",
        blocks: [
          { type: "title", text: "Your Home Care Plan", sub: "Written for you by your practitioner  |  Bring it to your next appointment" },
          { type: "fields", rows: [[["For", 0.34], ["Date", 0.18], ["Practitioner", 0.28], ["Next appointment", 0.2]]] },
          { type: "box", label: "What we found today", lines: 3 },
          { type: "h", text: "Your routine" },
          {
            type: "table",
            rowHeight: 30,
            columns: [
              { label: "Step", width: 0.2 },
              { label: "Product", width: 0.32 },
              { label: "How, and how often", width: 0.48 },
            ],
            rows: [{ title: "Cleanse" }, { title: "Condition" }, { title: "Scalp treatment" }, { title: "Leave-in / styling" }, { title: "Other" }],
          },
          { type: "checks", label: "For the next few weeks", items: ["Wash more gently", "Keep heat on a low setting", "Avoid tight styles and extensions", "Pause colour or chemical services", "Protect your scalp in the sun", "Other (see notes)"] },
          { type: "box", label: "Notes", lines: 3 },
          { type: "h", text: "When to get in touch sooner" },
          {
            type: "ul",
            items: [
              "Your scalp becomes painful, sore, weeping or crusted.",
              "You notice a new bald patch, or the loss speeds up.",
              "A product stings, burns or causes a rash.",
              "Anything worries you. A short message is always welcome.",
            ],
          },
          { type: "note", text: "This plan supports, and does not replace, advice from your doctor. If we have suggested you see your GP, please do." },
        ],
      },
      {
        label: "Client handout",
        blocks: [
          { type: "title", text: "Looking after hair and scalp at home", sub: "Good habits that help most people, whatever the concern" },
          {
            type: "defs",
            items: [
              { term: "Washing", text: "Most scalps do better washed regularly than left. Washing does not cause hair loss: hairs that come away in the shower were already at the end of their cycle. Use lukewarm water, work shampoo into the scalp with fingertips rather than nails, and rinse well." },
              { term: "Drying", text: "Pat rather than rub. Let hair dry most of the way before using heat, and keep tools on the lowest setting that works." },
              { term: "Handling", text: "Detangle from the ends upwards, with conditioner in. Wet hair stretches and snaps, so brush it gently." },
              { term: "Tension", text: "Ponytails, braids, buns and extensions pull on the hairline. Looser, lower and less often protects it. If a style hurts, it is too tight." },
              { term: "Chemical services", text: "Space out colour, bleach, relaxers and smoothing treatments, and tell your stylist about any scalp symptoms before they begin." },
              { term: "Sun and cold", text: "The scalp burns like any other skin. Wear a hat in strong sun, especially where the hair is thin." },
              { term: "Eating well", text: "Hair needs protein, iron and a varied diet. Crash diets and skipped meals often show in the hair two to three months later. Please do not start supplements for your hair without a blood test and advice from your doctor or pharmacist." },
              { term: "Stress and sleep", text: "Shedding after a stressful few months is common and usually settles. Sleep, movement and support all help, and so does patience." },
              { term: "Patience", text: "Hair grows about a centimetre a month, and a change of routine takes three to six months to show. A photograph of the same spot every few months shows progress that the mirror hides." },
            ],
          },
          { type: "note", text: "General information for clients, from Trichollective. It does not replace advice from your doctor." },
        ],
      },
    ],
  },

  {
    slug: "scalp-photography-protocol",
    title: "Scalp Photography Protocol",
    kind: "guide",
    summary: "Six standard views, the set-up to repeat them, and the labelling and storage rules that keep images useful and lawful, with a per-visit checklist.",
    inside: ["Preparation and consent", "Six standard views with position and framing", "Microscopy points, labelling and storage", "Session checklist to file with the record"],
    audience: "practitioner",
    orientation: "portrait",
    filename: "Trichollective_Scalp_Photography_Protocol",
    pages: [
      {
        label: "Practice protocol",
        blocks: [
          { type: "title", text: "Scalp Photography Protocol", sub: "Repeatable images that show change over time  |  The same views, the same way, every visit" },
          { type: "p", text: "A photograph is only useful at follow-up if it was taken the same way the first time. This protocol fixes the views, the set-up and the labelling, so that any member of the team can take a comparable set." },
          { type: "h", text: "Before you start" },
          {
            type: "ul",
            items: [
              "Consent, in writing, for photographs: what they are for, where they are stored, who sees them and for how long. Record it on the consultation record.",
              "Hair dry, free of styling product, and combed in the client's usual style. For top views, part centrally with a tail comb.",
              "Same room, same light, same plain mid-tone background and same distance each time. Mark the floor or chair position if you can.",
              "Same phone or camera on the same settings, flash off unless you use it every time, and the lens wiped.",
            ],
          },
          { type: "h", text: "The six standard views" },
          {
            type: "table",
            rowHeight: 30,
            columns: [
              { label: "View", width: 0.24 },
              { label: "Position", width: 0.4 },
              { label: "Frame", width: 0.36 },
            ],
            rows: [
              { title: "01 Frontal hairline", cells: ["Client seated, chin level, looking straight ahead. Camera at eye level.", "Hairline to crown, both temples in frame."] },
              { title: "02 Top (mid-scalp)", cells: ["Client bends head forward. Camera directly above, lens parallel to the scalp.", "Central parting from hairline to crown."] },
              { title: "03 Vertex / crown", cells: ["Client bends further forward, or you stand behind. Camera above the whorl.", "Whorl in the centre of the frame."] },
              { title: "04 Right temporoparietal", cells: ["Client turns 90 degrees. Camera at ear height.", "Temple, above the ear and the side."] },
              { title: "05 Left temporoparietal", cells: ["Client turns 90 degrees the other way. Camera at ear height.", "Temple, above the ear and the side."] },
              { title: "06 Occipital", cells: ["Client faces away, chin slightly down. Camera level with the back of the head.", "Crown to nape."] },
            ],
          },
          { type: "h", text: "Microscopy images" },
          {
            type: "ul",
            items: [
              "Choose one repeatable point in each zone you are following, for example a fixed distance along the central parting, and note it on the record.",
              "Keep magnification, light and pressure the same. Label each image with the zone, the point and the magnification.",
            ],
          },
          { type: "h", text: "Labelling and storage" },
          {
            type: "ul",
            items: [
              "Name files consistently: client reference, date as YYYY-MM-DD, view number. Never the client's full name in a file name.",
              "Store on an encrypted, backed-up system your practice controls, not in a personal camera roll or a messaging app. Delete from the device after upload.",
              "Keep images for as long as your records policy and data protection law require, then delete them securely. Use them beyond the client's own care only with specific written consent.",
            ],
          },
          { type: "note", text: "Teaching document. Follow your own practice's records policy and the data protection law where you work." },
        ],
      },
      {
        label: "Session checklist",
        blocks: [
          { type: "title", text: "Photography session checklist", sub: "One per visit. Tick as you go and file with the consultation record." },
          {
            type: "fields",
            rows: [
              [["Client reference", 0.4], ["Date", 0.25], ["Taken by", 0.35]],
              [["Camera or phone used", 0.35], ["Room and light", 0.35], ["Distance / position mark", 0.3]],
            ],
          },
          { type: "checks", label: "Preparation", items: ["Consent on file", "Hair dry, no product", "Usual style, or central parting for top views", "Background clear", "Lens wiped"] },
          {
            type: "table",
            rowHeight: 22,
            columns: [
              { label: "View", width: 0.3 },
              { label: "Taken", width: 0.1 },
              { label: "File name", width: 0.35 },
              { label: "Notes", width: 0.25 },
            ],
            rows: [
              { title: "01 Frontal hairline" },
              { title: "02 Top (mid-scalp)" },
              { title: "03 Vertex / crown" },
              { title: "04 Right temporoparietal" },
              { title: "05 Left temporoparietal" },
              { title: "06 Occipital" },
              { title: "Microscopy point A" },
              { title: "Microscopy point B" },
              { title: "Microscopy point C" },
            ],
          },
          { type: "checks", label: "Afterwards", items: ["Uploaded to secure storage", "Deleted from device", "Compared with previous set", "Client shown the images"] },
          { type: "box", label: "Observations compared with the last visit", lines: 4 },
          { type: "note", text: "Compare like with like: same view, same light, same distance." },
        ],
      },
    ],
  },
];

export function resourceBySlug(slug: string) {
  return resources.find((r) => r.slug === slug);
}
