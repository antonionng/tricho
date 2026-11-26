import type { Edition } from "./types";

const KARLEY = "Karley Weir, Founder of Trichollective";

export const editionsD: Edition[] = [
  /* ------------------------------------------------------------------ */
  /* 10. The Christmas edition                                           */
  /* Karley's column "Out and about with Trichollective", and the        */
  /* 12 Days of Christmas calendar (src/content/advent.ts).              */
  /* ------------------------------------------------------------------ */
  {
    number: 10,
    slug: "the-christmas-edition",
    title: "The Christmas edition",
    fade: "Out and about with Trichollective, and twelve days of gifts for our community.",
    theme: "Christmas",
    standfirst:
      "Karley takes you out and about with Trichollective this season, from Little Lady Locks in Manchester to ART in London, with honest conversations from the clinic room, three things to get in place before 2027 and a gift a day from 12 to 23 December.",
    coverImageKey: "headSpa",
    coverTone: "dark",
    festive: "christmas",
    audience: ["cosmetic", "clinical", "medical"],
    published: "2026-12-01",
    pages: [
      {
        kind: "letter",
        title: "So grab a cuppa and come with me.",
        blocks: [
          { type: "p", text: "Hello everyone, and a big welcome to this edition of Trichozette." },
          {
            type: "p",
            text: "I want to start with a huge congratulations to Ashley-Marie Higgins, who won Pride of the Industry at the Pro Hair Awards, sponsored by Passion4hair. I've visited Ashley-Marie's salon before and recently went back to Manchester with Debbie Digby to spend time with her at Little Lady Locks. Having seen some of the work that goes into supporting children and young people experiencing hair loss, I was so pleased to see her get that recognition.",
          },
          {
            type: "p",
            text: "I've also been to the House of Hair with Jude Bale, where we worked with Drew to launch Secret Recovery and spent time with Kate, who had experienced hair loss after breast cancer. I visited Rosalia and her team at Alchemy in Caddington as they celebrated 11 years in business, went to ART in London where Brian Plunkett announced his retirement, and got to sit on the other side of the classroom for a change at Malibu C training.",
          },
          {
            type: "p",
            text: "So grab a cuppa and come with me. I've got some lovely people to tell you about, a few honest conversations from the clinic room, and three things I'd get in place before we go into 2027.",
          },
          {
            type: "p",
            text: "And because it is Christmas, we have something new for you. From 12 to 23 December a door opens in this edition every morning, with a gift from a brand we trust or something from us to help you into the new year. You will find the doors on the next page.",
          },
        ],
        signoff: KARLEY,
      },
      {
        kind: "advent",
        kicker: "12 Days of Christmas",
        title: "Twelve days of gifts for the people who look after hair and scalps.",
        intro:
          "One door opens here every morning from Saturday 12 to Wednesday 23 December. Behind each one is an offer from a brand we trust, something to learn or a little help for the year ahead, and every gift is free to claim with a Trichollective account.",
      },
      {
        kind: "perspectives",
        kicker: "Three perspectives",
        title: "Knowing who to turn to gives a worried client a clear next step.",
        intro:
          "I always enjoy being in a room with people who see hair and scalp concerns from different perspectives. Knowing who to turn to makes it easier to give someone a clear next step when they're sitting in your chair, worried and unsure where to go.",
        views: [
          {
            discipline: "cosmetic",
            heading: "The hairdresser is often the first to notice.",
            blocks: [
              { type: "p", text: "A hairdresser might be the first to spot a change because they've seen that same client every six weeks for years." },
            ],
          },
          {
            discipline: "clinical",
            heading: "The trichologist has time to look and listen.",
            blocks: [
              { type: "p", text: "In my role as a cosmetic trichologist, I can spend time looking at the hair and scalp and listening to what the client has noticed." },
            ],
          },
          {
            discipline: "medical",
            heading: "The medical professional can investigate.",
            blocks: [{ type: "p", text: "A dermatologist or another medical professional can investigate where that's needed." }],
          },
        ],
      },
      {
        kind: "article",
        kicker: "Pride of the Industry",
        title: "Ashley-Marie Higgins and Little Lady Locks have been recognised for the work they do for children.",
        standfirst: "Karley went back to Manchester with Debbie Digby to spend time at Little Lady Locks.",
        imageKey: "portraitA",
        blocks: [
          {
            type: "p",
            text: "I'd visited Ashley-Marie's salon in Manchester before, and I plan to keep going back. This time, I went with Debbie Digby, who wanted to spend time with Ashley-Marie and see how she could support Little Lady Locks through her business, Passion4hair. It was lovely to go back together and hear more about what Ashley-Marie and her team are doing for children and young people experiencing hair loss.",
          },
          {
            type: "p",
            text: "When you work in hair replacement, it's easy to jump straight into talking about fittings, hair and how everything works. Spending time with Ashley-Marie makes me think about the everyday things that matter to a young person and their family. It might be getting ready for school, going to a party or feeling comfortable having their photo taken. I'd love to hear more from Ashley-Marie about what families need when they first get in touch and how those of us in the hair industry can help.",
          },
          {
            type: "pull",
            text: "I love seeing people in our industry pull together like this.",
          },
          {
            type: "p",
            text: "Jude Bale from Secret Hair Solutions is also working with Little Lady Locks, bringing her experience in hair replacement to support the charity. Debbie came to see what she could offer through Passion4hair. I love seeing people in our industry pull together like this. I want to keep visiting, stay in touch with Ashley-Marie and hear from her about what would genuinely help as the work continues.",
          },
          {
            type: "p",
            text: "A huge congratulations to you, Ashley-Marie, and to the team around you. It was lovely to see your work recognised at the Pro Hair Awards, and I'd love to give you the space to share more of your story in a future edition of Trichozette, in your own words.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Secret Recovery",
        title: "Secret Recovery gives people their hair back after cancer treatment.",
        standfirst: "Karley, Jude Bale and Drew launched the new hair replacement service at the House of Hair.",
        imageKey: "salon",
        blocks: [
          {
            type: "p",
            text: "I went to the House of Hair with Jude Bale from Secret Hair Solutions, where we worked with Drew to launch Secret Recovery, our new hair replacement service for people who have experienced hair loss following cancer treatment.",
          },
          {
            type: "p",
            text: "We worked with Kate, who had experienced hair loss after breast cancer. The moment that's stayed with me was seeing Kate with her hair again and seeing what that meant for her confidence. Hair is so personal. The way you wear it, how it feels and how you recognise yourself in the mirror are things you can take for granted until you've had to go without them.",
          },
          {
            type: "p",
            text: "I loved working with Jude and Drew on this. Being there with Kate reminded me how much an appointment like this comes down to giving somebody time. Time to say what they want, talk through what feels comfortable and decide how they want to wear their hair in everyday life. I'm so pleased we got to launch Secret Recovery together at the House of Hair. If Kate would ever like to share more of her experience in Trichozette, I'd love for you to hear it from her.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Members",
        title: "Alchemy in Caddington has spent eleven years giving clients time to talk.",
        standfirst: "Rosalia and her team showed Karley their Head Spa and the conversations it has opened up.",
        imageKey: "headSpa",
        blocks: [
          {
            type: "p",
            text: "I went to see Rosalia and her team at Alchemy, a beautiful salon in Caddington and part of our Trichollective community. They've recently celebrated 11 years in business, which is such a lovely milestone for Rosalia and the whole team. I wanted to see their Head Spa and hear about the opportunities it's opened up for them.",
          },
          {
            type: "p",
            text: "One thing I love about a Head Spa is the time it gives people to talk. Someone might book because they want a bit of time to themselves and then mention that their scalp has been uncomfortable for months, or that they've noticed more hair coming out when they wash it. Their hairdresser might be the first person they feel comfortable saying that to.",
          },
          {
            type: "p",
            text: "A salon team can make that conversation feel easier by listening, asking when the client first noticed the change and knowing who to signpost them to if they need further support. I'd love to hear more from Rosalia and the team about how they introduced the Head Spa to clients who already knew them, what people asked before booking and what the team learned in those first few months. Those are the details I'd want to hear if I were thinking about adding a service myself.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "ART in London",
        title: "Brian Plunkett announced his retirement at ART in London.",
        standfirst: "Karley spent the day with colleagues from across the profession.",
        imageKey: "london",
        blocks: [
          {
            type: "p",
            text: "At ART in London, I spent time with trichologist John Bellfield, dermatologist John English, Brian Plunkett and other colleagues from across the profession.",
          },
          {
            type: "p",
            text: "Brian Plunkett announced his retirement at the event, and I wanted to give that a proper mention. So much of what we learn in this profession comes from people making time to share their experience and talk things through with colleagues. I'm glad I was there for that moment, and I wish Brian all the very best for his retirement.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Education",
        title: "Clients deserve to know what you are using and why you have chosen it.",
        standfirst: "Karley went back to the classroom for Malibu C training, alongside many Trichollective members.",
        imageKey: "learning",
        blocks: [
          {
            type: "p",
            text: "I also attended Malibu C training, and it was lovely to see so many Trichollective members there. I teach as part of my work, so I really enjoy being the one asking questions and making notes for a change. Through my education work with Passion4hair, we also had eight trichologists attend a recent scalp-care training session.",
          },
          {
            type: "p",
            text: "One conversation I keep coming back to is how we explain the difference between clarifying and chelating in words a client can follow. If I'm choosing a product as part of an appointment, I want to be able to tell them what I'm using, why I've chosen it and what they can reasonably expect from that service.",
          },
          {
            type: "p",
            text: "The same goes for newer ingredients and devices. If a client shows me a peptide spray or a laser device they've seen online, I want to know what evidence is available for that specific product or device, who took part in the study and what was measured. Those are the details I want to understand before I talk to someone about where to spend their money.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "From the clinic room",
        title: "Clients want to understand what they are paying for before they commit.",
        standfirst: "These are the questions Karley is hearing right now, and what happens when the phone rings mid-appointment.",
        imageKey: "clinic",
        blocks: [
          {
            type: "pull",
            text: "Am I shedding more than usual? Is my hair breaking or coming out at the root? Why does my parting look wider? Where do I even start with my scalp?",
          },
          {
            type: "p",
            text: "Quite often, someone comes in with a list of things they've already tried or screenshots of products they're thinking about buying. I usually start with what they noticed first, when it changed and what they're using now. From there, I can talk through what I'm seeing from a cosmetic trichology perspective and whether it would be helpful for them to speak to their GP or another professional.",
          },
          {
            type: "p",
            text: "I hear plenty of practical questions too. How much will it cost? How long will it take? Does the booking fee come off the appointment price? Will I need to come back? In my own clinic, people want to understand what they're paying for and what happens afterwards before they commit. I'd be interested to hear whether salon and clinic owners in other areas are seeing the same thing and what's happening in their diaries.",
          },
          { type: "h", text: "When the phone rings and you're already with a client" },
          {
            type: "p",
            text: "A missed call, a no-show, a follow-up you promised to send and consultation notes you still need to finish. Each sounds like a small job until they all land on the same day and you're still doing admin at home in the evening.",
          },
          {
            type: "p",
            text: "I've been introducing Kiera SI on the booking side of my own business. What I'm interested in is whether it helps someone find the right appointment, see what it costs and know how to reach me when they need a personal answer. If someone has taken a while to build up to asking for help about their hair, I want that first contact to feel straightforward and welcoming.",
          },
        ],
      },
      {
        kind: "interactive",
        kicker: "Before 2027",
        title: "Three things are worth getting in place before the new year.",
        intro: "Tick each one off as you do it.",
        blocks: [
          {
            type: "checklist",
            title: "Before we go into 2027",
            items: [
              "Try booking with yourself from your phone. Start wherever a new client is most likely to find you, whether that's Instagram, Google or your website. Can you tell which appointment to choose, what it costs and what happens once you book?",
              "Know who you can refer people to. Think about the questions you already get in your salon or clinic, and make those introductions now so you have someone to call when a client needs a next step.",
              "Put some education in your diary. Pick something you're genuinely interested in and give yourself the time to go.",
            ],
          },
          {
            type: "p",
            text: "At the end of an appointment, make sure the client also knows what happens next and when they'll hear from you.",
          },
          {
            type: "callout",
            title: "Trichollective UK, Monday 26 April 2027",
            text: "If you'd love to spend a day learning and meeting people who work across hair and scalp care, come and join us at Whittlebury Hall. We're bringing together salon professionals, trichologists and medical practitioners. Come with a question you've been wanting to ask or a conversation you'd love to have with someone outside your own area of work. Tickets are at trichollective.net/events/trichollective-uk-2027.",
          },
        ],
      },
      {
        kind: "article",
        kicker: "Christmas",
        title: "One Christmas offer on the front desk works best when the buyer can explain it in a sentence.",
        standfirst: "Karley's idea for a simple gift your clients will want to give.",
        imageKey: "products",
        blocks: [
          {
            type: "p",
            text: "If I were putting one Christmas offer on the front desk, I'd choose something the person buying it can explain in a sentence. A Head Spa gift voucher is a lovely example. Put the appointment length, what's included and how to book somewhere easy to see. For someone who already enjoys a particular range, a small home-care duo based on what they actually use can make a thoughtful gift too.",
          },
          {
            type: "p",
            text: "If you're buying for someone experiencing hair loss, think about what they'd feel comfortable receiving. A general voucher can give them the choice to book something they want, in their own time.",
          },
        ],
      },
      {
        kind: "cta",
        kicker: "Thank you",
        title: "Thank you for reading Trichozette and being part of Trichollective.",
        intro: "If you have something to share, there is space here for it.",
        blocks: [
          {
            type: "p",
            text: "Thank you to everyone who welcomed me in and took the time to show me what they're working on. And thank you to all of you for reading Trichozette and being part of Trichollective.",
          },
          {
            type: "p",
            text: "If you've brought a new service into your salon, found a better way to manage bookings or met someone who's changed how you support your clients, I'd genuinely love to hear about it. You never know who else in our community is trying to work through the same thing.",
          },
          { type: "p", text: "Karley x" },
        ],
        offers: ["account", "member", "business"],
      },
    ],
  },
];
