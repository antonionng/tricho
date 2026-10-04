# Mobile check

This is the record of the mobile and responsive check run on 4 October 2026, the day before the Trichollective Ireland launch.

## How it was checked

Every page was loaded in Playwright with real mobile emulation (touch, mobile user agent and device pixel ratio) on the local development server, signed in with the seeded test accounts where a page needs one. For each page the script checked that the page never scrolls sideways (`scrollWidth` is no wider than the screen), listed any element that runs off the screen, listed tap targets shorter than 36px and any text field under 16px, and took screenshots that were reviewed by eye.

Viewports:

| Name | Size | Device profile |
|---|---|---|
| 375 | 375 × 812 | iPhone SE profile at mini height |
| 390 | 390 × 844 | iPhone 14 |
| 430 | 430 × 932 | iPhone 14 Pro Max |
| Pixel 7 | 412 × 915 | Pixel 7 |
| 768 | 768 × 1024 | Tablet with touch |
| 1440 | 1440 × 900 | Desktop |

"Pass" means no sideways scroll, nothing cut off, and no fixed bar covering content. "Fixed" means the page failed before the changes listed below and passes now.

## Results

### Public site

| Page | 375 | 390 | 430 | Pixel 7 | 768 | 1440 |
|---|---|---|---|---|---|---|
| `/` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/ireland` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/pricing` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/founding` | Fixed (1) | Pass | Pass | Pass | Pass | Pass |
| `/for-business` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/partners` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/partners/[slug]` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/directory` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/directory/[discipline]` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/directory/p/[slug]` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/events` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/events/[slug]` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/trichozette` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/trichozette/[slug]` | Pass | Pass | Pass | Pass | Fixed (2) | Pass |
| `/podcast` | Fixed (3) | Pass | Pass | Pass | Pass | Pass |
| `/login` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/login/check-email` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/signup` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/welcome` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/about` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/contact` | Pass | Pass | Pass | Pass | Pass | Pass |
| Mobile menu (every page) | Fixed (4) | Fixed (4) | Fixed (4) | Fixed (4) | Fixed (4) | Not shown |
| Join bar and footer | Fixed (5) | Fixed (5) | Fixed (5) | Fixed (5) | Fixed (5) | Not shown |

### Member area (Professional member)

| Page | 375 | 390 | 430 | Pixel 7 | 768 | 1440 |
|---|---|---|---|---|---|---|
| `/members` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/community` | Pass | Pass | Pass | Pass | Pass | Pass |
| A community post | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/profile` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/people` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/messages` and a thread | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/events` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/perks` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/referrals` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/refer` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/billing` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/onboarding` | Pass | Pass | Pass | Pass | Pass | Pass |
| Bottom tab bar | Fixed (6) | Fixed (6) | Fixed (6) | Fixed (6) | Fixed (6) | Not shown |

### Brand portal (Business account)

| Page | 375 | 390 | 430 | Pixel 7 | 768 | 1440 |
|---|---|---|---|---|---|---|
| `/members/business` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/members/business/setup` | Pass | Pass | Pass | Pass | Pass | Pass |

### Studio (Owner)

| Page | 375 | 390 | 430 | Pixel 7 | 768 | 1440 |
|---|---|---|---|---|---|---|
| `/studio` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/studio/crm` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/studio/members` | Pass | Pass | Pass | Pass | Pass | Pass |
| Phone header and tab strip | Fixed (7) | Fixed (7) | Fixed (7) | Fixed (7) | Fixed (7) | Not shown |

## What was fixed

1. **Founding, Business card.** The long "Join Business at £99 a month" button would not wrap, so it pushed the card past the edge of a 375px screen. Buttons now wrap onto two lines on phones, and the larger button sizes grow in height to fit.
2. **Trichozette reader on tablets.** Pull quotes were pulled 96px wider than the text column from 768px, which ran off a tablet screen. They now widen only from 1024px.
3. **Podcast sign-up.** The email field in the newsletter form held its own minimum width, which pushed the sign-up card wider than a small phone. The field now shrinks to fit beside its button.
4. **Mobile menu.** The menu opened inside the header instead of filling the screen, because the header's background blur traps fixed panels. The menu now sits outside the header, fills the screen below it, keeps its scrolling to itself, and its bottom buttons clear the home indicator.
5. **Sticky join bar.** The bar covered the last lines of the footer, and its padding collapsed on phones without a home indicator. Pages that show the bar now leave room for it, and the bar keeps its padding on every phone. Footer links are 40px tall on touch screens.
6. **Member tab bar.** The page now leaves room for the bar plus the home indicator, the bar respects the screen's rounded corners in landscape, the active tab is bold as well as dark, and tabs give a light press state.
7. **Studio on phones.** The header respects the notch and rounded corners, the tab strip keeps its sideways scroll to itself, and the tabs and the "Member app" link are 40px tall.

## App feel, across the whole platform

- The viewport fills the screen edge to edge (`viewport-fit=cover`) and fixed bars pad themselves for the notch and home indicator. Pinch zoom stays on for accessibility.
- No page can scroll sideways, and the page no longer rubber-bands as a whole. Menus, tab strips and chat threads still scroll on their own.
- Taps act straight away, with no 300ms delay, no double-tap zoom on controls and no grey tap flash.
- Every text field is at least 16px on phones and touch screens, so iPhones no longer zoom in when a field is focused.
- Long words, emails and links wrap rather than widening the page.
- Small buttons and icon buttons grow to 40px on touch screens.
- Members can add Trichollective to their home screen. It opens full screen at `/members` with the brand icon, including a maskable Android icon and the Apple touch icon. There is no service worker.

## Left for the portal owners

- **Studio filter chips** on `/studio/members` and `/studio/crm` (stage, plan and status filters, and the Table and Board switch) are 26 to 28px tall. They work, but `min-h-10` on touch screens would make them easier to tap.
- **Message thread composer** sits on `bottom-[calc(4rem+env(safe-area-inset-bottom))]`. The new `bottom-tabbar` utility gives the exact tab bar height if the composer should sit flush on the bar.
- **Author names and breadcrumbs** are plain text links about 20px tall. That is normal for inline links, so they were left as they are.
