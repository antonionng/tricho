import Link from "next/link";
import { Plus } from "lucide-react";
import type { Partner } from "@prisma/client";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, Field, Notice, PageHeader, Section, Stat, Tag, TextLink, dateOnly, fieldClass, NoAccess } from "@/components/studio/ui";
import { premiumBusiness } from "@/config/subscriptions";
import { foundingPartnerPlacesLeft } from "@/lib/founding";
import { PARTNER_CATEGORIES, partnerLogoSrc, partnerTierLabel, sortPartners } from "@/lib/partners";
import { partnerStatsTotals, plural } from "@/lib/partner-stats";
import { studioPage } from "../_lib/guard";
import { savePartnerAction } from "./actions";

export const dynamic = "force-dynamic";

function dateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function StudioPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; notice?: string; tone?: string }>;
}) {
  if (!(await studioPage("/studio/partners", "partners.view"))) return <NoAccess what="partner pages" />;
  const sp = await searchParams;

  const [partners, editing, foundingLeft, applications] = await Promise.all([
    prisma.partner.findMany({ orderBy: { name: "asc" }, include: { organisation: { select: { id: true } } } }),
    sp.edit ? prisma.partner.findUnique({ where: { id: sp.edit }, include: { organisation: { select: { id: true } } } }) : null,
    foundingPartnerPlacesLeft(),
    prisma.draft.count({ where: { agent: "website", kind: "partner_enquiry", status: "draft" } }),
  ]);
  const showForm = !!editing || sp.new === "1";
  const sorted = sortPartners(partners);
  const stats = await partnerStatsTotals(partners.map((p) => p.id), 30);


  return (
    <div className="space-y-10">
      <PageHeader
        title="Partners"
        intro={`Premium and Business partners shown on /partners, in member perks and in the partner strip. Nothing appears until you tick Published, except Premium pages bought online, which go live as soon as they are paid. Only the first ${premiumBusiness.foundingPlaces} Premium partners can be founding partners.`}
        actions={
          !showForm && (
            <Button asChild>
              <Link href="/studio/partners?new=1">
                <Plus /> New partner
              </Link>
            </Button>
          )
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Founding places left"
          value={`${foundingLeft} of ${premiumBusiness.foundingPlaces}`}
          note={`£${premiumBusiness.foundingAnnualPrice.toLocaleString("en-GB")} a year, then £${premiumBusiness.annualPrice.toLocaleString("en-GB")}`}
        />
        <Stat
          label="Published partners"
          value={partners.filter((p) => p.published).length}
          note={`${partners.filter((p) => p.published && p.tier === "premium").length} of them Premium`}
        />
        <Stat
          label="Applications waiting"
          value={applications}
          note="Partner applications and enquiries in the inbox"
        />
      </div>
      <p className="text-sm text-ink-2">
        <TextLink href="/studio/inbox?agent=website">Open partner applications in the inbox</TextLink>
      </p>

      {showForm && <PartnerForm partner={editing} />}

      <Section title="All partners">
        {sorted.length ? (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {sorted.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {partnerTierLabel(p.tier)} · {p.category} · /partners/{p.slug}
                    {p.featuredUntil && ` · Featured until ${dateOnly(p.featuredUntil)}`}
                    {p.contactEmail && ` · ${p.contactEmail}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const t = stats.get(p.id);
                      return t
                        ? `Last 30 days: ${plural(t.views, "view", "views")}, ${plural(t.websiteClicks, "website click", "website clicks")}, ${plural(t.perkClaims, "perk claim", "perk claims")}.`
                        : "No views, website clicks or perk claims in the last 30 days.";
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.isFounding && <Tag tone="ink">Founding</Tag>}
                  {p.perk ? <Tag>Perk</Tag> : <Tag tone="warn">No perk</Tag>}
                  {p.hidden ? (
                    <Tag tone="warn">Paused</Tag>
                  ) : p.published ? (
                    <Tag tone="positive">Published</Tag>
                  ) : (
                    <Tag tone="warn">Not published</Tag>
                  )}
                  {p.ownerEmail && <Tag>Brand manages</Tag>}
                  {p.organisation && (
                    <Button asChild size="xs" variant="ghost">
                      <Link href={`/studio/crm/${p.organisation.id}`}>Record</Link>
                    </Button>
                  )}
                  {p.published && (
                    <Button asChild size="xs" variant="ghost">
                      <Link href={`/partners/${p.slug}`} target="_blank">
                        View
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/studio/partners?edit=${p.id}`}>Edit</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            No partners yet. When you approve an application from the inbox, add the partner here and tick Published
            to show them on the website.
          </Empty>
        )}
      </Section>
    </div>
  );
}

function PartnerForm({ partner }: { partner: (Partner & { organisation: { id: string } | null }) | null }) {
  const categories: string[] = [...PARTNER_CATEGORIES];
  if (partner && !categories.includes(partner.category)) categories.unshift(partner.category);

  return (
    <form action={savePartnerAction} className="max-w-4xl space-y-5 rounded-2xl border border-rule bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{partner ? `Edit ${partner.name}` : "New partner"}</h2>
        <div className="flex items-center gap-4">
          {partner?.organisation && (
            <TextLink href={`/studio/crm/${partner.organisation.id}`}>Open the business record</TextLink>
          )}
          <Link href="/studio/partners" className="text-sm text-ink-2 underline underline-offset-4">
            Cancel
          </Link>
        </div>
      </div>
      {partner && <input type="hidden" name="id" value={partner.id} />}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <Field
          label="Company name"
          hint={partner ? `Web address: /partners/${partner.slug}` : "The web address is made from the name."}
        >
          <input name="name" defaultValue={partner?.name} required className={fieldClass} />
        </Field>
        <Field label="Tier">
          <select name="tier" defaultValue={partner?.tier ?? "premium"} className={fieldClass}>
            <option value="premium">Premium Business</option>
            <option value="business">Business</option>
          </select>
        </Field>
        <Field label="Category">
          <select name="category" defaultValue={partner?.category ?? ""} required className={fieldClass}>
            <option value="" disabled>
              Choose
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Blurb" hint="Two or three sentences about what they make and who it is for. Leave a blank line between paragraphs. No clinical claims.">
        <textarea name="blurb" defaultValue={partner?.blurb} required rows={4} className={fieldClass} />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Logo</p>
        <ImageUpload
          name="logoFile"
          currentUrl={partnerLogoSrc(partner?.logoUrl)}
          shape="wide"
          label={partner?.logoUrl ? "Upload a new logo" : "Upload a logo"}
          hint="A PNG, JPG or WebP up to 5MB, ideally on a transparent background. It is resized and stored for you. Logos the brand uploads appear here by themselves."
          removeName="removeLogo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Logo address (instead of uploading)" hint="Only if the logo lives elsewhere: a full link to a PNG or SVG. An upload above takes priority.">
          <input type="text" name="logoUrl" defaultValue={partner?.logoUrl ?? ""} placeholder="https://…" className={fieldClass} />
        </Field>
        <Field label="Website">
          <input name="website" defaultValue={partner?.website ?? ""} placeholder="https://…" className={fieldClass} />
        </Field>
      </div>

      <Field label="Member perk" hint="Shown in full to members only, for example the discount, the code and how to claim it.">
        <textarea name="perk" defaultValue={partner?.perk ?? ""} rows={3} className={fieldClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email" hint="Private. Never shown on the website.">
          <input type="email" name="contactEmail" defaultValue={partner?.contactEmail ?? ""} className={fieldClass} />
        </Field>
        <Field label="Featured until" hint="Optional. Featured partners are listed first within their tier.">
          <input type="date" name="featuredUntil" defaultValue={dateInput(partner?.featuredUntil)} className={fieldClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Public email" hint="Optional. Shown on the public partner page so professionals can contact the brand directly.">
          <input type="email" name="publicEmail" defaultValue={partner?.publicEmail ?? ""} className={fieldClass} />
        </Field>
        <Field label="Public phone" hint="Optional. Shown on the public partner page, so check the brand is happy for anyone to call it.">
          <input type="tel" name="publicPhone" defaultValue={partner?.publicPhone ?? ""} className={fieldClass} />
        </Field>
      </div>

      <Field
        label="Managed by"
        hint="The email the brand signs in with. They can then edit this page, upload a logo and give five of their team Professional from Your business in the member area. Premium partners managed this way also get Professional themselves."
      >
        <input type="email" name="ownerEmail" defaultValue={partner?.ownerEmail ?? ""} className={fieldClass} />
      </Field>

      <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
        <input type="checkbox" name="hidden" defaultChecked={partner?.hidden ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
        <span>
          <span className="font-medium text-ink">Paused</span>
          <span className="block text-muted-foreground">
            Takes the page down and stops the brand republishing it from their portal, for example if a payment stops or
            something breaks the guidelines.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
          <input type="checkbox" name="isFounding" defaultChecked={partner?.isFounding ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            <span className="font-medium text-ink">Founding partner</span>
            <span className="block text-muted-foreground">
              Premium only. Pays £{premiumBusiness.foundingAnnualPrice.toLocaleString("en-GB")} a year. At most{" "}
              {premiumBusiness.foundingPlaces}.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-sm">
          <input type="checkbox" name="published" defaultChecked={partner?.published ?? false} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            <span className="font-medium text-ink">Published</span>
            <span className="block text-muted-foreground">Show them on /partners and in member perks, and Premium partners in the partner strip.</span>
          </span>
        </label>
      </div>

      <SubmitButton pendingLabel="Saving…">{partner ? "Save changes" : "Create partner"}</SubmitButton>
    </form>
  );
}
