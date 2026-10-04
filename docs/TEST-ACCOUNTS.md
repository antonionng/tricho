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
