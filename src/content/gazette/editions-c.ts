import type { Edition } from "./types";

const KARLEY = "Karley Weir, Founder of Trichollective";

export const editionsC: Edition[] = [
  /* ------------------------------------------------------------------ */
  /* 9. Ireland, in review                                               */
  /* ------------------------------------------------------------------ */
  {
    number: 9,
    slug: "ireland-in-review",
    title: "Ireland, in review",
    fade: "Our industry met in one room, and the conversation now carries on online.",
    theme: "Event review",
    standfirst:
      "On Monday 5 October 2026, cosmetic, clinical and medical professionals met at the Manor House, Killashee Hotel, in Naas, County Kildare. Here are the day in pictures, the people who shared their knowledge, the brands that supported it and what happens next.",
    coverImageKey: "ire11",
    supportedBy: { name: "LIVDOR", slug: "livdor", url: "https://www.livdor.com" },
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-10-14",
    pages: [
      {
        kind: "letter",
        title: "Behind every consultation, treatment or referral is a person.",
        blocks: [
          {
            type: "p",
            text: "On Monday 5 October 2026, we gathered at the Manor House, Killashee Hotel in Naas, County Kildare, for Trichollective Ireland. For me, it was a deeply meaningful day: people from different professional backgrounds came together with a shared desire to learn, connect and support others.",
          },
          {
            type: "p",
            text: "I created Trichollective to connect cosmetic, clinical and medical professionals. Through my own journey as a hairdresser, educator and trichologist, I have seen how much each discipline contributes to someone's care, and how valuable it is when we understand one another's work.",
          },
          {
            type: "p",
            text: "Behind every consultation, treatment or referral is a person. Their hair concerns may affect their confidence, identity and wellbeing. Bringing our knowledge together helps us consider that person more fully.",
          },
          {
            type: "p",
            text: "This edition is my thank-you to everyone who made the day what it was: Tara, our speakers, our exhibitors, our sponsor, Aileen and every attendee. It is also a record of what we learned, so the conversations we started in Naas can carry on.",
          },
        ],
        signoff: KARLEY,
      },
      {
        kind: "gallery",
        kicker: "The day in pictures",
        title: "One room held the cosmetic, clinical and medical sides of our industry.",
        intro: "A day of talks, hands-on assessment and conversation at the Manor House, Killashee Hotel.",
        photos: [
          { imageKey: "ire08", caption: "Delegates from salons, clinics and medical practice shared the same tables for the day." },
          { imageKey: "ire03", caption: "A hands-on scalp assessment, with practitioners from different disciplines looking together." },
          { imageKey: "ire10", caption: "Tina Periclis set out what the evidence does and does not support after cancer-related hair loss." },
          { imageKey: "ire07", caption: "Between sessions, the conversation carried on around every table." },
          { imageKey: "ire01", caption: "Exhibitors walked delegates through their ranges and answered questions in person." },
          { imageKey: "ire13", caption: "Adam Bond at the LIVDOR stand, where delegates could see the cap and ask about it." },
          { imageKey: "ire12", caption: "Old colleagues and new ones, together in front of the gilt mirror." },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Each chair in the room took something different home.",
        intro:
          "The day was built so that a stylist, a trichologist and a clinician would each hear the others' work. Here is what it offered each of them.",
        views: [
          {
            discipline: "cosmetic",
            heading: "Noticing changes, and knowing the options",
            blocks: [
              {
                type: "p",
                text: "Hairdressers and barbers are often the first to see a change in someone's hair or scalp. Aileen Maher spoke about her online training hub, which takes stylists step by step through the basics of scalp education, from the reasons for thinning and hair loss to fitting hair pieces and wigs.",
              },
              {
                type: "p",
                text: "Ashley Marie Higgins of Little Lady Locks showed what practical help looks like for children, and Secret Hair Solutions explained how customised hair replacement fits into client care. Easydry brought the everyday detail of hygiene and laundry into the same conversation.",
              },
              {
                type: "callout",
                title: "For the cosmetic chair",
                text: "You do not need to diagnose. Noticing a change, asking about it kindly and knowing who to refer to is already care.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "Education, assessment and the referral in between",
            blocks: [
              {
                type: "p",
                text: "Liam Byrne, Vice Chair of the Institute of Trichologists, spoke about his own path through trichology and hair science, and why education and continued learning sit at the centre of professional practice.",
              },
              {
                type: "p",
                text: "Sarah Cummins described the work of Trua's clinics in Dublin and County Meath, and Tina Periclis covered oncology-related scalp and hair care, including cold capping, wigs, home care and support after surgery.",
              },
              {
                type: "callout",
                title: "For the clinical chair",
                text: "The trichologist often sits between the salon and the doctor. Clear notes and a clear referral route make that position useful to both.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Bloods, medication and surgery",
            blocks: [
              {
                type: "p",
                text: "Flo King, a Haematology Advanced Nurse Practitioner, explained how blood results can point to underlying causes of hair loss, such as iron deficiency, hormonal imbalance and liver disorders. Charlotte Lucas, a pharmacist and registered nutritionist, connected medication, nutrition and wider health.",
              },
              {
                type: "p",
                text: "Dr David Vondrys, Surgical Director at Hair Restoration Blackrock, brought the surgical view of hair restoration and the patient journey, connecting everyday work in salons and clinics with specialist medical care.",
              },
              {
                type: "callout",
                title: "For the medical chair",
                text: "Many people mention their hair to a stylist long before they mention it to a doctor. A relationship with the salons and clinics near you brings those people to you sooner.",
              },
            ],
          },
        ],
      },
      {
        kind: "article",
        kicker: "The patient perspective",
        title: "Tara reminded us what care feels like from the other side of the chair.",
        standfirst: "At the heart of the day was Tara, who bravely shared her own experience of hair loss as a patient.",
        imageKey: "ire09",
        blocks: [
          {
            type: "p",
            text: "Tara, thank you for trusting us with something so personal. Making space for the patient's voice matters deeply to me. Hearing someone's lived experience helps us understand what care, communication and support mean to the person receiving them.",
          },
          { type: "pull", text: "Making space for the patient's voice matters deeply." },
          {
            type: "p",
            text: "Your contribution gave us an opportunity to listen and to reflect on our own practice. It reminded us why connecting our professions matters: so that we can better understand and support the people who come to us for help.",
          },
          {
            type: "p",
            text: "It was a privilege to have your voice within the day.",
          },
          {
            type: "checklist",
            title: "Questions to take back to your own practice",
            items: [
              "How does a client first hear what I think is happening, and in what words?",
              "Do I explain what happens next, and who else might be involved?",
              "When I refer someone on, do they understand why, and do they feel looked after rather than passed on?",
              "Is there time in my appointment for the person to tell me how this feels, not only what they have noticed?",
            ],
          },
        ],
      },
      {
        kind: "partner",
        kicker: "Little Lady Locks",
        label: "Charity feature",
        title: "Every child deserves to feel like themselves again.",
        standfirst:
          "Ashley Marie Higgins told Trichollective Ireland why she founded Little Lady Locks, the Manchester charity that fits wigs and hair systems free of charge for children and young people up to 18, wherever they live in the UK.",
        partner: {
          name: "Little Lady Locks",
          slug: "little-lady-locks",
          logo: "/partners/little-lady-locks/logo.png",
          invertLogo: true,
          url: "https://www.littleladylocks.com/",
          ctaLabel: "Visit littleladylocks.com",
        },
        theme: { paper: "#fdf7f9", ink: "#33192a", accent: "#f4b6cc" },
        blocks: [
          {
            type: "p",
            text: "Ashley spent years working as a hair loss specialist, and her adult clients kept telling her the same thing. Losing their hair as children had led to bullying, and there had been almost no help for them at the time.",
          },
          {
            type: "p",
            text: "In 2018 she fitted hair systems for two girls, Harper and Ruba, aged five and fifteen. Seeing how much it changed their lives, she founded Little Lady Locks in Manchester so that no child would have to go without.",
          },
          {
            type: "p",
            text: "Today the charity fits wigs and hair systems for children and young people up to the age of 18, free of charge. Behind that work are children and families facing experiences that can affect confidence, friendships and everyday life.",
          },
          { type: "pull", text: "No child should have to go without." },
          {
            type: "p",
            text: "Ashley, thank you for sharing something you have poured so much care into, and for helping us understand the importance of support for children and their families.",
          },
          { type: "h", text: "What the charity provides" },
          {
            type: "list",
            items: [
              "Custom human-hair wigs: full lace wigs made from donated hair and matched to the child's own colour and texture.",
              "Hair systems and toppers: partial wigs, toppers and integration pieces for children with patchy or thinning hair.",
              "Hair systems for boys: short, natural systems that give boys a cut that looks just like their friends'.",
              "Headbands, hats and turbans: headbands with hair attached, beanies and soft turbans for chemotherapy and early hair loss.",
              "Fitting and aftercare: a fitting, a care kit and a new piece and accessory every twelve months as the child grows.",
            ],
          },
          { type: "h", text: "How your salon or clinic can help" },
          {
            type: "p",
            text: "Hair Fairies are hair professionals who collect hair for Little Lady Locks and tell their clients about the charity. It costs nothing, and it gives every client who is having a long cut a way to change a child's life.",
          },
          {
            type: "checklist",
            title: "Become a Hair Fairy",
            items: [
              "Email the charity with your name, your role, your clinic or salon name and address, your logo and your social handles.",
              "Collect hair from clients who are cutting at least 7 inches, and human-hair extensions of 14 inches or more.",
              "Send your first donation and receive your Hair Fairy pack, with a certificate, a membership number and promotional material.",
              "Appear on the Hair Fairy locator, so families and donors near you can find you.",
            ],
          },
          {
            type: "callout",
            title: "Before you send a ponytail",
            text: "Natural hair must be at least 7 inches, completely dry and tied into ponytails with hair bobbles. Extensions must be human hair, at least 14 inches and brushed free of tangles. Synthetic, matted or very damaged hair can't be used. Include a donation form so the donor receives a certificate.",
          },
        ],
        facts: [
          { label: "Children helped every month", value: "20" },
          { label: "To make and fit one custom wig", value: "£500" },
          { label: "Ponytails to make a single wig", value: "12" },
          { label: "Cost to every family, every time", value: "£0" },
        ],
        disclosure:
          "Little Lady Locks is a charity partner of Trichollective. Ashley Marie Higgins was named Woman of the Year 2025 for her work with the charity.",
      },
      {
        kind: "people",
        kicker: "Our speakers",
        title: "Eight speakers shared the knowledge that connects our professions.",
        intro:
          "Surgery, haematology, pharmacy, trichology, oncology care, education and charity work, all in one programme. Thank you to every one of them.",
        people: [
          {
            name: "Dr David J. Vondrys",
            role: "Surgical Director",
            org: "Hair Restoration Blackrock",
            place: "Dublin",
            note: "Shared his expertise in hair restoration and the patient journey, helping bring salon, clinic and specialist medical care closer together. He holds a Fellowship of the Royal College of Surgeons of England and has more than 20 years' experience as a surgeon.",
          },
          {
            name: "Ashley Marie Higgins",
            role: "Founder",
            org: "Little Lady Locks",
            place: "Manchester",
            note: "Shared the purpose behind Little Lady Locks, the charity she founded in 2018, which provides free hair replacement for children under 18 across the UK. Ashley was named Woman of the Year 2025 for this work.",
            href: "/partners/little-lady-locks",
          },
          {
            name: "Tina Periclis",
            role: "Founder",
            org: "The Hair and Skin Clinic MK",
            place: "Milton Keynes",
            note: "Spoke about cancer-related hair loss and headwear, drawing on more than 18 years in NHS and private healthcare and connecting practical support with the emotional impact of hair loss.",
            href: "/partners/the-hair-and-skin-clinic-mk",
          },
          {
            name: "Florence “Flo” King",
            role: "Haematology Advanced Nurse Practitioner",
            org: "Health Fusion",
            note: "Brought her clinical experience to blood health and deficiencies, showing how blood interpretation can help practitioners understand the causes of hair loss and know when another professional is needed.",
          },
          {
            name: "Sarah Cummins",
            role: "Trichologist",
            org: "Trua",
            place: "Dublin and County Meath",
            note: "Spoke about the clinic and the services she offers, giving delegates an insight into the care being provided in Ireland. Sarah has more than 25 years in the hair industry, including 13 years running her own salon.",
          },
          {
            name: "Charlotte Lucas",
            role: "Pharmacist and Registered Nutritionist",
            place: "UK",
            note: "Connected medication, nutrition and wider health, including her work on women's hair loss, in the whole-person approach Trichollective sets out to encourage.",
          },
          {
            name: "Liam Byrne",
            role: "Vice Chair",
            org: "Institute of Trichologists",
            place: "Navan, County Meath",
            note: "Represented the IOT and shared his career in trichology and hair science, from qualifying in 1987 to teaching hairdressing science today, and why continued learning and professionalism matter.",
          },
          {
            name: "Aileen Maher",
            role: "Hair, Scalp and Wig Specialist",
            org: "Hair Scalp & Wig Therapy",
            place: "Newbridge, County Kildare",
            highlight: "Co-organiser of the day",
            note: "Spoke about her educational hub for hairdressers and barbers, and gave her time, care and support to organising the event long before anyone arrived.",
          },
        ],
      },
      {
        kind: "partners",
        kicker: "Sponsor and exhibitors",
        title: "Meeting the people behind each brand turned introductions into conversations.",
        intro:
          "Our exhibitors connected the day's education with the products, services and technology available to our industry. Thank you to everyone who gave their time.",
        sponsor: {
          name: "Passion4hair",
          url: "https://www.passion4hair.com",
          note: "Passion4hair sponsored Trichollective Ireland. As a professional education and distribution company, it supports hair and scalp specialists with trusted brands and industry-led training. Thank you for helping turn this vision into a day of learning, connection and community.",
        },
        exhibitors: [
          {
            name: "LIVDOR",
            slug: "livdor",
            people: "Amy and Adam",
            url: "https://www.livdor.com",
            note: "Gave delegates the chance to explore LIVDOR's laser cap and ask about the technology, the evidence behind it and what introducing it into a business involves.",
          },
          {
            name: "Easydry",
            people: "Emma",
            url: "https://www.easydry.com",
            note: "Showed its single-use towel system and talked through hygiene, laundry and the client experience in salons and clinics.",
          },
          {
            name: "Sons",
            people: "Nick",
            url: "https://www.sons.ie",
            note: "Brought men's hair loss into the conversation, and explained how the brand makes treatment and guidance easier for men to access.",
          },
          {
            name: "Secret Hair Solutions",
            people: "Peter and Oliver Anderson",
            url: "https://secrethairshop.co.uk",
            note: "Showed its customised hair replacement systems and discussed their place in client care, alongside the personal significance of helping someone feel comfortable again.",
          },
          {
            name: "Trua and Remi",
            people: "Pamela Cummins and the team",
            url: "https://remiscalp.com",
            note: "Pamela introduced the team behind Trua's trichology clinics and the Remi scalp care range, so practitioners could explore their products and approach in detail.",
          },
        ],
      },
      {
        kind: "partner",
        kicker: "LIVDOR",
        label: "Sponsored partner feature",
        // Every quotation is Adam Bond's own written answer or bio (20 and 21 October 2026), trimmed to whole sentences.
        title: "Adam Bond wants practitioners to ask LIVDOR the hard questions.",
        standfirst:
          "Adam Bond founded LIVDOR in early 2025 after his own experience of hair loss. Here, in his own words, he explains how the cap works, who it is and is not for, and how practitioners can set honest expectations with clients.",
        partner: { name: "LIVDOR", slug: "livdor", url: "https://www.livdor.com", ctaLabel: "Visit livdor.com" },
        theme: { paper: "#f4f3f0", ink: "#0f1e35", accent: "#e0463e", onAccent: "#ffffff" },
        imageKey: "livdorLifestyleReading",
        blocks: [
          {
            type: "p",
            text: "Adam Bond is the founder of LIVDOR, a British haircare brand launched in early 2025 following his own experience with hair loss. Having explored clinic treatments himself, he wanted to make laser hair growth technology more accessible for people to use at home. Today, he focuses on developing LIVDOR and building relationships with hair and scalp professionals across the UK and Ireland.",
          },
          { type: "h", text: "Where it began" },
          {
            type: "p",
            text: "“I started LIVDOR in early 2025 after looking into treatments for my own hair loss. I'd been to a clinic, but appointments were expensive and difficult to fit around work and family life,” Adam says. “The name is personal too: LIV and DOR come from my daughters' names. 'Liv' is associated with life and renewal, and 'Dor' means gift.”",
          },
          {
            type: "p",
            text: "“I've experienced hair loss myself, and my wife went through it after having our children. So we know how much it can affect your confidence.”",
          },
          { type: "h", text: "What the cap does, in plain language" },
          {
            type: "p",
            text: "“The cap shines low-level red laser light onto the scalp. This type of light is used in photobiomodulation, which aims to influence processes in cells, including those involved in hair-follicle activity. It doesn't burn the scalp or create new follicles. I see it as one possible option for certain types of thinning, once the cause of the hair loss is understood.”",
          },
          {
            type: "p",
            text: "The LIVDOR Pro 272 uses 272 laser diodes at 650 nanometres, rather than LEDs. “Laser light is more directional, whereas LED light tends to spread out more,” Adam explains. “I wouldn't say the diode count alone tells you whether a cap will work. The wavelength, output, coverage and how it's used all matter.”",
          },
          {
            type: "p",
            text: "LIVDOR's instructions recommend 30 minutes per session, three times a week, with sessions spread across the week. “Using it more often has not been shown to improve outcomes for this specific cap, so we advise customers to follow the instructions.”",
          },
          { type: "h", text: "What the evidence does and does not cover" },
          {
            type: "p",
            text: "“The most convincing published evidence is for androgenetic alopecia, or pattern hair loss,” Adam says. “A 2025 systematic review also highlighted that the evidence is much more limited for other causes, including some forms of scarring hair loss and sudden shedding. I look to controlled trials and systematic reviews rather than isolated before-and-after photographs.”",
          },
          {
            type: "callout",
            title: "Who it is not for",
            text: "“I would always want sudden or patchy hair loss, an inflamed or scarred scalp, significant unexplained shedding, or possible underlying medical causes assessed first. People with suspicious scalp lesions, known photosensitivity, photosensitising medication or treatment for cancer should seek appropriate medical advice before use. Product-specific contraindications must follow the device's approved instructions, rather than general assurances from me as a seller.”",
          },
          { type: "h", text: "Setting honest expectations" },
          { type: "pull", text: "I would talk in months, not weeks." },
          {
            type: "p",
            text: "“I would talk in months, not weeks,” Adam says. “We ask people to give the routine at least three months, and for some it may take six months or longer to notice a difference. Sticking with it is important, but we also don't want to promise that everyone will see results.” If somebody stops, he adds, “it would be misleading to describe a few months of light treatment as a permanent cure.”",
          },
          {
            type: "p",
            text: "For clinics, he describes a practical arrangement: “One way a clinic can introduce LIVDOR is by having a cap available to demonstrate. Clients can see how it fits, ask questions and understand the routine before deciding whether to buy one for home use.”",
          },
          { type: "h", text: "Teach, don't sell" },
          {
            type: "p",
            text: "“I'd much rather a practitioner came away understanding the technology and its limitations than feeling they'd sat through a sales presentation,” Adam says. “Brands should help explain their products properly, but they shouldn't try to diagnose hair loss or tell a practitioner what to recommend.”",
          },
          {
            type: "p",
            text: "His message to every trichologist reading: “Please ask us questions.” A year from now, he would like members “to feel they can pick up the phone to LIVDOR, ask a question and get a straight answer.”",
          },
          {
            type: "callout",
            title: "Masterclass: Laser, LED and dose: understanding the specifications",
            text: "Adam Bond (LIVDOR) and Karley Weir co-present LIVDOR's first sponsored masterclass. The date will be announced to every Trichollective account. It is open to every member, and non-members can buy a guest ticket at trichollective.net/events.",
          },
          {
            type: "checklist",
            title: "Questions to ask about any laser or light device",
            items: [
              "What wavelength does it use, and does it use true laser diodes or LEDs?",
              "What does the published research show, and in which types of hair loss?",
              "How often, and for how long, is it used, and what happens if a client stops?",
              "Who should not use it, and when should a client see a GP, dermatologist or trichologist first?",
              "Which certifications does it hold, in which markets, and can the brand show you the documents?",
            ],
          },
          {
            type: "p",
            text: "At Trichollective Ireland, Amy and Adam gave delegates the chance to see the cap and ask the questions that matter before recommending any device: how it works, what the published evidence shows and what it means for a client's routine. Amy and Adam, thank you for giving your time, sharing your knowledge and supporting the vision behind Trichollective.",
          },
        ],
        facts: [
          { label: "Founder", value: "Adam Bond" },
          { label: "What it is", value: "A laser cap for use at home" },
          { label: "Technology", value: "Low-level laser therapy, 272 diodes at 650nm" },
          { label: "Routine", value: "30 minutes, three times a week (per LIVDOR's instructions)" },
          { label: "At Trichollective", value: "Exhibitor in Ireland and a Founding Premium Partner" },
          { label: "Instagram", value: "@livdoruk" },
        ],
        disclosure:
          "LIVDOR is a Founding Premium Partner of Trichollective and sponsors this feature. Trichollective wrote and edited it and kept editorial control. It describes a product and is not medical advice.",
      },
      {
        kind: "image",
        imageKey: "livdorLifestyleLaptop",
        caption: "Adam wanted a cap that is hands-free, so the routine can fit around an ordinary day at home.",
      },
      {
        kind: "partner",
        kicker: "Kiera SI",
        title: "Kiera remembers every client conversation, so your clinic never starts from the beginning.",
        standfirst:
          "Presented at Trichollective Ireland, Kiera is a Super Intelligence front desk for hair and scalp clinics. It answers calls, books appointments and follows up, while your team keeps the judgement and the relationship.",
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
            text: "Kiera helps service businesses hold on to the details that make a client relationship feel personal. It brings client context, calls, messages, appointments, follow-ups, products and payments together in one workspace.",
          },
          {
            type: "p",
            text: "The idea is simple: the work around great care should feel as thoughtful as the care itself. Kiera gives a team a calm, capable colleague for repeatable work, while people stay responsible for judgement, approvals and the relationship.",
          },
          { type: "pull", text: "A client should not have to start from the beginning every time they call, message or return." },
          { type: "h", text: "One relationship, many moments" },
          {
            type: "list",
            items: [
              "Client records, preferences, previous conversations and appointments stay connected, so your team starts with context.",
              "Kiera can answer calls, share approved information about your clinic, capture enquiries, book into your diary and hand over when a person needs to step in.",
              "Email and SMS help you confirm, remind and follow up in a consistent voice.",
              "You can send private payment links for bookings, deposits and products through your own Stripe account.",
              "You teach Kiera your services, people, locations, policies and tone once, so it works from knowledge you have approved.",
            ],
          },
          {
            type: "callout",
            title: "What stays with your team",
            text: "Kiera drafts, suggests, records and organises. Your clinic decides what is true, what is sent and what happens next. Clinical judgement is never handed to software.",
          },
          {
            type: "p",
            text: "Phone, messaging, payment and booking features depend on the provider connections, account set-up, verification and plan each business chooses.",
          },
        ],
        facts: [
          { label: "Built for", value: "Clinics, hair and scalp practices, studios and independent professionals" },
          { label: "Plans", value: "Essential £99 a month, Growth £149 a month" },
          { label: "Seen at", value: "Trichollective Ireland, 5 October 2026" },
        ],
        disclosure:
          "Kiera is built by Trichollective co-founder Antonio Giugno. We label this as a partner feature, as we do for every business we have a connection with.",
      },
      {
        kind: "article",
        kicker: "The launch",
        title: "Ireland was the day Trichollective went online for every member.",
        standfirst: "Karley Weir on building the platform with Antonio Giugno, and why the conversations from our events now carry on between them.",
        imageKey: "ire05",
        blocks: [
          {
            type: "p",
            text: "Ireland also marked the launch of Trichollective online, which made the day an especially proud milestone for me.",
          },
          {
            type: "p",
            text: "Antonio Giugno and I are now working together to develop this vision, combining my love for our industry and my experience in hairdressing, education and trichology with his knowledge of AI and technology.",
          },
          {
            type: "p",
            text: "As our industry moves further into technology, health and wellness, quality products and professionalism, I want Trichollective to create opportunities for us to understand those developments and explore them together.",
          },
          { type: "pull", text: "The conversations and connections made at our events can continue long after everyone goes home." },
          {
            type: "p",
            text: "My hope is to build a place where cosmetic, clinical and medical professionals can find one another, share their expertise and develop stronger relationships, while keeping the people we care for at the centre of our work.",
          },
          {
            type: "p",
            text: "Through trichollective.net, the conversations and connections made at our events can continue long after everyone goes home. This is something I care deeply about, and having Antonio alongside me to develop that vision makes this next chapter especially meaningful.",
          },
          { type: "h", text: "What you can do on the platform today" },
          {
            type: "list",
            items: [
              "Ask colleagues across every discipline in the members' community spaces.",
              "Be found in the directory by clients and by other professionals looking for someone to refer to.",
              "Read every edition of Trichozette in full, including the archive from 2023 to 2026.",
              "Learn at monthly masterclasses and case rounds, with recordings to watch between clients.",
            ],
          },
        ],
      },
      {
        kind: "cta",
        kicker: "To our attendees",
        title: "This is your platform, and there is space here for your voice.",
        intro: "Whether you are just beginning or have decades of experience, you have something valuable to bring.",
        blocks: [
          {
            type: "p",
            text: "A big, heartfelt thank you to every one of you who joined us. Your time, your trust and your willingness to share and learn mean more to me than I can put into words.",
          },
          {
            type: "p",
            text: "You are bringing this vision to life as we learn and grow together. Every question you ask, every experience you share and every connection you make helps shape what Trichollective becomes. This is your show, your platform, your website and your stages.",
          },
          {
            type: "p",
            text: "My role is to create those opportunities and bring us together. It is all of you who give this community its heart. Thank you for being part of it, for supporting one another and for helping Trichollective grow into something we can all feel proud of.",
          },
          { type: "p", text: "Karley" },
        ],
        offers: ["account", "member", "business"],
      },
    ],
    sources: [
      { label: "Hair Restoration Blackrock", url: "https://www.hrbr.ie" },
      { label: "Passion4hair", url: "https://www.passion4hair.com" },
      { label: "LIVDOR", url: "https://www.livdor.com" },
      { label: "Easydry", url: "https://www.easydry.com" },
      { label: "Sons", url: "https://www.sons.ie" },
      { label: "Secret Hair Solutions", url: "https://secrethairshop.co.uk" },
      { label: "Remi Scalp Care", url: "https://remiscalp.com" },
      { label: "Kiera SI", url: "https://kierasi.com" },
    ],
  },
];
