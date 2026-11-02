import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { CopyLink } from "@/components/members/CopyLink";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { Card, Empty, Field, Notice, NoAccess, PageHeader, Section, Tag, TextLink, dateOnly, fieldClass } from "@/components/studio/ui";
import { premiumBusiness } from "@/config/subscriptions";
import { site } from "@/config/site";
import { PARTNER_CATEGORIES } from "@/lib/partners";
import { inclusionsFrom, offerPath, offerPriceLabel } from "@/lib/partner-offers";
import { PARTNER_TERMS_VERSION } from "@/content/partner-terms";
import { studioPage } from "../../_lib/guard";
import { createOfferAction, markOfferPaidAction, withdrawOfferAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudioPartnerOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; notice?: string; tone?: string }>;
}) {
  if (!(await studioPage("/studio/partners/offers", "partners.view"))) return <NoAccess what="partner offers" />;
  const sp = await searchParams;
  const offers = await prisma.partnerOffer.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const showForm = sp.new === "1";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Premium offers"
        intro="For a Premium deal agreed by hand, such as a founding rate. Create the offer here, then send the brand its private link. On one page in their own colours, they read your note and what is included, sign the agreement, pay by card or ask for an invoice, and their partner page opens as soon as the payment arrives. The signed PDF is kept here."
        actions={
          !showForm && (
            <Button asChild>
              <Link href="/studio/partners/offers?new=1">
                <Plus /> New offer
              </Link>
            </Button>
          )
        }
      />
      <p className="text-sm text-ink-2">
        <TextLink href="/studio/partners">Back to partners</TextLink> ·{" "}
        <TextLink href="/terms/partners">Read the partner terms (version {PARTNER_TERMS_VERSION})</TextLink>
      </p>

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {showForm && (
        <Card>
          <form action={createOfferAction} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name">
                <input name="businessName" required className={`${fieldClass} h-10`} placeholder="Livdor" />
              </Field>
              <Field label="Category">
                <select name="category" defaultValue="Haircare" className={`${fieldClass} h-10`}>
                  {PARTNER_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Contact name" hint="Optional.">
                <input name="contactName" className={`${fieldClass} h-10`} />
              </Field>
              <Field label="Email" hint="Where you send the link. They can choose a different sign-in email when they accept.">
                <input name="email" type="email" required className={`${fieldClass} h-10`} />
              </Field>
              <Field label="Website" hint="Optional.">
                <input name="website" className={`${fieldClass} h-10`} placeholder="livdor.com" />
              </Field>
              <Field label="Price in pounds">
                <input
                  name="priceGBP"
                  required
                  inputMode="numeric"
                  defaultValue={premiumBusiness.foundingAnnualPrice}
                  className={`${fieldClass} h-10`}
                />
              </Field>
              <Field label="Billed">
                <select name="interval" defaultValue="year" className={`${fieldClass} h-10`}>
                  <option value="year">Yearly</option>
                  <option value="month">Monthly</option>
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-ink">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isFounding" defaultChecked /> Founding partner
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="fixedPrice" defaultChecked /> Price fixed for as long as they stay
              </label>
            </div>
            <fieldset className="space-y-4 rounded-2xl border border-rule p-4">
              <legend className="px-1 text-sm font-medium text-ink">Their page: how the onboarding looks</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUpload name="logoFile" shape="wide" label="Logo" hint="PNG, JPG or WebP. Or paste a link below." />
                <ImageUpload name="heroFile" shape="wide" label="Cover photo" hint="A product or brand photograph. Or paste a link below." />
                <Field label="Logo link" hint="Optional, if not uploaded.">
                  <input name="logoUrl" className={`${fieldClass} h-10`} placeholder="https://…" />
                </Field>
                <Field label="Cover photo link" hint="Optional, if not uploaded.">
                  <input name="heroUrl" className={`${fieldClass} h-10`} placeholder="https://…" />
                </Field>
                <Field label="Brand colour" hint="A hex code. The page is themed in it.">
                  <input name="accentColor" className={`${fieldClass} h-10 font-mono`} placeholder="#0B1A33" />
                </Field>
                <Field label="Founding number" hint={`Shown as "No. 1 of ${premiumBusiness.foundingPlaces}".`}>
                  <input name="foundingNumber" inputMode="numeric" className={`${fieldClass} h-10`} placeholder="1" />
                </Field>
              </div>
              <Field label="Tagline" hint="Optional. One line under their name.">
                <input name="tagline" className={`${fieldClass} h-10`} />
              </Field>
              <Field label="A note from Karley" hint="Opens the page like an editor's letter. Leave blank for the standard note. Separate paragraphs with a blank line.">
                <textarea name="personalNote" rows={6} className={`${fieldClass} py-2`} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First masterclass" hint="Optional. The topic, written to teach.">
                  <input name="firstMasterclass" className={`${fieldClass} h-10`} />
                </Field>
                <Field label="First Trichozette feature" hint="Optional. For example, the edition it appears in.">
                  <input name="firstFeature" className={`${fieldClass} h-10`} />
                </Field>
              </div>
            </fieldset>
            <fieldset className="space-y-4 rounded-2xl border border-rule p-4">
              <legend className="px-1 text-sm font-medium text-ink">The company, prefilled on the signing form</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Registered company name">
                  <input name="legalNameHint" className={`${fieldClass} h-10`} />
                </Field>
                <Field label="Company number">
                  <input name="companyNumberHint" className={`${fieldClass} h-10`} />
                </Field>
              </div>
              <Field label="Registered office address">
                <textarea name="addressHint" rows={2} className={`${fieldClass} py-2`} />
              </Field>
            </fieldset>
            <Field label="What is included" hint="One item per line. This becomes the schedule of their agreement, so match what you agreed.">
              <textarea name="inclusions" required rows={10} defaultValue={premiumBusiness.features.join("\n")} className={`${fieldClass} py-2`} />
            </Field>
            <Field label="Anything else agreed" hint="Optional. For example, a first feature in this Friday's Trichozette.">
              <textarea name="specialTerms" rows={3} className={`${fieldClass} py-2`} />
            </Field>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">Legacy: a Stripe payment link made by hand</summary>
              <Field label="Stripe payment link" hint="Only for older deals. New offers take payment on the page itself." className="mt-3">
                <input name="paymentUrl" className={`${fieldClass} h-10`} placeholder="https://buy.stripe.com/…" />
              </Field>
            </details>
            <div className="flex gap-2">
              <SubmitButton>Create offer and link</SubmitButton>
              <Button asChild variant="ghost">
                <Link href="/studio/partners/offers">Cancel</Link>
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Section title="All offers">
        {offers.length ? (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {offers.map((o) => {
              const url = `${site.url}${offerPath(o.token)}`;
              return (
                <li key={o.id} className="space-y-3 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-ink">{o.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {offerPriceLabel(o)} · {o.email} · {inclusionsFrom(o.inclusions).length} benefits · Created {dateOnly(o.createdAt)}
                        {o.createdBy && ` by ${o.createdBy}`}
                      </p>
                      {o.status === "accepted" && (
                        <p className="text-xs text-muted-foreground">
                          Accepted {dateOnly(o.acceptedAt)} by {o.signerName}, {o.signerRole}, for {o.legalName}
                          {o.companyNumber && ` (${o.companyNumber})`}. Signs in with {o.accountEmail}. Terms version {o.termsVersion}.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {o.isFounding && <Tag tone="ink">Founding</Tag>}
                      {o.paidAt ? (
                        <Tag tone="positive">Paid {dateOnly(o.paidAt)}</Tag>
                      ) : o.paymentMethod === "invoice" ? (
                        <Tag tone="warn">Invoice sent</Tag>
                      ) : (
                        <Tag tone="warn">Not paid</Tag>
                      )}
                      {o.status === "accepted" ? (
                        <Tag tone="positive">Accepted</Tag>
                      ) : o.status === "withdrawn" ? (
                        <Tag tone="danger">Withdrawn</Tag>
                      ) : (
                        <Tag>Waiting to accept</Tag>
                      )}
                      {o.contractFileId && (
                        <Button asChild size="xs" variant="ghost">
                          <a href={`${offerPath(o.token)}/contract`} target="_blank" rel="noopener">
                            Signed PDF
                          </a>
                        </Button>
                      )}
                      {o.stripeSubscriptionId && (
                        <Button asChild size="xs" variant="ghost">
                          <a href={`https://dashboard.stripe.com/subscriptions/${o.stripeSubscriptionId}`} target="_blank" rel="noopener noreferrer">
                            Stripe
                          </a>
                        </Button>
                      )}
                      {o.partnerId && (
                        <Button asChild size="xs" variant="ghost">
                          <Link href={`/studio/partners/${o.partnerId}`}>Partner page</Link>
                        </Button>
                      )}
                      {!o.paidAt && o.status !== "withdrawn" && (
                        <form action={markOfferPaidAction}>
                          <input type="hidden" name="id" value={o.id} />
                          <Button type="submit" size="xs" variant="outline">
                            Mark paid
                          </Button>
                        </form>
                      )}
                      {o.status === "sent" && (
                        <form action={withdrawOfferAction}>
                          <input type="hidden" name="id" value={o.id} />
                          <Button type="submit" size="xs" variant="ghost">
                            Withdraw
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  {o.status !== "withdrawn" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input readOnly value={url} aria-label={`Onboarding link for ${o.businessName}`} className={`${fieldClass} h-10 min-w-0 flex-1 font-mono text-xs`} />
                      <CopyLink value={url} />
                      <Button asChild variant="ghost">
                        <Link href={`${offerPath(o.token)}?preview=1`} target="_blank">
                          Preview as brand
                        </Link>
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No offers yet. Create one for each Premium deal you agree by hand, then send the brand its link.</Empty>
        )}
      </Section>
    </div>
  );
}
