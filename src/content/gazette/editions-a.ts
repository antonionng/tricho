import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";

export const editionsA: Edition[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. The founding edition
  // ─────────────────────────────────────────────────────────────
  {
    number: 1,
    slug: "the-founding-edition",
    title: "The founding edition",
    fade: "Why we meet.",
    theme: "Founding",
    standfirst:
      "Three disciplines, one client. Why Trichollective exists, what each discipline does and does not do, and how a good referral works.",
    coverImageKey: "community",
    coverTone: "light",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    pages: [
      {
        kind: "letter",
        title: "Why we meet",
        blocks: [
          {
            type: "p",
            text: "Most hair and scalp professionals work alone for most of the day. A head spa therapist sees a client's scalp more closely than almost anyone else will. A stylist notices the thinning at the crown before the client does. A trichologist spends an hour on a history. A nurse or doctor considers the bloods, the medicines and the family pattern. Each of us holds part of the picture, and too often the parts never meet.",
          },
          {
            type: "p",
            text: "Trichollective exists to change that. It is a closed, paid community for cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, founded by Karley Weir, a trichologist with more than twenty years in the hair industry and ten of them in trichology. The idea is simple: when the people who look after hair and scalp know one another, trust one another and speak a shared language, the client is better served.",
          },
          {
            type: "p",
            text: "Trichozette is where that shared language gets written down. Each edition takes one theme and treats it properly: what we know, what we don't, and where one discipline's work ends and another's begins. There are quizzes, checklists and questions to test yourself on, because reading is more useful when you have to answer something.",
          },
          {
            type: "p",
            text: "This founding edition is about the thing that holds the rest together: three disciplines, one client. It explains what each discipline does and does not do, how a good referral works, and how a room at Whittlebury Hall in January 2026 became a community with a platform of its own, launching in Dublin on 5 October.",
          },
          {
            type: "p",
            text: "We are publishing it, with the three editions that follow, as a founding library. Read them in any order. Argue with them in the community. Tell us what the next one should cover.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The idea",
        title: "Three disciplines, one client",
        standfirst:
          "The cosmetic, the clinical and the medical each see something the others miss. The client needs all three to be talking.",
        imageKey: "salon",
        blocks: [
          {
            type: "p",
            text: "Picture an ordinary Tuesday. A woman in her forties sits down for a cut and colour and mentions, almost in passing, that her ponytail feels thinner. Her stylist has noticed it too: the parting is wider than it was last spring. What happens next depends almost entirely on who that stylist knows.",
          },
          {
            type: "p",
            text: "If the stylist has nobody to call, the likely outcome is a sympathetic word and a volumising shampoo. If the stylist knows a trichologist, the client might have a full consultation within a fortnight. If that trichologist works closely with a GP or dermatologist, a medical cause can be looked for and, where there is one, treated. Same client, same hair, very different outcomes.",
          },
          { type: "h", text: "Three ways of looking" },
          {
            type: "p",
            text: "We use three words to describe the people Trichollective brings together. Each describes a different way of seeing the same head of hair.",
          },
          {
            type: "list",
            items: [
              "Cosmetic: head spa therapists, stylists, barbers and colourists, who see the hair and scalp most often and are usually the first to notice change.",
              "Clinical: trichologists and hair and scalp clinicians, who take detailed histories, examine the hair and scalp closely, and advise on care, management and referral.",
              "Medical: nurses, pharmacists, GPs and dermatologists, who can diagnose disease, order and interpret investigations, and prescribe treatment.",
            ],
          },
          {
            type: "p",
            text: "None of this is a ladder. A cosmetic professional is not a junior trichologist, and a dermatologist is not a senior stylist. Each discipline has its own skills, its own training and its own limits. The client benefits when each does its own job well and knows when to pass the work on.",
          },
          { type: "pull", text: "Same client, same hair, very different outcomes." },
          { type: "h", text: "Why the gaps matter" },
          {
            type: "p",
            text: "Hair and scalp concerns rarely stay in one lane. Shedding can follow illness, childbirth or stress. A flaky scalp can be simple dryness or a condition that needs medical treatment. Hair loss can carry a heavy emotional weight, and the person who notices that is often the one who spends the most time with the client, not the one with the most letters after their name.",
          },
          {
            type: "p",
            text: "When disciplines work in isolation, clients fall into the gaps between them. They are told it is nothing when it is something, or they are sold treatments that were never going to help. Sometimes they simply give up and stop asking.",
          },
          {
            type: "callout",
            title: "What Trichollective is for",
            text: "A place where the three disciplines meet as colleagues: to learn from one another, to refer with confidence and to build shared standards. It is closed and paid so that members can speak openly, among professionals.",
          },
          {
            type: "p",
            text: "The rest of this edition is practical. It sets out what each discipline does and does not do, and what a good referral looks like from both ends. Start with the quiz on the next page. It is harder than it looks.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "One parting, three chairs",
        intro:
          "A client mentions that her ponytail feels thinner and her parting looks wider. Here is how each discipline sees the same head of hair, and where each one hands on.",
        views: [
          {
            discipline: "cosmetic",
            heading: "In the salon chair",
            blocks: [
              {
                type: "p",
                text: "The stylist or head spa therapist is often the first to notice. You see the parting under good light every few weeks, you know how the ponytail used to feel, and you can compare this season with the last. That familiarity is valuable, and it is worth writing down what you see, with the client's permission, so that change can be tracked.",
              },
              {
                type: "p",
                text: "What you cannot do is name a cause. Thinning has many possible explanations, and guessing one aloud can mislead or frighten. Your part is to notice, to ask gentle questions, to avoid harsh chemical or tension-heavy services if the scalp looks sore, and to suggest that the client sees a trichologist or her GP.",
              },
              {
                type: "checklist",
                title: "Worth noting at the chair",
                items: [
                  "Where the thinning shows: parting, crown, temples or all over",
                  "Whether the client has noticed it, and for how long",
                  "Any redness, scaling or soreness on the scalp",
                  "Recent services that involved heat, chemicals or tension",
                  "The client's consent before you record anything",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "In the trichology consultation",
            blocks: [
              {
                type: "p",
                text: "A trichologist starts with time. A full history covers health, medicines, diet, stress, family pattern, hair care and the timeline of change, followed by a close look at the hair and scalp, often under magnification. From this the trichologist forms a view of what may be happening and writes a care plan the client can follow.",
              },
              {
                type: "p",
                text: "Trichology is not statutorily regulated in the UK or Ireland, so clients are wise to check training and professional membership. A trichologist cannot prescribe and is not the right person to manage an underlying medical condition. Where the history or examination raises a medical question, the plan should include a letter to the GP or a suggestion to see a dermatologist.",
              },
              {
                type: "quiz",
                question:
                  "The history suggests a family pattern of thinning, but the client also mentions heavy periods and persistent tiredness. What belongs in the care plan?",
                options: [
                  "Reassurance that it is inherited, with no further steps",
                  "A letter suggesting the GP considers whether any investigations are appropriate",
                  "A recommendation to buy a prescription treatment online",
                  "A course of scalp treatments before anything else is considered",
                ],
                answer: 1,
                explain:
                  "A family pattern does not rule out other contributing factors. Heavy periods and tiredness deserve a medical conversation, and the GP can decide whether any checks are needed. The trichology care plan can run alongside that, not instead of it.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "In the consulting room",
            blocks: [
              {
                type: "p",
                text: "Doctors, and nurses who hold prescribing qualifications, can diagnose, order and interpret investigations, and prescribe. A GP will usually look at the whole person first: medicines, recent illness, hormonal change and general health. A dermatologist is the specialist for scalp disease, particularly patchy, inflamed or scarring hair loss.",
              },
              {
                type: "p",
                text: "Medical care has limits too. Appointments are short, and the day-to-day advice on hair care, styling and confidence that clients value often sits better with a trichologist or stylist. A clear referral letter in either direction saves time and spares the client from telling their story again.",
              },
              {
                type: "reveal",
                prompt: "Which signs should send a client to a GP or dermatologist promptly rather than waiting?",
                answer:
                  "Patchy loss that is spreading quickly, a sore, burning or inflamed scalp, shiny or smooth patches where follicles seem to have gone, or hair loss alongside feeling generally unwell. These need a medical assessment, and the other disciplines should say so clearly.",
              },
            ],
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "Which discipline?",
        intro:
          "Three everyday situations. For each, choose the most appropriate next step. There is room for judgement, so read the explanations.",
        blocks: [
          {
            type: "quiz",
            question:
              "A regular client mentions a new, itchy, scaly patch behind one ear that has appeared since her last colour appointment. What is the most appropriate first step?",
            options: [
              "Carry on with the colour, avoiding the patch, and mention it next time",
              "Postpone colour near that area and suggest she asks her GP or pharmacist about the patch",
              "Recommend an anti-dandruff shampoo and proceed as normal",
              "Book her in with a trichologist and colour the rest of the head today",
            ],
            answer: 1,
            explain:
              "A new, itchy, scaly patch needs a look from someone who can diagnose it, and applying chemical products over inflamed skin risks making it worse. A trichologist may well be helpful too, but postponing the service and pointing her towards a GP or pharmacist puts her safety first.",
          },
          {
            type: "quiz",
            question:
              "A client has had diffuse shedding for about eight weeks. She had a high fever with a viral illness around three months ago and otherwise feels well. Who is best placed to take a full history and explain what may be happening?",
            options: [
              "Her stylist, at her next appointment",
              "A trichologist, who can take a detailed history and involve her GP if needed",
              "A dermatologist, as an urgent first referral",
              "A head spa therapist, with a stimulating scalp treatment",
            ],
            answer: 1,
            explain:
              "The pattern could fit shedding after illness, but a proper history matters. A trichologist can take one, explain the likely timeline and suggest she sees her GP if blood tests or other checks seem sensible. Urgent dermatology referral is for red flags such as scarring, inflammation or rapid patchy loss.",
          },
          {
            type: "quiz",
            question:
              "A man with gradual thinning at the crown asks about a prescription tablet he has read about online. Who can decide whether it is suitable for him?",
            options: [
              "His barber, who has seen other clients use it",
              "A trichologist, who can recommend how much to take",
              "A doctor or other qualified prescriber, after an assessment",
              "An online seller that ships without a consultation",
            ],
            answer: 2,
            explain:
              "Prescription medicines need a prescriber who takes a proper history and considers side effects and interactions. A trichologist can discuss the options in general terms and refer, but cannot prescribe. Buying prescription medicines without a consultation is a red flag.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Scope",
        title: "What each discipline does, and doesn't",
        standfirst: "Knowing your limits is not modesty. It is what makes a referral trustworthy.",
        imageKey: "clinic",
        blocks: [
          {
            type: "p",
            text: "Every profession has a scope: the work it is trained, insured and permitted to do. In hair and scalp care the lines are easy to blur, so here is a plain-language outline. It is general by design, and your own training, insurance and professional body always take precedence.",
          },
          { type: "h", text: "Cosmetic professionals" },
          {
            type: "p",
            text: "Head spa therapists, stylists, barbers and colourists work with healthy hair and scalp. They cleanse, condition, cut, colour, massage and advise on home care. They are also the professionals most likely to notice change, because they see the same clients every few weeks.",
          },
          {
            type: "list",
            items: [
              "They do: observe, ask gentle questions, adapt or postpone services, recommend suitable cosmetic products and suggest the client seeks advice.",
              "They don't: diagnose conditions, work over broken or inflamed skin, or suggest that a product will cure hair loss.",
            ],
          },
          { type: "h", text: "Clinical professionals" },
          {
            type: "p",
            text: "Trichologists study the hair and scalp in health and disease. A consultation usually includes a detailed history, close examination of the hair and scalp, often with magnification, and advice on management, care and referral. Many trichologists work closely with GPs and dermatologists.",
          },
          {
            type: "callout",
            title: "A note on regulation",
            text: "Trichology is not statutorily regulated in the UK or Ireland. The title is not protected by law, so standards depend on training and on membership of a professional body. Clients are entitled to ask where a trichologist trained and which body they belong to.",
          },
          {
            type: "list",
            items: [
              "They do: take histories, examine, explain likely causes, advise on care and lifestyle factors, recommend cosmetic and some over-the-counter products, and refer.",
              "They don't: prescribe medicines, or replace a medical diagnosis where one is needed.",
            ],
          },
          { type: "h", text: "Medical professionals" },
          {
            type: "p",
            text: "Nurses, pharmacists, GPs and dermatologists bring medical training and legal authority that the other disciplines do not have. Depending on their role, they can diagnose, arrange blood tests and biopsies, and prescribe. Dermatologists are specialist doctors for skin, hair and nails, and are the right destination for scarring hair loss and other complex conditions.",
          },
          {
            type: "list",
            items: [
              "They do: diagnose, investigate, prescribe, manage medical conditions and refer on to specialist services.",
              "They don't always have: the time for a long hair history, or day-to-day knowledge of cosmetic services. This is where the other disciplines help.",
            ],
          },
          { type: "pull", text: "Scope is not a hierarchy. It is a map of who can safely do what." },
          {
            type: "p",
            text: "Scope is not a hierarchy. It is a map of who can safely do what. The overlaps are where the best work happens: a stylist who spots a change, a trichologist who takes the time to understand it, and a doctor who can investigate and treat. Together they give the client something none of them could offer alone.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Practice",
        title: "Anatomy of a good referral",
        standfirst:
          "A referral is a handover, not a brush-off. Done well, the client feels looked after at every step.",
        blocks: [
          {
            type: "p",
            text: "Most of us have been on the receiving end of a poor referral. ‘You should get that looked at’ is technically advice, but it leaves the person with no idea who to see, how urgent it is or what to say when they get there. A good referral answers all three.",
          },
          { type: "h", text: "Before you refer" },
          {
            type: "p",
            text: "Start with what you have observed, not what you suspect. You might have noticed a wider parting, a patch with no hair, redness, scaling or more hair in the basin than usual. Describe it plainly and ask the client whether they have noticed it too. Many will have, and will be relieved that someone has said it aloud.",
          },
          {
            type: "p",
            text: "Then ask permission to talk about it. Some clients want to; some do not, at least not today. Respecting that is part of the care.",
          },
          { type: "h", text: "Making the handover" },
          {
            type: "list",
            items: [
              "Name the right person: a GP, a pharmacist, a trichologist or, through the GP, a dermatologist.",
              "Say how soon: when convenient, in the next few weeks or this week, and be honest about why.",
              "Offer something in writing: a short note of what you saw and when, which the client can take with them.",
              "Keep it private: talk away from other clients, and ask before taking any photograph.",
              "Follow up: ask at the next appointment how it went, and adapt your services if needed.",
            ],
          },
          { type: "pull", text: "A good referral answers three questions: who, how soon, and what to say." },
          {
            type: "callout",
            title: "Consent and records",
            text: "If you record observations or photographs, get the client's consent, store them securely and share them only with the client's agreement. Information about someone's health is special category data under UK and EU data protection law.",
          },
          { type: "h", text: "Receiving a referral" },
          {
            type: "p",
            text: "The other end matters just as much. If a stylist or head spa therapist has sent a client your way, a brief acknowledgement, with the client's consent, closes the loop. The referrer learns something, trusts the route more next time and can support the client between appointments.",
          },
          {
            type: "reveal",
            prompt: "A client asks, ‘Do you think it's serious?’ What might you say?",
            answer:
              "Something honest and steady: ‘I can't tell you what's causing it, and it may well be nothing to worry about. It looks different from what I usually see, so I'd like someone who can examine it properly to take a look. Would you like me to write down what I've noticed?’",
          },
          {
            type: "p",
            text: "Referral works best when it runs in every direction. Doctors refer to trichologists for time-intensive hair histories and ongoing support. Trichologists refer to cosmetic professionals for gentle services while hair recovers. That two-way traffic is what a community makes possible, and it is much easier when you already know the person on the other end.",
          },
        ],
      },
      {
        kind: "image",
        imageKey: "gathering",
        caption:
          "Professionals who usually work apart, listening in the same room. Trichozette begins where those conversations do.",
      },
      {
        kind: "article",
        kicker: "Where it started",
        title: "Whittlebury Hall, January 2026",
        standfirst: "Before there was a platform, there was a room, and a simple idea about who should be in it.",
        blocks: [
          {
            type: "p",
            text: "On 19 January 2026, the Trichology and Hair Professional Collective Conference took place at Whittlebury Hall in Northamptonshire. It brought trichologists and hair professionals together in one place, which in this field happens less often than it should.",
          },
          {
            type: "p",
            text: "That fact is worth pausing on. The people who look after hair and scalp work across salons, spas, clinics, pharmacies, surgeries and hospitals. They train through different routes, belong to different bodies and read different publications. Many rarely meet anyone from outside their own discipline, except across a referral letter, and often not even then.",
          },
          { type: "h", text: "Why meet in person" },
          {
            type: "p",
            text: "A great deal of professional learning can happen online, and Trichollective's platform exists for exactly that. But some things are easier face to face. It is easier to ask a question you worry is too basic. It is easier to find out what a colleague in another discipline actually does all day. And it is far easier to trust someone you have met when the time comes to send them a client.",
          },
          {
            type: "p",
            text: "Referral, in the end, rests on trust. A stylist who has sat beside a trichologist is more likely to suggest that a client books in. A trichologist who has talked with a GP understands better what a useful referral note contains. Those relationships are hard to build by email alone.",
          },
          { type: "pull", text: "Referral, in the end, rests on trust." },
          { type: "h", text: "What followed" },
          {
            type: "p",
            text: "Whittlebury Hall was the start of a sequence. On 15 June 2026, the Trichollective Conference met at Whittlebury Park Hotel & Spa, with a programme on hair biology, patient perspectives, non-surgical hair restoration and developing a UK trichology database for clinical decision-making and research. The next edition of Trichozette is given over to those themes.",
          },
          {
            type: "p",
            text: "On Monday 5 October 2026, the online platform launches at Trichollective Dublin, at the Killashee Hotel in Naas, County Kildare. It gives members somewhere to continue the conversation between gatherings: a community, a directory, learning and this magazine. The next conference after Dublin is planned for Los Angeles, with the date to be confirmed.",
          },
          {
            type: "callout",
            title: "Membership",
            text: "Trichollective is a closed, paid community for cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK. Keeping it closed keeps the conversation professional and lets members speak openly with one another.",
          },
          {
            type: "p",
            text: "The room at Whittlebury Hall was the beginning. What happens next depends on the people who join it, and on what they are willing to share.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Timeline",
        title: "From Whittlebury to Los Angeles",
        rows: [
          {
            label: "19 January 2026",
            value: "Trichology and Hair Professional Collective Conference, Whittlebury Hall, Northamptonshire.",
          },
          {
            label: "15 June 2026",
            value:
              "Trichollective Conference, Whittlebury Park Hotel & Spa: hair biology, patient perspectives, non-surgical hair restoration and a UK trichology database.",
          },
          { label: "30 September 2026", value: "Trichozette's founding library is published." },
          {
            label: "5 October 2026",
            value: "The online platform launches at Trichollective Dublin, Killashee Hotel, Naas.",
          },
          { label: "Next", value: "Los Angeles, date to be confirmed." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. From the room: Whittlebury Park
  // ─────────────────────────────────────────────────────────────
  {
    number: 2,
    slug: "from-the-room-whittlebury-park",
    title: "From the room",
    fade: "Whittlebury Park, June 2026.",
    theme: "Conference",
    standfirst:
      "Our explainers on the four themes of the June conference: the biology of hair, the person beneath it, the options for restoration and the case for shared data.",
    coverImageKey: "gathering",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    pages: [
      {
        kind: "letter",
        title: "From the room",
        blocks: [
          {
            type: "p",
            text: "On 15 June 2026, the Trichollective Conference took place at Whittlebury Park Hotel & Spa. The programme covered four themes that sit at the heart of hair and scalp practice: hair biology, patient perspectives, non-surgical hair restoration, and developing a UK trichology database for clinical decision-making and research.",
          },
          {
            type: "p",
            text: "This edition is not a report of the day. We have not tried to reconstruct what speakers said, and we would not want to put words in anyone's mouth. Instead, the editorial team has written an explainer on each theme, so that members who were there have something to return to, and members who were not can cover the same ground.",
          },
          {
            type: "p",
            text: "Among the speakers, Charlotte Knibbs RIT, Consultant Trichologist at Verve Hair Loss Specialists, spoke on the psychosocial impact of visible difference, patient-centred care and epidermolysis bullosa, drawing on her own lived experience. The Institute of Trichologists has published a review of the conference at instituteoftrichologists.co.uk/trichollective-conference-review/.",
          },
          {
            type: "p",
            text: "Our explainers run from the follicle outwards. We start with a refresher on how hair grows, because almost every conversation about hair loss depends on it. We then turn to the person in the chair, and to why visible difference deserves as much attention in a consultation as any measurement. Next comes a balanced look at non-surgical restoration: what exists, who provides it, how strong the evidence is and what should make you wary. Finally, we set out why a shared UK trichology database could matter to practice and research, and what it would take to build one responsibly.",
          },
          {
            type: "p",
            text: "There is a quiz at the end to check it has all stuck. As ever, tell us in the community where you think we have it right, and where we have missed something.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Explainer: hair biology",
        title: "How hair grows",
        standfirst:
          "A refresher on the follicle and the cycle it runs, because nearly every conversation about hair loss comes back to them.",
        imageKey: "hairDetail",
        blocks: [
          {
            type: "p",
            text: "Every hair on the scalp is the product of a small organ that rebuilds itself, over and over, throughout life. Understanding that organ, and the rhythm it keeps, is the foundation of good practice in every discipline. It explains why shedding appears months after its cause, why some treatments take so long to show and why patience is often the most honest advice.",
          },
          { type: "h", text: "The follicle" },
          {
            type: "p",
            text: "The hair follicle is a tube-like structure in the skin. At its base sits the bulb, where rapidly dividing cells produce the hair shaft. Within the bulb is the dermal papilla, a cluster of specialised cells with its own blood supply, which signals to the cells around it and plays a central part in controlling growth. Higher up, the sebaceous gland opens into the follicle, and the small arrector pili muscle attaches near a region called the bulge, where the follicle's stem cells live.",
          },
          {
            type: "list",
            items: [
              "Hair shaft: the visible fibre, made mostly of keratin and containing no living cells.",
              "Bulb and matrix: the growth centre, where new hair is made.",
              "Dermal papilla: the signalling hub that helps set the pace of growth.",
              "Bulge: home to the stem cells that allow the follicle to regenerate each cycle.",
              "Sebaceous gland: produces the sebum that conditions the scalp and hair.",
            ],
          },
          { type: "h", text: "The growth cycle" },
          {
            type: "p",
            text: "Scalp follicles do not grow hair continuously. Each moves through a cycle of phases on its own schedule, which is why we do not shed all our hair at once.",
          },
          {
            type: "list",
            items: [
              "Anagen, the growth phase, usually lasts several years on the scalp. Most scalp hairs are in anagen at any given time.",
              "Catagen is a short transition of a few weeks, during which growth stops and the lower follicle shrinks.",
              "Telogen, the resting phase, lasts around three months. The hair stays in place, then is released.",
              "Exogen describes the shedding of the old hair itself, often as a new anagen hair begins to grow beneath it.",
            ],
          },
          {
            type: "p",
            text: "Because telogen lasts around three months, anything that pushes many follicles out of anagen at once tends to show up as shedding weeks or months later. Shedding is often the end of a story that began months earlier, and that delay is the single most useful thing to explain to a worried client.",
          },
          { type: "pull", text: "Shedding is often the end of a story that began months earlier." },
          {
            type: "callout",
            title: "Why it matters in the chair",
            text: "A shorter anagen phase means a shorter maximum length. Follicles that gradually miniaturise, as in pattern hair loss, produce finer and shorter hairs over successive cycles. Both are changes in the cycle, not simply more hair falling out.",
          },
          {
            type: "quiz",
            question:
              "A client's hair started shedding noticeably this week. Roughly when might a trigger for telogen shedding have occurred?",
            options: [
              "Within the last few days",
              "Around two to three months ago",
              "About a year ago",
              "There is no trigger; telogen shedding is always inherited",
            ],
            answer: 1,
            explain:
              "Telogen lasts around three months, so shedding triggered by an event such as illness or childbirth typically appears a couple of months or so afterwards. It is a guide rather than a rule, and a careful history always matters.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Before anyone restores anything",
        intro:
          "Clients who ask about restoration are usually asking several questions at once. Each discipline answers a different one, and the best outcomes come when those answers arrive in the right order.",
        views: [
          {
            discipline: "cosmetic",
            heading: "Camouflage, toppers and honest styling",
            blocks: [
              {
                type: "p",
                text: "In the salon, restoration often begins with what can be done today: a cut that softens the look of thinning, fibres or tinted sprays, a topper or a full hair system. These are cosmetic options, and they can make a real difference to how a client feels as they leave the chair.",
              },
              {
                type: "p",
                text: "They do not treat the cause, and it is worth saying so plainly. Before fitting anything that attaches to existing hair, look at the scalp and consider the weight and tension it will add. If the client has not yet had their hair loss assessed, suggest a trichologist or GP first, so that a cover-up is a choice rather than a delay.",
              },
              {
                type: "reveal",
                prompt:
                  "A client wants a bonded topper fitted this week but has never had her thinning looked at. What is the kindest reply?",
                answer:
                  "Offer to plan the topper with her, and suggest she has the thinning assessed by a trichologist or her GP in the meantime. Fitting can go ahead once she knows more, and nothing about the conversation needs to feel like a refusal.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "Setting expectations",
            blocks: [
              {
                type: "p",
                text: "A trichologist looks at which kind of hair loss is present, how active it is and what the client hopes for. That assessment shapes which options are worth discussing at all, because many restoration treatments suit some patterns of loss and not others.",
              },
              {
                type: "p",
                text: "Trichologists can explain the evidence behind treatments in plain terms, help clients weigh cost against likely benefit, and recognise when marketing is running ahead of the research. They cannot prescribe or perform medical procedures. When a client is considering prescription treatment, injectable treatments or surgery, the trichologist's role is to refer to a doctor and, with consent, share the history already taken.",
              },
              {
                type: "checklist",
                title: "Before discussing restoration",
                items: [
                  "Has the type of hair loss been assessed?",
                  "Is the loss still active, or has it settled?",
                  "What does the client hope will change, and by when?",
                  "Has a medical cause been considered where the history suggests one?",
                  "Does the client understand that no treatment is guaranteed?",
                ],
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Diagnosis, prescribing and procedures",
            blocks: [
              {
                type: "p",
                text: "Doctors confirm the diagnosis, sometimes with blood tests or a scalp biopsy, and decide whether prescription treatment is suitable. Aesthetic doctors and nurses may offer procedures such as injectable treatments to the scalp, and hair transplant surgery is carried out by surgical teams in clinics that should be registered with the relevant regulator.",
              },
              {
                type: "p",
                text: "Good medical practice means confirming the diagnosis before any procedure, explaining risks and realistic outcomes, and giving the client time to decide. Clients who have been sold a package before being examined, or offered prescription medicines without a consultation, should be encouraged to step back and seek an independent opinion from their GP or a dermatologist.",
              },
              {
                type: "quiz",
                question:
                  "A clinic offers a client a course of scalp injections at her first visit, before anyone has examined her scalp. What is the main concern?",
                options: [
                  "The price of the course",
                  "Treatment is being offered before a diagnosis has been made",
                  "Injectable treatments are never appropriate for hair loss",
                  "She should have been fitted with a topper first",
                ],
                answer: 1,
                explain:
                  "Some procedures may suit some people, but only after an assessment has established what kind of hair loss is present. Offering treatment first puts the sale ahead of the client.",
              },
            ],
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Programme notes",
        title: "Whittlebury Park, 15 June 2026",
        rows: [
          { label: "Date", value: "15 June 2026" },
          { label: "Venue", value: "Whittlebury Park Hotel & Spa, Northamptonshire" },
          { label: "Theme one", value: "Hair biology" },
          { label: "Theme two", value: "Patient perspectives" },
          { label: "Theme three", value: "Non-surgical hair restoration" },
          {
            label: "Theme four",
            value: "Developing a UK trichology database for clinical decision-making and research",
          },
          {
            label: "Speaker",
            value:
              "Charlotte Knibbs RIT, Consultant Trichologist, Verve Hair Loss Specialists: the psychosocial impact of visible difference, patient-centred care and epidermolysis bullosa, drawing on her own lived experience",
          },
          {
            label: "Further reading",
            value:
              "The Institute of Trichologists' conference review: instituteoftrichologists.co.uk/trichollective-conference-review/",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Explainer: patient perspectives",
        title: "The person beneath the hair",
        standfirst:
          "Visible difference changes how people move through the world. A good consultation makes room for that.",
        imageKey: "portraitA",
        blocks: [
          {
            type: "p",
            text: "Hair is rarely just hair. It is tied up with identity, culture, age, gender and how we expect to be seen. When it changes, or when someone lives with a visible difference to their skin, scalp or hair, the effect can reach well beyond appearance. It can shape confidence at work, willingness to socialise and how comfortable someone feels walking into a salon or clinic.",
          },
          {
            type: "p",
            text: "Visible difference describes any condition or feature that makes someone look different from what others expect, whether present from birth or acquired through illness, injury or treatment. Its psychosocial impact, meaning the emotional and social effects, varies enormously from person to person. How much something shows is not the same as how much it matters.",
          },
          { type: "pull", text: "How much something shows is not the same as how much it matters." },
          { type: "h", text: "Why it belongs in the consultation" },
          {
            type: "p",
            text: "A consultation that measures only the hair can miss what the client came for. Two people with similar shedding may need very different conversations: one wants the facts straight away, the other needs to feel heard before any facts will land. Asking about impact is not a detour from clinical work. It shapes which options make sense, how quickly to move and what a good outcome looks like to that person.",
          },
          {
            type: "p",
            text: "It also matters for safety. Distress about appearance can be significant, and occasionally a hair professional will be the first to notice that someone is struggling. Knowing when to suggest wider support is part of patient-centred care.",
          },
          { type: "h", text: "Patient-centred habits" },
          {
            type: "list",
            items: [
              "Ask before you touch, and explain what you are about to do and why.",
              "Let the client describe the problem in their own words before you describe it in yours.",
              "Ask one open question about impact, such as ‘How is this affecting you day to day?’",
              "Offer privacy: a quieter room, a screen, or a chair turned away from the mirror if they prefer.",
              "Use neutral language, and describe what you see without words that sound like judgement.",
              "Agree what success means to them, and write it down.",
              "Check understanding at the end, and give them something to take away.",
            ],
          },
          {
            type: "callout",
            title: "When to suggest more support",
            text: "If a client describes persistent low mood, avoiding everyday life because of their appearance, or any thoughts of self-harm, encourage them to speak to their GP. In an emergency they should contact emergency services, or they can talk to a crisis line such as Samaritans, which operates across the UK and Ireland.",
          },
          {
            type: "p",
            text: "None of this takes long. Most of it is about attention: noticing the person as well as the scalp, and treating the conversation as part of the care rather than the preamble to it. Clients remember how a consultation made them feel long after they have forgotten the details.",
          },
        ],
      },
      {
        kind: "image",
        imageKey: "clinic",
        caption:
          "A scalp treatment in clinic. Every option on the following pages should begin with a proper assessment.",
      },
      {
        kind: "article",
        kicker: "Explainer: restoration",
        title: "Non-surgical restoration, weighed fairly",
        standfirst:
          "What the main options are, who provides them, how strong the evidence looks and what should make you cautious.",
        blocks: [
          {
            type: "p",
            text: "Non-surgical hair restoration covers a wide range, from licensed medicines to cosmetic solutions that make no claim to regrow anything. Clients meet all of them online, often presented with the same confidence. Our job is to help them tell the difference. What follows is an overview, not treatment advice. Suitability always depends on a proper assessment and, for medicines, on a prescriber.",
          },
          { type: "pull", text: "Our job is to help them tell the difference." },
          { type: "h", text: "The main categories" },
          {
            type: "list",
            items: [
              "Medical treatments, topical and oral: medicines that act on the hair cycle or on hormonal pathways. Some topical treatments are sold in pharmacies; others, and the oral options, need a doctor or other qualified prescriber. These have the most established evidence for pattern hair loss, although response varies and benefits usually last only while treatment continues.",
              "Low-level light therapy: devices using red or near-infrared light, at home or in clinic. There is some supportive evidence, but studies vary in quality and in the devices used, so expectations should be modest.",
              "Microneedling: controlled micro-injury to the scalp, carried out in clinic and sometimes combined with medical treatment. Early findings are encouraging but the studies are mostly small, and hygiene and training are critical.",
              "Scalp micropigmentation: a cosmetic tattooing technique that creates the appearance of density or a close-shaven hairline. It does not grow hair and is long-lasting, so the choice of practitioner matters.",
              "Hair systems and wigs: non-medical, immediate and reversible. For many people, including those with extensive or permanent loss, they are the most effective option available, and they deserve respect rather than being treated as a last resort.",
            ],
          },
          { type: "h", text: "Who provides what" },
          {
            type: "p",
            text: "Prescribing is for doctors and other qualified prescribers. Trichologists can explain the options, support clients through treatment and refer. Microneedling, light therapy and micropigmentation are offered in a range of clinical and aesthetic settings, and training, insurance and local licensing requirements vary. Hair system and wig specialists are skilled professionals in their own right.",
          },
          {
            type: "callout",
            title: "Red flags when a client is choosing",
            text: "Guaranteed results. Pressure to pay for a long package upfront. No medical history taken. Prescription medicines supplied without a consultation with a named prescriber. Before-and-after photographs with different lighting, angles or styling. Any claim that one treatment suits everyone.",
          },
          { type: "h", text: "A fair conversation" },
          {
            type: "p",
            text: "The most useful thing you can offer is a sense of proportion. Establish the likely cause first, because the right option for pattern hair loss is not the right option for shedding after illness, and neither is right for scarring conditions, which need a dermatologist. Explain that medical treatments usually take months to show any effect, that none works for everyone, and that cosmetic options can sit alongside medical ones rather than replacing them.",
          },
          {
            type: "reveal",
            prompt: "Why might a client be advised to wait several months before judging a medical treatment?",
            answer:
              "Treatments that act on the hair cycle need time for follicles to move through their phases and for new hair to gain visible length. Early shedding can even happen as the cycle shifts. A prescriber will set out what to expect and when to review.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Explainer: shared data",
        title: "The case for a UK trichology database",
        standfirst:
          "Individual clinics see individual clients. Pooled and carefully governed, their records could show patterns none of us can see alone.",
        imageKey: "learning",
        blocks: [
          {
            type: "p",
            text: "Every trichologist keeps records. Across the UK and Ireland, those records add up to a large body of knowledge about hair and scalp conditions: who presents, with what, how they are managed and what happens next. At present almost all of it sits in separate filing cabinets and software systems, where it can help one client at a time but cannot answer bigger questions.",
          },
          { type: "h", text: "What shared data could do" },
          {
            type: "list",
            items: [
              "Show which presentations are common, and in whom, across ages, sexes, ethnicities and regions.",
              "Record outcomes consistently, so practitioners can see how management approaches compare in everyday practice.",
              "Support clinical decision-making with reference points drawn from many practices rather than one.",
              "Give researchers a starting point for well-designed studies, and help identify the questions worth asking.",
              "Strengthen the profession's standing by showing its work in a form others can scrutinise.",
            ],
          },
          { type: "h", text: "What it would take" },
          {
            type: "p",
            text: "A database is only as useful as the data going in. That means agreeing a common minimum dataset: the same core questions, recorded in the same way, with shared definitions. Consistency is less glamorous than volume, and it matters more.",
          },
          { type: "pull", text: "Consistency is less glamorous than volume, and it matters more." },
          {
            type: "p",
            text: "It also means governance. Health information is special category data under the UK GDPR and, in Ireland, under the EU GDPR. Anyone building a shared database would need a lawful basis for processing and an additional condition for special category data, a data protection impact assessment, clear responsibilities for controllers and processors, and secure storage. Data should be kept to the minimum needed and pseudonymised wherever possible, and research uses may need ethical approval.",
          },
          {
            type: "callout",
            title: "Consent, in plain terms",
            text: "Clients should know what is collected, why, who will see it, how long it is kept and how to withdraw. Consent to care and agreement to research use are different things and should be asked about separately. Nobody's care should depend on agreeing to share their data.",
          },
          { type: "h", text: "Why it matters for an unregulated profession" },
          {
            type: "p",
            text: "Trichology is not statutorily regulated in the UK or Ireland, which places more weight on voluntary standards, training and transparency. A well-run shared database would be one way of showing that the profession measures what it does and learns from it. That is good for clients, for referrers and for practitioners alike.",
          },
          {
            type: "p",
            text: "There is a practical point for members, too. Good shared data starts with good records in your own clinic. Structured notes, consistent photographs taken with consent, and outcomes recorded at agreed intervals are worth doing now, whatever shape a future database takes.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "Four themes, three questions",
        intro: "A short check on the explainers in this edition. Pick an answer to see the reasoning.",
        blocks: [
          {
            type: "quiz",
            question: "Which statement about scalp micropigmentation is accurate?",
            options: [
              "It stimulates dormant follicles to produce new hair",
              "It creates the appearance of density but does not grow hair",
              "It is a prescription treatment for pattern hair loss",
              "It fades completely within a few weeks",
            ],
            answer: 1,
            explain:
              "Scalp micropigmentation is a cosmetic tattooing technique. It can create the look of density or a close-shaven hairline, but it has no effect on growth, and because it is long-lasting the choice of practitioner matters.",
          },
          {
            type: "quiz",
            question: "A client wants to try an oral medicine for pattern hair loss. What is the appropriate route?",
            options: [
              "A trichologist suggests an amount and the client buys it online",
              "An assessment with a doctor or other qualified prescriber",
              "The client tries what a friend uses and reviews it in a year",
              "The salon sells it alongside shampoos",
            ],
            answer: 1,
            explain:
              "Oral medicines for hair loss need a prescriber who can take a history, consider side effects and interactions, and arrange follow-up. Trichologists can discuss options and refer, but cannot prescribe.",
          },
          {
            type: "quiz",
            question: "Why would a shared trichology database need a clear lawful basis and a careful consent process?",
            options: [
              "Hair photographs count as public information",
              "Health information is special category data under data protection law",
              "Research databases are exempt from GDPR",
              "Consent is only needed for clients under 18",
            ],
            answer: 1,
            explain:
              "Information about someone's health, including their hair and scalp conditions, is special category data under the UK GDPR and the EU GDPR. It needs a lawful basis, an additional condition, strong safeguards and clear information for the people whose data it is.",
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Head spa, properly
  // ─────────────────────────────────────────────────────────────
  {
    number: 3,
    slug: "head-spa-properly",
    title: "Head spa, properly",
    fade: "The craft behind the calm.",
    theme: "Head spa",
    standfirst:
      "Head spa is a craft with a method. The sequence, the hygiene, the contraindications and the honest way to talk about results.",
    coverImageKey: "headSpa",
    coverTone: "light",
    audience: ["cosmetic", "clinical"],
    published: "2026-09-30",
    pages: [
      {
        kind: "letter",
        title: "The craft behind the calm",
        blocks: [
          {
            type: "p",
            text: "Head spa has grown quickly across Ireland and the UK. Clients arrive curious, often having seen it online, and leave describing something closer to rest than to a hair appointment. That response is real and worth taking seriously. So is the responsibility that comes with it.",
          },
          {
            type: "p",
            text: "A good head spa treatment looks effortless because the therapist has done a great deal of thinking beforehand. They have asked the right questions, checked the scalp, cleaned the equipment, set the water temperature and planned a sequence that makes sense. The calm the client feels is built on that preparation.",
          },
          {
            type: "p",
            text: "This edition is about the craft behind the calm. We set out the principles and sequence of a considered treatment, the hygiene and water practices that keep clients safe, and the contraindications to check before every appointment, with a checklist you can use at the basin. We look at how to talk about results without promising more than a cosmetic service can deliver, and at how to build head spa into a menu that makes sense for your business.",
          },
          {
            type: "p",
            text: "Head spa sits firmly in the cosmetic discipline, and it is one of the best places to notice change on the scalp. Therapists see the scalp closely, under good light, for a long time. That makes the head spa room a natural first step in the referral routes this community is building.",
          },
          {
            type: "p",
            text: "Whether you already offer head spa or are thinking about it, we hope you find something here to use on Monday morning.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Method",
        title: "Principles and sequence",
        standfirst: "A considered treatment follows an order for a reason. Each step prepares for the next.",
        imageKey: "headSpa",
        blocks: [
          {
            type: "p",
            text: "There is no single official head spa protocol, and different traditions and training providers teach different routines. What good treatments share is a logic: assess before you treat, cleanse before you condition, and move from stimulation towards stillness. The sequence below is a framework, not a script. Adapt it to your training and to the person in front of you.",
          },
          { type: "h", text: "Four principles" },
          {
            type: "list",
            items: [
              "Assessment comes first. Nothing happens to the scalp until you have asked, looked and agreed what the treatment is for.",
              "Pressure is a conversation. Check in early, adjust often and never assume that firmer is better.",
              "Temperature matters. Water and towels should be warm, not hot, and tested on your own wrist first.",
              "The ending is part of the treatment. Leave time for the client to come back to the room slowly.",
            ],
          },
          { type: "h", text: "A typical sequence" },
          {
            type: "list",
            items: [
              "Consultation and consent, including the contraindication check.",
              "Scalp observation, with magnification if you use it, noting anything to discuss or refer.",
              "A pre-cleanse, such as a light oil applied to the dry scalp to loosen build-up, where suitable.",
              "Cleansing, usually twice, with water at a comfortable temperature and thorough rinsing.",
              "A treatment product matched to the scalp's condition, such as a clarifying, soothing or hydrating formula.",
              "Massage of the scalp, neck and shoulders, with a steady rhythm and agreed pressure.",
              "Rinse, condition the lengths and towel dry gently.",
              "Close: a short rest, a glass of water, and a brief conversation about what you noticed and home care.",
            ],
          },
          { type: "pull", text: "Move from stimulation towards stillness." },
          {
            type: "p",
            text: "Timing varies with the menu, but the balance should favour the parts the client values most. For many, that is the massage and the rest at the end. For others, it is the observation and the advice. Asking which matters more to them is a quick way to tailor the treatment without changing its structure.",
          },
          {
            type: "callout",
            title: "Observation is a skill",
            text: "The long, close look at the scalp that head spa allows is valuable. Record what you see in neutral terms and share it gently. If anything looks unusual, suggest the client has it checked rather than guessing what it is.",
          },
          {
            type: "p",
            text: "Above all, a good sequence is repeatable. When every therapist in a team follows the same framework, clients get a consistent experience, new staff learn faster, and it becomes much easier to notice when something about a regular client's scalp has changed.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "What the steam reveals",
        intro:
          "A head spa gives a closer look at the scalp than almost any other appointment. When that look shows flaking, redness or something unexpected, each discipline has its own part to play.",
        views: [
          {
            discipline: "cosmetic",
            heading: "In the treatment room",
            blocks: [
              {
                type: "p",
                text: "Under magnification and good light, a head spa therapist sees the scalp in detail: build-up, dryness, flakes, redness, spots and sensitivity. The pre-treatment consultation, and a careful look before any product goes on, are what keep the treatment safe.",
              },
              {
                type: "p",
                text: "A therapist never diagnoses. Flaking may be product build-up or dryness, but it may also be a condition that needs treatment, and it is not for the treatment room to decide which. If the scalp is broken, weeping, very red or painful, pause the service. Describe what you see in neutral words, and suggest a trichologist, pharmacist or GP.",
              },
              {
                type: "quiz",
                question:
                  "During a head spa you notice thick, yellowish scale with redness along the hairline, and the client says it itches. What do you do?",
                options: [
                  "Carry on with an exfoliating step to lift the scale",
                  "Tell her it looks like psoriasis and recommend a product",
                  "Adapt to a gentle, non-exfoliating approach or pause, note what you saw and suggest she has it looked at",
                  "Say nothing, as it is outside your scope",
                ],
                answer: 2,
                explain:
                  "Exfoliating inflamed skin can make it worse, and naming a condition is a diagnosis you are not in a position to make. Adapting or pausing the treatment, recording what you saw and suggesting an assessment respects both the client and your scope.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "In the trichology clinic",
            blocks: [
              {
                type: "p",
                text: "A trichologist will ask how long the flaking has been present, whether it comes and goes, which products and routines the client uses, and whether skin elsewhere is affected. Examination, often with a trichoscope, helps to describe the pattern of scaling and any inflammation.",
              },
              {
                type: "p",
                text: "From there the trichologist can suggest changes to washing, products and routine, and may recommend head spa treatments as supportive care once the scalp has settled. Where a medical condition seems likely, or the scalp does not improve with sensible care, the trichologist refers to a GP or dermatologist rather than continuing alone.",
              },
              {
                type: "reveal",
                prompt: "Why might a trichologist suggest a head spa only once a scalp has settled?",
                answer:
                  "Some treatment steps, such as exfoliation, heat or firm massage, can aggravate an inflamed scalp. Once medical or clinical care has calmed it, a gentle head spa can support comfort and routine without getting in the way.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "In the surgery or dermatology clinic",
            blocks: [
              {
                type: "p",
                text: "A GP or dermatologist can diagnose scalp conditions such as seborrhoeic dermatitis, psoriasis, contact dermatitis or fungal infection, sometimes taking a sample to confirm, and can prescribe medicated treatment where it is needed. Pharmacists can advise on over-the-counter options and signpost to a GP when something needs a closer look.",
              },
              {
                type: "p",
                text: "What the doctor rarely sees is the scalp over several months, in good light and at close range. A short, factual note from a therapist or trichologist, shared with the client's consent, can help: when the problem started, what it looked like and what made it better or worse.",
              },
              {
                type: "checklist",
                title: "A useful note to take to the GP",
                items: [
                  "When the flaking or redness was first noticed",
                  "Where on the scalp it appears, and whether other skin is affected",
                  "Products, dyes or treatments used in the weeks before",
                  "Anything that has eased it or made it worse",
                  "Photos taken in consistent light, if the client agreed",
                ],
              },
            ],
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "At the basin",
        title: "Before every treatment",
        intro:
          "Work through this with each client before you begin. If any item cannot be ticked, postpone, adapt or refer. When in doubt, ask the client to check with their GP first.",
        blocks: [
          {
            type: "checklist",
            title: "Contraindication check",
            items: [
              "No open cuts, sores or broken skin on the scalp, face or neck",
              "No signs of infection, such as weeping, crusting, pustules or pain",
              "No head lice or suspected fungal infection of the scalp",
              "No flare of a scalp condition, such as psoriasis or eczema, that massage or products could aggravate",
              "No recent scalp surgery, hair transplant, injury or knock to the head",
              "No recent chemical service that makes cleansing or your products unsuitable today",
              "No known allergy to the products, oils or fragrances you plan to use",
              "No unexplained lumps, swelling or changing moles that have not been discussed",
              "No neck or back problems, recent whiplash or dizziness that affect positioning at the basin",
              "No fever, and the client feels well today",
              "Pregnancy, blood pressure, migraine and other medical conditions discussed, with positioning and products adapted",
              "Informed consent given, and the client knows they can stop at any time",
            ],
          },
          {
            type: "quiz",
            question:
              "A client mentions a small, sore, crusted patch on her scalp that appeared last week. What should you do?",
            options: [
              "Massage around it gently with a soothing oil",
              "Go ahead, but skip the pre-cleanse",
              "Postpone the scalp treatment and suggest she has it checked by her GP or pharmacist",
              "Apply a clarifying treatment to help it clear",
            ],
            answer: 2,
            explain:
              "A sore, crusted patch could be irritation, infection or something else, and it needs to be seen by someone who can diagnose it. Working on or around it risks making it worse or spreading an infection. Offer to rebook once it has been checked.",
          },
          {
            type: "reveal",
            prompt: "Why ask about neck problems and pregnancy before a head spa treatment?",
            answer:
              "Lying back at a basin puts the neck in extension, which can be uncomfortable or unsuitable for some people. Later in pregnancy, lying flat on the back can cause dizziness. Supportive cushions, a reclined chair or a shorter time at the basin may help, and some clients should check with their GP or midwife first.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Standards",
        title: "Hygiene and water",
        standfirst: "Clients close their eyes and trust you. Hygiene is how you keep that trust.",
        imageKey: "products",
        blocks: [
          {
            type: "p",
            text: "Head spa brings together warm water, shared equipment, towels, oils and close skin contact, which is exactly the environment in which poor hygiene causes problems. The good news is that the fundamentals are simple. The discipline lies in doing them every time.",
          },
          { type: "pull", text: "The fundamentals are simple. The discipline lies in doing them every time." },
          { type: "h", text: "Hands, tools and surfaces" },
          {
            type: "list",
            items: [
              "Wash your hands thoroughly before and after every client, and after touching anything soiled.",
              "Clean and then disinfect combs, brushes, scalp camera heads and applicators between clients, following the manufacturer's instructions for contact time.",
              "Use single-use items wherever proper cleaning is not possible.",
              "Wipe down basins, headrests, chairs and trolleys between clients.",
              "Keep clean and used items physically separate so they cannot be confused.",
            ],
          },
          { type: "h", text: "Towels and linen" },
          {
            type: "p",
            text: "Use a fresh towel, gown and headrest cover for every client. Wash linen hot, commonly at 60°C, with a suitable detergent, dry it thoroughly and store it covered. Damp towels left in a pile encourage microbes and smell stale quickly, and clients notice.",
          },
          { type: "h", text: "Water" },
          {
            type: "p",
            text: "Water is the heart of head spa and deserves the same attention as the products. Check the temperature at the start of every rinse and keep it comfortable rather than hot, because very warm water can irritate a sensitive scalp. Many parts of England have hard water, and mineral build-up can affect how products lather and rinse; some businesses choose filtered showerheads or softening systems for this reason.",
          },
          {
            type: "p",
            text: "The water system itself needs care. Showerheads and outlets that are rarely used can allow bacteria, including Legionella, to grow. People in control of premises have duties to assess and manage this risk. In practice that usually means flushing little-used outlets regularly, cleaning and descaling showerheads, and keeping hot and cold water at safe temperatures, following guidance from the health and safety authority where you work.",
          },
          {
            type: "callout",
            title: "Local rules apply",
            text: "Some local authorities require registration or licensing for certain treatments, particularly anything that pierces the skin, such as microneedling. Check what applies where you work, and make sure your insurance covers every service on your menu.",
          },
          {
            type: "p",
            text: "Write your hygiene routine down, train everyone on it and review it regularly. Clients rarely comment on clean equipment, but they always notice when it is not.",
          },
        ],
      },
      {
        kind: "image",
        imageKey: "portraitB",
        caption: "Every scalp is different. The consultation is where the treatment begins.",
      },
      {
        kind: "article",
        kicker: "Language",
        title: "Talking about results honestly",
        standfirst:
          "Head spa can feel wonderful and genuinely care for the scalp. It cannot cure hair loss, and clients deserve to hear that plainly.",
        blocks: [
          {
            type: "p",
            text: "Head spa is often marketed with big promises: detox, regrowth, anti-ageing, reversing hair loss. Some of these claims borrow the language of medicine without the evidence behind it. They set clients up for disappointment and put businesses at risk, because advertising codes in the UK and Ireland require that claims are not misleading and can be backed up.",
          },
          { type: "h", text: "What you can say with confidence" },
          {
            type: "list",
            items: [
              "A head spa treatment cleanses the scalp and removes build-up of product, oil and dead skin cells.",
              "Massage can feel deeply relaxing, and many clients find the experience restful.",
              "A clean, comfortable scalp is a good environment for healthy hair.",
              "Regular treatments are a chance to observe the scalp closely and notice changes early.",
            ],
          },
          { type: "h", text: "What to avoid" },
          {
            type: "list",
            items: [
              "Claims that head spa grows hair, stops hair loss or treats any medical condition.",
              "Wellness words such as ‘detox’ used as if they described a measurable effect.",
              "Before-and-after images that suggest regrowth, or that differ in lighting, angle or styling.",
              "Promising that a set number of sessions will fix a problem.",
            ],
          },
          {
            type: "p",
            text: "Honesty is not a weaker sales pitch. It is a more durable one. Clients who are told the truth trust you with the next question, and the one after that. Clients who were promised regrowth and did not see it rarely come back, and they tell their friends why.",
          },
          { type: "pull", text: "Honesty is not a weaker sales pitch. It is a more durable one." },
          {
            type: "callout",
            title: "If a client is worried about hair loss",
            text: "Be kind and clear. Head spa can keep the scalp clean and comfortable while the cause is explored, but it is not a treatment for hair loss. Suggest a trichologist or their GP, and offer to note down what you have seen.",
          },
          {
            type: "reveal",
            prompt: "A client asks, ‘Will this make my hair grow back?’ What might you say?",
            answer:
              "‘Head spa is lovely for the scalp and a good way to keep it clean and comfortable, but I'd be misleading you if I said it would grow hair back. If you're noticing loss, it's worth finding out why. I can suggest someone who can look into that properly, and we can keep your scalp in good condition in the meantime.’",
          },
          {
            type: "p",
            text: "The words on your menu, website and social media matter as much as what you say in the room. Read them back as a sceptical client would, and remove anything you could not stand behind if someone asked you to explain it.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Business",
        title: "Building head spa into a menu",
        standfirst: "A clear menu helps clients choose and helps your team deliver the same treatment every time.",
        imageKey: "salon",
        blocks: [
          {
            type: "p",
            text: "Head spa can sit on a menu in several ways: as a standalone treatment, as an add-on to a cut or colour, or as part of a scalp care programme built around consultation. The right shape depends on your space, your team's training and your clients. What matters is that each option is clearly described, consistently delivered and priced to reflect the time and skill involved.",
          },
          { type: "h", text: "Three common structures" },
          {
            type: "list",
            items: [
              "An add-on: a short scalp cleanse and massage offered alongside another service. Easy to introduce, and a gentle way for clients to try head spa.",
              "A signature treatment: the full sequence of consultation, observation, cleanse, treatment, massage and rest, booked on its own.",
              "A scalp care programme: a series of appointments that begins with a consultation and reviews observations and home care each time. Take care not to imply a medical outcome.",
            ],
          },
          { type: "h", text: "Getting the practicalities right" },
          {
            type: "list",
            items: [
              "Time: allow for consultation, setting up, cleaning down and a proper rest at the end, not just the hands-on minutes.",
              "Space: a quiet, warm room with a comfortable basin set-up makes a real difference.",
              "Training: make sure every therapist is trained in the sequence, hygiene and contraindications, and that your insurance covers the service.",
              "Descriptions: say what happens in the treatment and how it feels, and leave out claims you cannot support.",
              "Records: keep consultation notes and consent forms securely, in line with data protection law.",
            ],
          },
          {
            type: "p",
            text: "When it comes to pricing, count everything the treatment takes. Price the time and skill, not just the minutes on the scalp.",
          },
          { type: "pull", text: "Price the time and skill, not just the minutes on the scalp." },
          { type: "h", text: "Connecting to the wider picture" },
          {
            type: "p",
            text: "Because head spa sits in the cosmetic discipline, it has a particular value in a referral network. Therapists see scalps closely and often. A menu backed by clear routes onwards, such as a working relationship with a local trichologist, gives clients somewhere to go when something looks different, and it tells them you take their scalp seriously.",
          },
          {
            type: "callout",
            title: "A word on retail",
            text: "Home care products can support a treatment, but recommend them because they suit the client's scalp, not because of a target. Clients can tell the difference.",
          },
          {
            type: "p",
            text: "Finally, review your menu regularly. Look at which treatments are booked, which are rebooked and what clients say about them. A shorter, clearer menu often works better than a long one.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "At a glance",
        title: "A treatment in eight steps",
        rows: [
          { label: "1. Consultation", value: "History, expectations, contraindication check and consent." },
          { label: "2. Observation", value: "A close look at the scalp, with neutral notes and anything to refer." },
          { label: "3. Pre-cleanse", value: "A light oil or treatment on the dry scalp to loosen build-up, where suitable." },
          { label: "4. Cleanse", value: "Usually twice, with warm rather than hot water and thorough rinsing." },
          { label: "5. Treatment", value: "A product matched to the scalp: clarifying, soothing or hydrating." },
          { label: "6. Massage", value: "Scalp, neck and shoulders, at a pressure agreed and checked." },
          { label: "7. Rinse and dry", value: "Condition the lengths and towel dry gently." },
          { label: "8. Close", value: "Rest, water, a short summary of what you noticed and home care advice." },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Shedding season
  // ─────────────────────────────────────────────────────────────
  {
    number: 4,
    slug: "shedding-season",
    title: "Shedding season",
    fade: "Timelines, triggers and calm conversations.",
    theme: "Hair loss",
    standfirst:
      "Telogen effluvium is common, frightening and usually temporary. The biology, the timeline, the red flags and the conversations that help.",
    coverImageKey: "hairDetail",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-09-30",
    pages: [
      {
        kind: "letter",
        title: "When hair falls",
        blocks: [
          {
            type: "p",
            text: "Few things bring clients to us as quickly as sudden shedding. They arrive with hair in a sandwich bag, or photographs of the plughole, or simply the fear that it will not stop. Many will have searched online first and found the worst possible explanations.",
          },
          {
            type: "p",
            text: "Often, what they are experiencing is telogen effluvium: a shift in the hair cycle that causes more hairs than usual to shed at once, typically some weeks after a trigger such as illness, childbirth or a stressful event. It is common, and it usually settles. But it is not the only cause of shedding, and it can sit alongside other conditions. That is why a careful history and a clear sense of the red flags matter in every discipline.",
          },
          {
            type: "p",
            text: "This edition sets out what telogen effluvium is, how to draw its timeline with a client so that the delay between trigger and shedding makes sense, and the red flags that mean a GP or dermatologist should be involved. We describe the blood tests a doctor may consider, without straying into medical advice, and we look at aftercare conversations: what to say, what not to say and how to support someone while they wait.",
          },
          {
            type: "p",
            text: "That word, wait, is doing a lot of work. Much of the care in shedding is helping someone through the months when nothing seems to be happening. Calm, accurate information is one of the most useful things any of us can give.",
          },
          {
            type: "p",
            text: "As always, this is education for professionals, not a diagnostic guide. Work within your scope, and refer when in doubt.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The basics",
        title: "Telogen effluvium, explained",
        standfirst:
          "What it is, what tends to trigger it, and why it looks so alarming when it is usually temporary.",
        imageKey: "hairDetail",
        blocks: [
          {
            type: "p",
            text: "Telogen effluvium, often shortened to TE, is a form of diffuse hair shedding. It happens when a larger proportion of scalp follicles than usual move from the growth phase, anagen, into the resting phase, telogen, at around the same time. Because telogen lasts roughly three months, the hairs are released some weeks after whatever caused the shift, and they tend to fall together.",
          },
          {
            type: "p",
            text: "The result feels sudden and dramatic. Clients find hair on the pillow, in the shower and on their clothes. The hair may look thinner overall, though often less so than the client fears. Crucially, the follicles are not destroyed. They are resting.",
          },
          { type: "pull", text: "The follicles are not destroyed. They are resting." },
          { type: "h", text: "Common triggers" },
          {
            type: "list",
            items: [
              "Illness with a high fever, including viral infections.",
              "Childbirth, after which shedding is often described as postpartum telogen effluvium.",
              "Surgery, significant injury or a stay in hospital.",
              "Significant emotional stress or bereavement.",
              "Rapid weight loss, crash dieting or a sharp change in diet.",
              "Starting, stopping or changing some medicines, including hormonal contraception.",
              "Low iron stores, thyroid changes and other medical issues, which a doctor can investigate.",
            ],
          },
          {
            type: "p",
            text: "Sometimes no trigger is found, and sometimes there is more than one. A careful history, taken month by month, often surfaces something the client had not connected with their hair.",
          },
          { type: "h", text: "Acute and chronic" },
          {
            type: "p",
            text: "In acute telogen effluvium, shedding usually settles within around six months once the trigger has passed, and regrowth follows. When shedding continues for longer than six months, it is often described as chronic telogen effluvium, which can fluctuate over a long period and may need further medical assessment. Regrowth takes patience: scalp hair grows at roughly a centimetre a month, so it can be many months before length and density look recovered.",
          },
          {
            type: "callout",
            title: "Not always TE on its own",
            text: "Telogen effluvium can unmask or accompany other conditions, particularly pattern hair loss, and it can resemble early diffuse alopecia areata. A widening parting, patchy loss or scalp symptoms are reasons for a fuller assessment.",
          },
          {
            type: "p",
            text: "Diagnosis belongs to a doctor or, within their scope, a trichologist assessing the history and the scalp. Everyone else plays a vital part by noticing, listening and helping the client find the right person quickly.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "The same handful of hair",
        intro:
          "A client arrives with a handful of shed hair and a great deal of worry. Each discipline reads that handful differently, and each has something useful to offer.",
        views: [
          {
            discipline: "cosmetic",
            heading: "At the basin",
            blocks: [
              {
                type: "p",
                text: "Stylists and therapists often see shedding first: more hair in the basin, in the brush and on the cape. Clients may ask outright whether they are going bald. It is tempting to reassure, but it is kinder to acknowledge what they are seeing and to avoid guessing at a cause, however likely one seems.",
              },
              {
                type: "p",
                text: "You can be gentle with the hair, avoid tight styles and harsh processes while it is shedding, and suggest a trichologist or GP. If the client mentions feeling unwell, noticeable patches or a sore scalp, encourage them to see their GP soon rather than waiting for their next appointment.",
              },
              {
                type: "checklist",
                title: "When a client mentions shedding",
                items: [
                  "Acknowledge the worry without guessing at a cause",
                  "Handle the hair gently and skip tension-heavy styling",
                  "Ask whether they have noticed patches or a sore scalp",
                  "Suggest a trichologist or their GP, and offer to note what you have seen",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "Reading the timeline",
            blocks: [
              {
                type: "p",
                text: "Telogen effluvium usually follows its trigger by some weeks or months, so a trichologist's history reaches back: illness, surgery, childbirth, changes in diet, new medicines and periods of stress. Examination and simple assessments, such as a gentle pull test, help to describe the shedding.",
              },
              {
                type: "p",
                text: "A trichologist can explain the likely pattern, suggest practical care and help the client track progress. They cannot confirm a medical cause or treat one. Where shedding has no clear trigger, has continued for many months or sits alongside other symptoms, the care plan should include a visit to the GP.",
              },
              {
                type: "reveal",
                prompt:
                  "Why does a good trichology history ask about the months before shedding began, not just the weeks?",
                answer:
                  "Hair that is pushed into its resting phase is usually shed some time later, so the trigger often sits months back. Clients rarely connect the two unless someone asks.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Looking for a cause",
            blocks: [
              {
                type: "p",
                text: "A GP may consider blood tests to look for treatable contributors, such as low iron or thyroid problems, and will review medicines and recent illness. A dermatologist may become involved when the picture is unclear, when shedding persists, or when another type of hair loss may be present alongside it.",
              },
              {
                type: "p",
                text: "Doctors can treat underlying conditions and discuss whether any specific treatment is appropriate. They cannot hurry hair through its cycle, and good medical advice is honest about that. Scarring, inflammation or rapid patchy loss need prompt dermatology input rather than a wait-and-see approach.",
              },
              {
                type: "quiz",
                question:
                  "A client's shedding began some months after a severe illness, and her GP has found no other cause. What is the most honest summary?",
                options: [
                  "Her hair will certainly be back to normal within a month",
                  "Shedding after illness often settles with time, and it can be reviewed if it does not",
                  "Nothing more can be done, so she should stop worrying",
                  "She should start planning a hair transplant",
                ],
                answer: 1,
                explain:
                  "Shedding after a trigger is often temporary, but nobody can promise a timescale. A plan to review it, and to look again if it persists, is honest without being alarming.",
              },
            ],
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "Red flags",
        intro:
          "Most shedding is not an emergency. Some needs prompt medical attention. Three scenarios to check you would spot the difference, and a list to keep to hand.",
        blocks: [
          {
            type: "quiz",
            question:
              "Which of these should prompt a client to see a GP or dermatologist promptly?",
            options: [
              "Diffuse shedding that began three months after a bout of flu",
              "Smooth, shiny areas of scalp with no visible follicle openings, with burning or tenderness",
              "More hair in the brush a couple of months after a stressful house move",
              "Shedding that is gradually easing five months after childbirth",
            ],
            answer: 1,
            explain:
              "Loss of follicle openings, with redness, burning or tenderness, can suggest a scarring alopecia. These conditions can cause permanent hair loss, so prompt assessment by a dermatologist matters. The other scenarios may fit telogen effluvium, although a history is still worthwhile.",
          },
          {
            type: "quiz",
            question:
              "A client with shedding says she has felt exhausted, cold all the time, and her periods have become heavier. What is the best advice?",
            options: [
              "Reassure her it is probably stress and review in six months",
              "Suggest she sees her GP and mentions these symptoms alongside the shedding",
              "Recommend an iron supplement from a health food shop",
              "Book a course of scalp treatments to support regrowth",
            ],
            answer: 1,
            explain:
              "Symptoms beyond the hair matter. Tiredness, feeling cold and heavier periods are the kind of details a doctor will want to hear and may investigate, for example with blood tests. Suggesting supplements without testing is not appropriate, because some can cause harm when they are not needed.",
          },
          {
            type: "quiz",
            question: "Which situation calls for medical assessment rather than watchful waiting?",
            options: [
              "Hair loss in a child, or loss of eyebrows or eyelashes",
              "Shedding that began about ten weeks after an operation",
              "More hair in the shower a couple of months after a fever",
              "Short new hairs along the hairline a few months after shedding began",
            ],
            answer: 0,
            explain:
              "Hair loss in children, and loss of eyebrows, eyelashes or body hair, should be assessed by a doctor. The other scenarios fit the usual course of telogen effluvium, and short new hairs are often a reassuring sign of regrowth.",
          },
          {
            type: "checklist",
            title: "Refer to a GP or dermatologist if you see",
            items: [
              "Patches of complete hair loss, or rapidly spreading patches",
              "Redness, scaling, pustules, pain, burning or tenderness on the scalp",
              "Shiny, smooth areas where follicle openings seem to have gone",
              "Loss of eyebrows, eyelashes or body hair",
              "Hair loss in a child",
              "Shedding with feeling unwell, weight loss, fever or marked tiredness",
              "Irregular periods, new acne or increased facial or body hair alongside thinning",
              "Shedding lasting longer than around six months, or with no clear trigger",
            ],
          },
        ],
      },
      {
        kind: "article",
        kicker: "In the consultation",
        title: "Drawing the timeline",
        standfirst:
          "The delay between trigger and shedding confuses almost everyone. Drawing it out turns fear into something a client can follow.",
        imageKey: "learning",
        blocks: [
          {
            type: "p",
            text: "The most common question from a client with telogen effluvium is simple: why now? They feel well, life has calmed down, and yet their hair is falling out. The answer lies in the delay built into the hair cycle, and the clearest way to explain it is with a pen and a sheet of paper.",
          },
          { type: "h", text: "How to draw it" },
          {
            type: "list",
            items: [
              "Draw a horizontal line across the page and mark today's date at the right-hand end.",
              "Work backwards month by month, asking about anything significant: illness, fever, surgery, childbirth, bereavement, changes in diet, new or stopped medicines.",
              "Mark possible triggers on the line. Clients often remember more once they can see the months laid out.",
              "Mark when the shedding began, and look at the gap between that and each possible trigger.",
              "Extend the line into the future, and sketch when shedding might ease and when regrowth might become visible.",
            ],
          },
          {
            type: "p",
            text: "A typical case might look like this, described here as an anonymised composite: a client had a high fever in March, felt fine again by April, and noticed heavy shedding in late May or June. Laid out on paper, the gap makes sense in a way that words alone often do not.",
          },
          { type: "pull", text: "Laid out on paper, the gap makes sense in a way that words alone often do not." },
          { type: "h", text: "Talking through the future" },
          {
            type: "p",
            text: "Be careful with the right-hand side of the line. You are sketching what often happens, not making a promise. In acute telogen effluvium, shedding commonly eases within a few months of starting, and new growth may show as short, fine hairs along the hairline and parting. Visible density returns more slowly, because new hair needs months to gain length.",
          },
          {
            type: "callout",
            title: "Keep it honest",
            text: "If shedding continues beyond around six months, if there is no clear trigger, or if other features appear, the timeline is a reason to seek further assessment, not a reason to keep waiting.",
          },
          { type: "h", text: "Why it helps" },
          {
            type: "p",
            text: "A drawn timeline gives the client something to take home and look at when the worry returns. It shows them that you have listened, that there is a pattern and that there is a plan. It is also a useful record: dated, simple and easy to share with a GP, with the client's consent.",
          },
          {
            type: "reveal",
            prompt: "What if the client cannot think of any trigger at all?",
            answer:
              "That happens. Say so honestly: sometimes no single cause is found, or the trigger was something that did not seem significant at the time. Keep the timeline, note your questions, and suggest they speak to their GP, who may consider blood tests to look for causes that are not obvious from the history.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "At a glance",
        title: "A typical telogen effluvium timeline",
        rows: [
          {
            label: "The trigger",
            value: "An event such as illness with fever, childbirth, surgery or significant stress. The client may soon feel well again.",
          },
          {
            label: "About two to three months later",
            value: "Shedding becomes noticeable as follicles that entered telogen together release their hairs.",
          },
          {
            label: "The following months",
            value: "Shedding often peaks and then gradually eases, once the trigger has passed.",
          },
          {
            label: "Around six months",
            value: "Acute TE has usually settled. Shedding beyond this is often described as chronic and warrants further assessment.",
          },
          {
            label: "Regrowth",
            value: "Short, fine new hairs may appear along the hairline and parting. Length returns at roughly a centimetre a month.",
          },
          { label: "Always", value: "Timings vary between people. This is a guide, not a promise." },
        ],
      },
      {
        kind: "article",
        kicker: "Working with doctors",
        title: "What a doctor may check",
        standfirst:
          "Blood tests can help find causes of shedding that are not visible from the outside. What they are, and why a doctor might choose them.",
        imageKey: "clinic",
        blocks: [
          {
            type: "p",
            text: "When shedding has no clear trigger, lasts longer than expected or comes with other symptoms, a GP may decide to arrange blood tests. Which tests, if any, is a medical decision based on the person's history, examination and circumstances. It helps, though, for every discipline to understand the common ones, so that referral notes are useful and conversations with clients are accurate.",
          },
          {
            type: "callout",
            title: "Scope first",
            text: "Only a doctor or other appropriate clinician can decide which tests are needed and what the results mean. Nobody should request, interpret or act on blood results outside their scope, or suggest supplements or amounts on the strength of them.",
          },
          { type: "h", text: "Tests a doctor may consider" },
          {
            type: "list",
            items: [
              "A full blood count, which can show anaemia and other changes in the blood.",
              "Ferritin and other iron studies, which reflect the body's iron stores.",
              "Thyroid function tests, because both an underactive and an overactive thyroid can affect hair.",
              "Vitamin D, vitamin B12 and folate, depending on diet, symptoms and risk factors.",
              "Other tests where the history suggests them, such as hormone tests for a woman with irregular periods, acne or increased facial or body hair, or tests for inflammation or specific conditions.",
            ],
          },
          { type: "h", text: "What it means for your referral" },
          {
            type: "p",
            text: "A good referral note describes what you have seen and when, and leaves the medicine to the doctor. Useful details include when shedding began, possible triggers from the timeline, changes in diet or weight, and any heavy periods, tiredness or other symptoms the client has mentioned, along with anything you observed on the scalp. The client can take the note with them, which saves time and helps them explain.",
          },
          {
            type: "pull",
            text: "A good referral note describes what you have seen and when, and leaves the medicine to the doctor.",
          },
          { type: "h", text: "Talking about results" },
          {
            type: "p",
            text: "If a client shares their results with you, listen, and let their doctor lead on what they mean and what to do. Normal results can be reassuring, and are common in telogen effluvium after a clear trigger. Abnormal results are for the doctor to explain and manage. It is not safe to recommend iron, vitamin D or any other supplement on the strength of a number, because too much of some nutrients can cause harm and some supplements interact with medicines.",
          },
          {
            type: "p",
            text: "The aim is a joined-up approach. The doctor investigates and treats. The trichologist supports the hair and scalp and keeps track of change. The stylist or head spa therapist adapts services and keeps the client feeling cared for. Each role becomes clearer when the others are understood.",
          },
        ],
      },
      {
        kind: "image",
        imageKey: "portraitC",
        caption:
          "Shedding is common and usually temporary. The fear it causes is real, and it deserves a calm, careful answer.",
      },
      {
        kind: "article",
        kicker: "Support",
        title: "Aftercare conversations",
        standfirst: "While the hair cycle resets, what you say and how you say it can make the waiting easier.",
        imageKey: "portraitB",
        blocks: [
          {
            type: "p",
            text: "Much of the care in telogen effluvium happens after the explanation. The client understands the timeline, a doctor has been involved where needed, and now there is waiting. That period can be hard. The hair on the pillow does not stop overnight, and each morning can bring fresh worry.",
          },
          { type: "pull", text: "Much of the care happens after the explanation." },
          { type: "h", text: "Practical care while hair recovers" },
          {
            type: "list",
            items: [
              "Gentle handling: a wide-toothed comb, minimal tension and soft hair ties.",
              "Washing as normal. Hairs that are shedding have already been released and will fall regardless.",
              "Less heat and fewer chemical services while the hair feels fragile, agreed with their stylist.",
              "Cuts and styling that help the hair feel fuller in the meantime.",
              "Regular meals with enough protein, with any concerns about diet taken to their GP or a dietitian.",
              "Scalp comfort: keep the scalp clean and avoid harsh scrubbing.",
            ],
          },
          {
            type: "p",
            text: "It is worth saying something about the hair already shed. Clients sometimes stop washing or brushing in the hope of keeping what they have. Explaining that these hairs have already let go, and that washing simply collects them, can lift a surprising amount of fear.",
          },
          {
            type: "callout",
            title: "Signs to come back sooner",
            text: "Encourage the client to return, or to see their GP, if shedding continues beyond around six months, if patches appear, if the scalp becomes red, sore or scaly, or if new symptoms develop.",
          },
          { type: "h", text: "What would you say?" },
          {
            type: "p",
            text: "Four questions clients often ask. Think about your own answer, then tap to see one way of putting it.",
          },
          {
            type: "reveal",
            prompt: "‘Am I going to go bald?’",
            answer:
              "Answer the fear directly and honestly: ‘Telogen effluvium doesn't destroy the follicles, and for most people the shedding settles and the hair regrows. I can't promise exactly how yours will go, which is why we'll keep an eye on it and involve your GP if it doesn't follow the usual pattern.’",
          },
          {
            type: "reveal",
            prompt: "‘Should I stop washing my hair so less falls out?’",
            answer:
              "‘The hairs you see in the shower have already let go, so they'll come out either way. Washing as normal keeps your scalp healthy and won't make you lose more.’",
          },
          {
            type: "reveal",
            prompt: "‘Can I take something to make it stop?’",
            answer:
              "‘There's nothing I can safely recommend without knowing more, and some supplements can do harm if you don't need them. If your GP finds something such as low iron, they'll advise on treatment. Often the most reliable thing is time, once the trigger has passed.’",
          },
          {
            type: "reveal",
            prompt: "‘Is it my fault? I've been so stressed.’",
            answer:
              "‘No. Stress is one of many things that can trigger shedding, and nobody chooses it. What matters now is looking after yourself while your hair recovers, and your GP can help if the stress is still weighing on you.’",
          },
          {
            type: "p",
            text: "Finally, keep in touch. A short check-in at the next appointment, a note of how the shedding is going and a new photograph taken with consent can show progress that the client cannot see day to day.",
          },
        ],
      },
    ],
  },
];
