import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/site/primitives";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { BuyExtras } from "@/components/events/BuyExtras";
import { formatEventDate, eventPlace } from "@/components/editorial/events";
import { canEditDetails, detailsCloseAt, ticketPath } from "@/lib/attendees";
import { BOOKLET_BLURB_MAX, addonsFor, extrasLeft, packageIncludes } from "@/lib/packages";
import { seatUsage, typeAvailability } from "@/lib/tickets";
import { eventTimeZone } from "@/lib/event-time";
import { prisma } from "@/lib/prisma";
import { priceText } from "@/lib/vat";
import { nameExhibitorPlaceAction, saveExhibitorProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your exhibitor page",
  robots: { index: false, follow: false, nocache: true },
};

type Params = { slug: string; code: string };
type Search = { saved?: string; named?: string; notice?: string; package?: string; extras?: string };


function Banner({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "positive" }) {
  return (
    <p
      role="status"
      className={
        tone === "positive"
          ? "rounded-2xl border border-positive/30 bg-positive/10 p-4 text-sm leading-relaxed text-ink"
          : "rounded-2xl border border-rule bg-paper-2 p-4 text-sm leading-relaxed text-ink-2"
      }
    >
      {children}
    </p>
  );
}

/**
 * An exhibitor's own page, opened from their confirmation email: what their
 * package includes, naming its places, their logo and booklet text, and extra
 * places when the team offers them. The code in the address is the only key,
 * so the page is never indexed or cached.
 */
export default async function ExhibitorPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const { slug, code } = await params;
  const sp = await searchParams;
  const ex = await prisma.eventExhibitor.findUnique({
    where: { manageCode: code.toUpperCase() },
    select: {
      companyName: true,
      contactName: true,
      manageCode: true,
      website: true,
      logoUrl: true,
      bookletBlurb: true,
      standNumber: true,
      stageSlotAt: true,
      event: {
        select: { id: true, slug: true, title: true, startsAt: true, detailsCloseAt: true, timezone: true, venue: true, city: true, online: true, pricesExcludeVat: true },
      },
      ticket: {
        select: {
          id: true,
          status: true,
          ticketTypeId: true,
          ticketType: { select: { name: true, description: true, placesIncluded: true, includesStand: true, includesStageSlot: true } },
          attendees: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, code: true, awaitingName: true, cancelledAt: true } },
          extras: {
            where: { status: "paid" },
            orderBy: { createdAt: "asc" },
            select: { attendees: { where: { cancelledAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, code: true } } },
          },
        },
      },
    },
  });
  if (!ex || ex.event.slug !== slug || !ex.ticket.ticketType) notFound();

  const e = ex.event;
  const type = ex.ticket.ticketType;
  const tz = eventTimeZone(e.timezone);
  const paid = ex.ticket.status === "paid";
  const refunded = ex.ticket.status === "refunded";
  const started = e.startsAt <= new Date();
  const namingOpen = paid && canEditDetails(e);
  const places = ex.ticket.attendees.filter((a) => !a.cancelledAt);
  const waiting = places.filter((a) => a.awaitingName);
  const extraPeople = ex.ticket.extras.flatMap((x) => x.attendees);
  const when = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d);

  // Extra places this package can still add, if the team offers them.
  let extras: { addon: { id: string; name: string; pricePence: number; description: string }; left: number } | null = null;
  if (paid && !started && ex.ticket.ticketTypeId) {
    const types = await prisma.eventTicketType.findMany({
      where: { eventId: e.id, kind: "addon", active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        pricePence: true,
        memberPricePence: true,
        membersOnly: true,
        capacity: true,
        salesStart: true,
        salesEnd: true,
        maxPerOrder: true,
        active: true,
        kind: true,
        addonForTypeIds: true,
      },
    });
    const addon = addonsFor(types, ex.ticket.ticketTypeId)[0];
    if (addon) {
      const usage = await seatUsage(e.id);
      const total = usage.packageOrders.filter((o) => o.ticketTypeId === addon.id).reduce((n, o) => n + o.quantity, 0);
      const a = typeAvailability(addon, { eventStartsAt: e.startsAt, taken: total, eventLeft: null, isMember: true });
      if (a.state === "on_sale") extras = { addon, left: extrasLeft(addon, ex.ticket.id, usage.packageOrders) };
    }
  }

  return (
    <Section>
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="label text-muted-foreground">{type.name} package</p>
            <h1 className="display text-4xl leading-tight sm:text-5xl">{ex.companyName}</h1>
            <p className="text-lg text-ink-2">
              {e.title}, {formatEventDate(e.startsAt, tz)}, {eventPlace(e)}.
            </p>
          </div>

          {sp.package === "success" && !paid && !refunded && (
            <Banner tone="positive">
              Thank you for booking. Your payment is being confirmed, and your confirmation will arrive by email within a few minutes. Refresh this page
              shortly to name your places and send your logo.
            </Banner>
          )}
          {sp.package === "success" && paid && <Banner tone="positive">Thank you for booking. Your payment has been received, and your confirmation is on its way by email.</Banner>}
          {sp.extras === "success" && (
            <Banner tone="positive">Thank you. Once your payment is confirmed, each extra person is sent their own e-ticket by email.</Banner>
          )}
          {sp.extras === "cancelled" && <Banner>Your payment was cancelled and you have not been charged.</Banner>}
          {sp.saved === "1" && <Banner tone="positive">Your logo and booklet details have been saved.</Banner>}
          {sp.named === "1" && <Banner tone="positive">That place is named, and their e-ticket is on its way by email.</Banner>}
          {sp.notice && <Banner>{sp.notice}</Banner>}
          {refunded && <Banner>This package has been refunded, so it is no longer active. If you think this is a mistake, please reply to your confirmation email.</Banner>}

          <section className="flex flex-col gap-3 rounded-3xl border border-rule bg-card p-6">
            <h2 className="text-lg font-semibold text-ink">What your package includes</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-ink-2">
              {packageIncludes(type).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {(ex.standNumber || ex.stageSlotAt) && (
              <p className="text-[15px] text-ink">
                {ex.standNumber && <>Your stand is number {ex.standNumber}. </>}
                {ex.stageSlotAt && <>You are on stage at {when(ex.stageSlotAt)}.</>}
              </p>
            )}
          </section>

          {places.length > 0 && (
            <section id="places" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">Your places</h2>
                <p className="text-sm text-muted-foreground">
                  {namingOpen
                    ? `Name each person coming with ${ex.companyName}, and they are sent their own e-ticket with the QR code for the door. You can name places until ${when(detailsCloseAt(e))}.`
                    : paid
                      ? "Places can no longer be named online. Please reply to your confirmation email and we will help."
                      : "You can name your places here once your payment has been confirmed."}
                </p>
              </div>
              <ul className="flex flex-col divide-y divide-rule">
                {places
                  .filter((a) => !a.awaitingName)
                  .map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[15px]">
                      <span>
                        <span className="text-ink">{a.name}</span> <span className="text-muted-foreground">({a.email})</span>
                      </span>
                      {paid && (
                        <Link href={ticketPath(e.slug, a.code)} className="text-sm underline underline-offset-4">
                          View their e-ticket
                        </Link>
                      )}
                    </li>
                  ))}
                {extraPeople.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[15px]">
                    <span>
                      <span className="text-ink">{a.name}</span> <span className="text-muted-foreground">({a.email}, extra place)</span>
                    </span>
                    <Link href={ticketPath(e.slug, a.code)} className="text-sm underline underline-offset-4">
                      View their e-ticket
                    </Link>
                  </li>
                ))}
              </ul>
              {waiting.map((a, i) => (
                <form key={a.id} action={nameExhibitorPlaceAction} className="flex flex-col gap-2 rounded-xl border border-rule p-4">
                  <input type="hidden" name="code" value={ex.manageCode} />
                  <input type="hidden" name="attendeeId" value={a.id} />
                  <p className="text-sm font-medium text-ink">
                    Place {places.length - waiting.length + i + 1} of {places.length}, still to be named
                  </p>
                  <fieldset disabled={!namingOpen} className="grid gap-2 sm:grid-cols-2">
                    <Input name="name" placeholder="Full name" required maxLength={120} aria-label="Full name" />
                    <Input name="email" type="email" placeholder="Email for their e-ticket" required maxLength={200} aria-label="Email for their e-ticket" />
                    <Input name="dietary" placeholder="Dietary needs (optional)" maxLength={300} aria-label="Dietary needs" />
                    <Input name="accessNeeds" placeholder="Access needs (optional)" maxLength={300} aria-label="Access needs" />
                  </fieldset>
                  {namingOpen && (
                    <div>
                      <SubmitButton size="sm" pendingLabel="Sending…">
                        Send their e-ticket
                      </SubmitButton>
                    </div>
                  )}
                </form>
              ))}
            </section>
          )}

          <section id="booklet" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-ink">Your logo and booklet text</h2>
              <p className="text-sm text-muted-foreground">
                Every delegate receives the event booklet, and we use the same logo and description when we promote the event. Send them as early as you can
                so you are included in everything.
              </p>
            </div>
            <form action={saveExhibitorProfileAction} encType="multipart/form-data" className="flex flex-col gap-4">
              <input type="hidden" name="code" value={ex.manageCode} />
              <fieldset disabled={!paid || started} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {ex.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- an uploaded logo of any shape
                    <img src={ex.logoUrl} alt={`${ex.companyName} logo`} className="h-20 w-40 rounded-xl border border-rule bg-white object-contain p-2" />
                  ) : (
                    <span className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-rule text-xs text-muted-foreground">No logo yet</span>
                  )}
                  <label className="flex flex-col gap-1 text-sm text-ink-2">
                    {ex.logoUrl ? "Replace your logo" : "Your logo"}
                    <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="text-sm" />
                    <span className="text-xs text-muted-foreground">A PNG or JPG of at least 800 pixels wide, up to 5 MB, ideally on a white or clear background.</span>
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm text-ink-2">
                  About your company, for the booklet
                  <textarea
                    name="bookletBlurb"
                    defaultValue={ex.bookletBlurb ?? ""}
                    rows={5}
                    maxLength={BOOKLET_BLURB_MAX}
                    placeholder="Two or three sentences on what you do, and what delegates can find on your stand."
                    className="rounded-xl border border-input bg-card px-3 py-2 text-[15px]"
                  />
                  <span className="text-xs text-muted-foreground">Up to {BOOKLET_BLURB_MAX} characters.</span>
                </label>
                <label className="flex flex-col gap-1 text-sm text-ink-2">
                  Website
                  <Input name="website" defaultValue={ex.website ?? ""} placeholder="www.yourbrand.co.uk" maxLength={300} />
                </label>
              </fieldset>
              {paid && !started && (
                <div>
                  <SubmitButton pendingLabel="Saving…">Save logo and booklet text</SubmitButton>
                </div>
              )}
            </form>
          </section>

          {extras && (
            <section id="extras" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">Bring more of your team</h2>
                <p className="text-sm text-muted-foreground">
                  {extras.left > 0
                    ? `You can add ${extras.left === 1 ? "one more place" : `up to ${extras.left} more places`} at ${priceText(extras.addon.pricePence, e.pricesExcludeVat)} each. Each person is sent their own e-ticket.`
                    : `${ex.companyName} already has every extra place available to its package.`}
                  {extras.addon.description ? ` ${extras.addon.description}` : ""}
                </p>
              </div>
              {extras.left > 0 && <BuyExtras eventId={e.id} packageCode={ex.manageCode} addon={extras.addon} left={extras.left} excludesVat={e.pricesExcludeVat} />}
            </section>
          )}

          <p className="text-sm text-muted-foreground">
            Keep the link to this page safe, because it is unique to {ex.companyName}. If anything needs changing, reply to your confirmation email and we
            will help.
          </p>
          <Link href={`/events/${e.slug}`} className="text-sm underline underline-offset-4">
            About the event
          </Link>
        </div>
      </Container>
    </Section>
  );
}
