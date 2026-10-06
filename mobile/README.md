# Trichollective for iOS and Android

The member app, built with Expo (SDK 57) and Expo Router. It talks to the
website's JSON API under `/api/mobile/v1`, which lives in the Next.js app at
`src/app/api/mobile/v1/` in the repository root.

## Run it

```bash
cd mobile
npm install
# Point the app at your local website (use your Mac's LAN address for a real phone):
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo run:ios
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npx expo run:android
```

Push notifications need an EAS project (`EAS_PROJECT_ID`) and a real device.
In-app purchases need `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
Without those keys the app still runs; membership just can't be bought in it.

## How it fits together

- **Sign-in.** Members type their email and get a six-digit code
  (`auth/code`, `auth/verify`). The server returns a bearer token, kept in the
  keychain by `expo-secure-store`. On the server, `auth()` accepts that token,
  so every existing server action and helper (`getMemberContext()`, etc.) works
  for the app exactly as it does for the website.
- **Routes mirror the website.** `/members/community/abc` on the web is
  `/community/abc` in the app. `src/lib/links.ts` maps notification links, and
  anything the app does not show opens on the web.
- **Membership.** Bought in the app through RevenueCat (App Store, Google Play).
  `POST billing/sync` and the RevenueCat webhook (`/api/webhooks/revenuecat`)
  record it on the User (`storePlan`, `storeCurrentPeriodEnd`), and
  `getMembershipByEmail` counts it the same as Stripe.
- **Push.** Every `Notification` row the website creates is also pushed to the
  member's phones (a Prisma query extension in `src/lib/prisma.ts`).

## Conventions

### Server (`src/app/api/mobile/v1/<area>/…/route.ts`)

- Wrap every handler in `withMember(handler, { members: true })` from
  `@/lib/mobile/api`. Leave `members` off only for things a free account can see on
  the website too. `ctx` is the same `MemberContext` the web pages use.
- **Reuse, don't re-implement.** Reads: lift the query out of the web page into
  a function in `src/lib/…` or the area's `_data.ts`, and call it from both the
  page and the route. Writes: call the existing server action through
  `runAction(() => action(null, formData({...})))`, so validation, moderation,
  notifications and emails stay in one place.
- Return plain JSON. Dates go out as ISO strings, which is what `NextResponse.json` does.
- Paginate long lists with `page(req)` (cursor + limit).

### App (`mobile/src`)

- Screens go in `src/app/(app)/…`, matching the website path without `/members`.
  Set the header title from inside the screen with `<Stack.Screen options={{ title }} />`.
  Don't edit `src/app/(app)/_layout.tsx` or the tab layout unless you have to.
- Data comes through `@tanstack/react-query` and `api()` from `@/lib/api`. Query
  keys start with the area name, e.g. `["community", "post", id]`.
- Use the kit in `@/components/ui` (Screen, Text variants, Button, Card, Input,
  Avatar, Badge, Loading/Empty/ErrorState) and tokens in `@/theme`. Put area
  components in `src/components/<area>/`.
- Icons come from `lucide-react-native`, at `strokeWidth={1.75}`.
- Images from the website go through `mediaUrl()` so private files carry the token.
- `ErrorState` already turns a 402 into an invitation to become a member.

### Copy

Write as the website does: full sentences that say what the member gets, in
the language hair and scalp professionals use. No fragment headlines, and no
cute lines.
