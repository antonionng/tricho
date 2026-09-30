export type GlossaryTerm = {
  slug: string;
  term: string;
  /** One sentence. Used as the meta description and the list preview. */
  short: string;
  body: string[];
  /** Related glossary slugs. */
  see: string[];
};

export const glossary: GlossaryTerm[] = [
  {
    slug: "alopecia",
    term: "Alopecia",
    short:
      "Alopecia is the general medical word for hair loss, whatever the cause, and it covers many different conditions.",
    body: [
      "Alopecia simply means hair loss. On its own the word does not tell you the cause, how much hair is affected or whether the loss is likely to be temporary or permanent. Doctors add a second word to describe the type, such as androgenetic alopecia, alopecia areata or traction alopecia.",
      "Some forms of alopecia are common and gradual, while others appear suddenly or affect the skin of the scalp itself. Because the causes are so varied, the right next step depends on the pattern of loss, how quickly it has happened and whether there are other symptoms.",
      "If your hair loss is sudden, patchy, painful, itchy or inflamed, or if it comes with other symptoms such as tiredness or weight change, see your GP. They can arrange blood tests and, where needed, a referral to a dermatologist through the HSE in Ireland or the NHS in the UK.",
    ],
    see: ["androgenetic-alopecia", "alopecia-areata", "scarring-alopecia", "telogen-effluvium"],
  },
  {
    slug: "androgenetic-alopecia",
    term: "Androgenetic alopecia",
    short:
      "Androgenetic alopecia is the common inherited pattern of hair thinning seen in both men and women, often called male or female pattern hair loss.",
    body: [
      "Androgenetic alopecia is the most common type of hair loss. It is influenced by genes and by the way hair follicles respond to hormones called androgens. Over time, affected follicles produce finer, shorter hairs, a process known as miniaturisation.",
      "In men it often shows as a receding hairline or thinning at the crown. In women it more often shows as gradual thinning over the top of the head, with a widening parting, while the front hairline usually stays in place. It tends to develop slowly over years rather than weeks.",
      "There are licensed treatments, and a GP, pharmacist or dermatologist can explain the options, their side effects and whether they suit you. Women with pattern thinning alongside irregular periods, acne or extra facial hair should mention this to their GP, as it can point to a hormonal cause worth checking.",
    ],
    see: ["alopecia", "hair-growth-cycle", "dermatologist", "trichoscopy"],
  },
  {
    slug: "alopecia-areata",
    term: "Alopecia areata",
    short:
      "Alopecia areata is an autoimmune condition that usually causes smooth, round patches of hair loss and can affect the scalp, beard, eyebrows or lashes.",
    body: [
      "In alopecia areata, the immune system affects the hair follicles, which stop producing hair for a time. The follicles are not destroyed, which is why hair can regrow, although the course is hard to predict and patches can come and go.",
      "It typically appears as one or more smooth, round bald patches that develop quickly. Some people notice short broken hairs at the edges of a patch. Less commonly it affects larger areas of the scalp or body hair, including eyebrows and eyelashes.",
      "Anyone with sudden patchy hair loss, and any child with hair loss, should see a GP. A GP can confirm what is happening and refer to a dermatologist where appropriate. Support from others who have been through it can also help, as the emotional impact is often significant.",
    ],
    see: ["alopecia", "dermatologist", "trichoscopy"],
  },
  {
    slug: "telogen-effluvium",
    term: "Telogen effluvium",
    short:
      "Telogen effluvium is a temporary increase in hair shedding that usually starts two to three months after a trigger such as illness, stress or childbirth.",
    body: [
      "Normally only a small share of scalp hairs are in the resting (telogen) phase at any one time. After a shock to the body, such as a high fever, surgery, a major illness, significant stress, a crash diet or having a baby, many more hairs can move into the resting phase together. They then fall out a few months later.",
      "Because of that delay, shedding usually starts two to three months after the trigger, which is why people often do not connect the two. Hair tends to come out evenly from all over the scalp rather than in patches. In many cases the shedding settles within about six months once the trigger has passed, and regrowth follows gradually.",
      "It is sensible to see your GP if shedding is heavy, lasts more than six months or comes with other symptoms such as fatigue, feeling cold or weight change. Blood tests can check for things such as low iron or thyroid problems, which can cause or prolong shedding.",
    ],
    see: ["hair-growth-cycle", "ferritin", "alopecia", "trichologist"],
  },
  {
    slug: "traction-alopecia",
    term: "Traction alopecia",
    short:
      "Traction alopecia is hair loss caused by repeated pulling on the hair, often from tight braids, ponytails, extensions or weaves.",
    body: [
      "When hair is pulled tightly for long periods, the follicles can become inflamed and damaged. It often shows first around the hairline and temples, where tension is greatest. Early signs can include tenderness, small bumps around the follicles and short broken hairs.",
      "Caught early, traction alopecia can often improve once the tension is reduced. If the pulling continues for years, the follicles can scar and the loss may become permanent. Changing styles regularly, loosening tight styles and giving the hair breaks between extensions can all reduce strain.",
      "A stylist or trichologist can help you spot early signs and suggest gentler styling. If you notice lasting thinning at the hairline, pain or inflammation, see your GP, who can refer you to a dermatologist if needed.",
    ],
    see: ["scarring-alopecia", "alopecia", "trichologist"],
  },
  {
    slug: "scarring-alopecia",
    term: "Scarring alopecia",
    short:
      "Scarring alopecia is a group of uncommon conditions in which inflammation destroys hair follicles, so early assessment by a dermatologist really matters.",
    body: [
      "In scarring (cicatricial) alopecia, inflammation damages hair follicles and replaces them with scar tissue. Once a follicle has scarred it cannot grow hair again. The aim of treatment is to calm the inflammation and slow or stop further loss.",
      "Signs can include redness or scaling around the follicles, itching, burning or tenderness, and areas where the scalp looks smooth and shiny with no visible follicle openings. Some types cause a slowly receding hairline or loss of eyebrows. Symptoms can be subtle at first.",
      "Because lost hair cannot be recovered, anyone with these signs should see a GP promptly and ask about referral to a dermatologist. A scalp biopsy is sometimes needed to confirm the diagnosis. Cosmetic treatments are not a substitute for medical care here.",
    ],
    see: ["dermatologist", "trichoscopy", "traction-alopecia", "alopecia"],
  },
  {
    slug: "hair-growth-cycle",
    term: "Hair growth cycle",
    short:
      "The hair growth cycle is the repeating pattern of growing, resting and shedding that every hair follicle goes through.",
    body: [
      "Each hair follicle cycles through phases. Anagen is the growing phase, which on the scalp usually lasts several years. Catagen is a short transition of a few weeks. Telogen is the resting phase, which lasts around three months, after which the old hair is shed and a new one begins to grow.",
      "Follicles cycle independently, so at any time most scalp hairs are growing and a smaller number are resting. That is why losing some hair every day is normal. Shedding in the region of 50 to 100 hairs a day is commonly cited as typical, although it varies from person to person and from day to day.",
      "Many types of hair loss can be understood as changes to this cycle. In telogen effluvium, more hairs than usual enter the resting phase at once. In androgenetic alopecia, the growing phase gradually shortens and hairs become finer.",
    ],
    see: ["telogen-effluvium", "androgenetic-alopecia", "alopecia"],
  },
  {
    slug: "trichologist",
    term: "Trichologist",
    short:
      "A trichologist is a specialist in hair and scalp health who assesses hair and scalp concerns and advises on care, but is not usually a medical doctor.",
    body: [
      "Trichologists look at the hair and scalp, take a detailed history and often use magnification to examine the scalp. They can give advice on hair and scalp care, recommend treatments within their scope and suggest when medical tests or a doctor's opinion are needed.",
      "Trichology is not a statutorily regulated profession in Ireland or the UK, which means the title is not protected by law. Training varies, so it is worth asking about a practitioner's qualifications and whether they belong to a recognised professional body with a code of conduct.",
      "Most trichologists are not doctors, so they cannot prescribe medicines or make a medical diagnosis. A good trichologist will work alongside your GP or a dermatologist and will refer you on when something needs medical attention.",
    ],
    see: ["dermatologist", "trichoscopy", "alopecia"],
  },
  {
    slug: "dermatologist",
    term: "Dermatologist",
    short:
      "A dermatologist is a medical doctor who specialises in conditions of the skin, hair and nails, including the scalp.",
    body: [
      "Dermatologists are fully qualified doctors who have gone on to specialist training in skin disease. Because the scalp is skin and hair grows from it, hair loss and scalp conditions fall within their field. They can diagnose, order tests, take biopsies and prescribe treatment.",
      "In Ireland and the UK, you usually see a dermatologist through a referral from your GP, either in the public system through the HSE or the NHS, or privately. Waiting times for public appointments can be long, so it helps to see your GP early if you are worried.",
      "A dermatologist is the right person for scarring or inflamed scalp conditions, sudden patchy loss, hair loss in children and anything that is not improving with simpler care.",
    ],
    see: ["trichologist", "scarring-alopecia", "alopecia-areata", "scalp-psoriasis"],
  },
  {
    slug: "trichoscopy",
    term: "Trichoscopy",
    short:
      "Trichoscopy is a painless close-up examination of the scalp and hair using a magnifying device called a dermatoscope.",
    body: [
      "During trichoscopy, a practitioner holds a handheld or digital magnifier against the scalp. It shows detail that cannot be seen with the naked eye, such as differences in hair thickness, the appearance of the follicle openings, scaling and the small blood vessels of the scalp.",
      "Dermatologists use trichoscopy to help tell different types of hair loss apart. Trichologists and some scalp-care professionals also use scalp cameras to look at the skin and track changes over time. Photographs taken at the same spots can make progress easier to compare.",
      "Trichoscopy is quick and does not hurt. On its own it does not always give a diagnosis, and a doctor may still recommend blood tests or, occasionally, a small scalp biopsy.",
    ],
    see: ["trichologist", "dermatologist", "scarring-alopecia"],
  },
  {
    slug: "seborrhoeic-dermatitis",
    term: "Seborrhoeic dermatitis",
    short:
      "Seborrhoeic dermatitis is a common skin condition that causes flaking, redness and itching on the scalp and other oily areas of the face and body.",
    body: [
      "Seborrhoeic dermatitis tends to affect areas with more oil glands, such as the scalp, eyebrows, the sides of the nose and behind the ears. It can cause greasy or yellowish scales, redness and itching. Dandruff is generally thought of as a milder form of the same process.",
      "It is linked with an overreaction of the skin to a yeast called Malassezia that lives on everyone's skin. It is not caused by poor hygiene and is not contagious. It often comes and goes, and may flare with stress, cold weather or illness.",
      "Medicated shampoos from a pharmacy help many people. If it does not improve, is very inflamed or spreads, see your GP, who can suggest stronger treatment or check whether another condition, such as scalp psoriasis, is involved.",
    ],
    see: ["scalp-psoriasis", "scalp-microbiome", "dermatologist"],
  },
  {
    slug: "scalp-microbiome",
    term: "Scalp microbiome",
    short:
      "The scalp microbiome is the community of bacteria, yeasts and other microbes that naturally live on the skin of the scalp.",
    body: [
      "Like all skin, the scalp is home to a mix of microbes. Most are harmless and some are thought to help keep the skin in balance. Researchers are interested in how changes in this community relate to conditions such as dandruff and seborrhoeic dermatitis.",
      "This is an active area of research, and much is still unknown. Be cautious of products or treatments that promise to rebalance your microbiome, as the evidence behind specific claims is often limited.",
      "In practical terms, gentle, regular cleansing that suits your scalp, rinsing products out well and avoiding harsh scrubbing are sensible habits. If you have ongoing itching, flaking or redness, a pharmacist or GP is a good first stop.",
    ],
    see: ["seborrhoeic-dermatitis", "head-spa"],
  },
  {
    slug: "head-spa",
    term: "Head spa",
    short:
      "A head spa is a relaxing scalp-care treatment, rooted in Japanese salon practice, that combines scalp cleansing, massage and conditioning.",
    body: [
      "A head spa treatment usually begins with a look at the scalp, sometimes with a scalp camera, followed by thorough cleansing, a slow scalp massage and conditioning of the hair. Many include steam, warm water rinses and time to rest. The approach grew out of Japanese salon culture, where care and attention to detail are central.",
      "Head spa is a cosmetic and relaxation treatment. It can leave the scalp feeling clean and the hair soft, and many people find it deeply calming. It is not a medical treatment and should not be presented as a cure for hair loss or scalp disease.",
      "If you have an inflamed, sore, broken or infected scalp, or any sudden hair loss, see a GP before booking. A good head spa therapist will ask about your health and suggest you get checked when something looks like it needs medical attention.",
    ],
    see: ["scalp-microbiome", "led-light-therapy", "trichologist"],
  },
  {
    slug: "scalp-psoriasis",
    term: "Scalp psoriasis",
    short:
      "Scalp psoriasis is a long-term immune-related skin condition that causes raised, scaly patches on the scalp, often with itching or soreness.",
    body: [
      "Psoriasis speeds up the turnover of skin cells, which build up into thickened patches called plaques. On the scalp these are often well defined, with a silvery or white scale, and may extend beyond the hairline onto the forehead, neck or behind the ears.",
      "It is not contagious. It can flare and settle over time, and some people also have psoriasis elsewhere on the body or joint pain. Scratching or picking at the scale can make it worse, and heavy scaling can sometimes lead to temporary hair shedding.",
      "Your GP can confirm the diagnosis and prescribe treatment, and can refer you to a dermatologist if it is severe or not responding. Gentle scalp care can make you more comfortable, but it does not replace medical treatment.",
    ],
    see: ["seborrhoeic-dermatitis", "dermatologist"],
  },
  {
    slug: "led-light-therapy",
    term: "LED light therapy",
    short:
      "LED light therapy uses low-level light, often red, on the scalp, and is offered in some salons and clinics, though evidence for it is still developing.",
    body: [
      "LED and low-level light devices shine light of particular wavelengths onto the scalp. They are offered as helmets, caps, handheld devices and salon treatments. The treatment is generally painless and does not heat the skin in the way a lamp might.",
      "There has been research into low-level light for some types of hair thinning, but the evidence is still developing, results vary between people and devices, and it is not a replacement for a medical assessment. It should not be described as a cure.",
      "If you are considering LED treatment, get any sudden, patchy or inflamed hair loss checked by a GP first. Ask the provider what the device is, what results you can realistically expect and whether there are reasons it may not suit you, such as light sensitivity or certain medicines.",
    ],
    see: ["head-spa", "androgenetic-alopecia", "trichologist"],
  },
  {
    slug: "ferritin",
    term: "Ferritin",
    short:
      "Ferritin is a protein that stores iron in the body, and a blood test for it is often used to check iron levels when someone has hair shedding.",
    body: [
      "Your body keeps a reserve of iron, mostly bound to a protein called ferritin. A ferritin blood test gives an idea of how full those iron stores are. Low levels can occur with heavy periods, pregnancy, some diets, blood loss or problems absorbing iron.",
      "Low iron stores are one of the things doctors commonly check when someone has increased hair shedding. Your GP may test ferritin alongside a full blood count, thyroid function and other bloods, depending on your symptoms.",
      "Do not start iron supplements without speaking to your GP or pharmacist first. Too much iron can be harmful, and supplements can hide the reason your levels were low in the first place, which is worth finding out.",
    ],
    see: ["telogen-effluvium", "hair-growth-cycle"],
  },
];

export function termBySlug(slug: string) {
  return glossary.find((t) => t.slug === slug);
}
