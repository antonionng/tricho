import type { RoomId } from "@/config/rooms";

export type LaunchPost = {
  space: RoomId;
  title: string;
  body: string;
  /** Pinned to the top of its space when published. */
  pin?: boolean;
};

/**
 * Launch-week discussion starters, posted by the Trichollective team account
 * after the team approves each one in the Studio inbox. They are questions from
 * the team, not stories from members: no invented people, quotes or cases, and
 * no clinical claims.
 */
export const LAUNCH_POSTS: LaunchPost[] = [
  {
    space: "lounge",
    pin: true,
    title: "Welcome to Trichollective: how the community works",
    body: `Welcome, and thank you for being here at the very start.

Trichollective brings cosmetic, clinical and medical hair and scalp professionals into the same conversation. Head spa therapists, stylists, trichologists, nurses and doctors all see the same clients at different points, and we think everyone does better work when they can ask each other questions.

The community is organised into spaces. The Lounge is for everyday conversation across the whole collective. Introductions is where you say hello. Head Spa & Scalp Care, Hair Loss & Trichology, Devices & Technology and Business & Marketing are for focused discussion, and Wins is for good news, big or small.

The Case Room is for anonymised cases and is open to verified professionals only. Its rule is simple and it is not negotiable: never share anything that could identify a client. That means no names, no faces, no dates of birth, no workplace details and no photographs that someone could recognise, even with the client's goodwill. If you are unsure, leave it out, and describe the case in general terms instead.

Across every space, please be generous with what you know and careful with what you claim. Say when something is your experience rather than established evidence, share sources where you can, and refer on when a question needs a different discipline.

To introduce yourself, head to Introductions and tell us your name, your discipline, where you practise and one thing you would like to learn this year. It is the quickest way to find the people near you and the people who do what you do.

If you see anything that worries you, use the flag on the post and the team will look at it.`,
  },
  {
    space: "introductions",
    title: "Say hello: who are you, where do you practise and what brought you here?",
    body: `This is the place to introduce yourself to the collective.

It helps everyone if you share your name, your discipline, the town or city where you practise and roughly how long you have been doing this work. If you have a particular interest, such as textured hair, postpartum shedding, scalp psoriasis or head spa, mention it, because that is how people with the same interests will find you.

We would also love to know one thing you hope to get from Trichollective in your first few months. It could be a skill, a type of client you want to understand better, or simply colleagues to talk to between appointments.`,
  },
  {
    space: "lounge",
    title: "How do you structure a first consultation?",
    body: `Every practitioner seems to have their own shape for a first appointment, and we would like to hear yours.

How long do you set aside? What do you ask before you look at the scalp, and what do you leave until afterwards? Do you use a written questionnaire, and if so, do clients complete it before they arrive or with you in the room?

We are especially interested in how you close the appointment: what the client leaves with, whether you put anything in writing, and how you decide when a follow-up is needed.`,
  },
  {
    space: "hair-loss",
    title: "How do you explain telogen timelines to a worried client?",
    body: `Shedding that starts a few months after a trigger is one of the hardest things to explain, because the client is often looking for a cause in the wrong month.

How do you talk a client through the delay between a trigger and the shedding they are seeing, and the time it can take before they notice regrowth? Do you use a diagram, a calendar, an analogy or something else?

We would also like to hear how you set expectations without promising outcomes, and how you judge when it is time to suggest the client sees their GP or a dermatologist.`,
  },
  {
    space: "head-spa",
    title: "What does your hygiene routine between head spa clients look like?",
    body: `Head spa treatments involve water, heat, tools and close contact, so hygiene matters as much as technique.

What is your routine between clients? We are thinking about brushes and combs, basins and hoses, towels, steamers and any devices that touch the scalp. How do you clean and disinfect each one, and how often do you replace things?

If you have written your routine down for staff or for clients, tell us how you did it. And if there is anything you would like to see in a shared checklist for the community, say so here.`,
  },
  {
    space: "devices",
    title: "Which devices do you use, and what evidence did you look at before buying?",
    body: `Scalp scopes, LED devices, UV lamps and many other tools are marketed to our field, and the claims vary a great deal.

Which devices do you use in practice, and what made you choose them? When you were deciding, what did you look for: published studies, manufacturer data, training, recommendations from colleagues or something else?

It would be useful to hear where a device has been worth the money and where it has not, and how you describe its role to clients without overstating what it can do. Please keep to your own experience and link to sources where you can.`,
  },
  {
    space: "business",
    title: "How do you price a consultation?",
    body: `Pricing a consultation is one of the questions we are asked most often, and there is no single right answer.

Do you charge a separate consultation fee, include it in a treatment or offer it free? Do you price by time, by what the appointment includes or by comparison with others nearby? How has your pricing changed as your experience has grown?

If you are comfortable sharing numbers, include your country and the type of practice, because prices differ a great deal between a city clinic, a salon and a home studio. General principles are just as welcome.`,
  },
  {
    space: "business",
    title: "Referral letters: what do you include when you refer a client on?",
    body: `Referring a client to another discipline goes much better when the letter is clear, and the person receiving it knows why they are seeing them.

When you refer to a GP, dermatologist, trichologist or head spa therapist, what do you put in writing? Do you include what you observed, what the client has already tried and what you are asking the other practitioner to look at? How do you handle the client's consent?

If you have received a referral letter that was particularly useful, tell us what made it so, without sharing anything that identifies anyone.`,
  },
  {
    space: "lounge",
    title: "What is the best CPD you have done, and why?",
    body: `We are building the learning side of Trichollective and would like to know what has actually made a difference to your practice.

What is the best course, workshop, conference session or piece of reading you have done for your professional development? What made it worthwhile: the teacher, the format, the chance to practise, or the people you met?

We would also like to hear what you have looked for and not been able to find. Those gaps help shape what we offer next.`,
  },
  {
    space: "head-spa",
    title: "When does a head spa therapist refer on, and how do you raise it with the client?",
    body: `Cosmetic practitioners are often the first to see a change in someone's scalp or hair, sometimes before the client has noticed it themselves.

What makes you pause during a treatment and suggest that a client sees someone else? How do you raise it without alarming them, and what words have you found work well?

It would be helpful to hear from trichologists and doctors too: what would you like cosmetic colleagues to notice and mention, and what makes a referral from a salon or spa easy for you to act on?`,
  },
  {
    space: "hair-loss",
    title: "What questions do you always ask about medication, diet and recent illness?",
    body: `A good history often says more than the scalp does, but it is easy to miss something when appointments are busy.

Which questions about medication, supplements, diet, recent illness, surgery or life events do you make sure you always ask? Do you have a checklist, and has it changed over time?

Please keep this to the questions themselves and how you ask them, rather than advice about any particular treatment. It would be good to build a shared list the whole community can use.`,
  },
  {
    space: "business",
    title: "How do you keep clients coming back between treatments?",
    body: `Scalp and hair care usually takes more than one appointment, and keeping in touch between visits is part of the work.

How do you follow up with clients? Do you use reminders, progress photographs taken with consent, aftercare sheets, messages or something else? What has helped clients stay with a plan, and what has felt like too much?

We are interested in approaches that respect the client's time and privacy as well as those that fill the diary.`,
  },
  {
    space: "wins",
    title: "Share a win from this month",
    body: `This space is for good news, and we would like to start it off.

What went well for you this month? It could be a qualification, a new room, a client who left feeling better about their hair, a referral that worked just as it should, or simply a week where everything ran on time.

Please leave out anything that could identify a client. Everything else is welcome, however small it seems.`,
  },
  {
    space: "case-room",
    title: "How we'll use the Case Room",
    body: `The Case Room is where verified professionals can bring a case and ask colleagues from other disciplines for their thoughts. This post explains how we would like it to work.

First, confidentiality. Never share anything that could identify a client: no names, faces, dates of birth, places of work or distinctive details, and no photographs that someone could recognise. Describe the case in general terms, such as age range, history and what you have observed.

Second, structure. A helpful case post says what you have seen, what you already know, what has been tried and what you are unsure about. It ends with a clear question, so colleagues know what kind of answer you are looking for.

Third, care with answers. Replies here are a discussion between professionals, not a diagnosis. Say which discipline you are answering from, be clear about the limits of what can be judged from a description, and suggest a referral when that is the right step.

We would like your thoughts before the first cases arrive. What would make you comfortable bringing a case here, and what would make you comfortable answering one?`,
  },
];
