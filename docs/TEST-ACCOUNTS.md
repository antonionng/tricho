# Test accounts

These accounts exist only in local and preview databases. They are created by
`prisma/seed.ts`, which refuses to run against the live database.

## Signing in

- **Locally:** run `npm run dev`, open `/login` and use the "Local development
  sign-in" form. Enter one of the emails below; there is no password.
- **On a Vercel preview:** the same form appears when `PREVIEW_DEMO=true`, and
  it also asks for the preview passcode (`PREVIEW_PASSCODE` in Vercel).
- **On the live site** there is no test sign-in. Real accounts sign in with
  Google or an email link.

To recreate the accounts locally:

```bash
DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | sed -E 's/^DATABASE_URL="?([^"]*)"?$/\1/')" npx tsx prisma/seed.ts
```

## Accounts

| Portal | Email | What it shows |
|---|---|---|
| Member (Professional) | `aoife.sample@example.test` | The member area with Professional access: community including the Case Room, directory profile, referrals and invitations. |
| Member (Community) | `maya.sample@example.test` | The member area on the Community plan, without Professional features. |
| Free account | `free.sample@example.test` | A free account whose directory listing is inside its 90-day trial. |
| Business | `business.sample@example.test` | The brand portal at `/members/business` for "Sample Scalp Clinic", a Business-tier partner page, with setup steps, team seats and results. |
| Premium Business | `premium.sample@example.test` | The brand portal for "Premium Sample Devices", a Premium, founding partner page. |
| Owner | `owner.sample@example.test` | Studio at `/studio` with every permission, including Team, Audit log, Businesses and Referrals. |
| Editor | `karley@example.test` | Studio limited to the Editor role: Trichozette, podcast, newsletters and emails. |

Any other role can be tested by giving one of these accounts that role on the
Studio Team page, signed in as the owner.

## Production test accounts (trichollective.net)

These are real accounts on the live site, used by the team to check every portal.
They sign in with the emailed link, and every link goes to the `ag@experrt.com`
inbox (Google Workspace delivers `+` addresses to the main inbox). Each account
is tagged `staff-test`, and both test brand pages are unpublished, so the public
never sees them.

| Portal | Email | Access |
|---|---|---|
| Member (Professional) | `ag+member@experrt.com` | Complimentary Professional plan, practitioner role |
| Member (Community) | `ag+community@experrt.com` | Complimentary Community plan |
| Free account | `ag+free@experrt.com` | No plan |
| Business | `ag+business@experrt.com` | Complimentary Business plan and the unpublished page "Test Clinic (staff test)" |
| Premium Business | `ag+premium@experrt.com` | The unpublished Premium page "Test Brand (staff test)" |
| Owner | `ag+owner@experrt.com` | Owner in Studio |
| Editor | `ag+editor@experrt.com` | Editor in Studio |
| Moderator | `ag+moderator@experrt.com` | Moderator in Studio |

None of them have finished onboarding, so the first sign-in walks through the
full member onboarding, exactly as a new member would.

To remove them later, an owner can delete the two "(staff test)" partner pages
in Studio → Partners, remove the staff roles in Studio → Team, and set each
complimentary plan to "No complimentary plan" in Studio → Members. Every
account carries the `staff-test` tag, which you can filter by in Studio → Members.
