export type Guide = {
  slug: string;
  /** SEO title, natural, 60 characters or fewer. */
  title: string;
  /** Meta description, 140 to 160 characters. */
  description: string;
  audience: "public" | "professional";
  category: "Head spa" | "Hair loss" | "Scalp care" | "Choosing a professional";
  readingMinutes: number;
  /** ISO date. */
  published: string;
  updated?: string;
  /** Named clinical reviewer. Leave null: Trichollective will add a real reviewer before these go live. */
  reviewer: null | { name: string; credentials: string; reviewedOn: string };
  /** Two to three sentence standfirst. */
  intro: string;
  /** body = paragraphs. A paragraph starting with "- " with lines separated by "\n" renders as a bullet list. */
  sections: { heading: string; body: string[] }[];
  /** Three to five. Used for FAQPage schema. */
  faqs: { q: string; a: string }[];
  related: { discipline?: "cosmetic" | "clinical" | "medical"; glossary: string[] };
};

export const guides: Guide[] = [
  // 1
  {
    slug: "what-is-japanese-head-spa",
    title: "What is a Japanese head spa?",
    description:
      "What happens in a Japanese head spa, how it differs from a salon wash or scalp massage, who it suits, and when to see a GP about your scalp before booking.",
    audience: "public",
    category: "Head spa",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "A Japanese head spa is a slow, careful treatment for the scalp and hair that combines cleansing, massage and rest. This guide explains what usually happens during a session, what a head spa can and cannot do, and how to find a therapist you can trust.",
    sections: [
      {
        heading: "Where head spa comes from",
        body: [
          "Head spa grew out of salon culture in Japan, where washing and massaging the scalp has long been treated as a skill in its own right rather than a quick step before a cut. Therapists are trained to work slowly and precisely, paying close attention to pressure, water temperature and the comfort of the person in the chair.",
          "In recent years head spa has become popular in Ireland and the UK. Some salons offer a short version alongside other services, while dedicated head spa studios offer longer sessions in a quiet room. The name is used quite loosely, so two treatments called a head spa can be very different.",
        ],
      },
      {
        heading: "What usually happens during a session",
        body: [
          "Sessions often last between 60 and 90 minutes, although shorter options exist. A typical treatment follows a pattern like this:",
          "- A short conversation about your hair, your scalp and any health conditions or allergies.\n- A look at the scalp, sometimes with a small camera so you can see it on a screen.\n- Cleansing, often with more than one shampoo and warm water rinses to lift oil and product build-up.\n- A slow massage of the scalp, and often the neck, shoulders and face.\n- Conditioning treatments for the hair, sometimes with steam or a warm towel.\n- Time to rest, followed by drying and styling.",
          "Many people say the most noticeable part is the massage and the feeling of deep relaxation. The water work, where warm water is run over the scalp in steady streams, is another feature people often remember.",
        ],
      },
      {
        heading: "How it differs from a salon wash or scalp massage",
        body: [
          "A standard salon wash is designed to prepare hair for cutting or colouring, and it usually takes a few minutes. A head spa is the main event. It focuses on the scalp, uses more time and more steps, and is meant to be restful in itself.",
          "A scalp massage on its own, such as one offered as part of a beauty treatment, may not include cleansing or a look at the scalp. A head spa usually combines all three: assessment, cleansing and massage.",
        ],
      },
      {
        heading: "What a head spa can and cannot do",
        body: [
          "A head spa is a relaxation and scalp-care treatment. It can leave your scalp feeling clean and comfortable, remove product build-up and leave your hair feeling soft. Many people find it calming and use it as regular time for themselves.",
          "It is not a medical treatment. A head spa cannot diagnose a scalp condition, and it should not be offered as a cure for hair loss, psoriasis, dermatitis or any other medical problem. Be cautious of any provider who promises that a head spa will regrow hair or detox the scalp.",
        ],
      },
      {
        heading: "When to see a GP first",
        body: [
          "Some scalp and hair changes need a medical opinion before any cosmetic treatment. Speak to your GP before booking if you have:",
          "- Sudden or patchy hair loss, or loss of eyebrows or eyelashes.\n- Pain, burning, marked redness, open sores or pus on the scalp.\n- Areas where the scalp looks shiny or scarred.\n- Rapid hair loss, or hair loss with other symptoms such as tiredness or weight change.\n- Any hair loss in a child.",
          "Your GP can arrange tests and refer you to a dermatologist through the HSE in Ireland or the NHS in the UK if needed. Once a medical cause has been ruled out or treated, a head spa may still be a pleasant part of looking after yourself.",
        ],
      },
      {
        heading: "Finding a head spa therapist",
        body: [
          "Look for a therapist who asks about your health before starting, explains each step, checks that the pressure and temperature are comfortable and is open about what the treatment involves. Ask about their training, the products they use and how they keep tools and towels clean.",
          "Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, including head spa therapists. You can use it to find someone near you and to see how their work fits with other kinds of hair and scalp care.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a Japanese head spa good for hair loss?",
        a: "A head spa is a relaxation and scalp-care treatment, not a hair loss treatment, so it should not be relied on to stop shedding or regrow hair. If you are losing hair, especially suddenly or in patches, see your GP first. They can check for common causes such as low iron or thyroid problems and refer you to a dermatologist if needed.",
      },
      {
        q: "How long does a head spa take?",
        a: "Most full head spa sessions last between 60 and 90 minutes, including a short consultation, cleansing, massage, conditioning and drying. Some salons offer shorter versions of around 30 to 45 minutes. When you book, ask what is included, as the name head spa is used for quite different treatments.",
      },
      {
        q: "How often should I have a head spa?",
        a: "There is no set rule. Many people book every few weeks or once a month as regular relaxation, while others have one occasionally as a treat. Your therapist may suggest a rhythm based on your scalp and hair, but you should never feel pressured into a course of treatments.",
      },
      {
        q: "Can I have a head spa if I have a scalp condition?",
        a: "It depends on the condition and how active it is. If your scalp is sore, inflamed, broken or infected, see your GP before booking. For a well-managed condition, tell your therapist beforehand so they can adapt products and pressure, and stop if anything feels uncomfortable.",
      },
    ],
    related: { discipline: "cosmetic", glossary: ["head-spa", "scalp-microbiome", "led-light-therapy"] },
  },

  // 2
  {
    slug: "trichologist-vs-dermatologist",
    title: "Trichologist or dermatologist: who should I see?",
    description:
      "How trichologists and dermatologists differ, what each can help with, how to see them in Ireland and the UK, and the hair loss signs that need a doctor first.",
    audience: "public",
    category: "Choosing a professional",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "If you are worried about your hair or scalp, it can be hard to know who to turn to. Trichologists and dermatologists both work with hair and scalp problems, but their training, their role and the way you reach them are quite different. This guide sets out the differences so you can choose a sensible first step.",
    sections: [
      {
        heading: "The short answer",
        body: [
          "If your hair loss is sudden, patchy, painful or inflamed, if it affects a child, or if you feel unwell in other ways, start with your GP. They can refer you to a dermatologist, who is a medical doctor.",
          "If your concern is more gradual, such as general thinning, breakage, flaking or a scalp that never feels quite right, a trichologist can be a helpful place to start. A good trichologist will tell you if you need to see a doctor.",
        ],
      },
      {
        heading: "What a dermatologist is",
        body: [
          "A dermatologist is a qualified medical doctor who has completed specialist training in conditions of the skin, hair and nails. Because hair grows from the skin, hair loss and scalp disease are part of their work.",
          "Dermatologists can diagnose conditions, order blood tests, take a small scalp biopsy when needed and prescribe medicines. In Ireland and the UK you usually see one after a referral from your GP, either through the HSE or the NHS, or privately. Public waiting lists can be long, so it is worth seeing your GP early.",
        ],
      },
      {
        heading: "What a trichologist is",
        body: [
          "A trichologist specialises in the health of the hair and scalp. They take a detailed history, examine the scalp and hair, often with magnification, and give advice on care, lifestyle and treatments within their scope.",
          "Most trichologists are not medical doctors, so they cannot prescribe medicines or make a formal medical diagnosis. Trichology is also not a statutorily regulated profession in Ireland or the UK, which means anyone can use the title. It is sensible to ask about a trichologist's training and whether they belong to a recognised professional body with a code of conduct.",
        ],
      },
      {
        heading: "Signs you should see a doctor first",
        body: [
          "Some changes need a medical assessment rather than cosmetic or trichology care alone. See your GP if you notice any of the following:",
          "- Sudden patchy hair loss, or smooth round bald patches.\n- Pain, burning, marked redness, pus or open sores on the scalp.\n- Scalp that looks shiny, scarred or has lost visible follicles.\n- Loss of eyebrows or eyelashes.\n- Rapid hair loss over a few weeks.\n- Hair loss with other symptoms such as fatigue, feeling cold, weight change or irregular periods.\n- Any hair loss in a child.",
          "Your GP is also the right person to arrange blood tests, such as iron stores and thyroid function, which are often useful when hair is shedding.",
        ],
      },
      {
        heading: "How the two can work together",
        body: [
          "Trichologists and dermatologists are not rivals. Many people see both at different points. A dermatologist might diagnose and treat a condition, while a trichologist helps with day-to-day scalp care, styling habits and monitoring changes over time.",
          "Other professionals can play a part too. A hairdresser or head spa therapist is often the first to notice a change on the scalp, and a nurse or doctor with an interest in hair may offer specific treatments in a clinic setting.",
        ],
      },
      {
        heading: "Preparing for either appointment",
        body: [
          "Whoever you see, a little preparation makes the appointment more useful. Write down when you first noticed the change, how quickly it has progressed and anything significant that happened in the months before, such as an illness, a new medicine, a pregnancy or a stressful period. Bring a list of your medicines and supplements, and any recent blood test results.",
          "Photographs can help too. Pictures of your hair from a year or two ago, and a few taken now in good light from the same angles, make it easier to show what has changed. It is also worth noting the products you use and how you usually style your hair.",
        ],
      },
      {
        heading: "Finding the right person",
        body: [
          "Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, so you can see who works near you and what kind of care they offer. Our short guided tool can also suggest which type of professional might suit your concern. It does not diagnose, and it is not a substitute for seeing your GP.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do I need a referral to see a dermatologist?",
        a: "Usually, yes. In Ireland and the UK, public dermatology appointments through the HSE or the NHS need a GP referral, and many private dermatologists also ask for one. Your GP can do an initial assessment, arrange blood tests and decide how urgent the referral should be.",
      },
      {
        q: "Is a trichologist a doctor?",
        a: "Most trichologists are not medical doctors. They specialise in hair and scalp health and can assess and advise, but they cannot prescribe medicines or make a medical diagnosis. Trichology is not statutorily regulated in Ireland or the UK, so check a practitioner's training and professional body membership.",
      },
      {
        q: "Can a trichologist help with hair loss?",
        a: "A trichologist can assess your hair and scalp, look at your history and lifestyle, suggest care and treatments within their scope, and track changes over time. They should refer you to your GP when signs point to a medical cause, such as sudden patchy loss, scarring or symptoms elsewhere in the body.",
      },
      {
        q: "Should I see my GP before a trichologist?",
        a: "If your hair loss is sudden, patchy, painful or inflamed, affects a child, or comes with other symptoms such as tiredness or weight change, see your GP first. For slower changes, a trichologist can be a reasonable first step, provided they refer you to a doctor when needed.",
      },
    ],
    related: { discipline: "medical", glossary: ["trichologist", "dermatologist", "alopecia", "scarring-alopecia"] },
  },

  // 3
  {
    slug: "what-does-a-trichologist-do",
    title: "What does a trichologist do?",
    description:
      "A plain guide to trichology: what a trichologist assesses, the concerns they often help with, the limits of their role, and how to check their training.",
    audience: "public",
    category: "Choosing a professional",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "A trichologist specialises in the hair and the scalp. They look closely at what is happening, ask about your health and habits, and help you understand your options. This guide explains what they do, where their role ends and how to choose one with confidence.",
    sections: [
      {
        heading: "Trichology in a sentence",
        body: [
          "Trichology is the study of the hair and scalp. A trichologist uses that knowledge to assess concerns such as thinning, shedding, breakage and scalp discomfort, and to suggest practical ways to care for the hair and scalp.",
          "Trichologists come from different backgrounds. Some trained first as hairdressers, others in science or healthcare. What they have in common is a focus on the hair and scalp as a whole, rather than on styling alone.",
        ],
      },
      {
        heading: "What a trichologist looks at",
        body: [
          "A trichology consultation is usually detailed. A trichologist will often:",
          "- Ask about your hair history, when you first noticed a change and how it has developed.\n- Ask about your general health, medicines, diet, stress and any recent illness or life events.\n- Look at the scalp and hair closely, often with a magnifier or scalp camera.\n- Look at the length, thickness and condition of the hair and how it breaks.\n- Talk through your washing, styling and colouring habits.",
          "From this, they build a picture of what might be contributing to your concern. If they think blood tests would help, they will usually suggest you ask your GP, who can arrange them.",
        ],
      },
      {
        heading: "Concerns trichologists often help with",
        body: [
          "People commonly see a trichologist about gradual thinning, increased shedding, hair that breaks easily, dry or oily scalp, flaking and itching, and damage from styling or chemical treatments. Trichologists can also help you understand a diagnosis you have already been given, and support you with scalp care alongside medical treatment.",
          "Many trichologists offer treatments in clinic, such as scalp treatments and conditioning, and may recommend products or changes to your routine. Ask what each treatment is intended to do and what results you can realistically expect.",
          "Trichologists can also be a steady point of contact over time. Hair changes slowly, so regular reviews with photographs or scalp camera images can show whether things are improving, staying the same or changing in a way that needs a doctor's opinion.",
        ],
      },
      {
        heading: "Where their role ends",
        body: [
          "Most trichologists are not medical doctors. They cannot prescribe medicines or make a medical diagnosis, and they should not present themselves as able to. A responsible trichologist knows these limits well and refers people to a GP or dermatologist when something needs medical care.",
          "You should expect a referral to your GP if you have sudden patchy loss, pain, burning, redness or pus on the scalp, signs of scarring, loss of eyebrows or lashes, rapid loss, or hair loss alongside other symptoms such as fatigue or weight change. Hair loss in children should always be checked by a doctor.",
        ],
      },
      {
        heading: "How it differs from a salon visit",
        body: [
          "A stylist is often the first person to notice a change in your hair or scalp, and many stylists are very knowledgeable. A trichology consultation is different in its focus. Rather than cutting, colouring or styling, the time is spent understanding why your hair or scalp is behaving as it is.",
          "That usually means a longer appointment, more questions about your health and history, a closer examination and a written or clearly explained plan. Some trichologists also work in or alongside salons, so the two kinds of care can sit comfortably together.",
        ],
      },
      {
        heading: "Checking training and membership",
        body: [
          "Trichology is not a statutorily regulated profession in Ireland or the UK. That means the title is not protected by law, and the depth of training varies. Before booking, it is reasonable to ask:",
          "- Where did you train, and for how long?\n- Do you belong to a recognised professional body, and does it have a code of conduct and a complaints process?\n- Do you have professional insurance?\n- How do you work with GPs and dermatologists?",
          "A good trichologist will be happy to answer these questions and will not pressure you into long courses of treatment or expensive products.",
        ],
      },
      {
        heading: "Finding a trichologist",
        body: [
          "Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK. You can use it to find trichologists near you, alongside head spa therapists, stylists, nurses and doctors who work with hair and scalp concerns.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can a trichologist diagnose hair loss?",
        a: "A trichologist can assess your hair and scalp and give an informed view on what may be contributing, but most are not medical doctors and cannot make a formal medical diagnosis. When signs suggest a medical condition, they should refer you to your GP, who can arrange tests or a dermatology referral.",
      },
      {
        q: "Is trichology regulated in Ireland and the UK?",
        a: "No. Trichology is not a statutorily regulated profession in either country, so the title trichologist is not protected by law. Ask about a practitioner's training, whether they belong to a recognised professional body with a code of conduct and complaints process, and whether they hold professional insurance.",
      },
      {
        q: "Can a trichologist prescribe medication?",
        a: "Most trichologists cannot prescribe medicines because they are not doctors or prescribing healthcare professionals. If a prescription treatment might help, they can suggest you discuss it with your GP or a dermatologist. Some clinics have doctors or prescribing nurses on the team, so ask who you will see.",
      },
    ],
    related: { discipline: "clinical", glossary: ["trichologist", "trichoscopy", "dermatologist", "hair-growth-cycle"] },
  },

  // 4
  {
    slug: "how-to-choose-a-head-spa",
    title: "How to choose a head spa or scalp treatment",
    description:
      "Practical tips for choosing a head spa or scalp treatment: questions to ask, signs of good practice, claims to be wary of, and when to see a GP instead.",
    audience: "public",
    category: "Head spa",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "Head spas and scalp treatments are now widely available across Ireland and the UK, and they vary a great deal. A little preparation helps you find a treatment that is safe, comfortable and honest about what it offers. This guide covers what to look for and what to avoid.",
    sections: [
      {
        heading: "Start with what you want",
        body: [
          "It helps to be clear about why you are booking. If you want time to relax, a clean and comfortable scalp and soft hair, a head spa or salon scalp treatment is a reasonable choice.",
          "If you are worried about hair loss, a sore scalp or a skin condition, a cosmetic treatment is not the right starting point. See your GP, or a trichologist for gradual concerns, and consider a head spa later as part of your wider care.",
        ],
      },
      {
        heading: "Signs of good practice",
        body: [
          "A well-run head spa or scalp treatment will usually show these signs:",
          "- A health and allergy questionnaire, or a conversation, before any treatment begins.\n- A clear description of each step, how long it takes and what it costs.\n- Clean towels, capes and tools for every client, and a tidy treatment area.\n- A therapist who checks water temperature and pressure and stops if you are uncomfortable.\n- Patch testing or ingredient information if you have sensitive skin or allergies.\n- Honest answers when you ask what the treatment can and cannot do.",
          "A good therapist will also tell you if they notice something on your scalp that they think a doctor should look at, and will not carry on regardless.",
        ],
      },
      {
        heading: "Claims to be wary of",
        body: [
          "Head spa and most salon scalp treatments are cosmetic and relaxation treatments. Be cautious if a provider says a treatment will cure hair loss, regrow hair, treat a medical condition, detox the scalp or remove toxins. None of these claims should be made for a cosmetic treatment.",
          "LED light therapy is sometimes added to head spa or scalp treatments. There has been some research into low-level light for hair thinning, but the evidence is still developing and results vary. If LED is offered, ask what device is used and what you can realistically expect, and treat it as an optional extra rather than a medical treatment.",
          "Be careful, too, of pressure to buy long courses up front or large bundles of products on your first visit.",
        ],
      },
      {
        heading: "Questions to ask before you book",
        body: [
          "- What training have you had in head spa or scalp treatments?\n- What does the treatment include, and how long is the hands-on time?\n- What products do you use, and can I see the ingredients?\n- How do you adapt the treatment if I have sensitive skin or a scalp condition?\n- What should I do before and after my appointment?",
          "It is also worth asking about the booking and cancellation policy, and whether the treatment can be adjusted if you have neck or back problems, are pregnant, or find lying back uncomfortable.",
        ],
      },
      {
        heading: "When to see a GP instead",
        body: [
          "Do not book a cosmetic scalp treatment as a substitute for medical care if you have sudden or patchy hair loss, pain or burning, marked redness or pus, shiny or scarred-looking patches, loss of eyebrows or lashes, rapid loss, or hair loss alongside tiredness, weight change or other symptoms. Hair loss in a child also needs a doctor's opinion.",
          "Your GP can assess you, arrange tests and refer you to a dermatologist through the HSE or the NHS where needed.",
        ],
      },
      {
        heading: "After your treatment",
        body: [
          "Most people feel relaxed and comfortable after a head spa or scalp treatment. Mild redness from massage usually fades quickly. If you notice lasting redness, itching, stinging or a rash in the hours or days afterwards, it may be a reaction to a product. Rinse the scalp with cool water, avoid further products and let the provider know. If symptoms are severe or do not settle, speak to a pharmacist or your GP.",
          "It is also worth noticing how your scalp feels over the following weeks. That will help you decide whether the treatment suits you and how often, if at all, you would like to return.",
        ],
      },
      {
        heading: "Finding a provider",
        body: [
          "Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK. You can use it to compare head spa therapists and scalp specialists near you and see the kind of care each one offers.",
        ],
      },
    ],
    faqs: [
      {
        q: "What should I look for in a head spa?",
        a: "Look for a therapist who asks about your health and allergies before starting, explains each step and the price clearly, keeps a clean treatment area, checks comfort as they work and answers questions honestly. Be wary of anyone who promises that a cosmetic treatment will cure hair loss or treat a medical condition.",
      },
      {
        q: "Does LED scalp therapy work?",
        a: "The evidence for LED or low-level light on the scalp is still developing, and results vary between people and devices. It should not be presented as a cure. If you have hair loss, see your GP first to check for a medical cause, and treat LED as an optional extra rather than a replacement for medical care.",
      },
      {
        q: "Is a head spa safe during pregnancy?",
        a: "Many people enjoy head spa treatments while pregnant, but tell your therapist when you book. They may adjust your position, the length of the session, steam and the products they use. If you have any complications or concerns, check with your midwife, obstetrician or GP before booking.",
      },
      {
        q: "How do I prepare for a scalp treatment?",
        a: "Arrive with your hair as it normally is unless the provider asks otherwise, and avoid heavy styling products on the day. Let them know about any allergies, skin conditions, medicines or recent treatments such as colouring. Tell them if lying back is uncomfortable so they can adapt the set-up.",
      },
    ],
    related: { discipline: "cosmetic", glossary: ["head-spa", "led-light-therapy", "scalp-microbiome"] },
  },

  // 5
  {
    slug: "hair-shedding-when-to-worry",
    title: "Hair shedding: what's normal and when to get help",
    description:
      "How much hair shedding is normal, common reasons it increases, signs that need a GP or dermatologist, and practical steps while you wait for answers.",
    audience: "public",
    category: "Hair loss",
    readingMinutes: 6,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "Everyone loses some hair every day, and seeing hairs in the shower or on your brush is not a sign that something is wrong. But shedding can increase for many reasons, and some patterns do need a closer look. This guide explains what is normal, what can change it and when to get help.",
    sections: [
      {
        heading: "Why we shed hair at all",
        body: [
          "Each hair on your head grows for a number of years, rests for a few months and then falls out, making way for a new hair from the same follicle. This is called the hair growth cycle. Because follicles are all at different stages, a steady trickle of hairs is shed every day.",
          "Losing somewhere in the region of 50 to 100 hairs a day is commonly cited as normal. The exact number varies between people and from day to day. You may notice more on days you wash or brush your hair, simply because loose hairs are released all at once.",
        ],
      },
      {
        heading: "Common reasons shedding increases",
        body: [
          "Shedding can go up for a period of time for a range of reasons, including:",
          "- A recent illness, especially one with a high temperature.\n- Surgery, an accident or a stressful life event.\n- Having a baby.\n- Rapid weight loss or a very restrictive diet.\n- Low iron stores or other nutritional gaps.\n- Thyroid problems.\n- Starting, stopping or changing some medicines, including hormonal contraception.",
          "After a trigger like illness or childbirth, shedding usually shows up two to three months later. This is known as telogen effluvium, and in many cases it settles on its own once the cause has passed. Seasonal changes in shedding are also often described.",
        ],
      },
      {
        heading: "Shedding, thinning and breakage are different",
        body: [
          "Shedding means whole hairs coming out from the root, often with a tiny pale bulb at one end. Breakage means hairs snapping along their length, which often leaves short, uneven pieces. Breakage is usually linked to heat, chemical treatments, tight styles or rough handling.",
          "Thinning describes a gradual loss of density, such as a wider parting or more visible scalp at the crown. Pattern thinning often happens slowly and may not involve dramatic shedding at all. Knowing which of these you are seeing helps any professional understand what is going on.",
        ],
      },
      {
        heading: "When to see your GP",
        body: [
          "Make an appointment with your GP if you notice any of the following:",
          "- Sudden patchy hair loss or smooth bald patches.\n- Pain, burning, marked redness, pus or sores on the scalp.\n- Shiny or scarred-looking areas of scalp.\n- Loss of eyebrows, eyelashes or body hair.\n- Rapid loss, or heavy shedding that continues beyond about six months.\n- Hair loss with other symptoms, such as tiredness, feeling cold, weight change, palpitations or irregular periods.\n- Any hair loss in a child.",
          "Your GP can examine you, arrange blood tests such as iron stores and thyroid function, and refer you to a dermatologist through the HSE or the NHS if needed.",
        ],
      },
      {
        heading: "What you can do in the meantime",
        body: [
          "While you wait for an appointment or for shedding to settle, be gentle with your hair. Use a wide-toothed comb, avoid very tight styles and limit high heat. Keep washing your hair as usual: washing does not cause hair to fall out, it simply releases hairs that were already loose.",
          "Eat regular, balanced meals and avoid starting supplements without advice, as some can cause harm in high doses. It can help to note when the shedding started and anything that happened in the months before, as this is useful for your GP.",
        ],
      },
      {
        heading: "Keeping track of changes",
        body: [
          "Shedding can be hard to judge from one day to the next, and worry can make it seem worse. Taking photographs of your parting and hairline every few weeks, in the same light and from the same angles, gives you a clearer view of whether things are changing. A short note of when shedding seemed heavier, and anything that happened around then, can also help your GP or a hair professional.",
        ],
      },
      {
        heading: "Where a hair professional fits in",
        body: [
          "For gradual thinning, breakage or ongoing scalp discomfort, a trichologist can assess your hair and scalp and help you understand what may be contributing. Trichollective's directory lists cosmetic, clinical and medical professionals across Ireland and the UK, and our guided tool can suggest which type might suit your concern. It does not give a diagnosis.",
        ],
      },
    ],
    faqs: [
      {
        q: "How many hairs a day is it normal to lose?",
        a: "Shedding in the region of 50 to 100 hairs a day is commonly cited as normal, although it varies between people and from day to day. You may see more on wash days because loose hairs come out together. A sudden, clear increase or patchy loss is worth mentioning to your GP.",
      },
      {
        q: "Does washing my hair make it fall out?",
        a: "No. Washing does not cause hair loss. It releases hairs that had already finished growing and were ready to shed, which is why you may see more hair in the shower if you wash less often. Keep washing as often as suits your scalp, and handle wet hair gently.",
      },
      {
        q: "When should I worry about hair shedding?",
        a: "See your GP if the loss is sudden or patchy, if your scalp is painful, red or inflamed, if you are losing eyebrows or lashes, if shedding lasts more than about six months, or if you have other symptoms such as fatigue or weight change. Hair loss in children should always be checked.",
      },
      {
        q: "Can low iron cause hair shedding?",
        a: "Low iron stores are one of the things doctors commonly check when someone has increased shedding. Your GP can test your ferritin, which reflects iron stores, along with other bloods. Do not start iron supplements without advice, as too much iron can be harmful and the cause of low levels is worth finding.",
      },
    ],
    related: { discipline: "clinical", glossary: ["hair-growth-cycle", "telogen-effluvium", "ferritin", "alopecia-areata"] },
  },

  // 6
  {
    slug: "scalp-care-basics",
    title: "Scalp care basics: a healthy scalp routine",
    description:
      "Simple, sensible scalp care: how often to wash, choosing products, handling build-up and flakes, protecting the scalp, and when an itchy scalp needs a GP.",
    audience: "public",
    category: "Scalp care",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "Your scalp is skin, and it benefits from the same steady, gentle care as the rest of your skin. A good routine does not need to be complicated or expensive. This guide covers the basics and explains when a scalp problem needs more than everyday care.",
    sections: [
      {
        heading: "Think of the scalp as skin",
        body: [
          "The scalp has more oil glands than most areas of skin, and it is covered by hair that traps oil, sweat, skin cells and product. That is why it can feel greasy, itchy or flaky when it is not cleansed often enough, and tight or irritated when it is scrubbed too hard.",
          "A healthy scalp usually feels comfortable. It should not be persistently itchy, sore, red or heavily flaked. Some variation is normal, for example with the seasons or during stressful periods.",
        ],
      },
      {
        heading: "How often to wash",
        body: [
          "There is no single right answer. People with an oily scalp, fine hair or who exercise often may prefer to wash daily or every other day. People with dry, curly, coily or textured hair often wash less frequently. The best routine is one that keeps your scalp comfortable and clean without leaving it tight or irritated.",
          "When you wash, focus the shampoo on the scalp rather than the lengths, massage gently with your fingertips rather than your nails, and rinse thoroughly. Leftover shampoo and conditioner can contribute to itching and build-up.",
        ],
      },
      {
        heading: "Choosing products",
        body: [
          "Choose a shampoo that suits your scalp rather than your hair alone. A few general pointers:",
          "- If your scalp is sensitive, look for simpler, fragrance-free products and introduce new ones one at a time.\n- Apply conditioner mainly to the mid-lengths and ends unless the product is designed for the scalp.\n- Use heavy oils, butters and dry shampoo in moderation, and wash them out regularly.\n- For flaking, a pharmacist can suggest a medicated shampoo, which usually needs to stay on the scalp for a few minutes before rinsing.",
          "Be cautious of products that promise to detox the scalp or rebalance your microbiome. The scalp microbiome is an active research area and specific claims often go beyond the evidence.",
        ],
      },
      {
        heading: "Build-up, flakes and itching",
        body: [
          "Mild flaking is common and often responds to regular washing and a pharmacy dandruff shampoo. Build-up from styling products can be lifted with a clarifying wash from time to time.",
          "Persistent flaking with redness, greasy yellowish scale or itching may be seborrhoeic dermatitis. Thick, well-defined, silvery patches that extend past the hairline may be scalp psoriasis. Both are common and treatable, and your GP can confirm what is going on and suggest treatment.",
        ],
      },
      {
        heading: "A simple routine to start with",
        body: [
          "If you are not sure where to begin, a straightforward routine is a good starting point:",
          "- Wash as often as keeps your scalp comfortable, focusing shampoo on the scalp.\n- Rinse thoroughly, then condition the lengths.\n- Every week or two, use a clarifying wash if you use a lot of styling product.\n- Brush or comb gently, starting at the ends and working up.\n- Change pillowcases, brushes and hats regularly, and keep your own brushes to yourself.",
          "Give any change a few weeks before judging it, and change one thing at a time so you can tell what makes a difference.",
        ],
      },
      {
        heading: "Protecting your scalp",
        body: [
          "The scalp can burn in the sun, particularly along a parting or where hair is thin. A hat is the simplest protection on bright days. Keep heat tools off the scalp, and avoid very tight styles, which can pull on the follicles over time.",
          "When colouring or using chemical treatments, follow patch test advice every time, even with a product you have used before, as allergies can develop.",
        ],
      },
      {
        heading: "When to see a GP",
        body: [
          "See your GP if your scalp is painful, burning or very itchy, if you have marked redness, pus, open sores or crusting, if patches look shiny or scarred, or if you notice hair loss alongside scalp symptoms. Sudden patchy loss, loss of eyebrows or lashes, rapid loss, symptoms in a child, and hair changes with other symptoms such as tiredness or weight change also need a doctor's opinion.",
        ],
      },
      {
        heading: "Getting support",
        body: [
          "Stylists, head spa therapists and trichologists can all help with everyday scalp care. Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, so you can find the right kind of support near you.",
        ],
      },
    ],
    faqs: [
      {
        q: "How often should I wash my scalp?",
        a: "It depends on your scalp and hair type. Oily scalps and fine hair often feel best washed daily or every other day, while dry or textured hair may need washing less often. Aim for a routine that keeps your scalp comfortable, and always rinse shampoo and conditioner out thoroughly.",
      },
      {
        q: "What causes an itchy scalp?",
        a: "Common causes include product build-up, not rinsing well, dryness, dandruff, seborrhoeic dermatitis, psoriasis, reactions to hair products or dyes, and head lice. If itching persists despite gentle care and a pharmacy shampoo, or comes with redness, soreness or hair loss, see your GP.",
      },
      {
        q: "Is dandruff the same as a dry scalp?",
        a: "Not quite. A dry scalp tends to produce small, fine flakes and a tight feeling. Dandruff flakes are often larger and may look slightly oily, and dandruff is linked with a common yeast on the skin. A pharmacist can help you choose a suitable shampoo, and your GP can help if it does not settle.",
      },
    ],
    related: { discipline: "cosmetic", glossary: ["seborrhoeic-dermatitis", "scalp-psoriasis", "scalp-microbiome", "head-spa"] },
  },

  // 7
  {
    slug: "hair-loss-after-stress-or-illness",
    title: "Hair loss after stress, illness or having a baby",
    description:
      "Why hair can shed heavily a few months after stress, illness or childbirth, how long it usually lasts, what helps, and when to see your GP about it.",
    audience: "public",
    category: "Hair loss",
    readingMinutes: 6,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "Many people notice their hair falling out in larger amounts a few months after a difficult time, such as a bad illness, an operation, a stressful period or having a baby. This kind of shedding is common and often temporary. This guide explains why it happens, what to expect and when to get it checked.",
    sections: [
      {
        heading: "What is happening to your hair",
        body: [
          "Most of the hairs on your head are in a growing phase at any one time, and a smaller number are resting before they fall out. A shock to the body can push many more hairs into the resting phase at the same time. A few months later, those hairs shed together.",
          "Doctors call this telogen effluvium. Telogen is the name of the resting phase, and effluvium means shedding. It is not the same as pattern hair loss or patchy conditions such as alopecia areata, and it does not usually cause bald patches.",
        ],
      },
      {
        heading: "Common triggers",
        body: [
          "Triggers can be physical or emotional. They include:",
          "- An illness with a high temperature, including viral infections.\n- Surgery, an accident or a stay in hospital.\n- Having a baby, which is why many people notice shedding a few months after giving birth.\n- A significant stressful event or a long period of strain.\n- Rapid weight loss or a very restricted diet.\n- Starting or stopping some medicines, including hormonal contraception.",
          "Sometimes there is no single obvious trigger, and sometimes more than one factor plays a part. Low iron stores or a thyroid problem can cause or prolong shedding, which is why blood tests are often useful.",
        ],
      },
      {
        heading: "The timing: why it catches people out",
        body: [
          "Shedding usually begins two to three months after the trigger. By then, the illness or stressful event may have passed, so it can be hard to make the link. It often helps to think back over the previous few months and note anything significant.",
          "You may see more hair in the shower, on your pillow or in your brush, and your ponytail may feel thinner. Hair usually comes out evenly from across the scalp rather than in one area.",
          "It can help to keep a short note of what you have noticed and when. Include the date the shedding started, any illness, operation, stressful event or change in medicines in the months before, and whether anything seems to make it better or worse. This makes it much easier for your GP or a hair professional to understand what may be going on.",
        ],
      },
      {
        heading: "How long it lasts",
        body: [
          "In many cases the shedding settles within about six months once the trigger has passed. Regrowth then follows gradually, and because hair grows slowly it can take many months before your hair looks as full as it did. Short new hairs around the hairline are often an early sign of regrowth.",
          "For some people shedding goes on for longer than six months. This is worth discussing with your GP, as ongoing shedding can sometimes point to another cause that needs attention.",
        ],
      },
      {
        heading: "When to see your GP",
        body: [
          "See your GP if shedding is heavy or lasts longer than about six months, or if you notice any of these signs:",
          "- Patchy loss, smooth bald areas or loss of eyebrows or lashes.\n- Pain, burning, marked redness, pus or scarring on the scalp.\n- Very rapid loss.\n- Other symptoms such as fatigue, feeling cold, palpitations, weight change or irregular periods.\n- Hair loss in a child.",
          "Your GP can check for things such as low iron, thyroid problems and other causes, and refer you to a dermatologist through the HSE or the NHS if needed. If you are pregnant or have recently had a baby, your GP, midwife or public health nurse can also help.",
        ],
      },
      {
        heading: "Looking after yourself and your hair",
        body: [
          "Be gentle with your hair while it is shedding. Use a wide-toothed comb, avoid tight styles, and keep heat and chemical treatments to a minimum. Washing will not make the shedding worse.",
          "Regular, balanced meals support your general health. Avoid starting supplements, particularly iron, without advice from your GP or pharmacist. Shedding can be upsetting, and it is fine to ask for support with how it makes you feel.",
          "A trichologist or experienced stylist can suggest ways to care for and style your hair while it recovers. Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK if you would like that support.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does stress really cause hair loss?",
        a: "A major stressful event or a long period of strain can trigger a type of temporary shedding called telogen effluvium. It usually shows up two to three months after the stressful time. In many cases it settles on its own, but see your GP if it is heavy, lasts more than six months or comes with other symptoms.",
      },
      {
        q: "When does hair loss after having a baby start and stop?",
        a: "Shedding after childbirth often becomes noticeable a few months after the birth. For many people it gradually settles over the following months, and regrowth follows. If it continues, seems severe or comes with tiredness or other symptoms, speak to your GP, who may check your iron and thyroid function.",
      },
      {
        q: "Will my hair grow back after telogen effluvium?",
        a: "Telogen effluvium does not destroy hair follicles, so regrowth usually follows once the trigger has passed. Hair grows slowly, so it can take many months to look full again. If shedding continues beyond about six months, or you notice patches, scarring or other symptoms, see your GP to look for other causes.",
      },
      {
        q: "Should I take supplements for hair shedding?",
        a: "Do not start supplements without advice. Your GP can check for low iron stores, vitamin levels and thyroid problems with a blood test. If something is low, they can recommend the right treatment and dose. Some supplements, including iron, can be harmful if taken when you do not need them.",
      },
    ],
    related: { discipline: "clinical", glossary: ["telogen-effluvium", "hair-growth-cycle", "ferritin", "alopecia"] },
  },

  // 8
  {
    slug: "first-trichology-appointment",
    title: "Your first trichology appointment: what to expect",
    description:
      "What happens at a first trichology appointment, how to prepare, the questions you may be asked, what to ask in return, and what happens afterwards.",
    audience: "public",
    category: "Choosing a professional",
    readingMinutes: 5,
    published: "2026-09-30",
    reviewer: null,
    intro:
      "Booking a first appointment about your hair or scalp can feel like a big step, especially if you have been worrying for a while. Knowing what to expect makes it easier to relax and get the most from the visit. This guide walks through a typical first trichology consultation.",
    sections: [
      {
        heading: "Before you go",
        body: [
          "A little preparation helps your trichologist build an accurate picture. It is useful to bring or note down:",
          "- When you first noticed the change and how it has developed since.\n- Any illness, surgery, pregnancy, stressful events or diet changes in the past year.\n- Medicines and supplements you take, including recent changes.\n- Results of any recent blood tests from your GP.\n- The products you use and how often you wash, colour, style or use heat.\n- Photos of your hair from before the change, if you have them.",
          "Unless you are told otherwise, arrive with your hair as it usually is, without heavy styling products. Ask the clinic whether they would like you to wash your hair beforehand or leave it unwashed.",
        ],
      },
      {
        heading: "The conversation",
        body: [
          "A first appointment often starts with a detailed conversation. Your trichologist will ask about your hair history, general health, family history of hair loss, diet, stress and lifestyle. For women, they may ask about periods, pregnancy and menopause, as hormonal changes can affect hair.",
          "Some of these questions can feel personal. They are asked because hair is sensitive to what is happening elsewhere in the body. You can always say if you would prefer not to answer something.",
        ],
      },
      {
        heading: "The examination",
        body: [
          "Your trichologist will look closely at your scalp and hair. Many use a magnifier or scalp camera, which lets them see the skin, the follicle openings and the thickness of individual hairs. This is painless. They may gently pull on a small section of hair to see how easily it sheds, and look at the length and condition of the hair.",
          "Some clinics take photographs from set positions so that changes can be compared at later visits.",
        ],
      },
      {
        heading: "What happens next",
        body: [
          "Your trichologist should explain what they have found in plain language, what they think may be contributing and what they suggest. This might include changes to your routine, in-clinic treatments, products or a follow-up visit to review progress.",
          "If they think a medical cause is possible, they should recommend that you see your GP, who can arrange blood tests or a referral to a dermatologist through the HSE or the NHS. This is a sign of good practice, not a reason to worry. Trichologists are not usually medical doctors and cannot prescribe medicines or give a medical diagnosis. Trichology is also not statutorily regulated in Ireland or the UK, so it is reasonable to ask about their training and professional body membership.",
        ],
      },
      {
        heading: "Follow-up visits",
        body: [
          "If you and your trichologist agree a plan, you may be offered a follow-up appointment. Because hair grows slowly, reviews are often spaced a few months apart, which gives enough time for any change to become visible. Follow-ups are usually shorter and focus on comparing your hair and scalp with the first visit, often using the same photographs or scalp camera views.",
        ],
      },
      {
        heading: "Questions you might ask",
        body: [
          "- What do you think is contributing to my concern?\n- Do you think I should see my GP or a dermatologist?\n- What are you recommending, and why?\n- What results can I realistically expect, and over what time?\n- What will this cost in total, and can I stop at any point?",
          "A good trichologist will answer clearly and will not pressure you into a long course of treatment or expensive products at the first visit.",
        ],
      },
      {
        heading: "When not to wait for a trichology appointment",
        body: [
          "Some signs need a doctor rather than a trichologist first. See your GP promptly if you have sudden patchy loss, pain, burning, marked redness or pus on the scalp, shiny or scarred-looking patches, loss of eyebrows or lashes, rapid loss, or hair loss with other symptoms such as fatigue or weight change. Hair loss in a child should always be checked by a doctor.",
        ],
      },
      {
        heading: "Finding a trichologist",
        body: [
          "Trichollective's directory lists cosmetic, clinical and medical hair and scalp professionals across Ireland and the UK, including trichologists. You can use it to find someone near you and read about how they work before you book.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long is a first trichology appointment?",
        a: "First appointments are often longer than follow-ups, because they include a detailed history and a close examination of the hair and scalp. Many last around an hour, though this varies between clinics. Ask when you book so you can plan your time and bring any notes, test results and product details.",
      },
      {
        q: "Should I wash my hair before seeing a trichologist?",
        a: "Ask the clinic when you book, as preferences differ. Some trichologists like to see the scalp as it normally is, a day or two after washing, while others are happy either way. Avoid heavy styling products on the day so the scalp and hair can be examined clearly.",
      },
      {
        q: "Will a trichologist do blood tests?",
        a: "Most trichologists do not take blood themselves. If they think tests such as iron stores or thyroid function would help, they will usually suggest you ask your GP. Bring any recent results to your appointment, as they can help the trichologist understand what may be affecting your hair.",
      },
    ],
    related: { discipline: "clinical", glossary: ["trichologist", "trichoscopy", "dermatologist", "ferritin"] },
  },
];

export function guideBySlug(slug: string) {
  return guides.find((g) => g.slug === slug);
}
