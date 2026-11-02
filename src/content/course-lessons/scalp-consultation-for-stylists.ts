import type { CourseContent } from "@/content/course-types";

/**
 * The scalp consultation for stylists and head spa therapists.
 * Cosmetic discipline: learners observe, record, advise within scope and refer.
 * They never diagnose.
 */
export const content: CourseContent = {
  lessons: [
    // ------------------------------------------------------------------
    // Lesson 1
    // ------------------------------------------------------------------
    {
      slug: "why-the-scalp-matters",
      title: "Why the scalp matters",
      detail:
        "Why you are often the first person to notice a scalp change, what your role is, and the five-minute check you will run at every appointment.",
      minutes: 30,
      objectives: [
        "Explain why stylists and head spa therapists are often the first to notice a change in a client's scalp or hair.",
        "Describe the difference between observing and recording, which is your role, and diagnosing, which is not.",
        "Name the people you refer to in the UK and Ireland and what each of them does.",
        "Run the five structured steps of a five-minute scalp check in the right order.",
        "Explain in plain words how the hair growth cycle links a past event to shedding today.",
      ],
      blocks: [
        {
          type: "p",
          text: "You see more scalps, more closely and more often than almost anyone else in a client's life. A GP might look at a client's scalp once in ten years. You part their hair under good light every six weeks, you know what their scalp looked like last spring, and you are the person they tell when their ponytail feels thinner. That makes you an early warning system, whether you have chosen to be one or not.",
        },
        {
          type: "p",
          text: "This course is about doing that well. It does not turn you into a clinician, and it will not ask you to name conditions. It will help you look properly, ask useful questions, write down what you see in a way that holds up later, notice the small number of signs that mean a client should see a GP or a trichologist soon, and talk about shedding and thinning without frightening anyone or promising what you cannot deliver.",
        },
        { type: "h", text: "What a good scalp consultation does for your client" },
        {
          type: "p",
          text: "Many scalp and hair conditions are easier to manage when they are picked up early. Scarring hair loss is the clearest example. Once a follicle has been replaced by scar tissue it cannot grow hair again, so a client who reaches a dermatologist in the first months has a much better chance of keeping the hair they have than one who arrives years later. Skin cancers on the scalp are another. The scalp is a common site for sun damage, particularly on thinning hair and in clients who spend time outdoors, and a non-healing sore you mention today could be seen by a GP next week.",
        },
        {
          type: "p",
          text: "Most of what you see will be ordinary: a dry scalp in winter, some flaking, product build-up, a little seasonal shedding. A good consultation helps there too. It means your advice on products and services is based on what is actually happening on the scalp, it protects clients from services that could make an irritated scalp worse, and it gives you a record so you can tell whether things are improving.",
        },
        { type: "h", text: "What it does for you and your business" },
        {
          type: "list",
          items: [
            "It protects you. A dated record showing you checked the scalp, found it suitable and explained any risks is your best evidence if a client later reacts to a colour, relaxer or treatment.",
            "It builds trust. Clients notice when you take their scalp seriously, and they come back to the person who spotted something early.",
            "It keeps your insurance valid. Most salon and therapist insurers expect you to consult before chemical and treatment services and to keep records. Check your own policy wording.",
            "It gives you a professional network. A clear referral to a local trichologist or a well written note for the GP is how you build relationships that send clients back to you.",
          ],
        },
        { type: "h", text: "Observe, record, advise, refer" },
        {
          type: "p",
          text: "Everything in this course sits inside four verbs. You observe what is there. You record it accurately. You advise on the things that are within your discipline, such as products, styling, services and scalp care routines. And you refer when what you see or hear is outside that discipline. The verb that is missing is diagnose. Naming a medical condition, telling a client what is causing their hair loss, or suggesting a treatment that changes how the body works belongs to doctors, and in their own scope to trichologists.",
        },
        {
          type: "callout",
          tone: "scope",
          title: "Where your scope ends",
          text: "You can say what you see, for example a round smooth patch about the size of a 10p coin on the right side of the crown. You cannot say what it is, for example alopecia areata. Even when you are fairly sure, the name of a condition is a diagnosis, and a wrong diagnosis from a trusted professional can delay the right care. Describe, record and refer instead.",
        },
        {
          type: "p",
          text: "This is not about being timid. Clients find it reassuring when you are confident about what you know and honest about where your knowledge stops. Saying that something is worth getting checked by a GP is a professional judgement, and a good one.",
        },
        { type: "h", text: "Who you refer to" },
        {
          type: "table",
          caption: "The main referral routes in the UK and Ireland",
          head: ["Who", "What they do", "When to suggest them"],
          rows: [
            [
              "GP (general practitioner)",
              "Medical assessment, blood tests, prescriptions, referral to a dermatologist on the NHS or HSE.",
              "Anything that may be medical: sudden or patchy loss, pain, signs of infection, suspicious lesions, symptoms elsewhere in the body, loss after a new medicine.",
            ],
            [
              "Community pharmacist",
              "Advice on over-the-counter products, including medicated shampoos and licensed hair loss treatments, and on whether to see a GP.",
              "Mild flaking or itch that has not settled with gentle care, questions about over-the-counter treatments.",
            ],
            [
              "Trichologist",
              "Specialist assessment of hair and scalp. A qualified trichologist, for example a member of the Institute of Trichologists, can take a detailed history, examine closely and work alongside the client's GP.",
              "Ongoing thinning or shedding, breakage, scalp conditions that keep returning, clients who want a specialist opinion before or alongside the GP.",
            ],
            [
              "Dermatologist",
              "A doctor specialising in skin, hair and nails. On the NHS and HSE this is usually by GP referral. Privately, some accept self-referral.",
              "You do not usually refer directly. You suggest the GP, who decides. Mention that a dermatologist exists when a client asks who treats scarring or persistent scalp disease.",
            ],
            [
              "NHS 111, out-of-hours GP or 999",
              "Urgent advice when the GP is closed. 999 or 112 is for emergencies.",
              "Rapidly spreading redness and swelling with fever, a client who seems very unwell, or a child you believe is in immediate danger.",
            ],
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Know your local trichologist before you need one",
          text: "Find one or two qualified trichologists near you this month. Check their membership, read how they work, and ask whether they are happy to receive referral notes from you. When a worried client is in your chair, you want a name and a number ready, not a search engine.",
        },
        { type: "h", text: "The hair growth cycle in plain words" },
        {
          type: "p",
          text: "You do not need to be an expert in follicle biology, but one idea will change how you talk to clients. Each hair grows in cycles, and each follicle is on its own timetable. At any time most of the hairs on the head are growing, a small number are in a short transition phase, and a minority are resting before they fall out. A normal adult loses somewhere in the region of 50 to 100 hairs a day, and more on wash days, because loose hairs that would have fallen gradually come out together.",
        },
        {
          type: "p",
          text: "The key point is the delay. When something unsettles the body, such as a high fever, surgery, childbirth, a crash diet or a very stressful event, a larger share of growing hairs can be switched into the resting phase at once. They do not fall out straight away. They fall out roughly two to three months later. So a client who says their hair started coming out in handfuls in March may have had flu in December. Asking about the last three to six months, not the last three weeks, is one of the most useful habits you can build.",
        },
        {
          type: "terms",
          items: [
            { term: "Anagen", meaning: "The growing phase of a hair. It lasts years on the scalp, which is why scalp hair can grow long. Most hairs on a healthy scalp are in anagen at any one time." },
            { term: "Catagen", meaning: "A short transition phase of a few weeks, when the hair stops growing and the follicle begins to shrink." },
            { term: "Telogen", meaning: "The resting phase. The hair stays in place for a few months and then sheds, usually as a new hair starts to grow beneath it. A shed telogen hair often has a small pale bulb at the root end." },
            { term: "Telogen effluvium", meaning: "A medical term for increased shedding, often diffuse across the whole scalp, that commonly follows a trigger such as illness, childbirth, surgery, stress or a change in medication by around two to three months. Only a clinician can decide whether this is what is happening." },
            { term: "Follicle", meaning: "The small structure in the skin that produces the hair. A healthy follicle can regrow hair. A follicle destroyed by scarring cannot." },
            { term: "Diffuse", meaning: "Spread across the whole scalp rather than in one patch or one area." },
          ],
        },
        { type: "h", text: "The five-minute scalp check" },
        {
          type: "p",
          text: "The check you will learn in this course takes about five minutes once you are practised. It fits into the start of every appointment, before you shampoo, apply colour or begin a treatment. The order matters. You ask before you look so the client feels involved, and you record before they leave so nothing is lost.",
        },
        {
          type: "steps",
          title: "The five-minute check at a glance",
          steps: [
            { title: "1. Ask (about one minute)", detail: "Ask what the client has noticed, whether anything has changed since you last saw them, and whether anything is sore, itchy or worrying them. Lesson 2 gives you the questions." },
            { title: "2. Look (about two minutes)", detail: "Part the hair in sections from front to back under good light. Look at the skin, the hair and the hairline, in the same order every time. Lesson 3 shows you how." },
            { title: "3. Check for red flags (seconds)", detail: "Ask yourself whether anything you have seen or heard is on the red flag list in Lesson 4. If it is, the service may need to change and a referral conversation follows." },
            { title: "4. Talk (about one minute)", detail: "Tell the client what you have seen in plain words, what you suggest for today, and whether you think they should see someone. Lessons 5 and 6 cover the words." },
            { title: "5. Record (about one minute)", detail: "Write it on the record card with the date. Add photos only with consent. If you referred, note what you said and to whom." },
          ],
        },
        {
          type: "template",
          title: "Five-minute scalp check: pocket checklist",
          body: "FIVE-MINUTE SCALP CHECK\nClient: ____________  Date: ________  Service today: ____________\n\n1. ASK (1 min)\n[ ] Anything you have noticed about your hair or scalp since last time?\n[ ] Any itch, soreness, burning or tenderness?\n[ ] More hair coming out than usual? Since when?\n[ ] Any illness, new medicine, pregnancy or birth, big stress or diet change in the last 6 months?\n[ ] Any reactions to products or services before?\n\n2. LOOK (2 min)\n[ ] Hairline: front, temples, behind ears, nape\n[ ] Parting: width at front compared with back\n[ ] Skin: colour, flaking (dry or greasy), redness, bumps, spots, sores, marks\n[ ] Hair: density, breakage, length differences, patches\n[ ] Signs of tension from styles, extensions or scarves\n\n3. RED FLAGS (seconds)\n[ ] Any red flag from the course list? If yes, adjust service and refer.\n\n4. TALK (1 min)\n[ ] Told the client what I saw, in plain words\n[ ] Agreed today's service, or changed it\n[ ] Suggested GP / pharmacist / trichologist if needed\n\n5. RECORD (1 min)\n[ ] Record card completed and dated\n[ ] Photos taken with written consent (or declined)\n[ ] Referral note given (if applicable)\n\nPractitioner initials: ______",
        },
        {
          type: "case",
          title: "The client who only wanted a trim",
          scenario: "Priya, 34, has fine straight hair and comes in every eight weeks for a trim and gloss. She is in a hurry and says she just wants the usual. As you comb through, more hair comes away in the comb than you remember, and her parting looks a little wider at the front. She does not mention it.",
          question: "Should you raise it, and how do you avoid turning a quick trim into an alarming conversation?",
          discussion: "Yes, raise it, gently and briefly. The five-minute check gives you a natural way in, because you ask every client whether they have noticed any changes. Priya may already be worried and relieved to be asked, or she may not have noticed. Describe what you see without naming a cause: you noticed a bit more hair in the comb than usual. Then ask the timeline question about the last few months. If she mentions a trigger such as illness or a new medicine, you can suggest she mentions the shedding to her GP. Record what you saw either way, so that next time you can compare.",
        },
        {
          type: "case",
          title: "Head spa, first visit",
          scenario: "Malcolm, 61, books a 90-minute head spa ritual as a birthday gift from his daughter. He has very short grey hair and thinning on the crown. During the scalp analysis with your magnifying camera, you see a pink, slightly raised patch on the crown with a small crusted area in the middle. He says it has been there for a while and sometimes bleeds when he scratches it.",
          question: "What do you do about today's treatment and what do you say?",
          discussion: "A sore that crusts, bleeds and does not heal, on a sun-exposed bald or thinning crown, is a red flag that should be seen by a GP. You do not know what it is, and you must not say. You avoid working over it: no exfoliation, steam directed at it, or massage across it, and you adapt the treatment or offer to rebook if the area is large. You tell Malcolm calmly that you have noticed a spot that has not healed and that this is something GPs like to look at, then suggest he books an appointment soon. You record the size and position, take a photo only with consent, and offer a short note he can take. Lesson 4 covers skin lesions in more detail.",
        },
        {
          type: "script",
          title: "Opening the consultation with every client",
          lines: [
            "Before we start, I always have a quick look at the scalp. It takes a few minutes and it means I can choose the right products for today.",
            "Have you noticed anything different about your hair or scalp since I last saw you?",
            "Is anything itchy, sore or tender anywhere?",
            "I'll part your hair in a few places and have a look under the light. Just tell me if anything feels uncomfortable.",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Make it routine, not a reaction",
          text: "If you only check the scalp when something looks wrong, clients will read the check itself as bad news. Do it for everyone, every time, in the same friendly way. Then when you do find something, the conversation starts from a place of routine rather than alarm.",
        },
        { type: "h", text: "Records, consent and data" },
        {
          type: "p",
          text: "Under UK GDPR and the Irish Data Protection Acts, a consultation record containing information about a client's health, such as hair loss, a scalp condition, medication or pregnancy, is special category personal data. That means you need a clear reason to hold it, you must keep it secure, you must tell clients what you record and why, and you should get explicit consent before recording health details or taking photographs. Photographs of a client's head are personal data even if the face is not shown.",
        },
        {
          type: "list",
          items: [
            "Tell clients what you write down, why, how long you keep it and who can see it. A short privacy notice at reception or on your booking page helps.",
            "Ask before taking any photo, explain what it is for, and record the consent. Clients can withdraw consent and ask for photos to be deleted.",
            "Store records and photos securely: a locked cabinet or a password-protected system, not a personal phone camera roll shared with family accounts.",
            "Share information with a clinician only with the client's agreement. The usual route is to give the referral note to the client to take with them.",
            "For clients under 16, have a parent or guardian present, get their consent for services, records and photos, and follow your insurer's rules for chemical services on young people.",
          ],
        },
        {
          type: "callout",
          tone: "scope",
          title: "Your record is a record, not a diagnosis",
          text: "Write what you saw and what the client told you. Do not write condition names, guesses at causes or labels such as stress alopecia. If a clinician later reads your card, they want your observations, dated and accurate, so they can draw their own conclusions.",
        },
      ],
      check: [
        {
          id: "l1-q1",
          prompt: "A client mentions that her hair started shedding heavily this month. Based on the hair growth cycle, which question is most useful?",
          options: [
            "Have you changed shampoo in the last week?",
            "Has anything significant happened to your health or life in the last three to six months?",
            "Do you brush your hair when it is wet?",
            "Does anyone in your family have thin hair?",
          ],
          answer: 1,
          explain: "Shedding after a trigger such as illness, childbirth, surgery or a big stress usually starts around two to three months later, so asking about the last three to six months is the most useful timeline question. Product changes and brushing habits can matter for breakage, but they rarely explain a sudden rise in shedding from the root.",
        },
        {
          id: "l1-q2",
          prompt: "Which of these statements is within a stylist's or head spa therapist's scope?",
          options: [
            "This looks like alopecia areata, so it should grow back.",
            "You have a fungal infection and need an anti-fungal shampoo.",
            "I can see a smooth round patch about the size of a 10p coin on your crown, and I'd suggest you show it to your GP.",
            "This is telogen effluvium from your stress, it will settle in six months.",
          ],
          answer: 2,
          explain: "Describing what you see, with size and position, and suggesting a GP is exactly your role. The other options name a condition or a cause, which is a diagnosis. Even if they turn out to be right, they are outside your scope and could delay the right care if they are wrong.",
        },
        {
          id: "l1-q3",
          prompt: "Why do you ask the client questions before you part the hair and look?",
          options: [
            "It is faster that way.",
            "Insurers require questions to be asked first.",
            "The questions replace the need to look closely.",
            "It involves the client, tells you where to look, and makes the check feel routine rather than alarming.",
          ],
          answer: 3,
          explain: "Asking first brings the client into the conversation and often tells you exactly where to look, such as a sore spot or a patch they have noticed. It also frames the check as part of the normal service. Questions never replace looking. You need both.",
        },
        {
          id: "l1-q4",
          prompt: "You want to photograph a client's thinning crown to compare at the next visit. What do you need first?",
          options: [
            "The client's explicit consent, with an explanation of how the photo will be stored and used.",
            "Nothing, because the face is not in the photo.",
            "A GP's permission.",
            "Verbal agreement only if the client is over 25.",
          ],
          answer: 0,
          explain: "A photo of a client's head is personal data, and when it shows a health concern such as hair loss it is special category data. Ask first, explain what it is for and how you will store it, record the consent, and honour any request to delete it later.",
        },
      ],
      reflection:
        "Think about the last month of appointments. Was there a client whose scalp or hair you noticed something about but did not mention? What stopped you, and what would you say now?",
      takeaways: [
        "You are often the first person to notice a scalp change, so a routine five-minute check at every appointment matters.",
        "Your role is to observe, record, advise within your discipline and refer. Naming a condition or its cause is a diagnosis and is outside your scope.",
        "Shedding often starts two to three months after a trigger, so always ask about the last three to six months.",
      ],
    },

    // ------------------------------------------------------------------
    // Lesson 2
    // ------------------------------------------------------------------
    {
      slug: "questions-that-help",
      title: "Questions that help",
      detail:
        "The questions that give you a useful history in a minute, how to ask about health without prying, and how to listen for the answers that matter.",
      minutes: 30,
      objectives: [
        "Use open questions to find out what the client has noticed, when it started and how it has changed.",
        "Ask about health, medicines, pregnancy and life events in a respectful way that clients are comfortable answering.",
        "Ask about styling, chemical history and tension in a way that does not sound like blame.",
        "Recognise answers that point towards a referral, including symptoms elsewhere in the body.",
        "Adapt your questions for children, teenagers and clients who find the topic distressing.",
      ],
      blocks: [
        {
          type: "p",
          text: "The questions you ask in the first minute often tell you more than anything you see. A small patch of thinning means one thing in a client who has worn tight braids for ten years and something quite different in a client who noticed it two weeks ago with a sore, burning scalp. Good questions turn what you see into a story you can record and pass on.",
        },
        {
          type: "p",
          text: "You are not taking a medical history in the way a doctor does. You are asking what a careful, caring professional needs to know to choose a safe service, give sensible advice and decide whether to suggest someone else takes a look. Keep that purpose in mind and your questions will sound natural rather than intrusive.",
        },
        { type: "h", text: "Start open, then narrow down" },
        {
          type: "p",
          text: "Open questions invite the client to tell you what matters to them. Closed questions, which can be answered yes or no, are useful later to fill in the details. If you start with a closed question such as is your hair falling out, you often get a defensive no. If you start with what have you noticed about your hair lately, you get the story in the client's own words.",
        },
        {
          type: "table",
          caption: "Open and closed questions in a scalp consultation",
          head: ["Use for", "Open question", "Closed follow-up"],
          rows: [
            ["The main concern", "What have you noticed about your hair or scalp lately?", "Is it the shedding or the thinning that bothers you most?"],
            ["Timeline", "When did you first notice it, and how has it changed since?", "Is it getting worse, staying the same or getting better?"],
            ["Where", "Where on your head do you notice it most?", "Is it all over, or mainly at the front, top or one patch?"],
            ["Symptoms", "How does your scalp feel day to day?", "Any itching, burning, soreness or tenderness?"],
            ["Triggers", "Has anything changed for you in the last six months or so?", "Any illness, operation, new medicine, pregnancy or big stress?"],
            ["Styling", "Tell me about how you usually wear your hair.", "Do you wear braids, extensions, a tight bun or a fitted scarf most days?"],
          ],
        },
        { type: "h", text: "The six areas to cover" },
        {
          type: "steps",
          title: "A one-minute history",
          steps: [
            { title: "What", detail: "What has the client noticed? Shedding (hair coming out from the root, in the shower or on the pillow) is different from breakage (short broken pieces) and from thinning (less coverage, wider parting, more scalp showing). Ask them to describe it." },
            { title: "When and how fast", detail: "When did it start? Was it sudden or gradual? Weeks, months or years? Is it still changing? Rapid change is more significant than slow change." },
            { title: "Where", detail: "All over, the parting, the front hairline, the temples, the crown, one or more patches, the eyebrows or eyelashes, or body hair too?" },
            { title: "How it feels", detail: "Itch, soreness, burning, tenderness, tightness, or nothing at all. Pain and burning are important, because many common hair changes are painless." },
            { title: "What else is going on", detail: "Recent illness, operation, childbirth, weight loss, new or changed medicines, stress, and symptoms elsewhere such as unusual tiredness or feeling the cold." },
            { title: "Hair history", detail: "Colour, bleach, relaxers, perms, keratin treatments, heat, extensions, braids, weaves, wigs, tight styles and head coverings. What has the client tried already, and did it help?" },
          ],
        },
        { type: "h", text: "Asking about health without prying" },
        {
          type: "p",
          text: "Clients are usually happy to share health information when they understand why you are asking. Explain the reason once, make it clear they do not have to answer, and move on lightly. Avoid long pauses, raised eyebrows or comments on what they tell you. You are gathering information, not judging it.",
        },
        {
          type: "script",
          title: "Asking about health and life events",
          lines: [
            "Hair often reacts to things that happened a few months back, so I always ask a couple of health questions. You don't have to answer anything you'd rather not.",
            "In the last six months or so, have you been unwell, had an operation, or had a baby?",
            "Have you started or changed any medicines, including the pill, HRT or anything from the pharmacy?",
            "Has life been particularly stressful, or have you changed how you eat, for example a big diet or going vegetarian or vegan?",
            "Have you noticed anything else about how you feel generally, such as being more tired than usual, feeling the cold, or changes in weight?",
            "Thank you, that's really helpful. I'll make a note so I can keep an eye on things with you.",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Never comment on medicines",
          text: "If a client tells you their shedding started after a new medicine, do not suggest they stop it or switch, and do not say the medicine caused it. Suggest they mention the timing to their GP or pharmacist, who can review it safely. Stopping some medicines suddenly can be dangerous.",
        },
        { type: "h", text: "Answers that point to the GP" },
        {
          type: "p",
          text: "Some answers suggest that something in the body as a whole may be affecting the hair. You are not going to work out what. Your job is to recognise that the answer belongs to a doctor and to say so kindly.",
        },
        {
          type: "table",
          caption: "Answers worth passing to the GP",
          head: ["What the client tells you", "Why it matters", "What you can say"],
          rows: [
            ["Shedding plus tiredness, breathlessness, pale skin, or heavy periods", "These can go with low iron, which a GP can check with a blood test.", "It might be worth mentioning the shedding and the tiredness to your GP together. They can decide whether any tests would help."],
            ["Shedding plus feeling unusually cold or hot, weight change without trying, a racing heart or very dry skin", "These can go with thyroid changes, which a GP can check.", "Those other things you've mentioned are worth telling your GP about along with your hair."],
            ["Heavy shedding starting two to four months after giving birth", "Shedding after childbirth is common and often settles, but a GP or health visitor can check iron and thyroid if the client feels unwell or it does not settle.", "Lots of people notice this a few months after having a baby. If you're worried, or you're feeling run down, your GP or health visitor is a good person to ask."],
            ["Hair loss that started after a new medicine", "Some medicines can affect hair. Only a prescriber can review that.", "It would be worth mentioning the timing to your GP or pharmacist. Please don't stop anything without talking to them first."],
            ["Unexplained weight loss, fevers, night sweats, or feeling generally unwell with rapid shedding", "Shedding alongside systemic symptoms needs medical assessment.", "With everything else you've described, I'd really encourage you to see your GP soon."],
            ["Increased facial or body hair, irregular periods, or adult acne with thinning on top", "These can point to hormonal changes a GP can assess.", "Your GP would be the right person to talk to about all of that together."],
          ],
        },
        {
          type: "callout",
          tone: "scope",
          title: "Pass on the pattern, not a theory",
          text: "You may know that tiredness and shedding together can go with low iron. Do not say that to the client as an explanation. Say that the shedding and the tiredness are worth mentioning to the GP together. The GP decides what to test and what it means.",
        },
        { type: "h", text: "Asking about styling without blame" },
        {
          type: "p",
          text: "Questions about tight styles, relaxers or bleach can sound like an accusation, especially for clients with Afro-textured hair who may have heard unhelpful comments about their hair from professionals before. Many clients have worn protective styles since childhood and have good reasons for their choices. Ask with genuine curiosity and respect, and make it clear you are asking about every client.",
        },
        {
          type: "script",
          title: "Asking about styles and chemical history",
          lines: [
            "Tell me how you usually wear your hair day to day, and what you've had done over the last year or two.",
            "Do you wear braids, twists, locs, extensions, weaves or wigs? How long do you usually keep them in?",
            "When styles are first put in, do they ever feel tight, sore or bumpy around the edges?",
            "Have you had any relaxers, texturisers, keratin smoothing, colour or bleach? Roughly when was the last one?",
            "Do you wear a hijab, a tight underscarf, a sports headband or a cap most days?",
          ],
        },
        {
          type: "p",
          text: "Pay attention to answers such as it always feels tight for the first few days, I get little spots along my edges after braiding, or I've always had a scarf pinned tightly at the front. These describe tension, which over time can damage follicles at the hairline. Early tension damage often improves when the tension is reduced. Long-standing damage may not. Lesson 3 covers what to look for, and Lesson 6 covers how to talk about it.",
        },
        {
          type: "case",
          title: "The edges that keep receding",
          scenario: "Amara, 27, has Afro-textured hair and has worn knotless braids, refreshed every six to eight weeks, since she was a teenager. She asks you to install a new set and mentions in passing that her edges have been getting thinner for a couple of years. When you ask, she says new braids feel tight for about a week and she sometimes gets small bumps along her hairline.",
          question: "What else would you want to ask, and what would you record?",
          discussion: "Ask whether the thinning is only at the front and sides or anywhere else, whether her scalp is sore or itchy between installs, whether she has noticed any patches on the crown, and whether she gives her hair rest periods between styles. Record her own words about tightness and bumps, the length of time she has worn the style, and what you see at the hairline. You do not tell Amara she has traction alopecia. You can talk about tension and how to reduce it within your services, and suggest a trichologist if thinning continues, or the GP if she has soreness, pustules or patches on the crown. You might also adapt today's install, for example with lighter, looser braids and avoiding the most fragile edges.",
        },
        { type: "h", text: "Questions for children and teenagers" },
        {
          type: "p",
          text: "With clients under 16, a parent or guardian should be present and should give consent for the service, any records and any photos. Speak to the young person directly as well as to the adult. Children often know exactly where it itches or hurts. Keep questions simple and practical.",
        },
        {
          type: "list",
          items: [
            "Does your head feel itchy, sore or hot anywhere? Can you show me where?",
            "Has anyone else at home or school had an itchy head or patches recently?",
            "Have you been unwell lately?",
            "To the parent: when did you first notice this, and has it changed? Has your child seen the GP about it?",
          ],
        },
        {
          type: "case",
          title: "A boy with a scaly patch",
          scenario: "A mother brings her son Kofi, 7, for a short cut. When you clipper the back, you notice a round, scaly patch of broken hairs about the size of a 50p coin, and a couple of small lumps in the skin behind his ear. His mother says it has been itchy for a few weeks and his cousin had something similar.",
          question: "What do you ask, and what do you do with the clippers?",
          discussion: "Ask how long it has been there, whether it is spreading, whether it is sore, and whether Kofi has seen the GP. Do not name it, but recognise that a scaly patch of broken hairs in a child, especially with a similar case in the family, needs a GP to look at it, and that some scalp infections in children spread easily on shared combs and clippers. Stop cutting over the area, finish the cut only if you can avoid the patch, and suggest the GP soon. Afterwards, clean and disinfect the clippers, guards, combs and capes according to your hygiene procedure before the next client. Record what you saw and what you advised.",
        },
        { type: "h", text: "When the topic is upsetting" },
        {
          type: "p",
          text: "Hair loss can be deeply distressing. Some clients cry, some go quiet, and some joke to cover their worry. Slow down, lower your voice, and give them a choice about whether to talk now. Never minimise with phrases such as it's only hair or everybody loses hair. Do not offer hope you cannot back up, such as it will definitely grow back.",
        },
        {
          type: "script",
          title: "When a client is upset",
          lines: [
            "I can see this has been really worrying you. Thank you for telling me.",
            "We can talk about it now, or I can just get on with your hair and we can talk at the end. Whatever feels right for you.",
            "I can't tell you what's causing it, but I can tell you exactly what I see, and I can help you work out who the best person is to look at it properly.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Write down their words",
          text: "When a client describes their concern, write their own words on the record card in quotation marks, for example 'handfuls in the shower since February'. A clinician reading your note later will find the client's own description more useful than your summary of it.",
        },
        {
          type: "terms",
          items: [
            { term: "Shedding", meaning: "Hair coming out from the root, often with a small white bulb at the end. Seen in the shower, on the pillow or in the brush." },
            { term: "Breakage", meaning: "Hair snapping along its length, leaving short pieces without a bulb. Often linked to chemical processing, heat or mechanical stress." },
            { term: "Thinning", meaning: "Less hair coverage, for example a wider parting or more scalp showing. Thinning can happen without obvious shedding." },
            { term: "History", meaning: "The information a client gives you about their concern, its timeline and anything relevant. In this course it means a short, focused history, not a medical one." },
            { term: "Systemic symptoms", meaning: "Symptoms affecting the body as a whole, such as fever, weight loss, extreme tiredness or feeling generally unwell. Shedding with systemic symptoms is a reason to suggest the GP." },
            { term: "Protective style", meaning: "A style, such as braids, twists, locs or wigs, worn partly to reduce daily handling of Afro-textured or curly hair. It can be gentle or can cause tension, depending on how it is installed and worn." },
          ],
        },
      ],
      check: [
        {
          id: "l2-q1",
          prompt: "Which opening question is most likely to give you a useful answer?",
          options: [
            "Is your hair falling out?",
            "You've been losing hair, haven't you?",
            "Are you using the shampoo I recommended?",
            "What have you noticed about your hair or scalp lately?",
          ],
          answer: 3,
          explain: "An open question lets the client describe the concern in their own words and often tells you where to look. Closed or leading questions can make clients defensive and may miss the thing they are most worried about.",
        },
        {
          id: "l2-q2",
          prompt: "A client says her hair started shedding a few weeks after she began a new medicine. What do you say?",
          options: [
            "That medicine is known to cause hair loss, so ask your GP to change it.",
            "It would be worth mentioning the timing to your GP or pharmacist. Please don't stop anything without talking to them first.",
            "Stop taking it for a month and see whether the shedding settles.",
            "Medicines don't usually affect hair, so it is probably stress.",
          ],
          answer: 1,
          explain: "You pass on the timing and leave the medical judgement to the prescriber. Suggesting a cause, a change or stopping a medicine is outside your scope and could be harmful.",
        },
        {
          id: "l2-q3",
          prompt: "A client with shedding also tells you she is exhausted, short of breath on the stairs and has very heavy periods. What is the best response?",
          options: [
            "You are probably low in iron, so try an iron supplement.",
            "Try a protein treatment and see me in six weeks.",
            "It might be worth mentioning the shedding and the tiredness to your GP together. They can decide whether any tests would help.",
            "This is normal for your age.",
          ],
          answer: 2,
          explain: "Shedding with symptoms elsewhere in the body is a reason to suggest the GP. You pass on the pattern without offering a theory or recommending supplements, which could mask a problem or be unsuitable.",
        },
        {
          id: "l2-q4",
          prompt: "Why is it useful to ask a braided client whether new installs feel tight or cause bumps along the hairline?",
          options: [
            "Because those answers describe tension, which over time can damage follicles at the hairline.",
            "Because braids should never be worn.",
            "Because bumps always mean an infection.",
            "Because it allows you to diagnose traction alopecia.",
          ],
          answer: 0,
          explain: "Tightness and bumps after installation describe tension. Recording them helps you adapt the service and advise on gentler styling. It does not mean braids are wrong, and naming a condition is still outside your scope.",
        },
      ],
      reflection:
        "Write down the questions you currently ask at the start of an appointment. Which of the six areas in this lesson do you tend to miss, and how will you add them without making the consultation feel longer?",
      takeaways: [
        "Start with open questions, then use closed ones to fill in what, when, where, how it feels, what else is going on and hair history.",
        "Shedding alongside symptoms elsewhere in the body, or after a new medicine, is passed to the GP as a pattern, never as your explanation.",
        "Ask about styling and chemical history with curiosity and respect, and write down the client's own words.",
      ],
    },

    // ------------------------------------------------------------------
    // Lesson 3
    // ------------------------------------------------------------------
    {
      slug: "looking-closely",
      title: "Looking closely",
      detail:
        "A systematic way to examine the scalp, hair and hairline, how to describe what you see in words a clinician can use, and the record card to write it on.",
      minutes: 35,
      objectives: [
        "Prepare your light, tools and hygiene so you can see the scalp clearly and safely.",
        "Examine the scalp, hair and hairline in the same systematic order every time.",
        "Describe the position, size, colour, texture and pattern of what you see in neutral, accurate words.",
        "Recognise how scalp signs can look different on darker skin and on Afro-textured hair.",
        "Complete a consultation record card that a clinician could read and act on.",
      ],
      blocks: [
        {
          type: "p",
          text: "Looking closely is a skill, and like any skill it improves with a routine. Most missed findings are not missed because the practitioner did not know what they were looking at. They are missed because the practitioner looked in one place, found something ordinary such as product build-up, and stopped. A fixed order means you look everywhere, every time, and you can describe what you saw in a way that is useful later.",
        },
        { type: "h", text: "Set up before you start" },
        {
          type: "list",
          items: [
            "Light: use bright, even, white light. Natural daylight from a window or a daylight-balanced lamp is best. Warm salon lighting hides redness and makes scale hard to see.",
            "Magnification: a handheld magnifier or a scalp camera is helpful. Use it to look, not to impress. Magnified images can look alarming to clients, so think about what you show and say.",
            "Tools: a clean tail comb or sectioning clips, and a clean wide-tooth comb for textured hair. Keep a separate set for any client whose scalp looks inflamed, infected or infested, and disinfect afterwards.",
            "Hands: wash or sanitise before and after. Wear disposable gloves if the skin is broken, weeping, crusted or if you suspect infestation.",
            "Dry hair: examine before shampooing. Washing removes scale and build-up you need to see, and wet hair clumps and hides the scalp.",
          ],
        },
        { type: "h", text: "The systematic look" },
        {
          type: "steps",
          title: "Front to back, outside to inside",
          steps: [
            { title: "1. Stand back first", detail: "Look at the whole head from the front, both sides and behind, at normal conversation distance. Notice overall density, symmetry, the shape of the front hairline and any obvious patches before you get close." },
            { title: "2. The hairline", detail: "Work around the edge: centre front, temples, above and behind the ears, the nape. Look at the line itself, the skin just inside it, and whether the hairs at the edge are shorter, finer or broken. Glance at the eyebrows too." },
            { title: "3. The parting", detail: "Make a centre parting from front to crown. Compare how wide it looks at the front with how wide it looks further back. Then make parallel partings about two centimetres apart on each side." },
            { title: "4. The crown and back", detail: "Part through the crown and down the back to the nape in sections. The crown is easy to skip because clients rarely see it themselves." },
            { title: "5. Up close at each parting", detail: "At each parting, look at the skin (colour, scale, spots, marks), the openings of the follicles, and the hairs themselves (thickness, length, breakage)." },
            { title: "6. Touch, gently and with permission", detail: "Ask whether anywhere is sore before you touch. Note any area that is tender, hot, lumpy or boggy, and do not press on it." },
          ],
        },
        { type: "h", text: "What to look at on the skin" },
        {
          type: "table",
          caption: "Describing what you see on the scalp skin",
          head: ["Feature", "What to note", "Neutral words to use"],
          rows: [
            ["Colour", "Is the skin its usual colour for this client, or redder, darker, paler or shinier? Is it the same all over?", "Pink, red, darker than surrounding skin, paler, shiny, even, patchy"],
            ["Scale (flaking)", "Size of flakes, colour, whether dry or greasy, whether stuck down or loose, and where.", "Fine white loose flakes; larger yellowish greasy flakes; thick silvery-white scale stuck to the skin; scale extending beyond the hairline"],
            ["Around each follicle", "Redness, scale or a ring around individual hairs.", "Redness around the hairs; scale collars around the hairs"],
            ["Spots and bumps", "Size, number, whether they contain pus, whether centred on a hair.", "Small raised red bumps; small yellow-headed spots around hairs; a single larger lump"],
            ["Crusts, sores, weeping", "Any broken or open skin, crusting, or fluid.", "Crusted area about 1 cm; open sore; weeping"],
            ["Texture and smoothness", "Areas where the skin looks smooth and shiny, with no visible follicle openings.", "Smooth shiny patch with no visible hair openings"],
            ["Marks and lesions", "Moles, raised spots, rough patches, colour changes.", "Brown flat mark about 5 mm with an uneven edge; pink rough patch"],
            ["Debris", "Product build-up, dry shampoo, lint, or tiny specks attached to hairs close to the scalp.", "Product residue; small oval specks attached to hair shafts close to the scalp"],
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Redness looks different on darker skin",
          text: "On black and brown skin, inflammation may look purple, grey, dark brown or simply darker than the surrounding skin rather than pink or red. Previous inflammation can leave darker patches that last for months. Compare the area with the client's normal scalp skin elsewhere, ask whether it is itchy or sore, and describe what you see in your own words rather than writing no redness because you did not see pink.",
        },
        { type: "h", text: "What to look at in the hair" },
        {
          type: "list",
          items: [
            "Density: how much scalp shows through. Compare front with back and centre with sides.",
            "Thickness of individual hairs: are some hairs much finer and shorter than their neighbours? A mix of thick and fine hairs in one area can be worth recording.",
            "Breakage: short broken lengths, split or frayed ends, hairs that snap easily, particularly in chemically processed hair. Note where along the hair it breaks.",
            "Length pattern: hairs broken at different lengths in an irregular patch, or very short hairs at the edge of a patch.",
            "Patches: any area with no hair or much less hair. Note shape (round, oval, irregular), size, edges (sharp or blurred), and the skin inside it.",
            "Shedding during the service: note roughly how much hair comes away during gentle combing or shampooing compared with your usual experience of this client.",
          ],
        },
        {
          type: "callout",
          tone: "scope",
          title: "About the hair pull test",
          text: "Clinicians sometimes perform a hair pull test, gently pulling a small bundle of hairs to see how many come away, as part of their assessment. It is a diagnostic test, and its result means little without clinical training. Do not perform it or describe what you do as a test. Instead, record what you naturally observe, for example noticeably more hair in the comb and basin than at the last visit.",
        },
        { type: "h", text: "Patterns you may notice" },
        {
          type: "p",
          text: "You will start to notice that hair loss often follows recognisable shapes. Knowing these shapes helps you describe what you see accurately. It does not mean you can say what is causing them, because different conditions can look alike and some clients have more than one thing happening at once.",
        },
        {
          type: "table",
          caption: "Patterns to describe, not diagnose",
          head: ["What you see", "How to record it"],
          rows: [
            ["Parting wider at the front and top than at the back, with the front hairline kept", "Widening of centre parting at front and crown; front hairline intact. Clinicians sometimes grade this using the Ludwig or Sinclair scales."],
            ["Recession at both temples and thinning on the crown, usually in men", "Temple recession both sides; thinning at crown. Clinicians sometimes grade this using the Norwood scale."],
            ["Thinning even across the whole scalp, with lots of shedding", "Diffuse thinning; client reports increased shedding since (date)."],
            ["One or more smooth round or oval patches with normal-looking skin", "Smooth round patch approx 2 cm, right parietal; skin looks normal colour; short hairs at the edge."],
            ["A band of hairline moving back evenly across the forehead, sometimes with eyebrow thinning", "Front hairline set back evenly by approx 2 cm compared with old photo; skin in the band paler and smooth; eyebrows sparse."],
            ["Thinning at the edges along the line of a hairstyle", "Thinning at temples and front hairline matching the line of braids; short fine hairs remain along the margin."],
            ["Thinning that starts in the centre of the crown and spreads outward", "Thinning centred on the vertex, roughly 5 cm across; client reports tenderness; skin in the centre smoother."],
            ["Irregular patch with broken hairs of many different lengths", "Irregular patch approx 4 cm, left side above the ear; hairs broken at different lengths; skin looks normal."],
          ],
        },
        {
          type: "callout",
          tone: "redflag",
          title: "Smooth, shiny skin in a patch",
          text: "If the skin inside a patch looks smooth and shiny and you cannot see the small openings where hairs would normally grow, record it carefully and suggest the client sees their GP soon, asking for assessment of possible scarring. Scarring hair loss is permanent once established, and early specialist care can help protect the remaining hair.",
        },
        { type: "h", text: "Describing position and size" },
        {
          type: "p",
          text: "A clinician needs to be able to find what you found. Use simple anatomical areas and measure rather than estimate where you can. A small paper ruler in your consultation kit costs nothing.",
        },
        {
          type: "list",
          items: [
            "Frontal: the front of the head, behind the front hairline.",
            "Temporal: the temples, above and in front of the ears.",
            "Vertex or crown: the top and back of the top, where the hair often whorls.",
            "Parietal: the sides of the top of the head, between the temples and the crown. Always say left or right, meaning the client's left or right.",
            "Occipital: the back of the head, above the nape.",
            "Nape: the lowest part of the back of the head, at the neck.",
            "Size: measure in millimetres or centimetres. If you must compare, use a coin and name it, for example about the size of a 10p coin.",
          ],
        },
        {
          type: "terms",
          items: [
            { term: "Androgenetic alopecia", meaning: "The medical name for common patterned hair loss in men and women, often called male or female pattern hair loss. It is gradual and usually affects the top and front while the back and sides are kept. Only a clinician can diagnose it." },
            { term: "Ludwig and Norwood scales", meaning: "Picture scales clinicians use to grade patterned thinning. Ludwig (and the similar Sinclair scale) describes widening of the parting on top in women. Norwood describes temple recession and crown thinning in men. You may hear these names, but you describe what you see in plain words." },
            { term: "Alopecia areata", meaning: "A condition in which the immune system affects hair follicles, often causing smooth round patches. The skin usually looks normal and hair can regrow. Only a clinician can diagnose it." },
            { term: "Exclamation-mark hairs", meaning: "Very short hairs, often at the edge of a smooth patch, that are thicker at the tip and taper towards the scalp, a bit like an exclamation mark. Record them if you see them." },
            { term: "Scarring (cicatricial) alopecia", meaning: "A group of conditions in which inflammation destroys hair follicles and replaces them with scar tissue, so hair cannot regrow there. Skin may look smooth and shiny without follicle openings. Early specialist care matters." },
            { term: "Frontal fibrosing alopecia (FFA)", meaning: "A form of scarring hair loss that typically causes the front hairline to move back in a band, sometimes with eyebrow loss. It is most often seen in women after the menopause, though not only then." },
            { term: "CCCA (central centrifugal cicatricial alopecia)", meaning: "A form of scarring hair loss that starts at the centre of the crown and spreads outwards. It is seen most often in women of African descent. Early signs may include tenderness, itch or breakage at the crown." },
            { term: "Perifollicular erythema", meaning: "Redness around individual hair follicles. On darker skin it may look darker or violet rather than red. It can be a sign of inflammation that a clinician would want to see." },
            { term: "Seborrhoeic dermatitis", meaning: "A common scalp condition with greasy yellowish scale and redness, which can also affect the eyebrows, sides of the nose and behind the ears. Only a clinician can diagnose it." },
            { term: "Psoriasis", meaning: "A skin condition that can cause thick, well-defined, silvery-white scaly patches on the scalp, often extending beyond the hairline onto the forehead, behind the ears or the nape. Only a clinician can diagnose it." },
          ],
        },
        {
          type: "case",
          title: "Flakes, or something else?",
          scenario: "Janet, 45, has shoulder-length highlighted hair. She asks for an anti-dandruff treatment. At the partings you see thick, silvery-white scale stuck firmly to the skin in several well-defined patches, and a patch extends about a centimetre onto her forehead below the hairline and behind both ears. She says it has been on and off for years and her elbows get dry too.",
          question: "How do you record this, and does it change today's colour service?",
          discussion: "Record what you see without naming it: thick silvery-white adherent scale in well-defined patches at the crown and both parietal areas, extending about 1 cm beyond the front hairline and behind both ears; client reports similar on elbows, on and off for years. Because the description and the dry patches elsewhere suggest something more than ordinary flaking, suggest Janet asks her GP or pharmacist about it if she has not already. For colour, follow the manufacturer's instructions on not applying to broken, inflamed or irritated skin. If the scalp is cracked, sore or inflamed today, do not colour on scalp; offer an off-scalp technique or rebook. Do not pick or scrape the scale.",
        },
        {
          type: "case",
          title: "The crown that feels tender",
          scenario: "Grace, 52, has relaxed Afro-textured hair and has had a relaxer every eight weeks for over twenty years. She mentions her crown has been tender and itchy for about a year and the hair there breaks easily. At the vertex you see an area about 6 cm across where the hair is noticeably sparser, the hairs are short and broken, and the skin in the centre looks smoother and slightly shinier than elsewhere.",
          question: "What do you record, what happens to today's relaxer, and what do you suggest?",
          discussion: "Tenderness, itch and thinning centred on the crown that is spreading, with smoother skin in the centre, should be seen by a clinician soon, because some forms of scarring hair loss begin this way and early care matters. Record size, position, the appearance of the skin and Grace's own description. Do not relax over a tender or inflamed scalp. Explain that you would rather not apply a chemical service to an area that is sore, and agree a gentler alternative for today. Suggest she sees her GP, asking about referral to a dermatologist, or a qualified trichologist who will liaise with her GP. Offer a referral note. Avoid language that blames her relaxer use, because you do not know the cause.",
        },
        {
          type: "case",
          title: "Tiny specks near the scalp",
          scenario: "Sophie, 12, comes in with her dad for a trim. Her scalp is itchy. Behind her ears and at the nape you see tiny oval specks firmly attached to the hair shafts close to the scalp. They do not brush away like flakes.",
          question: "What do you do?",
          discussion: "Specks that are firmly attached to the hair and do not move like scale can be signs of head lice. Stay calm and discreet. Stop the service, speak privately to her dad, explain what you have seen, and suggest the pharmacist, who can advise on treatment. Follow your salon's infestation policy, which usually means rebooking once the problem is treated. Clean and disinfect tools, capes and the chair, and launder towels. Never make Sophie feel ashamed, and never discuss it in front of other clients.",
        },
        {
          type: "script",
          title: "Explaining what you are doing while you look",
          lines: [
            "I'm just going to make a few partings and have a look at the skin. Let me know if anywhere feels sore.",
            "Your scalp looks a little flaky here at the front, and there's some product sitting on it, which is really common.",
            "I can see a small area on the crown where the hair is a bit finer. I'm going to measure it so we can compare next time.",
            "Would you be happy for me to take a photo of this area for your record? It stays on our secure system and you can ask us to delete it at any time.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Photographs that are actually useful",
          text: "With consent, take photos in the same light, from the same angle and at the same distance each time, with the hair parted in the same place. Include a small paper ruler for scale. Label each photo with the date and area. A consistent series is worth far more than one dramatic close-up.",
        },
        {
          type: "template",
          title: "Scalp consultation record card",
          body: "SCALP CONSULTATION RECORD\n\nClient name: ____________________  Date of birth: ___________\nDate: ___________  Practitioner: ___________  Service: ______________\nUnder 16? [ ] Yes, parent/guardian present: ____________________\n\nCONSENT\n[ ] Client agrees to health information being recorded for their care\n[ ] Photos: [ ] consent given  [ ] declined   Areas photographed: ________\n\nCLIENT'S CONCERN (their own words)\n\"________________________________________________\"\nStarted: ___________  Sudden / gradual   Getting worse / same / better\nWhere: __________________________________________\nFeels: [ ] fine [ ] itchy [ ] sore/tender [ ] burning [ ] tight\n\nRELEVANT HISTORY (as told by client)\nIllness / operation / pregnancy or birth in last 6 months: __________\nNew or changed medicines (client's words, no advice given): __________\nOther symptoms mentioned: ____________________________________\nChemical services in last 12 months: _________________________\nStyles / extensions / head coverings / tension: _________________\nPrevious reactions or patch test results: ______________________\n\nOBSERVATIONS (describe, do not name conditions)\nHairline (front, temples, ears, nape): _______________________\nParting front vs back: _____________________________________\nCrown: _____________________________________________________\nSkin colour / redness / darker areas: _________________________\nScale (type, colour, where): _________________________________\nSpots, crusts, sores, lumps, marks (size, position): ___________\nPatches (shape, size, position, skin inside, edges): ____________\nHair (density, breakage, length differences, shedding seen): ____\nTender areas (client reported): _______________________________\n\nRED FLAGS\n[ ] None seen  [ ] Yes: ______________________________________\n\nOUTCOME\nService today: [ ] as planned [ ] adapted: ____ [ ] postponed: ____\nAdvice given (within scope): __________________________________\nReferral suggested: [ ] GP [ ] pharmacist [ ] trichologist [ ] NHS 111/urgent  [ ] none\nReferral note given: [ ] yes [ ] no\nClient response: ___________________________________________\nReview at next visit: [ ] yes   Date: ___________\n\nPractitioner signature: ______________",
        },
        {
          type: "callout",
          tone: "scope",
          title: "Scalp cameras and analysis reports",
          text: "Some scalp cameras and apps produce scores or labels such as sensitive scalp or hair loss stage. Treat these as prompts to look, not as findings. Do not pass on an automated label to the client as if it were a diagnosis, and do not use one to sell a course of treatment for a problem that may need medical care.",
        },
      ],
      check: [
        {
          id: "l3-q1",
          prompt: "Why should you examine the scalp before shampooing?",
          options: [
            "Because wet hair is more likely to break.",
            "Because shampoo removes scale and build-up you need to see, and wet hair clumps and hides the scalp.",
            "Because insurers forbid examining wet hair.",
            "Because the client is more relaxed before the shampoo.",
          ],
          answer: 1,
          explain: "Shampooing can wash away the very signs you are looking for, such as scale, debris and crusting. Wet hair also clumps together, making the skin and parting hard to assess.",
        },
        {
          id: "l3-q2",
          prompt: "On a client with dark brown skin, you see an area at the crown that looks darker and slightly purple compared with the rest of her scalp. She says it is itchy. How should you record it?",
          options: [
            "No redness seen.",
            "Normal pigmentation.",
            "Psoriasis.",
            "Area at vertex approx 3 cm, darker and slightly purple compared with surrounding scalp; client reports itch.",
          ],
          answer: 3,
          explain: "Inflammation can look purple, grey or darker on black and brown skin rather than red. Describe what you see compared with the client's own skin, add what she tells you, and do not name a condition.",
        },
        {
          id: "l3-q3",
          prompt: "Which is the best description for a record card?",
          options: [
            "Smooth round patch approx 2 cm on the right parietal area; skin normal colour; short hairs at the edge that taper towards the scalp.",
            "Alopecia areata, right side.",
            "Small bald bit, probably stress.",
            "Patch on the side, not too bad.",
          ],
          answer: 0,
          explain: "A good description gives shape, size, position (with left or right), the appearance of the skin and any notable hairs. It contains no diagnosis and no guess at a cause, so a clinician can find it and draw their own conclusions.",
        },
        {
          id: "l3-q4",
          prompt: "A client asks you to do a hair pull test like the one she saw on social media. What do you do?",
          options: [
            "Perform it and tell her whether the result is normal.",
            "Perform it but do not tell her the result.",
            "Explain that it is a test clinicians use as part of an assessment, and instead note what you see naturally, such as how much hair comes away during combing.",
            "Refuse to discuss shedding at all.",
          ],
          answer: 2,
          explain: "The pull test is a diagnostic tool and its result needs clinical interpretation. You can still record useful observations, such as shedding during the service, and suggest a trichologist or GP if she is concerned.",
        },
      ],
      reflection:
        "Next time you are at work, examine three scalps using the full front-to-back routine and fill in the record card for each. What did the routine help you notice that you might have missed before?",
      takeaways: [
        "Look in the same order every time, under good light and before shampooing: stand back, hairline, partings, crown and back, then up close.",
        "Describe shape, size, position, colour and texture in neutral words, comparing darker skin with the client's own normal skin.",
        "Smooth shiny skin without visible follicle openings in a patch is a reason to suggest the GP soon.",
      ],
    },

    // ------------------------------------------------------------------
    // Lesson 4
    // ------------------------------------------------------------------
    {
      slug: "red-flags",
      title: "Red flags",
      detail:
        "The signs and stories that mean a client should see a GP or trichologist, how urgent each one is, and what to do with today's service.",
      minutes: 40,
      objectives: [
        "List the red flags that mean a client should be advised to see a GP, and those that suit a trichologist.",
        "Judge how urgent a referral is, from routine to the same day.",
        "Adapt or postpone a service safely when a red flag is present.",
        "Respond calmly and sensitively to signs of possible infestation, hair pulling, neglect or abuse.",
        "Recognise suspicious skin lesions on the scalp and explain why sun damage matters there.",
      ],
      blocks: [
        {
          type: "p",
          text: "A red flag is a sign, or something a client tells you, that means a doctor or a specialist should look. It is not a diagnosis, and most red flags turn out to have a manageable explanation. The point of knowing them is that you never have to decide what something is. You only have to recognise that it belongs to someone else, say so clearly and kindly, and record what you did.",
        },
        {
          type: "p",
          text: "This lesson groups red flags by what you see, what you hear, and what you sense about a client's wider situation. Learn the list well enough that you would notice any of them in a busy salon on a Saturday.",
        },
        { type: "h", text: "How urgent is it?" },
        {
          type: "table",
          caption: "Matching the referral to the urgency",
          head: ["Urgency", "Examples", "What to suggest"],
          rows: [
            [
              "Emergency, now",
              "A client who seems very unwell, confused or has a rapidly spreading hot red swollen area with fever. A child you believe is in immediate danger.",
              "Call 999 or 112, or support the client to do so. For a child in immediate danger, call 999 and follow your safeguarding procedure.",
            ],
            [
              "Same day or next day",
              "Painful boggy swelling with pus or crusting, especially in a child. A spreading painful red area. A sore that is bleeding heavily or growing fast.",
              "Contact the GP practice today, or NHS 111 or the out-of-hours GP service if the practice is closed.",
            ],
            [
              "Soon, within a week or two",
              "Patchy loss with smooth shiny skin. Scalp pain, burning or tenderness with hair loss. A changing mole or a sore that will not heal. Rapid diffuse shedding with symptoms elsewhere in the body. Loss after a new medicine. Scaly patches with broken hairs in a child.",
              "Book a GP appointment soon. Offer a referral note.",
            ],
            [
              "Routine",
              "Gradual thinning over months or years. Ongoing breakage. Flaking or itch that has not settled with gentle care. Shedding after childbirth that is not settling.",
              "GP, pharmacist or a qualified trichologist, depending on the concern and what the client prefers.",
            ],
          ],
        },
        { type: "h", text: "Red flags you see" },
        {
          type: "callout",
          tone: "redflag",
          title: "Patchy loss with scarring or shiny skin",
          text: "A patch or band of hair loss where the skin looks smooth, shiny, pale or tight, with no visible follicle openings, especially with redness or scale around the remaining hairs at the edge. Also a front hairline that has moved back in an even band, or thinning that started in the centre of the crown with tenderness. Suggest the GP soon, because scarring hair loss is permanent once established and early specialist care matters.",
        },
        {
          type: "callout",
          tone: "redflag",
          title: "Pustules, crusting or boggy swelling, especially in children",
          text: "Spots containing pus, yellow crusts, or a raised, soft, boggy and often tender swelling on the scalp, sometimes with hair falling out over it and swollen glands in the neck. In a child this can be a severe inflammatory reaction to a fungal scalp infection, known as a kerion, which needs prompt medical treatment. It can be mistaken for an abscess. Do not work on the area, do not try to squeeze or drain it, and suggest the GP the same or next day.",
        },
        {
          type: "callout",
          tone: "redflag",
          title: "Suspicious skin lesions",
          text: "A mole that is new, changing in size, shape or colour, has an irregular edge or several colours, itches or bleeds. A sore that does not heal within a few weeks, bleeds easily or keeps crusting. A pearly or shiny lump, a firm red lump, or a scaly rough patch that is growing. The scalp is a common site for skin cancers, including basal cell carcinoma, squamous cell carcinoma and melanoma, particularly on thinning or bald scalps and in people who have spent years outdoors. You cannot tell which lesions are harmless. Suggest the GP soon, or urgently if it is growing quickly or bleeding.",
        },
        {
          type: "callout",
          tone: "redflag",
          title: "Signs of infestation",
          text: "Live lice, or eggs firmly attached to the hair close to the scalp, often behind the ears and at the nape, with itching. Stop the service discreetly, suggest the pharmacist for treatment advice, follow your salon policy, and clean and disinfect everything that touched the hair.",
        },
        {
          type: "list",
          items: [
            "Scaly patches with broken hairs or small black dots, especially in children, sometimes with swollen glands behind the ears or in the neck. Suggest the GP soon, as some scalp infections spread through shared combs, hats and clippers.",
            "Clusters of red or pus-filled spots centred on hairs, particularly if they are spreading, painful or keep coming back. Suggest the GP.",
            "Redness or scale around many individual hairs at the edge of a patch of thinning. Suggest the GP soon.",
            "Eyebrows or eyelashes falling out alongside scalp changes. Suggest the GP.",
          ],
        },
        { type: "h", text: "Red flags you hear" },
        {
          type: "callout",
          tone: "redflag",
          title: "Scalp pain, burning or tenderness",
          text: "Most common hair thinning is painless. A client who describes burning, stinging, soreness or tenderness of the scalp, especially in the same place as thinning, should see a GP soon. Do not dismiss it as a sensitive scalp, and do not apply chemical services or exfoliating treatments to that area.",
        },
        {
          type: "callout",
          tone: "redflag",
          title: "Rapid diffuse shedding with systemic symptoms",
          text: "Sudden heavy shedding all over the scalp together with symptoms elsewhere, such as fever, unexplained weight loss, extreme tiredness, night sweats, breathlessness, or feeling generally unwell. Suggest the GP soon, sooner if the client seems unwell.",
        },
        {
          type: "table",
          caption: "Other things clients tell you that are worth passing to the GP",
          head: ["What the client mentions", "What you suggest"],
          rows: [
            ["Hair loss that started after starting or changing a medicine", "Mention the timing to the GP or pharmacist. Never stop or change a medicine without speaking to them."],
            ["Shedding after having a baby that is very heavy, has lasted more than about six months, or comes with feeling unwell or very low", "See the GP or health visitor. Shedding after birth is common, but they can check whether anything else is going on, including mood."],
            ["Shedding or thinning with feeling unusually cold or hot, weight change, palpitations, very dry skin or a swelling in the neck", "See the GP and mention all of it together."],
            ["Shedding with tiredness, breathlessness, pale skin, heavy periods, or a restricted diet", "See the GP and mention all of it together."],
            ["Hair loss with increased facial or body hair, irregular periods or adult acne", "See the GP and mention all of it together."],
            ["Recent significant weight loss, or a very restrictive diet", "See the GP. If you have concerns about an eating disorder, raise them gently and suggest the GP."],
          ],
        },
        {
          type: "callout",
          tone: "scope",
          title: "Suggest the GP, never the explanation",
          text: "You may have learned that thyroid problems, low iron and childbirth can be linked with shedding. That knowledge helps you recognise when to suggest the GP. It does not allow you to tell a client what is wrong, recommend supplements or blood tests, or reassure them that it is just hormones. The GP decides.",
        },
        { type: "h", text: "Red flags you sense" },
        {
          type: "p",
          text: "Some red flags are not about the scalp at all. They are about the person and their situation. These need particular care, because the wrong words can cause shame or put someone at risk.",
        },
        {
          type: "h",
          text: "Possible hair pulling",
        },
        {
          type: "p",
          text: "Some people pull out their own hair, often without fully realising they are doing it, when bored, anxious or concentrating. This is sometimes called trichotillomania and is one of a group of body-focused repetitive behaviours. It affects children, teenagers and adults. You might notice irregular patches with hairs broken at many different lengths, often on the side of the dominant hand or on the crown, with normal-looking skin. Eyebrows and eyelashes can be affected too. The client may feel deep embarrassment and may not want to talk about it.",
        },
        {
          type: "callout",
          tone: "caution",
          title: "Handle with real sensitivity",
          text: "Never ask do you pull your hair out, and never suggest it in front of a parent, partner or other clients. Describe the patch neutrally, ask how the client feels about it, and suggest the GP as someone who can help work out what is going on. If the client tells you themselves, thank them, do not show surprise, and let them know that support is available through the GP. Record only what you saw and what the client chose to tell you.",
        },
        {
          type: "h",
          text: "Neglect and safeguarding",
        },
        {
          type: "p",
          text: "You may be one of the few adults outside the home who sees a child's scalp closely. Signs that may suggest a child is not being cared for include severe untreated infestation that keeps returning, untreated sores or infections, very matted hair with skin damage underneath, and a child who seems frightened, withdrawn or reluctant to be touched. In adults, signs such as bruising on the scalp, patches of hair that appear to have been pulled out by someone else, or a client who seems afraid of a partner can suggest domestic abuse. One sign alone rarely means abuse, and you are not there to investigate.",
        },
        {
          type: "steps",
          title: "If you have a safeguarding concern",
          steps: [
            { title: "Stay calm and listen", detail: "If a child or adult tells you something, listen, do not ask leading questions, and do not promise to keep it secret." },
            { title: "Write it down", detail: "Record what you saw and any words said, with the date and time, factually and without opinion." },
            { title: "Tell the right person", detail: "Follow your salon's safeguarding policy and tell the designated person if there is one. If you work alone, contact your local authority children's or adult social care team, or in Ireland, Tusla for children. You can also call the NSPCC helpline in the UK for advice." },
            { title: "Emergencies", detail: "If someone is in immediate danger, call 999 or 112." },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Have a safeguarding policy, even as a sole trader",
          text: "Write down who you would call and keep the numbers somewhere you can find them. Many local authorities offer free basic safeguarding awareness training for people who work with the public, and some insurers and training bodies require it for practitioners who see children.",
        },
        { type: "h", text: "What to do with today's service" },
        {
          type: "table",
          caption: "Adapting the service when a red flag is present",
          head: ["Situation", "Adapt or postpone"],
          rows: [
            ["Broken, weeping, crusted, infected or very inflamed skin", "Do not apply colour, bleach, relaxers, perms, exfoliants, scalp scrubs, steam or massage to the area. Postpone chemical services until the scalp is healed or the client has seen a clinician."],
            ["Suspected infestation or contagious infection", "Stop the service discreetly, rebook after treatment, and disinfect tools and surfaces."],
            ["Suspicious lesion", "Avoid the area entirely with combs, clippers, brushes, heat and products. Let the client know where it is so they can protect it."],
            ["Tender, sore or burning scalp", "Avoid chemical and stimulating treatments. Choose gentle, low-tension styling and a mild cleanse."],
            ["Tension damage at the hairline", "Avoid installing tight styles, heavy extensions or glue at the edges. Discuss lighter options."],
            ["Client unwell", "Rebook. If they seem very unwell, help them get medical advice."],
          ],
        },
        {
          type: "case",
          title: "A swelling at the back of the head",
          scenario: "Tyrone, 8, is brought in by his grandmother for a fade. At the occipital area you find a soft, raised, slightly squashy swelling about 4 cm across, with yellow crusts and several pustules. The hair over it comes out easily when touched, and there is a lump in his neck. His grandmother says it started as a small scaly patch a few weeks ago and she has been putting antiseptic cream on it.",
          question: "What do you do?",
          discussion: "This combination, a boggy swelling with pustules and crusting in a child, with loose hair and a swollen gland, is a red flag for prompt medical assessment. Stop the service. Do not touch the area further, do not squeeze it and do not suggest any product. Tell his grandmother calmly that the swelling needs to be seen by a doctor today or tomorrow, by the GP or through NHS 111 if the practice is closed. Explain that some scalp infections in children need treatment from a doctor and that it is not something a salon should treat. Wash your hands, disinfect clippers, guards and combs, and launder capes and towels. Record what you saw and what you advised. You do not mention fungal infection or kerion by name, because that is the doctor's assessment.",
        },
        {
          type: "case",
          title: "A mole on a balding crown",
          scenario: "Derek, 68, a retired gardener, comes for his regular clipper cut. He is largely bald on top. You notice a dark mole on the crown about 8 mm across with an irregular edge and two shades of brown. Looking back at your notes and photo from a year ago, taken with his consent for a different reason, the mole was smaller and one colour.",
          question: "How do you raise it, and how urgent is it?",
          discussion: "A mole that has grown and changed colour is a red flag. Suggest Derek books a GP appointment soon, ideally within the next week or two, and mention that the change compared with last year is the important part. Offer to show him the old and new photos on his own phone if he would like to take them, with his consent. Avoid the area with the clippers. Do not say it could be cancer, but do not play it down either. Also mention, as general advice, that a hat or sun protection on the scalp is sensible for anyone who spends time outdoors.",
        },
        {
          type: "case",
          title: "An irregular patch on a teenager",
          scenario: "Leah, 14, comes in with her mother for a cut. On the left side of her crown there is an irregular patch about 5 cm across where the hairs are broken at many different lengths and the skin looks completely normal. Leah keeps her hair down and seems uncomfortable when you section near it. Her mother has not mentioned it.",
          question: "How do you handle this?",
          discussion: "There could be several explanations, and you do not know which. The priority is Leah's dignity. Do not raise it in a way that embarrasses her or suggests anything in front of her mother. You might quietly ask Leah whether she is comfortable with you cutting around that area, and whether she would like you to style it so it is less noticeable. If the moment allows, mention neutrally to both of them that you noticed an area where the hair is shorter and that the GP is a good person to look at any changes like this. Record what you saw. If anything raises a wider safeguarding concern, follow your policy.",
        },
        {
          type: "script",
          title: "Raising a red flag without alarm",
          lines: [
            "While I was looking, I noticed something I'd like to mention. It's probably nothing to worry about, but it's not something I can assess.",
            "There's a small sore on your crown that looks like it hasn't healed. Have you noticed it?",
            "Sores like that are the kind of thing GPs like to have a look at, so I'd suggest booking an appointment in the next week or two.",
            "I'll keep clear of it today. I can write down what I've seen so you can show your GP, if that would help.",
          ],
        },
        {
          type: "terms",
          items: [
            { term: "Kerion", meaning: "A painful, boggy, inflamed swelling on the scalp, sometimes with pustules, crusting and hair loss, caused by a strong reaction to a fungal scalp infection. It is most common in children and needs prompt medical treatment. It is not something to diagnose, only to recognise as urgent." },
            { term: "Tinea capitis", meaning: "A fungal infection of the scalp, sometimes called scalp ringworm. It is most common in children and can cause scaly patches, broken hairs and swollen glands. It can spread through shared combs, hats and clippers." },
            { term: "Folliculitis", meaning: "Inflammation of hair follicles, often seen as small red or pus-filled spots centred on hairs. It has many causes, from friction and occlusion to infection." },
            { term: "Basal cell carcinoma (BCC)", meaning: "The most common type of skin cancer. It often appears as a pearly or shiny lump, or a sore that bleeds and does not heal, on sun-exposed skin." },
            { term: "Squamous cell carcinoma (SCC)", meaning: "A type of skin cancer that can appear as a firm, scaly, crusted or growing lump, or a non-healing sore, often on sun-damaged skin such as a bald scalp." },
            { term: "Melanoma", meaning: "A serious type of skin cancer that can develop in an existing mole or as a new mark. Warning signs include change in size, shape or colour, an irregular edge, several colours, itching or bleeding." },
            { term: "Trichotillomania", meaning: "A condition where a person repeatedly pulls out their own hair and finds it hard to stop. It is a body-focused repetitive behaviour and is helped by support from a GP or mental health professional." },
            { term: "Safeguarding", meaning: "Protecting children and adults at risk from abuse and neglect. Everyone who works with the public has a part to play in noticing and reporting concerns." },
          ],
        },
      ],
      check: [
        {
          id: "l4-q1",
          prompt: "A 6-year-old has a soft, tender, boggy swelling on the scalp with pustules and crusting. Hair over it comes out easily. What is the right response?",
          options: [
            "Finish the cut around it and suggest an anti-dandruff shampoo.",
            "Gently squeeze the pustules to relieve pressure.",
            "Suggest a trichologist appointment in the next month.",
            "Stop the service, avoid the area, and advise the parent to contact the GP today or tomorrow, or NHS 111 if the practice is closed.",
          ],
          answer: 3,
          explain: "A boggy swelling with pustules and crusting in a child is a red flag that needs prompt medical assessment. It may be a reaction to a scalp infection that needs prescribed treatment. Never squeeze or treat it in the salon, and disinfect your tools afterwards.",
        },
        {
          id: "l4-q2",
          prompt: "Which of these is a red flag that should prompt you to suggest a GP appointment?",
          options: [
            "Fine white loose flakes that improve after shampooing.",
            "A patch of hair loss where the skin looks smooth and shiny with no visible follicle openings.",
            "Slight dryness at the ends of bleached hair.",
            "A few more hairs in the brush during a change of season.",
          ],
          answer: 1,
          explain: "Smooth, shiny skin without visible follicle openings in an area of hair loss can be a sign of scarring, which is permanent once established. Early medical assessment can help protect the remaining hair. The other options are common and usually within your scope to advise on.",
        },
        {
          id: "l4-q3",
          prompt: "You notice an irregular patch of broken hairs of different lengths on a teenage client, with normal-looking skin. Her father is waiting nearby. What is the best approach?",
          options: [
            "Describe the patch neutrally, protect her dignity, and suggest the GP is a good person to look at changes like this, without suggesting a cause.",
            "Ask her directly whether she pulls her hair out.",
            "Tell her father you think she has trichotillomania.",
            "Say nothing and cut her hair as usual.",
          ],
          answer: 0,
          explain: "Possible hair pulling must be handled with great sensitivity. You describe without labelling, protect the young person's dignity, and suggest the GP. Naming a cause, especially in front of a parent, could cause shame and damage trust. Saying nothing misses a chance to help.",
        },
        {
          id: "l4-q4",
          prompt: "Why are skin lesions on the scalp particularly worth noticing?",
          options: [
            "Because all scalp moles are cancerous.",
            "Because hair products cause most skin cancers.",
            "Because the scalp is a common site for sun damage and skin cancers, especially on thinning or bald scalps, and clients often cannot see it themselves.",
            "Because only stylists are allowed to check scalp moles.",
          ],
          answer: 2,
          explain: "The scalp gets significant sun exposure, particularly when hair is thin, and clients rarely see their own crown. That makes you well placed to notice a changing mole or non-healing sore and suggest the GP. Most moles are harmless, but you cannot tell which.",
        },
      ],
      reflection:
        "Which red flag in this lesson would you find hardest to raise with a client, and why? Write down the words you would use, and note who in your area you would contact about a safeguarding concern.",
      takeaways: [
        "Red flags include scarring or shiny patches, pain or burning, pustules or boggy swelling, suspicious lesions, infestation, shedding with systemic symptoms, and loss after medicines, childbirth or with thyroid or iron-type symptoms.",
        "Match the referral to the urgency, and adapt or postpone the service so you never work over a red flag.",
        "Possible hair pulling, neglect and abuse need sensitivity, accurate records and your safeguarding procedure, never investigation or labels.",
      ],
    },

    // ------------------------------------------------------------------
    // Lesson 5
    // ------------------------------------------------------------------
    {
      slug: "referring-well",
      title: "Referring well",
      detail:
        "How to suggest a referral so the client goes, choose the right person, and write a short note a GP or trichologist can act on.",
      minutes: 30,
      objectives: [
        "Choose between the GP, pharmacist, trichologist and urgent services for a given concern.",
        "Suggest a referral in words that encourage the client to act without causing alarm.",
        "Write a referral note that is factual, brief and useful to a clinician.",
        "Handle consent, data protection and under-16s correctly when sharing information.",
        "Record the advice you gave and follow up at the next appointment.",
      ],
      blocks: [
        {
          type: "p",
          text: "A referral only helps if the client actually goes and the person they see can use what you noticed. Many good observations are lost because the suggestion was too vague, the client did not understand why it mattered, or they arrived at the GP unable to describe what their stylist had seen on a part of their head they cannot see themselves. This lesson is about closing those gaps.",
        },
        {
          type: "p",
          text: "In the cosmetic professions, referring is usually a recommendation, not a formal process. You suggest who the client should see, explain why in plain words, give them something in writing if it helps, and record what you said. The client decides what to do. Your job is to make the right decision easy.",
        },
        { type: "h", text: "Choosing who to suggest" },
        {
          type: "table",
          caption: "Which route fits which concern",
          head: ["Concern", "Suggest", "Why"],
          rows: [
            ["Any red flag in Lesson 4", "GP (urgency as in Lesson 4)", "The GP can examine, arrange tests, prescribe and refer to a dermatologist."],
            ["Shedding with symptoms elsewhere in the body, or after a new medicine, childbirth or illness", "GP", "Only a doctor can assess the body as a whole and review medicines."],
            ["Mild flaking or itch that has not settled with gentle care and no red flags", "Pharmacist first, GP if it does not improve", "Pharmacists can advise on over-the-counter medicated shampoos and when to see the GP."],
            ["Gradual thinning, ongoing breakage, a client who wants a specialist hair and scalp assessment", "Qualified trichologist, with GP as well if anything medical is suspected", "A trichologist can take a full history, examine in detail, and work alongside the GP."],
            ["Client asks about over-the-counter treatments for thinning", "Pharmacist or GP", "They can explain licensed options, suitability and what to expect."],
            ["Distress, low mood or anxiety linked to hair loss", "GP, and patient support organisations", "The GP can offer support. Charities such as Alopecia UK provide information and peer support."],
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "A trichologist is not a substitute for the GP when a red flag is present",
          text: "If you have seen a red flag, the GP comes first or at the same time. A good trichologist will say the same and will often write to the GP themselves. Suggesting both is fine. Suggesting only a trichologist for a boggy swelling in a child or a changing mole is not.",
        },
        { type: "h", text: "What makes a client actually go" },
        {
          type: "list",
          items: [
            "A clear reason in plain words: it is something a doctor should look at because I can't assess what is causing it.",
            "A clear timescale: today, this week, in the next couple of weeks, or when convenient.",
            "A specific person: your GP, the pharmacist on the high street, or a named trichologist.",
            "Something in writing: a short note they can hand over or read from. Clients forget details, particularly about areas they cannot see.",
            "Calm confidence: if you sound panicked, the client may avoid the appointment out of fear. If you sound too casual, they may not bother.",
            "Follow-up: telling the client you will ask how they got on next time makes it more likely they will go.",
          ],
        },
        {
          type: "script",
          title: "Suggesting a GP appointment",
          lines: [
            "I've noticed something today that I think is worth getting checked by your GP.",
            "On the left side of your crown there's an area where the hair is thinner and the skin looks smoother and shinier than elsewhere. You'll find it hard to see yourself, so I've measured it.",
            "I can't tell you what's causing it, and it's not something I'd want to guess about. A GP can look at it properly and decide whether you need to see a specialist.",
            "I'd suggest booking in the next couple of weeks rather than leaving it.",
            "Would it help if I wrote down what I've seen for you to take along? With your permission I can also take a photo you can keep on your phone.",
            "Next time you're in, I'll ask how you got on.",
          ],
        },
        {
          type: "script",
          title: "Suggesting a trichologist",
          lines: [
            "From what you've told me and what I can see, I think you'd get a lot from seeing a trichologist. They specialise in hair and scalp, and they can take a much more detailed look than I can.",
            "The one I usually suggest is a member of the Institute of Trichologists. I'll give you their details, and if you'd like, a note of what I've seen.",
            "If they think anything needs a doctor, they'll tell you and often write to your GP too.",
          ],
        },
        { type: "h", text: "Writing a note a clinician will act on" },
        {
          type: "p",
          text: "GPs have ten-minute appointments and read quickly. A good referral note is short, factual and organised. It says who you are, what you saw, where, how big, for how long according to the client, and what the client is worried about. It does not include your theory about the cause, product recommendations, or anything you would not be comfortable defending.",
        },
        {
          type: "table",
          caption: "What helps and what gets in the way",
          head: ["Helpful", "Unhelpful"],
          rows: [
            ["Smooth shiny patch approx 2.5 cm, left parietal scalp, no visible hair openings. Redness around hairs at the edge.", "Suspected scarring alopecia, please treat."],
            ["Client reports burning and tenderness at this site for about 3 months.", "Client is very stressed which is causing her hair loss."],
            ["Area photographed today with the client's consent, photo held by the client.", "See attached 15 photos from my scalp camera."],
            ["Observed at routine salon appointments on 12 March and 30 April 2026. Area larger at second visit (2 cm then 2.5 cm).", "It has got much worse."],
            ["Practitioner name, qualification, salon, phone number.", "No contact details."],
          ],
        },
        {
          type: "template",
          title: "Referral note for a GP or trichologist",
          body: "REFERRAL NOTE FROM HAIR / SCALP PRACTITIONER\nThis note describes what I observed during a cosmetic hair or scalp service. It is not a diagnosis.\n\nFor: [ ] GP  [ ] Trichologist  [ ] Pharmacist  [ ] Other: ________\nClient name: ____________________  Date of birth: ___________\nDate of this note: ___________\n\nFrom: ____________________ (name)\nRole and qualifications: ______________________ (e.g. hairdresser, NVQ Level 3; head spa therapist)\nBusiness: ____________________  Phone / email: ____________________\nHow long I have looked after this client's hair: ______________\n\nWHAT I OBSERVED\nPosition (client's left/right): ______________________________\nSize (measured): ___________________________________________\nAppearance of skin: ________________________________________\nAppearance of hair: ________________________________________\nAny change since previous visits (with dates): __________________\n\nWHAT THE CLIENT TOLD ME (their words)\nConcern: \"____________________________________________\"\nWhen it started: ____________  Symptoms (itch, pain, burning): __________\nOther things the client mentioned (illness, medicines, childbirth, symptoms): ____\n\nPHOTOS\n[ ] Taken with client consent; copy held by the client  [ ] None taken\n\nWHAT I HAVE DONE\nService adapted / postponed: ______________________________\nAdvice given: _____________________________________________\nI suggested the client see you because: _______________________\n\nThe client has agreed to share this note with you.\nClient signature (or parent/guardian if under 16): ______________\nPractitioner signature: ______________",
        },
        {
          type: "callout",
          tone: "scope",
          title: "Describe, do not diagnose, even in writing",
          text: "A written note carries your name and lasts. Never write a condition name, a suspected diagnosis, a cause or a treatment request. Write what you saw, what the client said and why you suggested they come. The clinician will value a careful observer far more than a confident guess.",
        },
        { type: "h", text: "Consent and data protection" },
        {
          type: "p",
          text: "The information in a referral note is health information about the client. You should only share it with the client's explicit agreement, and the simplest and safest way is to give the note to the client to take with them. If a client asks you to send it directly to a trichologist or clinic, get their consent in writing, use a secure method, and send only what is needed. Do not phone a GP practice to discuss a client unless the client has asked you to and agreed what you will say.",
        },
        {
          type: "list",
          items: [
            "Ask: would you like me to write down what I've seen for you to take with you?",
            "Show the client what you have written before they take it, so there are no surprises.",
            "Keep a copy on their record card, stored securely, and note that the client took the original.",
            "For under-16s, write the note for the parent or guardian, discuss it with them, and have them sign. Speak to the young person too, in words they understand.",
            "If a client declines a referral, respect that. Record that you advised it and that they chose not to go, and raise it again kindly at the next visit if the concern remains.",
          ],
        },
        {
          type: "callout",
          tone: "caution",
          title: "Safeguarding is different",
          text: "If you have a safeguarding concern about a child or an adult at risk, you may need to share information without consent. Follow your safeguarding policy and seek advice from your local safeguarding team. Do not use a referral note to the family to raise safeguarding concerns.",
        },
        {
          type: "case",
          title: "The client who does not want to bother the GP",
          scenario: "Bernadette, 72, lives in Galway and has had her hair set weekly for years. You notice a rough, crusted, pink patch on her crown that bleeds slightly when the brush catches it. She tells you it has been there since the summer and she does not want to bother the doctor with something so small.",
          question: "How do you encourage her, and what do you write?",
          discussion: "Acknowledge her feelings, then be clear: it is exactly the kind of thing GPs want to see, and it is not bothering them. Explain that you cannot assess it and that a sore that has not healed for months should be checked. Suggest she books with her GP in the next week or two. Write a short note: rough crusted pink patch approx 1 cm on the vertex, bleeds slightly when brushed, present since about July according to the client, observed at weekly appointments. Offer to take a photo for her own phone. Avoid the area with brushes and rollers and keep heat and lacquer away from it. Ask at her next appointment whether she has been, and record her answer.",
        },
        {
          type: "case",
          title: "The client who wants you to fix it instead",
          scenario: "Femi, 38, has Afro-textured natural hair. You notice clusters of small pus-filled spots on the back of his scalp, some with crusting, and he says they are sore and keep coming back. He asks whether you can sell him something to clear them up and says he does not have time for the GP.",
          question: "What do you say?",
          discussion: "Explain kindly that recurring sore pus-filled spots are something the GP or a pharmacist needs to assess, because the right treatment depends on the cause and some causes need prescribed treatment. You can mention that a pharmacist is a quick first step if he cannot get a GP appointment soon. Do not sell a product as a fix for the spots. Avoid close clipper work over the area today, use clean, disinfected tools, and record what you saw and advised. If he still declines, note that you advised it, and check how the area looks next time.",
        },
        {
          type: "case",
          title: "Following up",
          scenario: "Six weeks ago you suggested Aisha, 29, see her GP about heavy shedding that began three months after her baby was born, together with exhaustion. She is back for her appointment.",
          question: "How do you follow up, and what do you record?",
          discussion: "Ask openly and without pressure: last time we talked about mentioning the shedding to your GP, how did you get on? If she has been, you do not need to know the details. Listen to what she chooses to share and record only what is relevant to her hair services, for example client has seen GP and is being looked after. If she has not been and the shedding and tiredness continue, gently suggest it again. Compare what you see today with your notes and photos, and record any change.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Build relationships before you need them",
          text: "Introduce yourself to one or two qualified trichologists locally. Ask how they like to receive notes and whether they will let you know, with the client's consent, if your observations were useful. Many will welcome stylists who refer carefully, and some will refer clients back to you for gentle styling, wigs or toppers.",
        },
        {
          type: "terms",
          items: [
            { term: "Referral", meaning: "In this course, a recommendation that a client sees another professional, with a clear reason and timescale. It is the client's choice whether to go." },
            { term: "Consultant trichologist", meaning: "A title used by experienced trichologists. Trichology is not statutorily regulated in the UK or Ireland, so check membership of a professional body such as the Institute of Trichologists and ask about qualifications." },
            { term: "Dermatologist", meaning: "A medical doctor who specialises in skin, hair and nail conditions. NHS and HSE dermatology is usually accessed by GP referral." },
            { term: "Explicit consent", meaning: "Clear, specific agreement, ideally in writing, to a particular use of personal information, such as sharing a note with a clinician or taking a photo." },
            { term: "Special category data", meaning: "Personal data that needs extra protection under UK GDPR and Irish data protection law, including health information such as hair loss, scalp conditions, medicines and pregnancy." },
          ],
        },
      ],
      check: [
        {
          id: "l5-q1",
          prompt: "Which sentence belongs in a referral note to a GP?",
          options: [
            "Suspected frontal fibrosing alopecia, please refer to dermatology.",
            "Front hairline set back by approx 2 cm in an even band compared with client's photo from 2023; skin in the band paler and smooth; eyebrows sparse; client reports itch.",
            "Hair loss caused by stress and HRT.",
            "I recommend she starts a course of scalp treatments with me.",
          ],
          answer: 1,
          explain: "A useful note records what you saw, measured and dated, with the client's own report. It contains no diagnosis, no cause and no treatment request, which leaves the clinical judgement to the clinician.",
        },
        {
          id: "l5-q2",
          prompt: "What is the simplest and safest way to share your observations with a client's GP?",
          options: [
            "Phone the GP practice and describe what you saw.",
            "Email photos to the practice from your phone.",
            "Write a short note, show it to the client, and give it to them to take to their appointment.",
            "Post your observations on a professional forum to get advice first.",
          ],
          answer: 2,
          explain: "Giving the note to the client keeps them in control of their health information and avoids sharing data without consent. Keep a secure copy on their record card. Never share identifiable client details on forums.",
        },
        {
          id: "l5-q3",
          prompt: "A client with a changing mole on her scalp asks if she can just see a trichologist instead of her GP. What is the best answer?",
          options: [
            "Yes, a trichologist can treat moles.",
            "Yes, but only if the mole is under 6 mm.",
            "No, she should wait and see if it changes further.",
            "The GP should see a changing mole. She can see a trichologist as well for her hair, but the mole needs the GP.",
          ],
          answer: 3,
          explain: "A changing mole is a red flag for the GP. A trichologist can help with hair and scalp concerns and will usually send the client to the GP for a lesion like this, but they are not a substitute for medical assessment.",
        },
        {
          id: "l5-q4",
          prompt: "A client declines your suggestion to see the GP about tender thinning at her crown. What should you do?",
          options: [
            "Respect her decision, record that you advised it and she declined, and kindly raise it again at the next visit if the concern remains.",
            "Refuse to do her hair until she has been.",
            "Phone her GP without telling her.",
            "Stop mentioning it so she does not feel pressured.",
          ],
          answer: 0,
          explain: "Clients have the right to decide. Your record shows you gave appropriate advice, and gently returning to it later keeps the door open. Contacting the GP without consent is not appropriate outside a safeguarding situation.",
        },
      ],
      reflection:
        "Using the referral note template, write a note for a real or imagined client you have seen with a scalp concern. Then read it as if you were a busy GP. What would you want to know that is not there?",
      takeaways: [
        "Choose the right route: the GP for any red flag or medical concern, the pharmacist for mild problems, and a qualified trichologist for specialist hair and scalp assessment.",
        "A good referral gives a clear reason, a timescale, a named person and a short factual note, with no diagnosis or theory.",
        "Share health information only with the client's consent, usually by giving them the note, and record the advice and the client's decision.",
      ],
    },

    // ------------------------------------------------------------------
    // Lesson 6
    // ------------------------------------------------------------------
    {
      slug: "aftercare-conversations",
      title: "Aftercare conversations",
      detail:
        "How to talk about shedding and thinning honestly and within scope, give practical aftercare, and support clients over time.",
      minutes: 35,
      objectives: [
        "Talk about shedding and thinning in plain, honest words without diagnosing or making promises.",
        "Give practical aftercare advice on cleansing, styling, tension and chemical services that is within your scope.",
        "Answer questions about products, supplements and over-the-counter treatments responsibly.",
        "Support clients emotionally and offer cosmetic options such as styling, toppers and wigs.",
        "Plan follow-up at future appointments using your records.",
      ],
      blocks: [
        {
          type: "p",
          text: "The conversation at the end of the appointment is often the one clients remember. They may have been worrying about their hair for months, and you are the professional who has just looked closely. They want to know what you think, what they should do and whether it will get better. You can give them a lot of real help without crossing into diagnosis. This lesson shows you how.",
        },
        { type: "h", text: "Honest without diagnosing" },
        {
          type: "p",
          text: "The safest and most helpful pattern has three parts. First, say what you see, in plain words. Second, say what you can help with today and in their routine. Third, say what you cannot assess and who can. Clients rarely feel let down by this. What upsets them is vague reassurance that turns out to be wrong, or alarming hints with no clear next step.",
        },
        {
          type: "table",
          caption: "Turning diagnosis into description",
          head: ["Avoid saying", "Say instead"],
          rows: [
            ["You've got female pattern hair loss.", "Your parting looks a little wider at the front than at the back. That's worth mentioning to your GP or a trichologist, who can tell you what's behind it."],
            ["It's just stress, it'll grow back.", "Shedding can have lots of causes and some settle on their own, but I can't tell which this is. If it carries on or you feel unwell, see your GP."],
            ["That's alopecia.", "There's a smooth round patch here about the size of a 10p coin. I'd suggest showing it to your GP."],
            ["Your relaxer has damaged your follicles.", "Your crown feels tender and the hair there is thinner. I'd rather not use a chemical on it today, and I'd like you to get it checked."],
            ["Don't worry, everyone loses hair.", "It's normal to lose some hair every day. What you're describing sounds like more than usual for you, so let's keep an eye on it together."],
            ["This shampoo will stop your hair falling out.", "This shampoo is gentle and will keep your scalp clean and comfortable, which is a good base. It won't change what's happening inside the follicle."],
          ],
        },
        {
          type: "script",
          title: "Talking about shedding",
          lines: [
            "You told me you've been losing more hair in the shower, and I did see more in the basin today than I'd usually expect from you.",
            "Hair often sheds more a couple of months after something like an illness, an operation or a stressful time, and in many people it settles. But I can't tell you that's what's happening here.",
            "If it's still heavy in a couple of months, or you're feeling unwell or very tired, please mention it to your GP. They can check whether anything else is going on.",
            "In the meantime, let's be gentle: a mild shampoo, no tight styles, and less heat. I'll make a note and we'll compare next time.",
          ],
        },
        {
          type: "script",
          title: "Talking about gradual thinning",
          lines: [
            "I can see your parting is wider at the front than it is further back, and there's a bit more scalp showing on top than when I first saw you two years ago.",
            "Gradual thinning on top is very common in men and women, and there are a few different reasons it can happen. A GP or a trichologist can tell you which applies to you and what your options are.",
            "There are licensed treatments, and some are available from the pharmacist without a prescription, but whether one is right for you is a conversation for them, not me.",
            "What I can do is help with a cut and styling that gives more volume on top and makes the most of what you have.",
          ],
        },
        {
          type: "callout",
          tone: "scope",
          title: "Over-the-counter treatments",
          text: "Minoxidil is a licensed treatment for some types of hair loss and is available over the counter from pharmacies in the UK and Ireland. You can tell a client it exists and that they could ask a pharmacist or their GP whether it is suitable. Do not advise on strength, dosing, how to apply it or what to expect, and do not sell or apply it as part of a service. Never recommend prescription medicines.",
        },
        { type: "h", text: "Practical aftercare within your scope" },
        {
          type: "p",
          text: "This is where your expertise shines. Good everyday care will not cure a medical condition, but it protects the hair a client has, keeps the scalp comfortable and avoids making things worse.",
        },
        {
          type: "list",
          items: [
            "Cleansing: wash often enough to keep the scalp clean and comfortable, which for many people is more often than they think. Use a mild shampoo, massage with fingertips not nails, and rinse well. For Afro-textured hair, a regular cleansing routine that reaches the scalp, rather than only conditioning the lengths, helps reduce build-up.",
            "Product build-up: heavy oils, pomades and dry shampoo left on the scalp can contribute to flaking and itch. Advise applying products to the hair rather than the scalp, and cleansing thoroughly.",
            "Heat: lower straightener and dryer temperatures, use heat protection, and avoid repeatedly passing heat over the same section.",
            "Tension: rotate partings and styles, avoid styles that feel tight or cause bumps, ask for looser installs, keep extensions light, take breaks between long-wear styles, and loosen ponytails, buns and tight underscarves. Soft scrunchies are kinder than elastic bands.",
            "Chemical services: allow recommended intervals, avoid overlapping relaxer or bleach on previously treated hair, patch test as the manufacturer instructs, and never apply to broken, sore or inflamed skin.",
            "Sun: a hat or a scalp sunscreen helps protect a thinning or bald scalp and partings.",
            "Night care: a satin or silk scarf or pillowcase can reduce friction, particularly for curly, coily and fragile hair.",
          ],
        },
        {
          type: "case",
          title: "Edges and tension",
          scenario: "Zainab, 31, wears a hijab with a tightly pinned underscarf every day and keeps her hair in a high bun underneath. She has noticed her front hairline and temples thinning over two years. At the hairline you see short, fine hairs along the edge and some small bumps. Her scalp is not sore, and the rest of her hair looks full.",
          question: "What aftercare advice can you give, and when would you suggest a referral?",
          discussion: "Describe what you see without naming a condition, and explain that steady pulling on the hair at the front over a long time can contribute to thinning there, and that reducing tension early gives the hair its best chance. Practical, respectful suggestions within your scope include a looser underscarf or a soft, non-slip cap, varying where pins sit, lowering and loosening the bun, and soft hair ties. Suggest a qualified trichologist if the thinning continues after a few months of reduced tension, and the GP sooner if she develops soreness, pustules or smooth shiny skin at the hairline. Record your observations and photograph the hairline with consent so you can compare.",
        },
        {
          type: "case",
          title: "The supplement question",
          scenario: "Chloe, 26, has noticed more shedding and has seen hair supplements promoted on social media. She asks which one you recommend and whether she should take biotin.",
          question: "What do you say?",
          discussion: "Explain that you cannot recommend supplements as a treatment for shedding, because the right approach depends on the cause, and that some people take supplements they do not need. Suggest that if she is concerned, the GP can decide whether any checks are needed. It is useful and accurate to mention that high-dose biotin can affect the results of some blood tests, so she should tell her GP or the lab if she takes it. Do not sell or endorse a supplement as a solution to her shedding.",
        },
        {
          type: "callout",
          tone: "caution",
          title: "Product claims",
          text: "Cosmetic products cannot lawfully be marketed as treating, curing or preventing hair loss, because that would make them medicinal claims. Be careful how you describe products in conversation and on social media. Phrases such as stops hair loss or regrows hair should not be used for cosmetics. You can describe what a product does cosmetically, such as cleansing gently, reducing visible flakes or adding volume.",
        },
        { type: "h", text: "Aftercare after a head spa or scalp treatment" },
        {
          type: "list",
          items: [
            "Tell the client what is normal after the treatment, for example slight warmth or some loose hairs released during massage, and what is not, such as burning, swelling or a rash.",
            "Ask them to contact you if they notice anything unusual, and to seek medical advice for a reaction that is spreading, blistering or affecting their breathing or face.",
            "Explain that some hairs come out during massage and washing because they were already in the resting phase and ready to fall. This does not mean the treatment caused hair loss.",
            "Record the products used, any reaction, and your aftercare advice.",
          ],
        },
        { type: "h", text: "The emotional side" },
        {
          type: "p",
          text: "Hair is tied to identity, culture, faith, gender and confidence. Hair loss can affect how people feel about going out, dating, work and photographs. You do not need to be a counsellor, but you can listen, avoid minimising, and know where to point people for more support.",
        },
        {
          type: "list",
          items: [
            "Give the client privacy for difficult conversations. Offer a quieter station or a moment at the end of the appointment.",
            "Use the client's own words for their hair and their concern.",
            "Offer cosmetic options that help now, such as a cut that suits the current density, root-lifting styling, coloured scalp powders or fibres, toppers and wigs. These are firmly within your skills.",
            "Mention that charities such as Alopecia UK provide information and peer support for people affected by hair loss.",
            "If a client seems very low, hopeless, or mentions not wanting to go on, encourage them to speak to their GP, and if they are at immediate risk, call 999 or 112, or encourage them to contact Samaritans on 116 123 in the UK and Ireland.",
          ],
        },
        {
          type: "case",
          title: "A topper conversation",
          scenario: "Margaret, 58, has gradual thinning on the top of her head. She has seen a trichologist and her GP and is following their advice. She tells you she feels self-conscious and asks whether there is anything you can do in the meantime.",
          question: "How do you help within your scope?",
          discussion: "This is a great opportunity to use your skills. Ask what bothers her most and in what situations. Discuss a cut that suits her current density, styling for lift at the root, scalp-coloured powder or fibres along the parting, and, if she is interested, a topper or partial hair piece. Make sure any attachment method does not put tension on fragile hair. Avoid suggesting anything that conflicts with the advice she has been given, and ask her to check with her trichologist if she is using a topical treatment that might be affected by fibres or attachments.",
        },
        { type: "h", text: "Following up over time" },
        {
          type: "steps",
          title: "Using your records at the next visit",
          steps: [
            { title: "Read the card before the client sits down", detail: "Look at what you noted last time, any referral you suggested, and any photos." },
            { title: "Ask, do not assume", detail: "Ask how things have been and whether they saw anyone. Let the client decide how much to share." },
            { title: "Look again in the same way", detail: "Repeat your routine and take comparison photos in the same position, with consent." },
            { title: "Compare and describe", detail: "Tell the client what has changed or stayed the same, in plain words." },
            { title: "Update the plan", detail: "Adjust services and aftercare. If something has worsened or a new red flag has appeared, raise a referral again." },
          ],
        },
        {
          type: "template",
          title: "Aftercare summary to give the client",
          body: "YOUR SCALP AND HAIR CARE NOTES\nDate: ___________  From: ____________________\n\nWhat I noticed today (in plain words):\n______________________________________________\n\nWhat we did today:\n______________________________________________\n\nYour home care:\nWashing: ____________________________________\nStyling and tension: __________________________\nHeat and chemical services: ___________________\nSun protection: ______________________________\n\nPlease see your GP / pharmacist / trichologist if: \n______________________________________________\n\nPlease seek advice promptly if you notice pain, burning, spreading redness, pus, swelling, a sore that does not heal, or you feel unwell.\n\nNext appointment: ___________  We will look again at: ______________",
        },
        {
          type: "terms",
          items: [
            { term: "Minoxidil", meaning: "A licensed medicine applied to the scalp for some types of hair loss, available over the counter in pharmacies. Pharmacists and GPs advise on whether it is suitable. It is not a cosmetic product." },
            { term: "Traction", meaning: "Pulling on the hair from tight styles, extensions, buns, ponytails or head coverings. Long-term traction can damage follicles, especially at the hairline. Reducing tension early can help." },
            { term: "Topper", meaning: "A partial hairpiece that adds coverage on the top of the head. Attachment should not put strain on fragile hair." },
            { term: "Scalp fibres and powders", meaning: "Cosmetic products that reduce the contrast between hair and scalp, making thinning less visible. They do not affect growth." },
          ],
        },
      ],
      check: [
        {
          id: "l6-q1",
          prompt: "A client asks whether her shedding is just stress and will grow back. What is the best answer?",
          options: [
            "Yes, stress shedding always grows back within six months.",
            "Shedding can have lots of causes and some settle on their own, but I can't tell which this is. If it carries on or you feel unwell, please see your GP.",
            "No, it is probably genetic.",
            "Try this hair growth shampoo and it should stop.",
          ],
          answer: 1,
          explain: "You are honest about what you can and cannot know, give a clear next step and a trigger for seeing the GP. Both reassurance and alarm based on a guess are outside your scope, and cosmetic shampoos cannot claim to stop hair loss.",
        },
        {
          id: "l6-q2",
          prompt: "A client asks about minoxidil. What is within your scope?",
          options: [
            "Telling her which strength to buy and how often to apply it.",
            "Applying it during a head spa treatment.",
            "Explaining that it is a licensed over-the-counter treatment and that a pharmacist or GP can advise whether it suits her.",
            "Telling her it does not work.",
          ],
          answer: 2,
          explain: "You can say that the treatment exists and point to the pharmacist or GP. Advice on suitability, strength and use belongs to them.",
        },
        {
          id: "l6-q3",
          prompt: "Which piece of aftercare advice is within a stylist's scope for a client with thinning at the hairline from tight styles?",
          options: [
            "Rotate partings, choose looser installs and lighter extensions, and take breaks between long-wear styles.",
            "Take an iron supplement.",
            "Apply a steroid cream to the hairline.",
            "Use a hair growth serum that will reverse the damage.",
          ],
          answer: 0,
          explain: "Reducing tension is practical styling advice firmly within your scope. Supplements and creams that treat the skin are medical decisions, and no cosmetic product can promise to reverse follicle damage.",
        },
        {
          id: "l6-q4",
          prompt: "After a head spa massage, a client notices hairs in the basin and asks whether the treatment caused hair loss. What do you explain?",
          options: [
            "Yes, massage can cause permanent hair loss.",
            "The treatment was too strong and you will refund it.",
            "Hair loss is caused by poor circulation, which the massage fixes.",
            "Some hairs were already in their resting phase and ready to fall, and massage and washing release them. It does not mean the treatment caused hair loss.",
          ],
          answer: 3,
          explain: "Resting hairs are released by handling and washing. Explaining the growth cycle simply reassures the client without making claims. If she has ongoing heavy shedding, the usual referral advice applies.",
        },
      ],
      reflection:
        "Think of a client conversation about hair loss that did not go as well as you hoped. Rewrite it using the three-part pattern from this lesson: what you see, what you can help with, and who can assess the rest.",
      takeaways: [
        "Talk about shedding and thinning in three parts: what you see, what you can help with, and who can assess what you cannot.",
        "Give practical aftercare on cleansing, tension, heat, chemicals and sun protection, and never make medical claims for cosmetic products.",
        "Support clients emotionally and with cosmetic options, and use your records to follow up at every visit.",
      ],
    },
  ],

  assessment: [
    {
      id: "a1",
      prompt: "Nadia, 40, says her hair has been coming out in handfuls for the last three weeks. Which question will most help you understand the timeline?",
      options: [
        "Have you changed your conditioner recently?",
        "Do you sleep on a cotton pillowcase?",
        "Has anything significant happened to your health or life in the last three to six months?",
        "How often do you blow-dry?",
      ],
      answer: 2,
      explain: "Shedding after a trigger such as illness, childbirth, surgery or major stress usually begins around two to three months later. Asking about the last three to six months is the most useful timeline question.",
    },
    {
      id: "a2",
      prompt: "During a colour consultation you see a smooth round patch about 2 cm across on the client's crown, with normal-coloured skin and a few very short hairs at the edge. What do you write on the record card?",
      options: [
        "Smooth round patch approx 2 cm at vertex; skin normal colour; several very short hairs at the edge. Suggested client sees GP.",
        "Alopecia areata at vertex.",
        "Bald patch, stress related.",
        "Small patch, nothing to worry about.",
      ],
      answer: 0,
      explain: "Describe shape, size, position and appearance, and record the advice you gave. Naming a condition, guessing a cause or offering reassurance are all outside your scope.",
    },
    {
      id: "a3",
      prompt: "Which client should be advised to contact a doctor the same or next day?",
      options: [
        "An adult with fine loose flakes that improve after washing.",
        "An adult with gradual widening of the parting over five years.",
        "A new mother with shedding that started three months after the birth and is slowly settling.",
        "A child with a tender, boggy swelling on the scalp with pustules, crusting and loose hair over it.",
      ],
      answer: 3,
      explain: "A boggy, tender swelling with pustules and crusting in a child needs prompt medical assessment. The other situations may still benefit from advice or a routine referral, but they are not urgent.",
    },
    {
      id: "a4",
      prompt: "A client with dark brown skin has an itchy area at her crown that looks darker and slightly violet compared with the rest of her scalp. What is the right approach?",
      options: [
        "Record no redness, because the skin is not pink.",
        "Describe the area as darker and violet compared with her surrounding scalp, record the itch, and consider whether a referral is needed.",
        "Apply an exfoliating scalp treatment to calm it.",
        "Tell her it is post-inflammatory pigmentation and will fade.",
      ],
      answer: 1,
      explain: "Inflammation can look darker, violet or grey on black and brown skin. Compare with the client's own skin, record her symptoms, and avoid naming a cause.",
    },
    {
      id: "a5",
      prompt: "Grace, 50, has relaxed hair and reports tenderness and itch at the crown for a year. The crown hair is sparse and broken and the skin in the centre looks smoother. She is booked for a relaxer. What do you do?",
      options: [
        "Go ahead with the relaxer but use a scalp protector.",
        "Tell her the relaxer has caused scarring.",
        "Postpone the relaxer on that area, offer a gentler service, and suggest she sees her GP soon with a referral note.",
        "Suggest a trichologist in six months if it is no better.",
      ],
      answer: 2,
      explain: "Tenderness with thinning that is centred on the crown and smoother skin is a red flag for possible scarring, which benefits from early assessment. Do not apply chemicals to a tender scalp, and do not blame a cause.",
    },
    {
      id: "a6",
      prompt: "A client mentions that her shedding started soon after a new prescription. What do you say?",
      options: [
        "Stop the medicine for a few weeks to see if the shedding improves.",
        "It would be worth mentioning the timing to your GP or pharmacist. Please don't stop anything without speaking to them first.",
        "That medicine definitely causes hair loss.",
        "Medicines never affect hair.",
      ],
      answer: 1,
      explain: "Pass on the timing and leave any review of the medicine to the prescriber. Never suggest stopping or changing a medicine.",
    },
    {
      id: "a7",
      prompt: "Derek, 68, has a bald crown. You notice a mole there that has grown and changed colour since a photo taken last year. How should you respond?",
      options: [
        "Tell him it is probably melanoma.",
        "Suggest he applies sunscreen and see if it changes further.",
        "Recommend a trichologist only.",
        "Avoid the area, explain calmly that a mole that has changed is something a GP should look at, and suggest he books in the next week or two.",
      ],
      answer: 3,
      explain: "A changing mole on a sun-exposed scalp is a red flag. You suggest the GP soon without naming a possible diagnosis, and you avoid working over the area.",
    },
    {
      id: "a8",
      prompt: "You notice tiny oval specks firmly attached to the hair close to the scalp of a 10-year-old client. What do you do?",
      options: [
        "Stop the service discreetly, speak privately to the parent, suggest the pharmacist for treatment advice, follow your salon policy and disinfect your tools.",
        "Announce to the salon that the child has lice.",
        "Continue the cut and wash the tools at the end of the day.",
        "Comb them out and charge for a treatment.",
      ],
      answer: 0,
      explain: "Possible infestation is handled calmly, privately and without shame. Stop the service, signpost the pharmacist, follow your policy, and clean everything that touched the hair.",
    },
    {
      id: "a9",
      prompt: "Which statement about the hair pull test is correct for a stylist?",
      options: [
        "You should perform it on every client and record the number of hairs.",
        "You can perform it but only on clients over 18.",
        "It is a diagnostic test clinicians use; instead you record what you naturally observe, such as shedding during combing.",
        "It replaces the need to ask about shedding.",
      ],
      answer: 2,
      explain: "The pull test needs clinical interpretation and implies diagnosis. Your role is to record observations such as the amount of hair in the comb or basin.",
    },
    {
      id: "a10",
      prompt: "Amara has worn tight braids for ten years and her edges are thinning, with short fine hairs at the margin and small bumps after each install. Her scalp is not sore. What advice is within your scope?",
      options: [
        "Tell her she has traction alopecia that is permanent.",
        "Suggest lighter, looser installs, rotating styles and breaks between long-wear styles, and a trichologist if thinning continues.",
        "Recommend a supplement to regrow the edges.",
        "Refuse to braid her hair ever again.",
      ],
      answer: 1,
      explain: "Reducing tension is practical advice within your scope, and a trichologist can assess further if thinning continues. Naming a condition, recommending supplements or refusing all future services are not appropriate.",
    },
    {
      id: "a11",
      prompt: "What is the simplest and safest way to share your observations with a client's GP?",
      options: [
        "Write a short factual note, show it to the client and give it to them to take, keeping a secure copy.",
        "Phone the surgery and speak to the receptionist.",
        "Email the photos from your personal phone.",
        "Ask a colleague to pass the information on.",
      ],
      answer: 0,
      explain: "Giving the note to the client respects their control over their health information. Sharing directly needs explicit consent and a secure method.",
    },
    {
      id: "a12",
      prompt: "A 15-year-old asks you to photograph a thinning patch for her record. Her mother is in the waiting area. What should happen first?",
      options: [
        "Take the photo, because the client asked.",
        "Take the photo but do not store it.",
        "Refuse to photograph anyone under 18.",
        "Explain the purpose, and get consent from her parent or guardian as well as agreement from the young person before taking any photo.",
      ],
      answer: 3,
      explain: "For under-16s, involve a parent or guardian in consent for services, records and photos, and include the young person in the conversation. Photos of the head are personal data and must be stored securely.",
    },
    {
      id: "a13",
      prompt: "A client asks whether a cosmetic shampoo you stock will stop her hair falling out. What is the most accurate answer?",
      options: [
        "Yes, it contains caffeine which stops hair loss.",
        "It will keep your scalp clean and comfortable, which is a good base, but it won't change what's happening in the follicle. If you're concerned about the shedding, a GP or trichologist can look into it.",
        "Yes, if you use it daily for three months.",
        "No, nothing helps hair loss.",
      ],
      answer: 1,
      explain: "Cosmetic products cannot claim to treat or prevent hair loss. Describe what the product does cosmetically and point to the right person for the underlying concern.",
    },
    {
      id: "a14",
      prompt: "Leah, 14, has an irregular patch with hairs broken at many different lengths and normal-looking skin. She seems uncomfortable when you section near it. Her mother has not mentioned it. What is the best approach?",
      options: [
        "Ask Leah in front of her mother whether she pulls her hair.",
        "Ignore it to avoid embarrassment.",
        "Protect her dignity, describe the patch neutrally, offer to style around it, and suggest the GP is a good person to look at changes like this.",
        "Tell her mother it is trichotillomania.",
      ],
      answer: 2,
      explain: "Possible hair pulling must be handled sensitively and without labels. Describing neutrally and suggesting the GP helps without shaming the young person.",
    },
    {
      id: "a15",
      prompt: "Six weeks ago you suggested a client see her GP about heavy shedding with exhaustion. She is back today. What is the best follow-up?",
      options: [
        "Ask for details of her blood test results.",
        "Say nothing unless she raises it.",
        "Tell her you think she is low in iron.",
        "Ask openly how she got on, record only what she chooses to share that is relevant, and compare today's observations with your notes.",
      ],
      answer: 3,
      explain: "Following up shows care and helps clients act on advice. Let the client decide what to share, keep records relevant to your service, and look again in the same way so you can compare.",
    },
  ],
};
