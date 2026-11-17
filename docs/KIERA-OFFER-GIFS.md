# Kiera SI member offer: motion graphics brief

Six short looping GIFs, one per feature card in the Trichollective member email
(`src/lib/mail/templates/kiera.ts`). These are advertising graphics in the Apple product-film
style, not screen recordings: one idea per card, generous space, a single hero element, slow and
deliberate motion. Drop the finished files into `public/partners/kiera/` with the exact file names
below; the email picks them up by name.

## Format, for every file

- 1200 × 675 px (16:9). The email shows them at 526 px wide, so everything must read at half size:
  headline type 64 px or larger, UI fragments scaled up, no body text smaller than 28 px.
- 4 to 6 seconds, looping, 12 to 15 fps. Under 1 MB each. Few colours, flat backgrounds and small
  moving regions keep GIFs small.
- The first frame must stand on its own as a finished still (Outlook and some corporate mail apps show
  only the first frame). The last frame holds for a second before the loop restarts.
- Motion: slow, eased, one thing at a time. A fragment of UI rises and settles. A number counts up. A
  message bubble arrives. A line draws itself. Nothing bounces, flashes or pans fast. No captions
  needed: the email supplies the title and sentence under each graphic.
- Fictional business and people only. No real client names, phone numbers or real-looking amounts.
- Must have no text that claims a result or statistic. The figures in the email are sourced separately.

## Brand

- Name: Kiera SI (the platform) and Kiera (the front-desk assistant). Logo: `public/partners/kiera/logo.png`
  (900 × 300, midnight wordmark on transparent). Use it small, bottom right or not at all; the email
  header already carries both logos.
- Palette: midnight `#101d23`, ink `#162c2c`, mint `#c4f0d6`, porcelain `#f4f5ef`, muted `#74827e`,
  hairline `#dfe6dc`. Alternate backgrounds between porcelain (light) and midnight (dark) so the six
  cards vary down the email: light, dark, light, dark, light, dark.
- Type: Inter for everything, tight tracking on headlines. One italic serif word for warmth where it
  helps (the booking page does this: "A little time *for you.*").
- UI fragments: rounded 16 px cards, 1 px hairline borders, soft shadow, white on porcelain or
  slightly lighter midnight on midnight. Mint is the only accent: a confirmed state, a paid badge, a
  glowing dot.
- Tone: calm, precise, premium. Think Apple Pay and iPhone feature pages, not SaaS dashboards.

## The six graphics

### 1. `phone-receptionist.gif`: Kiera answers your phone
Dark (midnight). A single incoming-call pill at the top ("Incoming call · 10:15") with a soft mint
dot pulsing. Beneath it, two message bubbles arrive one after the other, Kiera's in mint-tinted
white: "Northside Clinic, Kiera speaking." then a client line, then Kiera's "Thursday at 10:00 is
free. Shall I book it?" Finish as a small white card slides in: "Appointment booked · Thu 10:00" with
a mint tick. Hold.

### 2. `pay-by-text.gif`: get paid by text
Light (porcelain). An iPhone-style message thread, cropped so only two bubbles and the top of the
phone show. A text arrives from the clinic: "Your deposit for Thursday: €40. Pay securely here" with
a link pill. The link is tapped, a compact Apple Pay-style sheet rises: "Northside Clinic · €40.00",
a mint "Paid" badge lands with a tick. Hold.

### 3. `till-card-reader.gif`: a till for the clinic
Dark. A checkout total in large type counts up as two line items settle in: "Initial consultation
€45.00", "Scalp serum €38.00", "Total €83.00". A QR code tile fades in beside the total, then a card
reader silhouette with a contactless wave. A mint "Paid · receipt sent" line concludes. Hold.

### 4. `booking-forms.gif`: online booking with consultation forms
Light. A row of date chips, one highlights (Thu 12). Time chips appear, 10:00 highlights. A
confirmation card settles: "Thursday 12 November · 10:00 · Initial consultation". Then a second card
slides up behind it, a form with three fields filling themselves with dots, titled "Pre-consultation
form · completed", mint tick. Hold.

### 5. `team-management.gif`: your team, managed
Dark. Three circular avatars with initials (AM, ST, PS) rise into a row. Under each, a role label.
A weekly hours bar draws across for each (20h, 24h, 16h). One day on one grid flips to "Time off"
in muted type. Finish with a slim statement card: "Commission · October · £41.35" and a mint tick.
Hold.

### 6. `clinic-records.gif`: every client, remembered
Light. One client card: initials avatar, name "Sarah B.", then lines fade in beneath, one by one:
"Last visit · 14 Oct", "Prefers morning appointments", "Follow-up due · 9 Nov". A question pill
rises from below in the client's words: "Do you treat scalp psoriasis?" and Kiera's answer appears
in a mint-tinted bubble: "Yes. Book an initial consultation and we'll build a plan with you." Hold.

## Also needed

- `logo.png` is already in place. Nothing to do.
- If a card cannot be animated in time, a 1200 × 675 PNG still of its final frame with the same
  file name (and `.png` extension) works in the meantime; the send script falls back to it.
