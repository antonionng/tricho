# Going live

Target: live and tested by **Saturday 3 October**, ready for Trichollective Dublin on **Monday 5 October**.

## 1. What we need from you

| # | Item | Where it goes | Why |
|---|---|---|---|
| 1 | **Stripe prices**: Community (£9, founding £6, annual £90), Professional (£19, founding £14, annual £190), Business (£99, annual £990) | Vercel env: `STRIPE_PRICE_ID_COMMUNITY`, `_COMMUNITY_FOUNDING`, `_COMMUNITY_ANNUAL`, `_PROFESSIONAL`, `_PROFESSIONAL_FOUNDING`, `_PROFESSIONAL_ANNUAL`, `_BUSINESS`, `_BUSINESS_ANNUAL` | Without them the join buttons explain that payments aren't switched on yet. |
| 2 | **Stripe webhook** pointing at `https://<domain>/api/webhooks/stripe` with events `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted` | `STRIPE_WEBHOOK_SECRET` | This is what turns a payment into a membership and claims a free listing. |
| 3 | **Resend** API key and a verified sending address (e.g. `hello@` your domain) | `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` | Magic-link sign-in, the newsletter and reminder emails. |
| 4 | **Vercel AI Gateway** key | `AI_GATEWAY_API_KEY` | The Assistant and the agents. Without it, agents still draft from templates. |
| 5 | **The domain** you want to launch on | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL` | Canonical links, share images, QR codes and emails. |
| 6 | **The logo** as SVG | `src/components/brand/BrandMark.tsx` | Replaces the text wordmark everywhere at once. |
| 7 | **Karley's email address** for her admin account | Studio → Members → make admin | So she can approve and publish from the Studio. |
| 8 | A **contact email** for the footer and enquiries | `NEXT_PUBLIC_CONTACT_EMAIL` | Currently a placeholder. |

Also set `CRON_SECRET` (any long random string) so the agents' scheduled runs are authorised, and **do not** set `DEV_MEMBERSHIP_UNLOCK` in production.

## 2. Database (the live Supabase database already has real data)

The change is **additive only**: new tables, new columns and new indexes. A read-only comparison on 30 September found nothing that drops or rewrites existing data. The SQL is in `prisma/go-live/2026-09-30-catch-up.sql` for review.

1. Take a backup in Supabase (Database → Backups) before anything else.
2. Regenerate the comparison on the day, in case the live schema changed:
   `DATABASE_URL=<live> npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > catch-up.sql`
   Check it contains no `DROP TABLE`, `DROP COLUMN` or type changes.
3. Apply it: `DATABASE_URL=<live> npx prisma db execute --file catch-up.sql`
4. Tell Prisma the migrations are now in place, so future deploys run cleanly:
   `for m in prisma/migrations/2*/; do DATABASE_URL=<live> npx prisma migrate resolve --applied "$(basename $m)"; done`
5. Tidy the existing data (dry run first, then apply):
   `ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live`
   `ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live --apply`
   This gives existing listings a profile address, starts their 90 free days from launch day, and sets the plan for existing subscribers.

**Never** run `prisma migrate dev` or `prisma db push --force-reset` against the live database. The sample seed refuses to run anywhere but a local database.

## 3. Deploy and test (Saturday)

- [ ] Merge the pull request, or deploy the branch as a preview first.
- [ ] Buy a Community plan in Stripe test mode and confirm the account appears in Studio → Members with the right plan.
- [ ] Pay with the email on a free listing and confirm the listing becomes a full profile.
- [ ] Add a free listing from `/directory/list`, approve it in Studio → Listings, and check it appears in the directory.
- [ ] Open `/dublin` on a phone from the printed QR code and complete a sign-up.
- [ ] Run each agent once from Studio → Agents and check the drafts in the inbox.
- [ ] Share a Trichozette link in WhatsApp or Slack and check the preview image.
- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console.

## 4. Content sign-off before launch

- [ ] A qualified clinician checks the medical Trichozette editions, the public guides and the 28 news items (every claim links to its source).
- [ ] A solicitor reviews `/privacy` and `/terms`, which are marked as drafts.
- [ ] Karley answers her first column questions in the Studio inbox.
