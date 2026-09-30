import type { Edition } from "./types";

const TEAM = "The Trichollective editorial team";
const PUBLISHED = "2026-09-30";

export const editionsB: Edition[] = [
  /* ------------------------------------------------------------------ */
  /* 5. Light and devices                                                */
  /* ------------------------------------------------------------------ */
  {
    number: 5,
    slug: "light-and-devices",
    title: "Light and devices",
    fade: "What the evidence does and doesn't say.",
    theme: "Devices & technology",
    standfirst:
      "Light panels, scopes and scanners now sit in many treatment rooms. This edition looks at what the research supports, where it runs out, and how to talk about equipment without overpromising.",
    coverImageKey: "clinic",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: PUBLISHED,
    pages: [
      {
        kind: "letter",
        title: "Looking closely at the light",
        blocks: [
          {
            type: "p",
            text: "Few questions come up in our conversations as often as this one: is it worth buying? A supplier has shown you a device, the demonstration was persuasive, and the finance terms look manageable. What you want is someone who will tell you plainly what the equipment can and cannot do.",
          },
          {
            type: "p",
            text: "That is the spirit of this edition. We have tried to set out the evidence as it stands, without enthusiasm and without cynicism. Some technologies have a reasonable body of research behind them for specific uses. Others have very little. Almost all of them are described, somewhere, in language that goes further than the research does.",
          },
          {
            type: "p",
            text: "You will find a careful look at light-based treatments, including why ultraviolet belongs under medical oversight. There is a practical guide to scopes and trichoscopy, a set of questions to put to any supplier, and some thoughts on describing devices to clients in words you can stand behind.",
          },
          {
            type: "p",
            text: "None of this is an argument against technology. A good scope can change a consultation, and a well-chosen device can have a sensible place in a treatment plan. The aim is simply that every purchase, and every promise, should rest on something solid.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Evidence",
        title: "What light can and cannot do",
        standfirst:
          "Low-level light is one of the most researched devices in hair care, and one of the most oversold. Ultraviolet is a different matter altogether.",
        imageKey: "clinic",
        blocks: [
          {
            type: "p",
            text: "Walk around any beauty trade show and you will see red light glowing from helmets, caps, hoods and handheld wands. The category goes by several names: low-level light therapy, low-level laser therapy, photobiomodulation, or simply LED. The names matter less than the questions underneath them. What is the device meant to do, for whom, and how do we know?",
          },
          { type: "h", text: "The research, in outline" },
          {
            type: "p",
            text: "Low-level light has been studied mainly in pattern hair loss. A number of trials have reported modest changes in hair counts or density over several months of regular use. The research also has well-known limits. Many studies are small or short, devices and settings vary widely, and some trials are funded by the companies selling the equipment. Researchers are still discussing how the light might act on the follicle, and which wavelengths, doses and schedules matter.",
          },
          {
            type: "p",
            text: "A fair summary, then, is that low-level light may help some people with some types of hair loss, and that results are variable and depend on consistent use. That is a long way from the language of regrowth and guarantees that often surrounds it.",
          },
          {
            type: "pull",
            text: "Low-level light may help some people with some types of hair loss. That is a long way from a guarantee.",
          },
          { type: "h", text: "What that means in the treatment room" },
          {
            type: "list",
            items: [
              "Establish the likely cause of the hair loss first. Light will not address thyroid disease, iron deficiency, scarring conditions or medication effects, and some of those need a doctor.",
              "Set expectations in writing. Say that response varies, that any change is usually gradual, and that stopping treatment may mean losing what was gained.",
              "Photograph and measure at baseline and at agreed intervals, under the same lighting and from the same angles, so that you and the client can judge progress honestly.",
              "Follow the manufacturer's instructions on eye protection, contraindications and photosensitising medication, and record that you have checked.",
            ],
          },
          { type: "h", text: "Ultraviolet is not the same thing" },
          {
            type: "p",
            text: "Ultraviolet light is used in dermatology, under medical supervision, for certain inflammatory skin conditions, which can include some that affect the scalp. It is also a known cause of sunburn, skin ageing and skin cancer. The dose that helps one person can harm another, particularly someone with fair skin, a history of skin cancer, or medication that makes the skin more sensitive to light.",
          },
          {
            type: "p",
            text: "For that reason, ultraviolet treatment of the scalp is not something to offer on the strength of a supplier's training day. It needs a clear clinical reason, proper training, and medical oversight wherever a condition is being treated. If a device on your shortlist emits ultraviolet, ask exactly what it is for, who should be operating it, and what your insurer says.",
          },
          {
            type: "callout",
            title: "A simple rule",
            text: "If a device is marketed to treat a medical condition, treat the purchase as a clinical decision. Check the regulatory status, your scope of practice and your insurance before you check the price.",
          },
          {
            type: "p",
            text: "Light-based devices can earn a place in a considered practice. They earn it through careful case selection, honest conversation and good records, not through the brochure.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Who holds the scope",
        intro:
          "Light panels and scalp scopes now appear in salons, clinics and consulting rooms alike. The same device means something quite different depending on who is using it, and why.",
        views: [
          {
            discipline: "cosmetic",
            heading: "Devices in the treatment room",
            blocks: [
              {
                type: "p",
                text: "In a salon or head spa, a scalp camera helps clients see what the therapist sees, and an LED panel may be offered as part of a relaxing treatment. Used well, a camera is a teaching tool: it shows build-up before cleansing and a cleaner scalp afterwards.",
              },
              {
                type: "p",
                text: "A camera image is not a diagnosis, and a therapist should never use one to tell a client what condition they have. Describe light treatments as part of the experience rather than as a cure, avoid claims the supplier cannot support, and if an image shows something unexpected, suggest a trichologist or GP.",
              },
              {
                type: "reveal",
                prompt:
                  "A scalp camera image shows redness and scaling around several follicles. What should the therapist say?",
                answer:
                  "Something factual and calm: that the scalp looks a little red and flaky in places, that it is worth having it looked at properly, and that a trichologist or GP can do that. With consent, the image can be saved to share with them.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "Trichoscopy in the clinic",
            blocks: [
              {
                type: "p",
                text: "For a trichologist, trichoscopy is one part of a structured examination. Standard views, consistent lighting and dated images allow change to be compared over time, and the findings are read alongside the history rather than instead of it.",
              },
              {
                type: "p",
                text: "Trichologists may also offer light-based treatments. The honest position is to explain what the research supports and for which conditions, where it runs out, and that responses vary. Some trichoscopic findings point towards conditions that need medical assessment, and these should prompt a referral to a GP or dermatologist rather than a course of treatment.",
              },
              {
                type: "quiz",
                question: "What makes trichoscopy images most useful for tracking change over time?",
                options: [
                  "Taking as many images as possible at each visit",
                  "Using the same sites, magnification and lighting each time, with dates recorded",
                  "Applying filters so that changes are easier to see",
                  "Comparing them with images from other clients",
                ],
                answer: 1,
                explain:
                  "Consistency is what makes comparison fair. Standard sites, settings and lighting, with clear dates and consent, let you see real change rather than differences in technique.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Devices with a medical purpose",
            blocks: [
              {
                type: "p",
                text: "Dermatologists use dermoscopy as part of diagnosis, alongside history, examination and sometimes blood tests or biopsy. Aesthetic doctors and nurses may offer device-based treatments within their clinical governance, and should be able to say what each device is intended for and what evidence supports that use.",
              },
              {
                type: "p",
                text: "Doctors are also well placed to see where a device could cause harm, for example when a medicine increases sensitivity to light or a skin condition may be aggravated by it. Clients should mention their medicines and conditions before starting a light-based treatment anywhere.",
              },
              {
                type: "checklist",
                title: "Before a light-based treatment",
                items: [
                  "Ask about medicines that may increase sensitivity to light",
                  "Ask about skin conditions, including any made worse by light",
                  "Check what the device is intended for and what the evidence supports",
                  "Explain that results vary and are not guaranteed",
                  "Record consent and the settings used",
                ],
              },
            ],
          },
        ],
      },
      {
        kind: "image",
        imageKey: "clinic",
        caption:
          "A device is only as useful as the assessment that comes before it. Most of the value in scalp work still sits in looking carefully and asking good questions.",
      },
      {
        kind: "article",
        kicker: "Assessment",
        title: "Seeing the scalp: scopes and trichoscopy",
        standfirst:
          "Magnification turns a vague impression into something you can describe, photograph and compare. Used well, it is the most useful device you will own.",
        imageKey: "hairDetail",
        blocks: [
          {
            type: "p",
            text: "Trichoscopy is the examination of the scalp and hair under magnification, usually with a handheld dermatoscope or a digital scope linked to a screen. Dermatologists use it as part of diagnosis. For cosmetic and clinical practitioners outside medicine, it has a different and equally valuable role: careful observation, clear documentation and better-informed referral.",
          },
          { type: "h", text: "What a scope helps you notice" },
          {
            type: "list",
            items: [
              "Variation in hair shaft thickness across an area, which is worth recording and discussing with a trichologist or doctor.",
              "Scale, redness or build-up around the follicles, and whether it is loose and flaky or thick and adherent.",
              "Broken hairs, short regrowing hairs and the pattern of any breakage along the shaft.",
              "Whether follicle openings look present and regular, or seem to be missing in places.",
              "The effects of styling, colour and heat on the hair shaft itself.",
            ],
          },
          {
            type: "pull",
            text: "A scope is for describing what you see, not for naming what it is.",
          },
          { type: "h", text: "Describing, not diagnosing" },
          {
            type: "p",
            text: "The hardest discipline with a scope is restraint. Images on a large screen can look dramatic, and clients naturally want to know what they mean. If you are not medically qualified, describe what you see in plain terms, explain what might be worth investigating, and refer where appropriate. Missing follicle openings, redness with pain or burning, and pustules are all reasons to recommend a medical opinion promptly.",
          },
          { type: "h", text: "Choosing a scope" },
          {
            type: "p",
            text: "Magnification is only one consideration. Consistent lighting, focus that holds steady on a curved scalp, software that stores images against a client record, and a sensible approach to data protection all matter as much. Ask to try the scope on several hair types and skin tones before buying, since contrast varies considerably.",
          },
          {
            type: "reveal",
            prompt: "Do I need consent to photograph a client's scalp?",
            answer:
              "Yes. Scalp images are personal data and may be health data. Explain why you are taking them, how they will be stored and for how long, and record the client's consent. Never share identifiable images, including in the Case Room, without explicit permission, and remove anything that could identify the person.",
          },
          {
            type: "callout",
            title: "Build a standard view",
            text: "Agree a fixed set of sites for every assessment, such as the frontal hairline, mid-scalp parting, crown and temples. The same views each time make comparison meaningful months later.",
          },
          {
            type: "p",
            text: "The best scope in the world will not replace a thorough history. Used alongside one, it gives you and your client a shared picture to discuss, and gives any professional you refer to a clear record of what you found.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Buying well",
        title: "How to read a supplier's claims",
        standfirst:
          "Marketing material is written to sell. A few careful questions will tell you how much of it is evidence and how much is enthusiasm.",
        blocks: [
          {
            type: "p",
            text: "Suppliers are not the enemy. Many are knowledgeable, supportive and honest about their products. But a brochure has a job to do, and that job is persuasion. Reading one well means separating three kinds of statement: what the device is, what it has been shown to do, and what someone hopes it will do.",
          },
          { type: "h", text: "Watch the verbs" },
          {
            type: "p",
            text: "Language tells you a great deal. Words such as “supports”, “may help” and “is associated with” usually signal modest or early evidence. Words such as “proven”, “cures”, “reverses” and “guaranteed” are claims that very few devices in this field could justify. Where you see the second kind, ask for the evidence behind it.",
          },
          {
            type: "pull",
            text: "Ask for the study, not the summary of the study.",
          },
          { type: "h", text: "What good evidence looks like" },
          {
            type: "list",
            items: [
              "Published research in a peer-reviewed journal, which you can read in full rather than as a quoted headline.",
              "Studies of the same device, or at least the same settings, rather than of the technology in general.",
              "A comparison group, so that change can be judged against people who did not receive the treatment.",
              "Participants who resemble your clients in age, sex, hair type and the kind of hair loss involved.",
              "A clear statement of who funded the work and of any side effects that were reported.",
            ],
          },
          { type: "h", text: "Before-and-after photographs" },
          {
            type: "p",
            text: "Photographs are the most persuasive and the least reliable part of most marketing. Changes in lighting, hair styling, camera angle and the time since the last wash can all transform an image. Ask whether photographs were taken under standard conditions, whether they are typical, and how many clients saw no visible change.",
          },
          { type: "h", text: "The practical questions" },
          {
            type: "p",
            text: "Evidence is only part of the decision. Training, servicing, warranty, running costs and the regulatory status of the device all affect whether it belongs in your practice. So does your insurance, which may not cover equipment used outside the scope you have declared.",
          },
          {
            type: "callout",
            title: "Take your time",
            text: "A good supplier will be happy for you to take information away and think. Pressure to sign on the day, or a discount that expires tonight, is itself useful information.",
          },
          {
            type: "p",
            text: "You will find a full checklist of questions a few pages on. Take it to your next demonstration and see how the conversation changes.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Tools",
        title: "Questions to ask before you buy",
        intro:
          "Work through the checklist at your next device demonstration, then test your ear for evidence language with three short questions.",
        blocks: [
          {
            type: "checklist",
            title: "Questions to ask before you buy",
            items: [
              "What exactly is this device intended to do, and for which clients?",
              "What is its regulatory status in the UK and Ireland, and for what intended use?",
              "Which published studies used this device, at these settings?",
              "Who funded those studies, and what side effects were reported?",
              "What are the contraindications, and who should not be treated?",
              "What training is included, and does it lead to a recognised certificate?",
              "Will my insurer cover me to use it within my scope of practice?",
              "What are the servicing, warranty and consumable costs over five years?",
              "Were the before-and-after images taken under standard conditions, and are they typical?",
              "Can I speak to existing users who were not selected by the supplier?",
            ],
          },
          {
            type: "quiz",
            question: "A brochure says a treatment is “associated with improved hair density”. What does that most reasonably mean?",
            options: [
              "The treatment has been proven to increase density",
              "Some studies observed a link between the treatment and improved density, but that alone does not show the treatment caused it",
              "The treatment will increase density for most clients",
              "The claim has been approved by a regulator",
            ],
            answer: 1,
            explain:
              "“Associated with” describes a link seen in data. It does not establish cause, size of effect or who is likely to respond. It is honest language, but it is modest language, and it should be passed on to clients in the same spirit.",
          },
          {
            type: "quiz",
            question: "Which of these is the strongest kind of evidence for a specific device?",
            options: [
              "A set of before-and-after photographs from the supplier's best clients",
              "A study of a similar technology from a different manufacturer",
              "A published, controlled trial of this device at the settings you would use",
              "Testimonials from practitioners who sell the device",
            ],
            answer: 2,
            explain:
              "A controlled trial of the same device, at the same settings, is the closest match to what you would actually offer. Photographs and testimonials can illustrate, but they cannot tell you how typical a result is.",
          },
          {
            type: "quiz",
            question: "Which wording would be most appropriate to use with a client?",
            options: [
              "“This will regrow your hair.”",
              "“This is clinically proven to stop hair loss.”",
              "“Some people see a gradual improvement, some don't, and we'll track it together with photographs.”",
              "“This works for everyone if you're consistent.”",
            ],
            answer: 2,
            explain:
              "The third option is accurate, sets realistic expectations and commits you to measuring progress. The others promise results that no device in this field can guarantee.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Conversation",
        title: "Describing devices to clients honestly",
        standfirst:
          "Clients cannot judge the research themselves. They rely on how you explain it, which makes your words part of the treatment.",
        blocks: [
          {
            type: "p",
            text: "Once a device is in the room, the temptation is to let it sell itself. It looks impressive, the client is curious, and you have made an investment you would like to see returned. This is exactly the moment when careful language matters most.",
          },
          { type: "h", text: "Start with the reason" },
          {
            type: "p",
            text: "Explain why you are suggesting the device for this person, based on what you found in the consultation. A recommendation tied to their own history and observations is more honest and more reassuring than a general description of what the technology does.",
          },
          { type: "h", text: "Say what is known and what is not" },
          {
            type: "p",
            text: "Most clients respond well to candour. You might say that research suggests some people see a modest improvement, that it tends to take months rather than weeks, and that you cannot predict in advance who will respond. It is also fair to say what the device will not do, and what else might be needed alongside it.",
          },
          {
            type: "pull",
            text: "Clients rarely feel let down by honesty. They feel let down by promises.",
          },
          { type: "h", text: "Phrases worth keeping" },
          {
            type: "list",
            items: [
              "“The evidence for this is encouraging but limited, so I'd like us to measure rather than guess.”",
              "“We'll take photographs today and again in three months, and decide together whether to continue.”",
              "“This isn't a substitute for seeing your GP about the blood tests we discussed.”",
              "“If it isn't helping, I'll tell you, and we'll stop.”",
            ],
          },
          { type: "h", text: "Phrases to retire" },
          {
            type: "p",
            text: "Avoid anything that implies certainty: guaranteed, proven, permanent, reverses, cures. Avoid comparisons with medical treatment unless you are qualified to make them. And avoid describing a device as medical-grade or clinical unless you can explain precisely what that means for this particular product.",
          },
          {
            type: "reveal",
            prompt: "A client asks, “Will this definitely work for me?” How might you answer?",
            answer:
              "Something like: “I can't promise that, and I'd be wary of anyone who did. Some people see a gradual improvement and some don't. What I can promise is that we'll measure it properly, and that I'll be honest with you about what we see.”",
          },
          {
            type: "callout",
            title: "Put it in writing",
            text: "Give clients a short written summary of what the treatment involves, what the realistic outcomes are, the likely number of sessions and costs, and when you will review progress together. It protects them and it protects you.",
          },
          {
            type: "p",
            text: "Honest description is not a lesser form of selling. Over time, it is what brings clients back and what makes them recommend you.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "At a glance",
        title: "Devices, in plain terms",
        rows: [
          { label: "Low-level light", value: "Studied mainly in pattern hair loss. Results vary and depend on consistent use. Set expectations and measure." },
          { label: "Ultraviolet", value: "Carries real skin risks. Needs a clinical reason, proper training and medical oversight where a condition is treated." },
          { label: "Scopes", value: "Excellent for observation and records. Describe what you see; refer rather than diagnose." },
          { label: "Photographs", value: "Standard sites, lighting and angles every time. Record consent and store securely." },
          { label: "Supplier claims", value: "Ask for the published study on this device, at these settings, and who funded it." },
          { label: "Client language", value: "“May help”, “some people”, “we'll measure it”. Never “guaranteed” or “proven to cure”." },
          { label: "Where to discuss", value: "Devices & Technology space, and the Case Room for anonymised cases." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 6. The business of scalp care                                        */
  /* ------------------------------------------------------------------ */
  {
    number: 6,
    slug: "the-business-of-scalp-care",
    title: "The business of scalp care",
    fade: "Pricing, menus and rebooking.",
    theme: "Business",
    standfirst:
      "Good care deserves a sound business behind it. This edition covers pricing, menus, rebooking and marketing that stays on the right side of the advertising codes.",
    coverImageKey: "headSpa",
    coverTone: "light",
    audience: ["cosmetic", "clinical"],
    published: PUBLISHED,
    pages: [
      {
        kind: "letter",
        title: "On being paid properly",
        blocks: [
          {
            type: "p",
            text: "Many people come to scalp care because they want to help. Fewer come to it because they love spreadsheets. That is entirely understandable, and it is also why so many skilled practitioners undercharge, overwork and quietly wonder whether the business is sustainable.",
          },
          {
            type: "p",
            text: "This edition is about the practical side of the work. We look at the consultation as something of value in its own right, at how to arrive at prices you can explain, and at how to build a menu that makes sense to the people reading it.",
          },
          {
            type: "p",
            text: "We also look at rebooking and aftercare, which can feel like selling when done badly and like continuity of care when done well. And we set out, in general terms, how the advertising codes in the UK and Ireland apply to what you say about your services.",
          },
          {
            type: "p",
            text: "Running a business well is not at odds with caring for clients. A practice that pays its way is one that can keep investing in training, equipment and time, and that is still there when a client needs it.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Practice",
        title: "The consultation is the product",
        standfirst:
          "The most valuable thing you offer is not a massage, a serum or a device. It is the hour in which you listen, look and think.",
        imageKey: "headSpa",
        blocks: [
          {
            type: "p",
            text: "Ask most practitioners what they sell and they will name treatments. Ask their most loyal clients what they value and the answer is often different: someone finally took the time to understand what was going on. The consultation is where your knowledge is most visible, and yet it is the part of the service most often given away.",
          },
          { type: "h", text: "Why a free consultation can undermine you" },
          {
            type: "p",
            text: "A free consultation tells clients, without meaning to, that the conversation is a preamble to the real product. It can attract people who are shopping around rather than seeking help, and it puts quiet pressure on you to convert the conversation into a sale. Charging for it, or folding its cost clearly into a first treatment, changes the tone for everyone.",
          },
          {
            type: "pull",
            text: "A free consultation tells clients the conversation is only a preamble. It is not.",
          },
          { type: "h", text: "What a paid consultation should include" },
          {
            type: "list",
            items: [
              "A structured history covering health, medication, diet, stress, styling habits and the timeline of any change.",
              "A visual assessment and, where you use one, a scope examination with photographs taken with consent.",
              "An honest explanation of what you have found, in plain language, including anything outside your scope.",
              "A written plan with options, likely timescales and costs, and no obligation to book.",
              "A referral letter or recommendation to see a GP, trichologist or dermatologist where appropriate.",
            ],
          },
          { type: "h", text: "Making the value visible" },
          {
            type: "p",
            text: "Clients value what they can see. A written summary sent after the appointment, a copy of the baseline photographs, and a clear note of what happens next all turn an intangible hour into something they can hold. They also give the client something useful to show their doctor if a referral is needed.",
          },
          {
            type: "callout",
            title: "Referral is part of the service",
            text: "Recommending that a client sees a doctor is not a lost sale. It is a professional outcome, and clients who are referred well tend to return and to recommend you. The referral network on the platform exists to make this easier across disciplines.",
          },
          {
            type: "p",
            text: "Pricing the consultation properly also frees you to be honest. If you are not relying on every conversation to end in a course of treatment, you can tell a client that they do not need one. Few things build trust faster.",
          },
          {
            type: "p",
            text: "Start by timing your consultations for a month, including the notes and follow-up you do afterwards. The number is usually larger than people expect, and it is the right starting point for a price.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Three consultations, three fees",
        intro:
          "Every discipline charges for its time and judgement. What the client is paying for, and what they should leave with, differs from one room to the next.",
        views: [
          {
            discipline: "cosmetic",
            heading: "The consultation before the service",
            blocks: [
              {
                type: "p",
                text: "In a salon or head spa, the consultation protects both the client and the business: it checks suitability, sets expectations and records consent. Some businesses include it in the price of a treatment and others charge for it separately, especially for longer scalp-focused appointments.",
              },
              {
                type: "p",
                text: "Whatever the model, the consultation should never become a diagnosis dressed up as a service. A cosmetic practitioner cannot sell a plan to treat a condition. When the consultation raises a question about hair loss or scalp health, the most valuable thing to offer is a clear suggestion to see a trichologist or GP, recorded on the client's card.",
              },
              {
                type: "quiz",
                question: "Which description of a paid scalp consultation stays within cosmetic scope?",
                options: [
                  "A diagnosis of the client's hair loss, with a treatment plan",
                  "An assessment of the scalp for treatment suitability, with referral where needed",
                  "A regrowth programme with a guaranteed outcome",
                  "Advice on which prescription treatment to buy",
                ],
                answer: 1,
                explain:
                  "A cosmetic consultation can assess suitability for treatment and describe what is seen. Diagnosis, promises of regrowth and advice on prescription medicines all fall outside cosmetic scope.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "The trichology fee",
            blocks: [
              {
                type: "p",
                text: "In trichology the consultation is often the main product: a long history, a careful examination and a written care plan. Because trichology is not statutorily regulated in the UK or Ireland, clients are also paying for trust, which is built through clear information about training, fees and what the appointment includes.",
              },
              {
                type: "p",
                text: "A trichologist should be open about review appointments and their cost, avoid selling treatment courses before the assessment is complete, and include referral in the plan wherever it is needed. A referral to a GP is not lost business. It is part of the service, and often the reason clients come back.",
              },
              {
                type: "checklist",
                title: "What the client should leave with",
                items: [
                  "A plain summary of what was found",
                  "A written care plan with realistic expectations",
                  "The cost and timing of any review",
                  "Any referral, with a letter where appropriate",
                ],
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Medical time, well spent",
            blocks: [
              {
                type: "p",
                text: "GP appointments are usually short and focused on diagnosis, investigations and treatment. Private dermatology and aesthetic medicine appointments tend to be longer and fee-paying, and aesthetic practitioners work under professional and advertising rules about how treatments may be promoted.",
              },
              {
                type: "p",
                text: "Doctors cannot offer everything clients want within the time they have, such as long conversations about hair care, styling or routine. Referring on to a trichologist or cosmetic professional for that support, with the client's agreement, is a good use of everyone's time and money, and keeps each discipline doing its own work.",
              },
              {
                type: "reveal",
                prompt: "Why can a referral from a doctor to a trichologist or stylist be good for the client?",
                answer:
                  "The doctor can focus on diagnosis and treatment, while the trichologist or stylist has time for routine, care and the practical questions that matter day to day. The client gets both, without paying for one discipline to do the other's work.",
              },
            ],
          },
        ],
      },
      {
        kind: "image",
        imageKey: "headSpa",
        caption:
          "The treatment is what the client feels. The consultation before it is what makes it the right treatment.",
      },
      {
        kind: "article",
        kicker: "Money",
        title: "Pricing and the menu",
        standfirst:
          "A price should be something you can explain in one calm sentence. A menu should be something a client can understand without you in the room.",
        blocks: [
          {
            type: "p",
            text: "Most pricing in beauty and wellness is set by looking at what others charge nearby. That tells you something about the market, but nothing about your costs, your training or the time a service actually takes. Start with your own numbers, and use local prices only as a check.",
          },
          { type: "h", text: "Working out a price" },
          {
            type: "list",
            items: [
              "Add up your fixed monthly costs: rent, insurance, software, equipment finance, professional fees and training.",
              "Decide how many hours you can realistically sell each month, allowing for admin, cleaning, notes and holidays.",
              "Divide one by the other to find what each hour must cover before you have paid yourself anything.",
              "Add what you need to earn per hour, then the product and consumable cost of each specific service.",
              "Include the time around the service, such as preparation, consultation notes and follow-up messages.",
            ],
          },
          {
            type: "pull",
            text: "Start with your own numbers. Use the prices down the road only as a check.",
          },
          { type: "h", text: "Structuring a menu" },
          {
            type: "p",
            text: "A good menu is short. It helps clients choose, rather than presenting them with every possible combination. Many scalp practices find a simple structure works well: a consultation, a small number of core treatments, and clearly described courses or add-ons.",
          },
          {
            type: "p",
            text: "Describe each service by what happens and how long it takes, not by adjectives. A client should be able to tell the difference between two treatments from the description alone. Avoid names that imply a medical result, and keep any mention of conditions for the consultation rather than the menu.",
          },
          { type: "h", text: "Courses and packages" },
          {
            type: "p",
            text: "Courses can make sense where a plan genuinely involves several sessions. Be clear about what happens if a client needs to stop early, and never present a course as a guarantee of outcome. Refund and cancellation terms should be written down and given before payment.",
          },
          {
            type: "quiz",
            question: "Which menu description is most appropriate for a cosmetic head spa treatment?",
            options: [
              "“Our signature regrowth ritual, clinically proven to thicken hair.”",
              "“A 60-minute scalp cleanse, steam and massage, followed by a conditioning treatment and blow-dry.”",
              "“The ultimate cure for thinning and dandruff.”",
              "“Medical-grade detox to reverse hair loss.”",
            ],
            answer: 1,
            explain:
              "The second option describes what happens and how long it takes, and makes no medical claim. The others promise results or imply medical effects that a cosmetic treatment should not claim.",
          },
          {
            type: "callout",
            title: "Review twice a year",
            text: "Costs change. Set two dates in the diary each year to revisit your numbers and adjust prices, with notice to existing clients. Small regular changes are easier for everyone than a large one after years of standing still.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Continuity",
        title: "Rebooking and aftercare that feel like care",
        standfirst:
          "The difference between selling and caring is often a matter of reason and timing. Recommend the next step because the plan calls for it, and say why.",
        blocks: [
          {
            type: "p",
            text: "Rebooking has a poor reputation among many practitioners, and understandably so. Most of us have been on the receiving end of a hard sell at a reception desk. But a client who leaves without a clear next step is often a client who drifts, and in scalp care, drift can mean a problem goes unnoticed.",
          },
          { type: "h", text: "Recommend from the plan" },
          {
            type: "p",
            text: "The most natural rebooking conversation follows from the consultation. If the plan agreed at the start involves a review in six weeks, then booking that review is simply keeping to what you both decided. Explain what you will look at next time and why the timing matters.",
          },
          {
            type: "pull",
            text: "If the plan calls for a review in six weeks, booking it is not a sale. It is keeping a promise.",
          },
          { type: "h", text: "Aftercare that is useful" },
          {
            type: "list",
            items: [
              "Give written aftercare that matches what you actually did, not a generic leaflet.",
              "Include what is normal after the treatment, what is not, and who to contact with a concern.",
              "Recommend products only where they serve the plan, and say plainly that they are optional.",
              "Send a short follow-up message a few days later asking how the scalp feels.",
              "Note in the client record anything they report, so the next appointment starts from there.",
            ],
          },
          { type: "h", text: "Retail without pressure" },
          {
            type: "p",
            text: "Retail can be part of good care when it genuinely supports what you are doing in the room. Offer one or two options, explain what each is for, and make it easy to say no. Clients who feel free to decline are far more likely to trust your recommendation next time.",
          },
          { type: "h", text: "When not to rebook" },
          {
            type: "p",
            text: "Sometimes the right advice is to pause. If a client is waiting for blood test results, or for a dermatology appointment, further cosmetic treatment may be unnecessary or unwise until they have answers. Say so, and offer to see them afterwards.",
          },
          {
            type: "reveal",
            prompt: "A client says, “I'll just call you when I need you.” What might you say?",
            answer:
              "Respect it, and leave the door open with a reason: “Of course. Based on what we saw today, I'd suggest a check in about six weeks so we can compare the photographs. I'll send you a note nearer the time, and you can decide then.”",
          },
          {
            type: "callout",
            title: "Ask permission to follow up",
            text: "Before sending reminders or offers, ask clients how and whether they would like to hear from you, and record their preference. Marketing messages need consent under data protection and electronic communications rules in both the UK and Ireland.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Tools",
        title: "A new-client welcome",
        intro:
          "First impressions shape everything that follows. Use this checklist to review how a new client is welcomed, from the first enquiry to the follow-up message.",
        blocks: [
          {
            type: "checklist",
            title: "Before, during and after the first visit",
            items: [
              "The booking confirmation says what the first visit involves, how long it takes and what it costs.",
              "A health and consent form is sent in advance, with a note on how the information is stored.",
              "Cancellation and refund terms are given in writing before any payment is taken.",
              "The client is asked whether they would like to arrive with hair washed or unwashed, and why.",
              "The room is ready early, so the appointment starts calmly and on time.",
              "The consultation happens before any treatment, and the client can ask questions without being rushed.",
              "The client leaves with a written summary, the agreed plan and clear aftercare.",
              "Any referral recommendation is explained, with written notes the client can take to their GP.",
              "Marketing preferences are asked for, not assumed.",
              "A follow-up message is sent within a few days to ask how the scalp feels.",
            ],
          },
          {
            type: "quiz",
            question: "What is the main purpose of charging for the consultation?",
            options: [
              "To discourage clients from booking",
              "To recognise the time and expertise involved, and remove pressure to convert every conversation into a sale",
              "To make the treatment itself cheaper",
              "Because clients expect to pay for everything",
            ],
            answer: 1,
            explain:
              "A paid consultation values the assessment properly and frees you to give honest advice, including advice that no treatment is needed.",
          },
          {
            type: "quiz",
            question: "A client is waiting for blood test results ordered by their GP. What is the most sensible approach?",
            options: [
              "Book a full course now so they don't lose momentum",
              "Tell them the tests are probably unnecessary",
              "Offer to see them once they have their results, and keep any interim care gentle and cosmetic",
              "Recommend supplements while they wait",
            ],
            answer: 2,
            explain:
              "Waiting for results is a good reason to pause and plan. Recommending supplements or discouraging tests goes beyond cosmetic practice and could mislead.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Standards",
        title: "Marketing within the rules",
        standfirst:
          "Advertising codes apply to your website, your social media and your price list. Staying within them is mostly a matter of saying what you do, not what you hope it will achieve.",
        blocks: [
          {
            type: "p",
            text: "Marketing in scalp care sits close to health. That makes it an area where regulators and advertising bodies pay attention, and where a well-meant post can cross a line. The principles are straightforward, even if the detail can be complex.",
          },
          { type: "h", text: "Which rules apply" },
          {
            type: "p",
            text: "In the UK, non-broadcast advertising, including websites and social media posts that promote your business, is covered by the CAP Code, which the Advertising Standards Authority enforces. In Ireland, the Advertising Standards Authority of Ireland publishes its own code, and consumer protection law, overseen by the Competition and Consumer Protection Commission, also applies. The detail differs, but the core expectation is shared: advertising should be legal, decent, honest and truthful, and claims should be backed by evidence.",
          },
          {
            type: "pull",
            text: "Say what you do, not what you hope it will achieve.",
          },
          { type: "h", text: "Where practitioners most often slip" },
          {
            type: "list",
            items: [
              "Claiming to treat, cure or reverse a medical condition, such as alopecia or psoriasis, without being qualified and able to prove it.",
              "Using before-and-after images that are edited, untypical or taken under different conditions.",
              "Describing treatments as “clinically proven” without robust evidence for that specific treatment.",
              "Sharing client testimonials that make claims you could not make yourself.",
              "Promoting prescription-only medicines, which is not permitted to the public in the UK or Ireland.",
            ],
          },
          { type: "h", text: "Testimonials and social media" },
          {
            type: "p",
            text: "A testimonial you publish becomes your claim. If a client writes that your treatment cured their hair loss, sharing that post puts you in the same position as if you had written it. Thank them warmly, and share something that describes their experience rather than a medical result. Posts by influencers or partners who receive anything in return need to be clearly labelled as advertising.",
          },
          { type: "h", text: "Writing that stays safe" },
          {
            type: "p",
            text: "Describe the service, the time it takes, the experience and your qualifications. Talk about the consultation, the care you take and when you refer. These are genuine strengths, and they need no exaggeration.",
          },
          {
            type: "callout",
            title: "When in doubt, check",
            text: "Both advertising bodies publish guidance on health and beauty claims, and the UK's CAP offers a free copy advice service. This article is a general overview, not legal advice. If a campaign matters to your business, take proper advice before it goes live.",
          },
          {
            type: "p",
            text: "The Business & Marketing space on the platform is a good place to ask peers how they have approached a particular piece of copy. Many of the best examples are refreshingly plain.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "At a glance",
        title: "The business, on one page",
        rows: [
          { label: "Consultation", value: "Charge for it, or fold it clearly into a first treatment. Always give a written summary." },
          { label: "Hourly cost", value: "Fixed monthly costs divided by realistically sellable hours, before you pay yourself." },
          { label: "Menu", value: "Short, plain and descriptive. What happens and how long, with no medical promises." },
          { label: "Courses", value: "Only where the plan needs several sessions. Written terms for stopping early." },
          { label: "Rebooking", value: "Recommend from the agreed plan, with a reason and a date." },
          { label: "Aftercare", value: "Specific to the treatment given, with who to contact if something feels wrong." },
          { label: "Advertising (UK)", value: "CAP Code, enforced by the Advertising Standards Authority." },
          { label: "Advertising (Ireland)", value: "ASAI Code, alongside consumer protection law." },
          { label: "Price review", value: "Twice a year, with notice to existing clients." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 7. Textured hair and traction                                        */
  /* ------------------------------------------------------------------ */
  {
    number: 7,
    slug: "textured-hair-and-traction",
    title: "Textured hair and traction",
    fade: "Care without assumptions.",
    theme: "Textured hair",
    standfirst:
      "Traction alopecia is common, often preventable and, caught early, often reversible. Caring for it well starts with understanding, respect and good questions.",
    coverImageKey: "portraitA",
    coverTone: "light",
    audience: ["cosmetic", "clinical", "medical"],
    published: PUBLISHED,
    pages: [
      {
        kind: "letter",
        title: "Care without assumptions",
        blocks: [
          {
            type: "p",
            text: "Many clients with textured hair have had experiences in salons and clinics that left them feeling judged, misunderstood or simply unseen. Some have been told their styling choices were the problem before anyone asked a single question. Others have been told nothing at all while a condition quietly progressed.",
          },
          {
            type: "p",
            text: "This edition is about doing better on both counts. Traction alopecia is a real and often preventable form of hair loss, and every practitioner who works with hair should be able to recognise its early signs. But recognition is only useful if it comes with respect, and with an understanding of why people choose the styles they do.",
          },
          {
            type: "p",
            text: "We explain what traction alopecia is and how tension builds over time. We look at how to hold a consultation that begins with curiosity rather than assumptions, and at gentler alternatives that clients can genuinely consider. We also set out, plainly, the signs that mean a client should see a doctor without delay.",
          },
          {
            type: "p",
            text: "We hope it is useful whether textured hair is the centre of your work or something you see only occasionally. Either way, every client deserves a practitioner who knows what to look for and how to ask.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "Understanding",
        title: "Traction alopecia, explained",
        standfirst:
          "Hair loss caused by repeated or prolonged pulling is common across many hair types and cultures. It is also one of the few forms of hair loss where early action can make a real difference.",
        imageKey: "portraitA",
        blocks: [
          {
            type: "p",
            text: "Traction alopecia is hair loss caused by tension on the hair follicle over time. It can follow tight braids, cornrows, locs, weaves, extensions, tight ponytails and buns, and the repeated use of heavy accessories or tight headwear. It is seen in people of every background, including dancers, athletes and anyone who regularly wears their hair pulled back firmly. It is more often discussed in relation to textured hair because some common styles for textured hair can place sustained tension on the follicles, especially at the hairline.",
          },
          { type: "h", text: "Where it tends to appear" },
          {
            type: "p",
            text: "The hairline at the temples and forehead is the most commonly affected area, because it takes the most strain in many styles. It can also appear around the ears, at the nape, or wherever extensions or tight partings are attached. Clinicians sometimes notice a thin line of short hairs retained along the very front of the hairline, with thinning just behind it. It is one of the features that can point towards traction.",
          },
          { type: "h", text: "Why timing matters" },
          {
            type: "p",
            text: "In its early stages, traction alopecia is often reversible. If the tension is reduced, the follicles can recover. With prolonged strain over many years, the follicles can be damaged permanently and replaced by scar tissue, and hair will no longer grow from those sites. This is why early, sensitive conversations matter so much.",
          },
          {
            type: "pull",
            text: "Early traction alopecia is often reversible. Long-standing traction may not be.",
          },
          { type: "h", text: "Early signs worth noticing" },
          {
            type: "list",
            items: [
              "Soreness, tenderness or a feeling of tightness after a style is put in.",
              "Small bumps or redness around the follicles at the hairline or partings.",
              "Short, broken hairs along the edges.",
              "Gradual thinning or recession at the temples, often on both sides.",
              "A widening of partings where tension is concentrated.",
            ],
          },
          {
            type: "p",
            text: "None of these signs alone means a client has traction alopecia, and other conditions can look similar. Your role, unless you are medically qualified, is to notice, describe, discuss and refer where needed. A dermatologist can confirm what is happening and assess whether any scarring is present.",
          },
          {
            type: "callout",
            title: "It is not a judgement",
            text: "Traction alopecia is a consequence of mechanics, not of a client's choices being wrong. Explaining it as a matter of tension, time and follicle health keeps the conversation practical and free of blame.",
          },
          {
            type: "p",
            text: "Most importantly, clients who understand the early signs can protect their own hair. A clear explanation, given kindly, may be the most useful thing you offer.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Tension, seen from three rooms",
        intro:
          "Traction alopecia begins in the styling chair and, left unchecked, may end in a dermatology clinic. Each discipline has a chance to help earlier.",
        views: [
          {
            discipline: "cosmetic",
            heading: "At the styling chair",
            blocks: [
              {
                type: "p",
                text: "Stylists and braiders see traction before anyone else: thinning at the edges, small bumps around follicles, tenderness after an installation. They also control the tension, the weight of extensions and the time between styles, which places them at the centre of prevention.",
              },
              {
                type: "p",
                text: "A stylist cannot diagnose traction alopecia, but can talk about tension without judgement, suggest looser or lighter styles and longer rest periods, and decline a style that would strain an already sore hairline. Where edges are thinning noticeably or the scalp is painful, suggest a trichologist or GP.",
              },
              {
                type: "checklist",
                title: "Checks at every installation",
                items: [
                  "Ask whether the last style felt tight or sore",
                  "Look at the hairline and edges before you start",
                  "Match weight and tension to the condition of the hair",
                  "Suggest a rest period between protective styles",
                  "Note any new thinning and suggest an assessment",
                ],
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "The styling history",
            blocks: [
              {
                type: "p",
                text: "A trichologist takes a detailed styling history: which styles, how often, for how long, and whether they hurt. Examination looks at the pattern of loss, at signs of inflammation around follicles, and at whether follicles still appear to be present.",
              },
              {
                type: "p",
                text: "Early traction may improve when tension is reduced, and a trichologist can build a care plan around that with the client, respecting their hair and their choices. A trichologist cannot treat inflammation medically. Where there are signs of scarring, ongoing inflammation or a pattern that suggests another cause, referral to a GP or dermatologist is the right step.",
              },
              {
                type: "quiz",
                question: "Which finding makes a dermatology referral more pressing?",
                options: [
                  "The client prefers to wear braids",
                  "Thinning at the edges that has improved since styles were loosened",
                  "Shiny patches along the hairline where follicles no longer seem visible",
                  "Mild tenderness on the day of installation only",
                ],
                answer: 2,
                explain:
                  "Shiny skin without visible follicles may point to scarring, which needs medical assessment. Improvement after loosening styles is encouraging, and brief tenderness is common, though still worth asking about.",
              },
            ],
          },
          {
            discipline: "medical",
            heading: "Diagnosis and treatment",
            blocks: [
              {
                type: "p",
                text: "A GP or dermatologist can confirm traction alopecia, look for other conditions that can appear similar, and sometimes take a biopsy. They can prescribe treatment for inflammation and discuss further options where hair loss is long-standing. Where scarring has occurred, they can explain honestly what may and may not be possible.",
              },
              {
                type: "p",
                text: "Good medical care here also depends on cultural competence: understanding textured hair and styling practices, rather than simply telling clients to stop wearing their hair a certain way. Medical teams benefit from working with stylists and trichologists who can suggest practical changes that clients are willing to make.",
              },
              {
                type: "reveal",
                prompt: "Why is \"stop braiding\" rarely helpful advice on its own?",
                answer:
                  "It overlooks what styles mean to the client, practically and culturally, and it is often not followed. Advice about tension, weight, duration and rest, worked out with the client and ideally with their stylist, is far more likely to help.",
              },
            ],
          },
        ],
      },
      {
        kind: "image",
        imageKey: "portraitA",
        caption:
          "Textured hair carries history, identity and a great deal of skill. Good care starts by respecting all three.",
      },
      {
        kind: "article",
        kicker: "Mechanics",
        title: "How styling tension builds up",
        standfirst:
          "Traction rarely comes from one appointment. It builds through small, repeated strains that are easy to overlook, and it can ease through changes that are just as small.",
        blocks: [
          {
            type: "p",
            text: "It is tempting to think of traction as the result of a single overly tight style. More often it is cumulative. A style that feels a little tight for the first few days, repeated back to back for years, can place more total strain on the follicles than one dramatic incident.",
          },
          { type: "h", text: "The factors that add up" },
          {
            type: "list",
            items: [
              "How tightly the hair is pulled at installation, especially at the edges.",
              "How long a style stays in, and how quickly the next one follows.",
              "The weight of added hair in extensions, braids or locs, particularly on fine edges.",
              "Repeated partings, attachments or clips in exactly the same place.",
              "Chemical treatments or heat that have already weakened the hair shaft.",
              "Tight headwear, wig bands or sports bands worn for long periods.",
            ],
          },
          {
            type: "pull",
            text: "A style that is a little tight, repeated for years, can do more than one that is painful once.",
          },
          { type: "h", text: "Pain is information" },
          {
            type: "p",
            text: "Many people have been taught that a new style should hurt, or that tightness is a sign of a neat, long-lasting result. Discomfort, headaches, small bumps or needing painkillers after a style is put in are all signs of excessive tension. Neither stylist nor client should treat pain as normal.",
          },
          { type: "h", text: "Gentler alternatives" },
          {
            type: "p",
            text: "Protective styles are valued for good reasons, including reducing daily manipulation and protecting the ends. The aim is not to discourage them but to make them gentler. Suggestions that clients often find workable include:",
          },
          {
            type: "list",
            items: [
              "Looser installation at the hairline, with the edges left out or braided more gently.",
              "Lighter or shorter extensions, especially where the edges are already thinning.",
              "Rest periods between styles, even of a week or two.",
              "Varying partings and attachment points from one style to the next.",
              "Softer headwear linings and bands that do not grip the hairline.",
              "Leaving longer-term styles in for a shorter period than before.",
            ],
          },
          {
            type: "callout",
            title: "For stylists",
            text: "Check in during installation, not only at the end. Asking “how does that feel at the front?” while you work gives clients permission to say it is too tight before the style is finished.",
          },
          {
            type: "p",
            text: "Small, sustainable changes are more likely to last than a dramatic change a client does not want. The best plan is the one they can actually follow.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Consultation",
        title: "The culturally competent consultation",
        standfirst:
          "Competence here means knowledge, humility and good questions. It does not mean pretending to know everything about every client.",
        imageKey: "portraitC",
        blocks: [
          {
            type: "p",
            text: "Cultural competence can sound like an abstract goal. In a consultation it is very concrete. It means knowing enough about textured hair, common styles and their care to ask sensible questions. It means recognising that hair can carry deep personal, cultural and sometimes professional meaning. And it means not assuming anything about a client based on how they look.",
          },
          { type: "h", text: "Start with curiosity" },
          {
            type: "p",
            text: "Begin by asking how the client usually wears their hair, what they enjoy about it, and what matters to them. A client who feels understood is much more likely to hear and act on concerns about tension. A client who feels their choices are being criticised may simply not come back.",
          },
          {
            type: "pull",
            text: "A client who feels understood will hear your concerns. A client who feels judged may not come back.",
          },
          { type: "h", text: "Know the basics" },
          {
            type: "list",
            items: [
              "Learn the common styles, how they are installed and roughly how long they are typically worn.",
              "Understand that textured hair can be more fragile at points along the shaft, and that dryness is common.",
              "Know that redness can look different on darker skin tones and may be harder to see without good lighting and magnification.",
              "Be aware that some conditions, including certain scarring alopecias, need particular vigilance, and refer when unsure.",
            ],
          },
          { type: "h", text: "Language that helps" },
          {
            type: "p",
            text: "Talk about tension and follicles, not about styles being bad. Avoid words such as unmanageable, difficult or messy. Offer options rather than instructions, and ask what would work in the client's life, which may include work, faith, family and cost.",
          },
          { type: "h", text: "Questions you might ask" },
          {
            type: "reveal",
            prompt: "How do you usually wear your hair, and what do you like about it?",
            answer:
              "An open question that shows interest in the client's preferences before any assessment. It often reveals how long styles are kept in and how often they are changed.",
          },
          {
            type: "reveal",
            prompt: "How does your scalp feel in the first few days after a new style?",
            answer:
              "This invites the client to describe tightness, soreness or headaches without framing them as a problem. It is often the most useful single question about tension.",
          },
          {
            type: "reveal",
            prompt: "Have you noticed any change at your edges or partings?",
            answer:
              "Many clients have noticed but have not been asked. Using their own words, such as edges, helps the conversation feel familiar rather than clinical.",
          },
          {
            type: "reveal",
            prompt: "Is there anything about your hair you'd like me to understand before I look?",
            answer:
              "This hands the client some control, and it may surface past experiences in salons or clinics that shape how they feel about the appointment.",
          },
          {
            type: "callout",
            title: "Admit what you don't know",
            text: "If a style or product is unfamiliar, say so and ask. Clients generally respect honesty far more than confident guesswork, and it models the openness you hope for from them.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Test yourself",
        title: "Traction, tension and referral",
        intro:
          "Three questions to check your understanding, and two conversations to think through before you next see a client with concerns about their edges.",
        blocks: [
          {
            type: "quiz",
            question: "Why is early recognition of traction alopecia important?",
            options: [
              "Because it always progresses quickly",
              "Because in its early stages it is often reversible if tension is reduced",
              "Because it can only be treated with medication",
              "Because it affects only one hair type",
            ],
            answer: 1,
            explain:
              "Early traction alopecia can often recover when tension is reduced. Prolonged strain can lead to permanent scarring, which is why noticing and discussing it early matters.",
          },
          {
            type: "quiz",
            question: "A client says a new style always hurts for the first few days. How should you understand this?",
            options: [
              "It is normal and a sign the style will last",
              "It is a sign of excessive tension worth discussing",
              "It only matters if the pain lasts more than a month",
              "It means the client has a sensitive scalp and nothing else",
            ],
            answer: 1,
            explain:
              "Pain, headaches or bumps after installation suggest the hair is under too much tension. It is worth talking through gentler options with the client and their stylist.",
          },
          {
            type: "quiz",
            question: "Which finding should lead to a prompt referral to a doctor?",
            options: [
              "Dry ends after a long-term style",
              "Short broken hairs after a heat treatment",
              "Smooth, shiny patches where follicle openings appear to be missing",
              "Slight frizz at the hairline",
            ],
            answer: 2,
            explain:
              "Areas that look smooth and shiny with missing follicle openings can suggest scarring. Scarring alopecias need medical assessment promptly, because early treatment may help limit further permanent loss.",
          },
          {
            type: "reveal",
            prompt: "A client becomes defensive when you mention tension at the hairline. What might you do?",
            answer:
              "Step back and acknowledge what they value about the style. Explain that you are describing what you see at the follicle, not criticising their choice, and offer small options, such as leaving the edges out next time, rather than asking them to stop.",
          },
          {
            type: "reveal",
            prompt: "A client asks whether their edges will grow back. How might you answer?",
            answer:
              "Be honest: “It depends on how long the tension has been there and whether there's any scarring, which I can't determine myself. A dermatologist can assess that. What we do know is that reducing tension now gives your hair the best chance.”",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Red flags",
        title: "When to refer",
        standfirst:
          "Some hair loss at the hairline or crown needs a medical opinion, and quickly. Knowing the signs is part of caring for textured hair well.",
        blocks: [
          {
            type: "p",
            text: "Not all hair loss in clients with textured hair is traction, and not all traction is uncomplicated. A number of conditions can look similar at first, including scarring alopecias that can cause permanent hair loss if not treated early. Some of these are seen more often in people of African and Caribbean heritage, and some begin at the crown rather than the hairline.",
          },
          { type: "h", text: "The scarring red flags" },
          {
            type: "p",
            text: "If you see any of the following, recommend that the client sees their GP and asks for a dermatology referral. Say it clearly and kindly, and write it down.",
          },
          {
            type: "list",
            items: [
              "Smooth, shiny skin where follicle openings appear to be missing.",
              "Hair loss that begins at the crown and spreads outwards.",
              "Pain, burning, tenderness or persistent itching on the scalp.",
              "Pustules, crusting, weeping or thick scale.",
              "Redness or darkening of the skin around the follicles, especially at the edge of a patch.",
              "Hair loss that is spreading despite reduced tension.",
              "Several hairs emerging from one opening, like a small tuft.",
            ],
          },
          {
            type: "pull",
            text: "Scarring hair loss is permanent. Early medical assessment may help limit it.",
          },
          { type: "h", text: "Why speed matters" },
          {
            type: "p",
            text: "Once scarring has occurred, the follicles in that area cannot regrow hair. Medical treatment aims to calm inflammation and slow or stop further loss. The earlier a dermatologist sees the client, the more hair there may be to protect.",
          },
          { type: "h", text: "How to make the referral" },
          {
            type: "list",
            items: [
              "Explain what you saw in plain words, and why you think a doctor should look.",
              "Avoid naming a condition unless you are medically qualified to diagnose it.",
              "Give the client a written note describing your observations, with dated photographs if they consent.",
              "Suggest they ask specifically for a dermatology referral, and mention any symptoms such as pain or itching.",
              "Offer to see them after their appointment to support their care within your scope.",
            ],
          },
          {
            type: "callout",
            title: "Pause cosmetic treatment",
            text: "Where you suspect a scarring condition, it is usually wise to pause cosmetic scalp treatments until the client has been assessed. Gentle, non-irritating care can continue with the doctor's agreement.",
          },
          {
            type: "p",
            text: "The referral network on the platform can help you find trichologists and doctors with experience of textured hair in your area. Anonymised cases can be discussed with verified professionals in the Case Room.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "At a glance",
        title: "Traction care, in brief",
        rows: [
          { label: "What it is", value: "Hair loss from prolonged or repeated tension on the follicle." },
          { label: "Where", value: "Most often the temples and front hairline; also nape, partings and attachment points." },
          { label: "Early signs", value: "Tenderness, bumps, broken edge hairs, gradual thinning at the temples." },
          { label: "Outlook", value: "Often reversible early. Long-standing strain can cause permanent scarring." },
          { label: "Gentler options", value: "Looser edges, lighter extensions, rest between styles, varied partings." },
          { label: "Consultation", value: "Start with curiosity. Talk about tension and follicles, never about styles being bad." },
          { label: "Refer promptly", value: "Shiny patches, crown-first loss, pain, burning, pustules, spreading despite less tension." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* 8. Dublin                                                           */
  /* ------------------------------------------------------------------ */
  {
    number: 8,
    slug: "dublin",
    title: "Dublin",
    fade: "Where Trichollective goes online.",
    theme: "Launch",
    standfirst:
      "On Monday 5 October 2026, Trichollective comes to Ireland and the online platform opens. Here is what the day is, how to make the most of it, and how the platform works.",
    coverImageKey: "dublin",
    coverTone: "dark",
    audience: ["cosmetic", "clinical", "medical"],
    published: PUBLISHED,
    pages: [
      {
        kind: "letter",
        title: "From two rooms to one community",
        blocks: [
          {
            type: "p",
            text: "Trichollective began in rooms. In January, at Whittlebury Hall in Northamptonshire, and again in June at Whittlebury Park Hotel & Spa, hair and scalp professionals from very different backgrounds sat together and found how much they had in common.",
          },
          {
            type: "p",
            text: "The question afterwards was always the same: how do we keep this going between conferences? The online platform is our answer. It is a private, members-only space for the conversations, referrals and learning that used to wait for the next event.",
          },
          {
            type: "p",
            text: "It opens at Trichollective Dublin on Monday 5 October 2026, at the Killashee Hotel in Naas. It seems right that the platform should begin in a room full of people, since that is where the community itself began.",
          },
          {
            type: "p",
            text: "This edition sets out what we know about the day, some practical advice for making the most of it, and a tour of what you will find when you log in. We look forward to seeing many of you there, and to meeting many more of you online.",
          },
        ],
        signoff: TEAM,
      },
      {
        kind: "article",
        kicker: "The event",
        title: "What Trichollective Dublin is",
        standfirst:
          "A day for hair and scalp professionals across Ireland and the UK, and the moment the platform opens its doors.",
        imageKey: "dublin",
        blocks: [
          {
            type: "p",
            text: "Trichollective Dublin takes place on Monday 5 October 2026, from 9.30am to 6pm, at the Killashee Hotel on Kilcullen Road, Naas, in County Kildare. It is the third Trichollective conference, following the two days at Whittlebury earlier this year, and the first to be held in Ireland.",
          },
          {
            type: "p",
            text: "It is also the day the online platform launches. Everything described later in this edition, from the community spaces to the founding directory, opens to members from that date.",
          },
          {
            type: "p",
            text: "Holding the launch at a conference, rather than simply switching the platform on, is a deliberate choice. Many members will create their profiles, join their chapters and make their first introductions on the same day they meet each other in person. The online community starts with faces and names already attached, and with conversations already under way.",
          },
          { type: "h", text: "Who it is for" },
          {
            type: "p",
            text: "The day is for the whole range of people who work with hair and scalps: head spa therapists, stylists, trichologists, nurses and doctors. That breadth is deliberate. Much of the value of Trichollective lies in people from cosmetic, clinical and medical practice learning how the others work, and knowing whom to call when a client needs more than they can offer.",
          },
          {
            type: "pull",
            text: "The platform begins in a room full of people, which is where the community itself began.",
          },
          { type: "h", text: "The essentials" },
          {
            type: "list",
            items: [
              "Date: Monday 5 October 2026.",
              "Time: 9.30am to 6pm.",
              "Venue: Killashee Hotel, Kilcullen Road, Naas, County Kildare.",
              "Tickets: available on Eventbrite.",
              "Programme: the full programme will be shared by the Trichollective team.",
            ],
          },
          { type: "h", text: "The programme" },
          {
            type: "p",
            text: "We are not publishing speakers or session details in this edition. The full programme will be shared by the team directly, and members will hear first. If you have a question about the day in the meantime, the Introductions space on the platform, and the Dublin chapter once you join it, are good places to ask.",
          },
          { type: "h", text: "After Dublin" },
          {
            type: "p",
            text: "The next conference will be in Los Angeles, with the date to be confirmed. Between events, the platform is where the community carries on: in the spaces, the local chapters, the monthly live masterclasses and the courses.",
          },
          {
            type: "callout",
            title: "Book early",
            text: "Tickets are sold through Eventbrite. Check the listing for availability and ticket details, and book your travel and any accommodation in good time, since early October is a busy period.",
          },
        ],
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Who you call next",
        intro:
          "The Dublin day and the new platform exist to make one thing easier: knowing who to call when a client needs more than you can offer. Here is what that looks like from each discipline.",
        views: [
          {
            discipline: "cosmetic",
            heading: "Referring from the chair",
            blocks: [
              {
                type: "p",
                text: "For a stylist or head spa therapist, the hard part is often knowing whom to suggest. A client mentions thinning or an itchy scalp, and a name you trust is worth far more than a general instruction to see someone about it.",
              },
              {
                type: "p",
                text: "The directory and the Dublin day are chances to meet trichologists and medical colleagues nearby, and to understand what they offer and how clients can reach them. Cosmetic professionals still never diagnose, and a referral should always be framed as a suggestion the client chooses to take, with their consent before any details are shared.",
              },
              {
                type: "reveal",
                prompt: "What makes a referral from a salon feel reassuring rather than alarming?",
                answer:
                  "A calm description of what you have noticed, a specific name rather than a vague suggestion, and a clear sense that the client decides. Knowing the person you are recommending makes all three easier.",
              },
            ],
          },
          {
            discipline: "clinical",
            heading: "The trichologist in the middle",
            blocks: [
              {
                type: "p",
                text: "Trichologists often sit between the other two disciplines, receiving referrals from salons and writing to GPs. A local network makes both directions work: stylists who know what a trichology consultation involves, and doctors who recognise a well-written letter when it arrives. Each referral that goes well makes the next one easier.",
              },
              {
                type: "p",
                text: "Because trichology is not statutorily regulated in the UK or Ireland, a clear directory listing, stated qualifications and professional membership help colleagues refer with confidence. Trichologists should be as ready to refer on as to receive, particularly when red flags point to a GP or dermatologist.",
              },
              {
                type: "checklist",
                title: "A referral network worth building",
                items: [
                  "Two or three salons or head spas you trust",
                  "A local GP practice or pharmacist you can write to",
                  "A dermatologist for red flags and complex cases",
                  "A clear consent process for sharing information",
                ],
              },
            ],
          },
          {
            discipline: "medical",
            heading: "The medical end of the network",
            blocks: [
              {
                type: "p",
                text: "GPs, dermatologists and aesthetic doctors and nurses receive referrals of very different quality. A short letter setting out the history, what was seen and why the referral is being made helps a doctor decide what to investigate and how urgently. A clear letter also makes it more likely that a reply finds its way back to the person who referred.",
              },
              {
                type: "p",
                text: "Medical colleagues can also refer outwards: to trichologists for detailed care planning and follow-up, and to cosmetic professionals for camouflage, styling and scalp care once a condition is being managed. Knowing who those people are locally is exactly what the community is for.",
              },
              {
                type: "quiz",
                question: "Which referral letter is most useful to a GP?",
                options: [
                  "A detailed list of possible diagnoses",
                  "A brief summary of the history, what was seen, the client's concern and the reason for referral",
                  "A request for a specific prescription",
                  "The client's full treatment records with no summary",
                ],
                answer: 1,
                explain:
                  "A GP needs the facts and the question, not a diagnosis or a request for treatment. A short, clear summary, shared with the client's consent, helps the client get the right assessment.",
              },
            ],
          },
        ],
      },
      {
        kind: "image",
        imageKey: "dublin",
        caption:
          "The Ha'penny Bridge over the Liffey. Trichollective Dublin takes place a short way south-west of the city, at the Killashee Hotel in Naas.",
      },
      {
        kind: "article",
        kicker: "Practical guide",
        title: "Getting the most from a conference day",
        standfirst:
          "A good conference day is part preparation, part attention and part follow-through. The last is the part most people skip.",
        imageKey: "gathering",
        blocks: [
          {
            type: "p",
            text: "Conferences are generous with information and hard on memory. By the end of a full day, even the most useful session can blur into the others. A little planning before and a little discipline afterwards make an enormous difference to what you carry home.",
          },
          { type: "h", text: "Before the day" },
          {
            type: "list",
            items: [
              "Decide on two or three questions you would like answered by the end of the day.",
              "Read the programme when the team shares it, and mark the sessions most relevant to your practice.",
              "Plan your route to Naas, allowing extra time for morning traffic.",
              "Update your profile on the platform, so people you meet can find you afterwards.",
              "Bring a notebook, a charged phone and business cards if you use them.",
            ],
          },
          { type: "h", text: "During the day" },
          {
            type: "p",
            text: "Take notes by hand if you can, and keep them brief: one idea, one action. Write down the name and discipline of anyone you would like to speak to again. Sit next to someone from a different kind of practice at least once. Some of the most useful conversations of the day will happen in the queue for coffee.",
          },
          {
            type: "pull",
            text: "Sit next to someone from a different kind of practice at least once.",
          },
          {
            type: "p",
            text: "Pace yourself. A conference day is long, and it is perfectly reasonable to step outside between sessions. Drink water, eat properly at lunch, and do not feel obliged to attend every session if one is less relevant to you.",
          },
          { type: "h", text: "After the day" },
          {
            type: "p",
            text: "Within a day or two, go back through your notes and choose one change to make in your practice. Message the people you met through the platform while the conversation is fresh. Join your local chapter, and post one thing you learned in the relevant space. Explaining an idea to others is one of the surest ways to remember it.",
          },
          {
            type: "callout",
            title: "Continuing professional development",
            text: "Keep a short record of the sessions you attend and what you took from each. Many professional bodies ask for reflective notes as evidence of learning, and it is much easier to write them the same week.",
          },
          {
            type: "p",
            text: "The checklist on the next page gathers all of this into one place. Tick it off as you go.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Tools",
        title: "Your Dublin checklist",
        intro:
          "Work through the checklist before, during and after the day. Then try a short quiz on getting started with the platform.",
        blocks: [
          {
            type: "checklist",
            title: "Before, during and after Trichollective Dublin",
            items: [
              "Ticket booked on Eventbrite.",
              "Travel to the Killashee Hotel, Naas, planned with time to spare.",
              "Two or three questions written down for the day.",
              "Programme read, and priority sessions marked, once the team shares it.",
              "Platform profile updated with your discipline and location.",
              "Notebook, charged phone and water bottle packed.",
              "At least one conversation with someone from a different discipline.",
              "Names of people to follow up with noted down.",
              "One practical change chosen within two days of the event.",
              "Local chapter joined and a first post shared.",
              "Founding directory listing checked and completed.",
            ],
          },
          {
            type: "quiz",
            question: "You'd like to discuss an anonymised client case with other verified professionals. Where should you post it?",
            options: [
              "Introductions",
              "Wins",
              "The Case Room",
              "Business & Marketing",
            ],
            answer: 2,
            explain:
              "The Case Room is for anonymised cases and is open only to verified professionals. Remove anything that could identify the client before posting.",
          },
          {
            type: "quiz",
            question: "How long does a free founding listing in the directory last?",
            options: ["30 days", "60 days", "90 days", "One year"],
            answer: 2,
            explain:
              "Early sign-ups receive a free directory listing for 90 days. To keep it after that, you claim it with the Professional plan.",
          },
          {
            type: "quiz",
            question: "A client needs specialist input that is outside your scope. What is the platform's tool for this?",
            options: [
              "The public directory search only",
              "The referral network across disciplines",
              "A monthly masterclass",
              "The Wins space",
            ],
            answer: 1,
            explain:
              "The referral network connects members across cosmetic, clinical and medical practice, so you can find the right professional for a client's needs.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "The platform",
        title: "A tour of the new platform",
        standfirst:
          "Spaces for conversation, chapters for meeting locally, and a referral network that connects the disciplines. Here is how it fits together.",
        imageKey: "community",
        blocks: [
          {
            type: "p",
            text: "The Trichollective platform is a closed, paid community. It is not a public social network, and nothing posted in it is visible to clients or to the wider internet. That privacy is what allows members to ask honest questions, share uncertainty and discuss difficult cases.",
          },
          { type: "h", text: "The spaces" },
          {
            type: "p",
            text: "Conversation is organised into spaces, each with its own focus.",
          },
          {
            type: "list",
            items: [
              "Head Spa & Scalp Care, for treatments, techniques, products and the practical detail of the work.",
              "Hair Loss & Trichology, for questions about assessment, conditions and when to refer.",
              "Case Room, for anonymised cases, open only to verified professionals.",
              "Devices & Technology, for equipment, evidence and experiences of using it.",
              "Business & Marketing, for pricing, menus, marketing and the running of a practice.",
              "Introductions, for saying hello and telling others what you do.",
              "Wins, for sharing what has gone well, however small.",
            ],
          },
          {
            type: "pull",
            text: "Privacy is what allows members to ask honest questions and share uncertainty.",
          },
          { type: "h", text: "Local chapters" },
          {
            type: "p",
            text: "Chapters bring members together by place. The first are Dublin, Cork, Galway, Belfast, London and Manchester. They are a way to find peers nearby, arrange to meet, and share local knowledge, from suppliers to good places to refer.",
          },
          { type: "h", text: "The referral network" },
          {
            type: "p",
            text: "The referral network is built for the moment a client needs more than you can offer. A head spa therapist can find a trichologist, a trichologist can find a doctor, and a doctor can find a stylist experienced with a particular hair type. Referrals work in every direction, because good care often does.",
          },
          {
            type: "p",
            text: "Referring through the network does not replace your professional judgement or your usual duties of care. It simply makes it easier to find someone suitable. Explain to the client why you are suggesting another professional, share only what they have agreed you may share, and follow up afterwards where appropriate.",
          },
          { type: "h", text: "Learning" },
          {
            type: "p",
            text: "Courses can be completed at your own pace, and each one finished earns a certificate of completion. Monthly live masterclasses offer a chance to learn in real time and put questions directly. Trichozette, which you are reading now, sits alongside both.",
          },
          {
            type: "callout",
            title: "Start small",
            text: "In your first week, complete your profile, introduce yourself in Introductions, join your nearest chapter and read one thread in a space you do not usually work in. That is enough to get a feel for the place.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Directory",
        title: "How the founding directory works",
        standfirst:
          "The public directory helps clients find qualified hair and scalp professionals. Early members are listed free for their first 90 days.",
        blocks: [
          {
            type: "p",
            text: "Alongside the private community, Trichollective runs a public directory. It is the part of the platform clients can see, and it is designed to help them find the right kind of professional for what they need, whether that is a head spa, a trichologist or a medical opinion.",
          },
          { type: "h", text: "The founding offer" },
          {
            type: "p",
            text: "Members who sign up early receive a free listing in the directory for 90 days. It is our way of making sure the directory is well populated from the start, and of giving founding members the chance to see how it works for their practice before committing.",
          },
          {
            type: "p",
            text: "The directory is designed to help a client see who practises near them and what kind of care each person offers. A listing is not an endorsement of individual treatments. It is a clear, accurate introduction to you and your practice.",
          },
          {
            type: "pull",
            text: "Ninety days free, then claim your listing with the Professional plan to keep it.",
          },
          { type: "h", text: "After 90 days" },
          {
            type: "p",
            text: "To keep your listing once the free period ends, you claim it with the Professional plan. If you choose not to, your listing will no longer appear in the directory, and your membership of the community continues according to your plan.",
          },
          { type: "h", text: "Making your listing useful" },
          {
            type: "list",
            items: [
              "Describe what you do in plain language that a client would understand.",
              "State your qualifications and discipline accurately.",
              "List the services you offer, without medical claims you are not qualified to make.",
              "Say where you practise and how clients can book or contact you.",
              "Keep it up to date when your services, hours or location change.",
            ],
          },
          { type: "h", text: "The same standards apply" },
          {
            type: "p",
            text: "A directory listing is a form of advertising, so the principles set out in our business edition apply. Describe your services honestly, avoid promising outcomes, and make sure anything you say about treating conditions is within your scope and supported by evidence.",
          },
          {
            type: "reveal",
            prompt: "Can clients see what I post in the community spaces?",
            answer:
              "No. The community is private and members-only. Clients see only your public directory listing, which you write and control.",
          },
          {
            type: "callout",
            title: "Check your listing this week",
            text: "If you signed up early, look at your founding listing now and complete any missing details. Note the date your 90 days end, so you can decide in good time whether to claim it with the Professional plan.",
          },
        ],
      },
      {
        kind: "glance",
        kicker: "Key dates",
        title: "Trichollective, so far and next",
        rows: [
          { label: "19 January 2026", value: "Conference at Whittlebury Hall, Northamptonshire." },
          { label: "15 June 2026", value: "Conference at Whittlebury Park Hotel & Spa." },
          { label: "30 September 2026", value: "Trichozette founding library is published." },
          { label: "5 October 2026", value: "Trichollective Dublin, 9.30am to 6pm, Killashee Hotel, Kilcullen Road, Naas. The platform launches." },
          { label: "Tickets", value: "On Eventbrite." },
          { label: "Programme", value: "To be shared by the Trichollective team." },
          { label: "Founding listings", value: "Free for 90 days from sign-up, then claim with the Professional plan." },
          { label: "Los Angeles", value: "The next conference. Date to be confirmed." },
        ],
      },
    ],
  },
];
