# Plan: Whittlebury tickets, educator package, consumer area

Karley's request (3 Nov 2026):

1. Sell tickets for the event at Whittlebury Hall on 26 April 2027 through the website.
2. An educator package with an annual fee, so educators can host courses on the platform, with the option for us to help build their courses.
3. A consumer area, separate from the professional side, where people can use their name or stay anonymous. It lets us share information with them and helps them find professionals in the directory.

## Before anything: get the branches up to date

- **Local `main` is behind.** It is 8 commits behind `origin/main`, which already has PR #37 (the course builder and `model Course`).
- **Uncommitted work is on `main`.** The signup changes (`PendingSignup` and its migration, onboarding, `EmailLinkForm`) need a commit or stash before pulling. They should land first, because the consumer area builds on that signup flow and all three features add migrations after it.

---

## 1. Whittlebury Hall tickets

**What already works.** Stripe ticketing is built (`src/lib/tickets.ts`, `src/app/api/events/[id]/checkout/route.ts`, `BuyTicket.tsx`):

- one member price and one guest price
- capacity, with a database lock and places held for 35 minutes during checkout
- buying without an account, up to 4 tickets
- a confirmation email, an alert to the owners, and a Studio attendee list with CSV export

**What it lacks for this event.** It was built for online masterclasses, so it has:

- no ticket types
- one row per order, not one per person
- no QR check-in
- no discount codes
- online-only email wording
- partial refunds ignored

| PR | Scope |
|---|---|
| T1: Ticket types | `EventTicketType` (price, member price, capacity, sales window for early bird, max per order). Each type's capacity is checked inside the existing lock. Turn on `allow_promotion_codes`. Add a venue address and in-person email wording. Studio gets an editor for ticket types. Events without types keep working as they do today. |
| T2: Named attendees | `EventAttendee` holds name, email, dietary and access needs, a unique code and `checkedInAt`. The buyer enters one row per place. Each attendee gets an e-ticket with an embedded QR code. A self-service page lets them change their name or details before a cut-off. Reminders go to each attendee. |
| T3: Check-in | `/studio/events/[id]/checkin`, built for a phone: QR scan through BarcodeDetector, a name search fallback, a warning when a ticket has already been scanned, and undo. A preloaded list covers poor hotel signal. |
| T4: Landing page | A `/whittlebury` page in the style of the `/ireland` page. It shows ticket tiers with "N left" or "Sold out", the agenda (`EventSession`), speakers, venue, travel and parking, the hotel room-booking link, an FAQ and event structured data. |
| T5: Refunds and reporting | Refund or cancel a single attendee, which fixes the partial-refund gap. Transfer a ticket, add a free place for a speaker or sponsor, and run a waitlist. A sales dashboard by type, showing VAT and discount codes used. |

T1 to T3 are the minimum to go on sale. T4 can be built alongside them, and T5 can come before the event.

**Questions for Karley**

- Which ticket types and prices: early bird (closing when), standard, member, student?
- Are dinner or overnight packages needed, or do rooms go through the hotel's group booking code?
- What is the capacity?
- What is the refund policy? Today tickets are non-refundable (`src/lib/legal.ts`). Should name changes be free up to a date?
- What is the most tickets per order, for example a clinic booking its whole team?
- Do we need discount codes for sponsors, speakers or groups?
- Do businesses need VAT invoices?
- Which details should we collect from each attendee: dietary, access, clinic, the name for the CPD certificate?
- What is the agenda, who are the speakers, which images do we use, and when does it go on sale?

---

## 2. Educator package

**Most of this is already built and waiting in open PRs.**

| PR | Status | What it gives |
|---|---|---|
| #37 course builder | Merged | Courses built on the site, with a review for every version |
| #38 educators | Open, merges cleanly | £500/yr Stripe plan, `/educators` marketing page, educator terms, dashboard, approval in Studio (rejection refunds the fee), revenue share per educator |
| #39 educator payouts | Open, stacked on #38 | Stripe Connect Express, a 70/30 split, a sales ledger, refunds that take back the educator's share |
| #40 course drafter | Open, stacked on #39 | AI drafting from the educator's own material, plus `CourseRequest`: "help us build it", with a team queue in Studio |

**The gap.** The "we'll build it with you" service is a request form and a tracker only. It has no price, quote, payment or terms.

| Phase | Scope |
|---|---|
| E0: Land the stack | Merge #38, then #39, then #40. Run the `docs/GO-LIVE.md` steps:<br>• create the price and set `STRIPE_PRICE_ID_EDUCATOR`<br>• turn on Stripe Connect and set up its webhook and secret<br>• add `charge.dispute.created` to the main webhook<br>Then run `migrate deploy` and a smoke test in Stripe test mode. Check migration order: these are dated 14 Oct, earlier than migrations already in production. |
| E1: Build service as a product | `src/config/course-build.ts` defines the tiers (for example Tailor, Build, Build + film). `CourseRequest` gets a tier, a quote and payment fields. The team quotes in Studio and the educator accepts and pays by one-off Stripe Checkout. Work moves to "building" once payment is in. |
| E2: Marketing and terms | A course-build section on `/educators`, and an enquiry form for people who haven't joined yet. A build-service clause in the educator terms covering fees, revisions, IP and the share on courses we build. Bump the terms version. |
| E3: Studio tracking | Milestones and an activity log on each request. A revenue view (memberships, build fees, sales share). Renewal and lapse reminders. |

**Questions for Karley**

- Is the build service a fixed price per tier, a quote per project, or both?
- On a course we build, does the split stay at 70/30, or change (for example to 50/50) instead of a fee?
- Can someone buy a build without joining at £500 first, and should a bundle include the first year?
- Should there be a higher tier (for example £1,000/yr with one build included)?
- Is filming in scope?
- Who owns the IP in a course we build if the educator leaves?
- Is £500 still the price? Do we want a founding-educator price?
- Still open from October: the solicitor's review of the educator terms, and the accountant's view on VAT for the split.

---

## 3. Consumer area

**Approach.**

- **Account type.** Add a separate `User.accountType` (professional or consumer) instead of a new `UserRole`, because billing overwrites `role`.
- **Profile.** Consumers get a `ConsumerProfile` with `displayMode` set to name or alias. The alias is generated at random, for example "Willow-428", and is never derived from the person's name or email. Staff always see the real identity.
- **Separate area.** Consumers live in their own route group, `/hub`, which never shares a shell, community or API with `/members`.

| PR | Scope |
|---|---|
| C1: Schema | `AccountType`, `ConsumerProfile` (alias, avatar seed, region, `marketingConsentAt`, `healthDataConsentAt`), `SavedListing`, `Enquiry.userId`, `PendingSignup.accountType`. |
| C2: Auth and separation | Put `accountType` in the JWT and session.<br>`authorized()` sends consumers away from `/members` and `/pro`, and professionals away from `/hub`.<br>Server checks too: `getMemberContext`, the members layout, `/api/ai/chat`, community actions.<br>`applyPendingSignup` must not create a `TrichologistProfile` or directory listing for a consumer.<br>Studio counts and stats exclude consumers. |
| C3: Consumer routes | `/hub`: a feed of consumer-tagged blog and education pieces, plus pages for profile, saved professionals, enquiries and settings (consents, export, delete).<br>Signup at `/signup/you`, asking for email and an optional first name.<br>Results from the `/find` flow lead into signup. |
| C4: Directory | Save a professional. Enquiries sent while signed in link to the consumer's account and show their status in `/hub`.<br>Filter the directory by concern.<br>Tell consumers plainly that the professional sees their real name and email when they send an enquiry. |
| C5: Emails and consent | Consumer welcome, enquiry update and monthly digest emails. Marketing is opt-in and unticked (PECR), which is the opposite of the professional default. Opt-ins sync to `Subscriber`. |
| C6: Studio | `/studio/consumers` for the owner and support roles only, with every view logged in the audit log. An audience toggle in the content editors. |
| C7: AI matcher | `/hub/match`: a guided chat that maps concern categories to directory listings.<br>Strictly no diagnosis.<br>Red-flag symptoms (sudden patchy loss, pain, scarring, a child, signs of an eating disorder) always point to a GP.<br>Transcripts are not stored by default. Evals cover all of the above. |
| Later | A consumer Q&A with posts shown under the alias, AI moderation before anything is published, and verified professionals answering. It waits until a safeguarding policy is in place. |

**Risks**

- **Health data.** Hair-loss concerns are health data, which UK GDPR Article 9 treats as special category. That needs explicit separate consent and collecting the minimum: categories only, no photos or free text. Update the DPIA and privacy notice.
- **Leaks into the professional area.** `/api` routes skip the middleware, so each one needs its own check.
- **Anonymity.** An alias can be unmasked if a real name appears in a URL, a notification or an email.

**Questions for Karley**

- Is contact only through enquiries, or messaging inside the platform too?
- What is the minimum age, 18 or 16?
- Should the Q&A be in the first release or later?
- What do we call the area?
- Can a professional also hold a consumer account?
- Should consumers be able to leave reviews of professionals? That brings moderation and defamation risk.
- Should the AI matcher be public or for signed-in consumers only?

---

## Suggested order

1. Land the uncommitted signup work, then pull `origin/main`.
2. **E0**: merge the educator stack. It's mostly configuration and testing, and gives the quickest result for Karley.
3. **T1 to T3** next. April 2027 is about five months away, and early-bird sales usually open three to four months before the event.
4. **C1 and C2** can run alongside the tickets work.
5. **E1 and E2**, then **T4 and T5**, then **C3 to C7**.

These are separate pieces of work, so tickets and the consumer area can each be built in their own session or worktree. They don't touch the same files, apart from `prisma/schema.prisma`, where migrations will need ordering.
