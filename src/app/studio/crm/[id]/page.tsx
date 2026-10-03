import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { Card, Empty, Field, NoAccess, Notice, PageHeader, Section, Tag, TextLink, dateOnly, dateTime, fieldClass } from "@/components/studio/ui";
import { urlForFile } from "@/lib/storage";
import { BUSINESS_SEATS, getMembershipByEmail } from "@/lib/subscription";
import { PARTNER_CATEGORIES, partnerTierLabel, safeHttpUrl } from "@/lib/partners";
import { partnerStatsSummary, plural } from "@/lib/partner-stats";
import {
  KIND_LABEL,
  NOTE_KINDS,
  NOTE_KIND_LABEL,
  ORG_KINDS,
  ORG_SIZES,
  ORG_STAGES,
  SOCIAL_KEYS,
  SOCIAL_LABEL,
  STAGE_LABEL,
  formatGBP,
  isFollowUpDue,
  kindLabel,
  mergeTimeline,
  readSocials,
  type NoteKind,
} from "@/lib/crm";
import { cn } from "@/lib/utils";
import { studioPage } from "../../_lib/guard";
import { teamMembers } from "../_lib/data";
import { StageTag } from "../_lib/StageTag";
import {
  addContactAction,
  addOrgNoteAction,
  convertToPartnerAction,
  deleteOrganisationAction,
  removeContactAction,
  saveOverviewAction,
  updateContactAction,
  updateDetailsAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Search = { notice?: string; tone?: string; confirm?: string };

function Hidden({ id }: { id: string }) {
  return <input type="hidden" name="id" value={id} />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-rule py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-32 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink">{children}</dd>
    </div>
  );
}

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default async function BusinessPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const staff = await studioPage(`/studio/crm/${id}`, "crm.view");
  if (!staff) return <NoAccess what="the business CRM" />;
  const sp = await searchParams;

  const org = await prisma.organisation.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, slug: true, name: true, tier: true, published: true, hidden: true, isFounding: true, ownerEmail: true, category: true } },
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        include: { user: { select: { id: true, name: true } } },
      },
      notes: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });
  if (!org) notFound();

  const canEdit = staff.perms.has("crm.edit");
  const isOwner = staff.role === "owner";
  const now = new Date();
  const accountEmail = org.accountEmail ?? org.partner?.ownerEmail ?? null;

  const authorIds = [...new Set(org.notes.map((n) => n.authorId).filter((x): x is string => !!x))];
  const [team, logoUrl, audits, authors, membership, seats, account, stats] = await Promise.all([
    teamMembers(),
    urlForFile(org.logoFileId),
    prisma.auditLog.findMany({
      where: { targetType: "organisation", targetId: id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, createdAt: true, action: true, summary: true, actorEmail: true },
    }),
    authorIds.length ? prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true } }) : [],
    accountEmail ? getMembershipByEmail(accountEmail) : null,
    accountEmail ? prisma.businessSeat.count({ where: { ownerEmail: accountEmail } }) : 0,
    accountEmail
      ? prisma.user.findFirst({ where: { email: { equals: accountEmail, mode: "insensitive" } }, select: { id: true, name: true } })
      : null,
    org.partner ? partnerStatsSummary(org.partner.id, 30) : null,
  ]);
  const authorName = new Map(authors.map((a) => [a.id, a.name ?? a.email]));
  const ownerName = org.ownerStaffId ? (team.find((t) => t.id === org.ownerStaffId)?.name ?? "A former team member") : null;
  const timeline = mergeTimeline({
    notes: org.notes.map((n) => ({ ...n, author: n.authorId ? (authorName.get(n.authorId) ?? null) : null })),
    audits,
    intake: org.intake ? { at: org.createdAt, source: org.source, value: org.intake } : null,
  });
  const socials = readSocials(org.socials);
  const website = safeHttpUrl(org.website);
  const confirmingDelete = sp.confirm === "delete" && isOwner;
  const due = isFollowUpDue(org.followUpAt, now);
  const primaryEmail = org.contacts.find((c) => c.email)?.email ?? null;

  return (
    <div className="space-y-10">
      <PageHeader
        title={org.name}
        intro={
          <>
            {kindLabel(org.kind)}
            {org.city ? ` in ${org.city}` : ""}. Added on {dateOnly(org.createdAt)}
            {org.source ? ` from ${org.source}` : ""}.
          </>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/studio/crm">Back to businesses</Link>
          </Button>
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {confirmingDelete && (
        <div className="space-y-3 rounded-2xl border-2 border-destructive bg-card p-5">
          <p className="font-medium text-ink">Delete {org.name} from the CRM?</p>
          <p className="text-sm leading-relaxed text-ink-2">
            This removes the business with all of its contacts and notes, and it cannot be undone. A brand page that was created from it
            stays on the Partners page. The audit log keeps a copy of what was deleted.
          </p>
          <form action={deleteOrganisationAction} className="flex gap-2">
            <Hidden id={org.id} />
            <input type="hidden" name="confirm" value="yes" />
            <SubmitButton variant="destructive" pendingLabel="Deleting…">
              Yes, delete this business
            </SubmitButton>
            <Button asChild variant="outline">
              <Link href={`/studio/crm/${org.id}`}>Cancel</Link>
            </Button>
          </form>
        </div>
      )}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-rule bg-paper-2 text-xs text-muted-foreground">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${org.name} logo`} className="h-full w-full object-contain p-1" />
            ) : (
              <span>No logo</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <StageTag stage={org.stage} />
            <Tag>{kindLabel(org.kind)}</Tag>
            {org.valueGBP !== null && <Tag>{formatGBP(org.valueGBP)} a year</Tag>}
            {org.followUpAt && <Tag tone={due ? "warn" : "default"}>Follow up on {dateOnly(org.followUpAt)}</Tag>}
            {org.partner && <Tag tone="ink">{partnerTierLabel(org.partner.tier)}</Tag>}
            {org.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>

        {canEdit ? (
          <form action={saveOverviewAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Hidden id={org.id} />
            <Field label="Stage">
              <select name="stage" defaultValue={org.stage} className={fieldClass}>
                {ORG_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABEL[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Looked after by">
              <select name="owner" defaultValue={org.ownerStaffId ?? ""} className={fieldClass}>
                <option value="">Nobody yet</option>
                {team.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Value a year, in pounds">
              <input name="valueGBP" inputMode="numeric" defaultValue={org.valueGBP ?? ""} maxLength={12} className={fieldClass} />
            </Field>
            <Field label="Follow up on">
              <input type="date" name="followUpAt" defaultValue={day(org.followUpAt)} className={fieldClass} />
            </Field>
            <Field label="Tags" hint="Separate tags with commas." className="sm:col-span-2 lg:col-span-1">
              <input name="tags" defaultValue={org.tags.join(", ")} maxLength={2000} className={fieldClass} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-5">
              <SubmitButton size="sm" pendingLabel="Saving…">
                Save changes
              </SubmitButton>
            </div>
          </form>
        ) : (
          <dl>
            <Row label="Stage">{STAGE_LABEL[org.stage].label}</Row>
            <Row label="Looked after by">{ownerName ?? "Nobody yet"}</Row>
          </dl>
        )}
        <p className="text-xs text-muted-foreground">{STAGE_LABEL[org.stage].description}</p>
      </Card>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-8">
        <div className="min-w-0 space-y-10">
        <Section title="Notes and activity" intro="Calls, emails and meetings, every change the team has made, and the original application, newest first.">
          {canEdit && (
            <form action={addOrgNoteAction} className="space-y-2">
              <Hidden id={org.id} />
              <div className="flex flex-wrap gap-2">
                <select name="kind" defaultValue="note" aria-label="Kind of note" className={cn(fieldClass, "w-auto py-2")}>
                  {NOTE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {NOTE_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <label htmlFor="org-note" className="sr-only">
                Note
              </label>
              <textarea id="org-note" name="body" rows={3} maxLength={6000} required placeholder="What was said, and what happens next." className={fieldClass} />
              <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                Add to the timeline
              </SubmitButton>
            </form>
          )}
          {timeline.length === 0 ? (
            <Empty>Nothing has happened with this business yet.</Empty>
          ) : (
            <ol className="space-y-2">
              {timeline.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  {item.type === "note" ? (
                    <Card className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag tone="ink">{NOTE_KIND_LABEL[item.kind as NoteKind] ?? item.kind}</Tag>
                        <span className="text-xs text-muted-foreground">
                          {item.author ?? "Someone who has since left the team"}, {dateTime(item.at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm text-ink">{item.body}</p>
                    </Card>
                  ) : item.type === "audit" ? (
                    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-rule px-5 py-3 text-sm">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-ink">{item.summary ?? item.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.actor}, {dateTime(item.at)}
                        </p>
                      </div>
                      <Tag>{item.action}</Tag>
                    </div>
                  ) : (
                    <Card className="space-y-2 bg-paper-2/60">
                      <p className="text-sm font-medium text-ink">
                        The original {item.source === "application" ? "application" : "enquiry"}, received on {dateOnly(item.at)}.
                      </p>
                      <dl>
                        {item.fields.map(([label, value]) => (
                          <Row key={label} label={label}>
                            <span className="whitespace-pre-line">{value}</span>
                          </Row>
                        ))}
                      </dl>
                    </Card>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Section>
        <Section title="Contacts" intro="The people we deal with. Anyone with a member account is linked to their profile.">
          {org.contacts.length === 0 ? (
            <Empty>There are no contacts for this business yet.</Empty>
          ) : (
            <Card className="divide-y divide-rule p-0">
              {org.contacts.map((c) => (
                <div key={c.id} className="space-y-2 px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5 text-sm">
                      <p className="font-medium text-ink">
                        {c.name}
                        {c.title && <span className="font-normal text-muted-foreground">, {c.title}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(" · ") || "No email or phone yet"}</p>
                      {c.user && (
                        <p className="text-xs">
                          <TextLink href={`/studio/members/${c.user.id}`}>Open their member profile</TextLink>
                        </p>
                      )}
                    </div>
                    {c.isPrimary && <Tag tone="ink">Main contact</Tag>}
                  </div>
                  {canEdit && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs text-ink-2 underline underline-offset-4">Edit or remove</summary>
                      <form action={updateContactAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Hidden id={org.id} />
                        <input type="hidden" name="contactId" value={c.id} />
                        <ContactFields c={c} />
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
                            Save contact
                          </SubmitButton>
                        </div>
                      </form>
                      <form action={removeContactAction} className="mt-2">
                        <Hidden id={org.id} />
                        <input type="hidden" name="contactId" value={c.id} />
                        <SubmitButton size="sm" variant="ghost" className="text-destructive" pendingLabel="Removing…">
                          Remove this contact
                        </SubmitButton>
                      </form>
                    </details>
                  )}
                </div>
              ))}
            </Card>
          )}
          {canEdit && (
            <details className="group rounded-2xl border border-rule bg-card" open={org.contacts.length === 0}>
              <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-ink">
                Add a contact
                <span className="ml-2 font-normal text-muted-foreground group-open:hidden">Someone else you deal with at {org.name}.</span>
              </summary>
              <form action={addContactAction} className="grid gap-3 border-t border-rule p-5 sm:grid-cols-2">
                <Hidden id={org.id} />
                <ContactFields />
                <div className="sm:col-span-2">
                  <SubmitButton size="sm" variant="outline" pendingLabel="Adding…">
                    Add contact
                  </SubmitButton>
                </div>
              </form>
            </details>
          )}
        </Section>
        </div>
        <div className="min-w-0 space-y-10">
        <Section title="Platform" intro="What they have on Trichollective, and whether their account is active.">
          <Card>
            <dl>
              <Row label="Brand page">
                {org.partner ? (
                  <span className="flex flex-wrap items-center gap-2">
                    {org.partner.name}, {partnerTierLabel(org.partner.tier)}
                    {org.partner.isFounding && <Tag>Founding</Tag>}
                    {org.partner.hidden ? <Tag tone="danger">Taken down</Tag> : org.partner.published ? <Tag tone="positive">Published</Tag> : <Tag tone="warn">Draft</Tag>}
                    <TextLink href="/studio/partners">Manage on the Partners page</TextLink>
                    {org.partner.published && !org.partner.hidden && <TextLink href={`/partners/${org.partner.slug}`}>View the public page</TextLink>}
                  </span>
                ) : (
                  "This business does not have a brand page yet."
                )}
              </Row>
              <Row label="Account email">
                {accountEmail ? (
                  <span>
                    {accountEmail}
                    {account && (
                      <>
                        {" "}
                        <TextLink href={`/studio/members/${account.id}`}>Open their member profile</TextLink>
                      </>
                    )}
                    {!account && <span className="text-muted-foreground">. Nobody has signed up with this email yet.</span>}
                  </span>
                ) : (
                  "No account email has been set. Add one in Details so the right person can manage their page."
                )}
              </Row>
              {accountEmail && (
                <Row label="Membership">
                  {membership?.isActive
                    ? `Active on ${membership.tierName ?? "a paid plan"}${membership.via ? `, provided by ${membership.via}` : ""}.`
                    : "This account does not have an active plan."}
                </Row>
              )}
              {accountEmail && <Row label="Team seats in use">{seats} of {BUSINESS_SEATS}</Row>}
              {stats && (
                <Row label="Last 30 days">
                  {plural(stats.totals.views, "page view", "page views")}, {plural(stats.totals.websiteClicks, "website visit", "website visits")},{" "}
                  {plural(stats.totals.perkViews, "perk view", "perk views")} and {plural(stats.totals.perkClaims, "perk claim", "perk claims")}. The
                  brand sees the same figures in its portal.
                </Row>
              )}
              {website && (
                <Row label="Website">
                  <a href={website} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {website}
                  </a>
                </Row>
              )}
            </dl>
          </Card>

          {canEdit && !org.partner && (
            <Card className="space-y-3">
              <p className="font-medium text-ink">Convert to a brand page</p>
              <p className="text-sm text-ink-2">
                This creates an unpublished partner page from these details, links it to this business and moves the deal to Won. The page
                is managed by {org.accountEmail ?? primaryEmail ?? "the account email you set in Details"}, who can finish and publish it
                from the member area.
              </p>
              <form action={convertToPartnerAction} className="grid gap-3 sm:grid-cols-2">
                <Hidden id={org.id} />
                <Field label="Tier">
                  <select name="tier" defaultValue={org.interest?.toLowerCase().includes("premium") ? "premium" : "business"} className={fieldClass}>
                    <option value="business">Business partner</option>
                    <option value="premium">Premium partner</option>
                  </select>
                </Field>
                <Field label="Category">
                  <select
                    name="category"
                    defaultValue={(PARTNER_CATEGORIES as readonly string[]).includes(org.category ?? "") ? (org.category as string) : ""}
                    required
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {PARTNER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Description for the page" hint="At least 20 characters. They can change it later." className="sm:col-span-2">
                  <textarea name="blurb" rows={3} maxLength={4000} defaultValue={org.description ?? ""} className={fieldClass} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2">
                  <input type="checkbox" name="isFounding" /> They are a founding partner, which takes one of the limited founding Premium places.
                </label>
                <div className="sm:col-span-2">
                  <SubmitButton size="sm" pendingLabel="Creating…">
                    Create the brand page
                  </SubmitButton>
                </div>
              </form>
            </Card>
          )}
        </Section>
        </div>
      </div>

      <details className="group rounded-2xl border border-rule bg-card/60" open={!org.website && !org.email && !org.description}>
        <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2 px-5 py-4">
          <span className="text-lg font-semibold tracking-tight text-ink">Details</span>
          <span className="text-sm text-muted-foreground group-open:hidden">
            Address, company records, social links and description. Open to edit.
          </span>
        </summary>
        <div className="border-t border-rule p-4 sm:p-5">
        {canEdit ? (
          <Card>
            <form action={updateDetailsAction} className="grid gap-4 sm:grid-cols-2">
              <Hidden id={org.id} />
              <div className="sm:col-span-2">
                <ImageUpload name="logo" currentUrl={logoUrl} label="Choose a logo" hint="A PNG, JPEG or WebP image up to 5 MB." removeName="removeLogo" />
              </div>
              <Field label="Name">
                <input name="name" required minLength={2} maxLength={160} defaultValue={org.name} className={fieldClass} />
              </Field>
              <Field label="Kind">
                <select name="kind" defaultValue={org.kind} className={fieldClass}>
                  {ORG_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category" hint="For example Scalp care or Devices and diagnostics.">
                <input name="category" maxLength={120} defaultValue={org.category ?? ""} list="crm-categories" className={fieldClass} />
              </Field>
              <Field label="Size">
                <select name="size" defaultValue={org.size ?? ""} className={fieldClass}>
                  <option value="">Not known</option>
                  {ORG_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s === "1" ? "Just one person" : `${s} people`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Website">
                <input name="website" maxLength={500} defaultValue={org.website ?? ""} className={fieldClass} />
              </Field>
              <Field label="Business email">
                <input name="email" type="email" maxLength={160} defaultValue={org.email ?? ""} className={fieldClass} />
              </Field>
              <Field label="Phone">
                <input name="phone" maxLength={60} defaultValue={org.phone ?? ""} className={fieldClass} />
              </Field>
              <Field label="Account email" hint="The sign-in email of whoever manages them on Trichollective.">
                <input name="accountEmail" type="email" maxLength={160} defaultValue={org.accountEmail ?? ""} className={fieldClass} />
              </Field>
              <Field label="Address line 1">
                <input name="addressLine1" maxLength={200} defaultValue={org.addressLine1 ?? ""} className={fieldClass} />
              </Field>
              <Field label="Address line 2">
                <input name="addressLine2" maxLength={200} defaultValue={org.addressLine2 ?? ""} className={fieldClass} />
              </Field>
              <Field label="Town or city">
                <input name="city" maxLength={120} defaultValue={org.city ?? ""} className={fieldClass} />
              </Field>
              <Field label="County or region">
                <input name="region" maxLength={120} defaultValue={org.region ?? ""} className={fieldClass} />
              </Field>
              <Field label="Postcode">
                <input name="postcode" maxLength={20} defaultValue={org.postcode ?? ""} className={fieldClass} />
              </Field>
              <Field label="Country">
                <input name="country" maxLength={120} defaultValue={org.country ?? ""} className={fieldClass} />
              </Field>
              <Field label="Company number">
                <input name="companyNumber" maxLength={40} defaultValue={org.companyNumber ?? ""} className={fieldClass} />
              </Field>
              <Field label="VAT number">
                <input name="vatNumber" maxLength={40} defaultValue={org.vatNumber ?? ""} className={fieldClass} />
              </Field>
              <Field label="What they are interested in">
                <input name="interest" maxLength={120} defaultValue={org.interest ?? ""} className={fieldClass} />
              </Field>
              <Field label="Where they came from">
                <input name="source" maxLength={60} defaultValue={org.source ?? ""} className={fieldClass} />
              </Field>
              {SOCIAL_KEYS.map((k) => (
                <Field key={k} label={SOCIAL_LABEL[k]}>
                  <input name={`social_${k}`} maxLength={300} defaultValue={socials[k] ?? ""} className={fieldClass} />
                </Field>
              ))}
              <Field label="Description" className="sm:col-span-2">
                <textarea name="description" rows={4} maxLength={6000} defaultValue={org.description ?? ""} className={fieldClass} />
              </Field>
              <datalist id="crm-categories">
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="sm:col-span-2">
                <SubmitButton size="sm" pendingLabel="Saving…">
                  Save details
                </SubmitButton>
              </div>
            </form>
          </Card>
        ) : (
          <Card>
            <dl>
              <Row label="Category">{org.category ?? "Not given"}</Row>
              <Row label="Website">{website ? <a href={website} target="_blank" rel="noreferrer" className="underline underline-offset-4">{website}</a> : "Not given"}</Row>
              <Row label="Email">{org.email ?? "Not given"}</Row>
              <Row label="Phone">{org.phone ?? "Not given"}</Row>
              <Row label="Address">
                {[org.addressLine1, org.addressLine2, org.city, org.region, org.postcode, org.country].filter(Boolean).join(", ") || "Not given"}
              </Row>
              <Row label="Company number">{org.companyNumber ?? "Not given"}</Row>
              <Row label="VAT number">{org.vatNumber ?? "Not given"}</Row>
              <Row label="Size">{org.size ?? "Not known"}</Row>
              <Row label="Socials">
                {Object.entries(socials).map(([k, v]) => `${SOCIAL_LABEL[k as keyof typeof SOCIAL_LABEL]}: ${v}`).join(", ") || "None given"}
              </Row>
              <Row label="Description">{org.description ?? "Not given"}</Row>
            </dl>
          </Card>
        )}
        </div>
      </details>


      {isOwner && !confirmingDelete && (
        <Section title="Delete this business" intro="Only owners can delete a business, and you will be asked to confirm.">
          <form action={deleteOrganisationAction}>
            <Hidden id={org.id} />
            <SubmitButton size="sm" variant="destructive" pendingLabel="Opening…">
              Delete business
            </SubmitButton>
          </form>
        </Section>
      )}
    </div>
  );
}

function ContactFields({
  c,
}: {
  c?: { name: string; email: string | null; phone: string | null; title: string | null; isPrimary: boolean };
}) {
  return (
    <>
      <Field label="Name">
        <input name="name" maxLength={160} defaultValue={c?.name ?? ""} className={fieldClass} />
      </Field>
      <Field label="Job title">
        <input name="title" maxLength={120} defaultValue={c?.title ?? ""} className={fieldClass} />
      </Field>
      <Field label="Email" hint={c ? undefined : "If they have a member account, it will be linked automatically."}>
        <input name="email" type="email" maxLength={160} defaultValue={c?.email ?? ""} className={fieldClass} />
      </Field>
      <Field label="Phone">
        <input name="phone" maxLength={60} defaultValue={c?.phone ?? ""} className={fieldClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2">
        <input type="checkbox" name="isPrimary" defaultChecked={c?.isPrimary ?? false} /> This is the main contact for the business.
      </label>
    </>
  );
}
