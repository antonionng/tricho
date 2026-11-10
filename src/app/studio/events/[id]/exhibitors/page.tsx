import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, Field, NoAccess, Notice, PageHeader, Section, Stat, Tag, dateTime, fieldClass } from "@/components/studio/ui";
import { loadExhibitors } from "@/lib/exhibitors";
import { exhibitorPath } from "@/lib/packages";
import { dateToZonedInput } from "@/lib/event-input";
import { studioPage } from "../../../_lib/guard";
import { saveExhibitorAction } from "./actions";

export const dynamic = "force-dynamic";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

/** "2 logos and 1 description are still to come." */
function bookletNote(logos: number, blurbs: number) {
  const part = (n: number, one: string, many: string) => (n === 0 ? null : `${n} ${n === 1 ? one : many}`);
  const parts = [part(logos, "logo", "logos"), part(blurbs, "description", "descriptions")].filter(Boolean);
  if (!parts.length) return "Every exhibitor has sent their logo and booklet text.";
  return `${parts.join(" and ")} ${logos + blurbs === 1 ? "is" : "are"} still to come.`;
}

export default async function ExhibitorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; tone?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { notice, tone, saved } = await searchParams;
  const staff = await studioPage(`/studio/events/${id}/exhibitors`, "events.view");
  if (!staff) return <NoAccess what="events" />;
  const canEdit = staff.perms.has("events.edit");

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true, startsAt: true, timezone: true, standSpaces: true, stageSlots: true },
  });
  if (!event) notFound();

  const all = await loadExhibitors(event.id);
  const paid = all.filter((r) => r.status === "paid");
  const stands = paid.filter((r) => r.includesStand).length;
  const stage = paid.filter((r) => r.includesStageSlot).length;
  const revenue = paid.reduce((n, r) => n + r.paidPence, 0);
  const missingLogo = paid.filter((r) => !r.logoUrl).length;
  const missingBlurb = paid.filter((r) => !r.bookletBlurb).length;
  const slotTime = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: event.timezone }).format(d);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Exhibitors"
        intro={`The brands and clinics with an exhibitor or sponsor package for ${event.title} on ${dateTime(event.startsAt)}. Each one manages their places, logo and booklet text from their own exhibitor page.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/studio/events">Back to events</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/studio/events?edit=${event.id}#packages`}>Edit packages</Link>
            </Button>
            <Button asChild>
              <a href={`/studio/events/${event.id}/exhibitors/export`}>Download the booklet list</a>
            </Button>
          </>
        }
      />

      {notice && <Notice tone={tone === "danger" ? "danger" : "default"}>{notice}</Notice>}
      {saved && !notice && (
        <Notice>{`${all.find((r) => r.id === saved)?.companyName ?? "The exhibitor"}'s stand and stage details are saved.`}</Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Packages sold" value={paid.length} note={`${money(revenue)} including extra places, VAT included.`} />
        <Stat label="Stands" value={event.standSpaces != null ? `${stands} of ${event.standSpaces}` : stands} note="Packages that include a stand." />
        <Stat label="Stage slots" value={event.stageSlots != null ? `${stage} of ${event.stageSlots}` : stage} note="Packages that include a stage slot." />
        <Stat label="Booklet" value={missingLogo + missingBlurb === 0 ? "Complete" : `${missingLogo + missingBlurb} to come`} note={bookletNote(missingLogo, missingBlurb)} />
      </div>

      <Section title="Exhibitors">
        {all.length === 0 ? (
          <Empty>No packages have been bought yet. They appear here as soon as Stripe confirms payment.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-rule bg-card">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-rule text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Places</th>
                  <th className="px-4 py-3 font-medium">Logo</th>
                  <th className="px-4 py-3 font-medium">Booklet text</th>
                  <th className="px-4 py-3 font-medium">Stand and stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule align-top">
                {all.map((r) => (
                  <tr key={r.id} id={`ex-${r.id}`} className={r.status === "refunded" ? "opacity-60" : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{r.companyName}</p>
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noreferrer" className="block text-xs text-ink-2 underline underline-offset-4">
                          {r.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      <details className="mt-1 text-xs text-ink-2">
                        <summary className="cursor-pointer text-muted-foreground">Invoice details</summary>
                        <p className="mt-1 whitespace-pre-line">{r.invoiceAddress}</p>
                        <p className="mt-1">{r.vatNumber ? `VAT number ${r.vatNumber}` : "No VAT number given."}</p>
                        <p className="mt-1">{money(r.paidPence)} paid{r.paidAt ? ` on ${dateTime(r.paidAt)}` : ""}.</p>
                        <a href={exhibitorPath(event.slug, r.manageCode)} target="_blank" rel="noreferrer" className="mt-1 inline-block underline underline-offset-4">
                          Open their exhibitor page
                        </a>
                      </details>
                    </td>
                    <td className="px-4 py-3">
                      {r.packageName}
                      {r.status === "refunded" && (
                        <span className="ml-1">
                          <Tag tone="warn">Refunded</Tag>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      <p className="text-ink">{r.contactName}</p>
                      <a href={`mailto:${r.contactEmail}`} className="block underline underline-offset-4">
                        {r.contactEmail}
                      </a>
                      <p>{r.contactPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.places === 0 ? (
                        <span className="text-muted-foreground">None included</span>
                      ) : (
                        <Tag tone={r.named === r.places ? "positive" : "warn"}>
                          {r.named} of {r.places} named
                        </Tag>
                      )}
                      {r.extraPlaces > 0 && <p className="mt-1 text-xs text-ink-2">+{r.extraPlaces} extra</p>}
                    </td>
                    <td className="px-4 py-3">
                      {r.logoUrl ? (
                        <a href={r.logoUrl} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.logoUrl} alt={`${r.companyName} logo`} className="h-10 w-20 rounded border border-rule bg-white object-contain p-1" />
                        </a>
                      ) : (
                        <Tag tone="warn">Not yet</Tag>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      {r.bookletBlurb ? (
                        <details>
                          <summary className="cursor-pointer">
                            <Tag tone="positive">Added</Tag>
                          </summary>
                          <p className="mt-1 whitespace-pre-line text-xs text-ink-2">{r.bookletBlurb}</p>
                        </details>
                      ) : (
                        <Tag tone="warn">Not yet</Tag>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <form action={saveExhibitorAction} className="flex min-w-[220px] flex-col gap-2">
                          <input type="hidden" name="eventId" value={event.id} />
                          <input type="hidden" name="exhibitorId" value={r.id} />
                          {r.includesStand && (
                            <Field label="Stand number">
                              <input name="standNumber" defaultValue={r.standNumber ?? ""} maxLength={40} className={fieldClass} />
                            </Field>
                          )}
                          {!r.includesStand && <input type="hidden" name="standNumber" value={r.standNumber ?? ""} />}
                          {r.includesStageSlot && (
                            <Field label="Stage slot">
                              <input type="datetime-local" name="stageSlotAt" defaultValue={dateToZonedInput(r.stageSlotAt, event.timezone)} className={fieldClass} />
                            </Field>
                          )}
                          {!r.includesStageSlot && <input type="hidden" name="stageSlotAt" value={dateToZonedInput(r.stageSlotAt, event.timezone)} />}
                          <Field label="Notes for the team">
                            <textarea name="notes" defaultValue={r.notes ?? ""} rows={2} maxLength={4000} className={fieldClass} />
                          </Field>
                          <div>
                            <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                              Save
                            </SubmitButton>
                          </div>
                        </form>
                      ) : (
                        <div className="text-ink-2">
                          {r.standNumber && <p>Stand {r.standNumber}</p>}
                          {r.stageSlotAt && <p>On stage {slotTime(r.stageSlotAt)}</p>}
                          {!r.standNumber && !r.stageSlotAt && <p className="text-muted-foreground">Not set yet</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
