import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, FileText, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/BrandMark";
import { gazetteFonts } from "@/components/gazette/fonts";
import { ShowcaseProfile, type ShowcasePartner } from "@/components/partners/ShowcaseProfile";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getStaff } from "@/lib/staff";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";
import { premiumBusiness } from "@/config/subscriptions";
import { slugify } from "@/lib/directory";
import { partnerLogoSrc } from "@/lib/partners";
import { paragraphs, safeHex, textOn, tint } from "@/lib/showcase";
import { longDate } from "@/lib/mail/templates/directory";
import { PARTNER_TERMS_UPDATED, partnerTerms } from "@/content/partner-terms";
import { foundingLabel, groupInclusions, inclusionsFrom, offerPriceLabel, offerPriceNote, readPagePrefill } from "@/lib/partner-offers";
import { socialLinks } from "@/lib/business-profile";
import { offerIdFrom } from "@/lib/partner-offer-payments";
import { activatePaidOffer } from "@/lib/partner-offer-activation";
import { isCheckoutSessionId } from "@/lib/signin-email";
import { continueAfterCheckout } from "@/app/(site)/welcome/actions";
import { cn } from "@/lib/utils";
import { AcceptForm } from "./AcceptForm";
import { OfferCheckout } from "./OfferCheckout";
import { ProgressRail } from "./ProgressRail";
import { requestOfferInvoice } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Your Premium partnership",
  description: "Your Trichollective Premium partnership: what we will make together, your agreement, payment and welcome.",
  path: "/onboard",
  noindex: true,
});

const SETUP = "/members/business/setup";
const SIGN_IN = `/login?next=${SETUP}`;

const chapterLabel = "mag-caps text-[11px] text-[var(--c-strong)]";
const h2 = "mag-didone text-[2.6rem] font-medium leading-[1.02] tracking-tight sm:text-6xl";

/** A card payment that has come back to the page: confirmed with Stripe, so it never relies on the webhook arriving first. */
async function confirmCardPayment(offer: { id: string; paidAt: Date | null; accountEmail: string | null }, sessionId: string | undefined) {
  if (offer.paidAt || !isCheckoutSessionId(sessionId)) return offer.paidAt;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = s.status === "complete" && (s.payment_status === "paid" || s.payment_status === "no_payment_required");
    if (!paid || offerIdFrom(s.metadata) !== offer.id) return null;
    await activatePaidOffer({
      offerId: offer.id,
      subscriptionId: typeof s.subscription === "string" ? s.subscription : (s.subscription?.id ?? null),
      customerId: typeof s.customer === "string" ? s.customer : (s.customer?.id ?? null),
    });
    return new Date();
  } catch (error) {
    console.error("[ONBOARD_CONFIRM]", error);
    return null;
  }
}

export default async function OnboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ session_id?: string; preview?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const offer = token.length >= 16 ? await prisma.partnerOffer.findUnique({ where: { token } }) : null;
  if (!offer) notFound();

  // The team can look through a brand's page from the Studio without recording anything.
  const preview = sp.preview === "1" && !!(await getStaff());
  const paidAt = await confirmCardPayment(offer, sp.session_id);
  const signed = offer.status === "accepted";
  const withdrawn = offer.status === "withdrawn";
  const invoiced = !paidAt && offer.paymentMethod === "invoice" && !!offer.stripeSubscriptionId;
  const settled = !!paidAt;
  const cardSession = paidAt && isCheckoutSessionId(sp.session_id) ? sp.session_id : null;

  const accent = safeHex(offer.accentColor, "#0B0B0B");
  const onAccent = textOn(accent);
  const strong = onAccent === "#FFFFFF" ? accent : "#0B0B0B";
  const vars = {
    "--c-accent": accent,
    "--c-on": onAccent,
    "--c-strong": strong,
    "--c-soft": tint(accent, 0.22),
    "--c-wash": tint(accent, 0.06),
  } as React.CSSProperties;

  const logo = partnerLogoSrc(offer.logoUrl);
  const hero = partnerLogoSrc(offer.heroUrl);
  const inclusions = inclusionsFrom(offer.inclusions);
  const groups = groupInclusions(inclusions);
  const founding = foundingLabel(offer, premiumBusiness.foundingPlaces);
  const first = (offer.contactName ?? "").trim().split(/\s+/)[0] || "there";
  const letter = paragraphs(offer.personalNote);
  const price = offerPriceLabel(offer);

  const prefill = readPagePrefill(offer.pagePrefill);
  const draft: ShowcasePartner = {
    name: offer.businessName,
    slug: slugify(offer.businessName) || "partner",
    tier: "premium",
    kind: "brand",
    category: offer.category,
    blurb: `${offer.businessName} supports hair and scalp professionals as a Premium partner of ${site.name}.`,
    logoUrl: offer.logoUrl,
    coverUrl: offer.heroUrl,
    website: offer.website,
    perk: null,
    publicEmail: null,
    publicPhone: null,
    accentColor: offer.accentColor,
    charityNumber: null,
    tagline: offer.tagline,
    story: prefill.story,
    highlights: prefill.highlights.length ? prefill.highlights : null,
    offerings: prefill.offerings.length ? prefill.offerings : null,
    sections: null,
    ctaLabel: prefill.ctaLabel,
    ctaUrl: prefill.ctaUrl,
    videoUrl: null,
  };

  const chapters = [
    { id: "cover", label: "Welcome" },
    { id: "together", label: "Together" },
    { id: "your-page", label: "Your page" },
    { id: "agreement", label: "Agreement", done: signed },
    { id: "payment", label: "Payment", done: settled },
    { id: "welcome", label: "Welcome in" },
  ];

  // Numbered straight through, like a contents page.
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((sum, g) => sum + g.items.length, 0));

  return (
    <div className={cn(gazetteFonts, "mag bg-paper text-ink")} style={vars}>
      {preview && (
        <p role="note" className="bg-ink px-4 py-2 text-center text-xs text-paper">
          Studio preview. Nothing you do on this page is recorded, and the forms are switched off.
        </p>
      )}

      {/* Masthead */}
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label={`${site.name} home`}>
            <BrandMark size="sm" sub />
          </Link>
          <p className="mag-caps hidden text-[10px] text-ink-2 sm:block">Private and prepared for {offer.businessName}</p>
        </div>
      </header>
      <ProgressRail chapters={chapters} />

      {/* I. Cover */}
      <section id="cover" className="scroll-mt-14 bg-[var(--c-accent)] text-[var(--c-on)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-24 lg:grid-cols-12 lg:items-center">
          <div className="flex flex-col gap-7 animate-rise lg:col-span-7">
            <p className="mag-caps text-[11px] opacity-80">
              {[founding, "Premium Business", `${site.name} × ${offer.businessName}`].filter(Boolean).join("  ·  ")}
            </p>
            <h1 className="mag-didone text-[3.2rem] font-medium leading-[0.95] tracking-tight sm:text-7xl lg:text-[6.2rem]">
              A partnership with <em className="italic">{offer.businessName}</em>.
            </h1>
            {offer.tagline && <p className="mag-serif text-xl italic opacity-90 sm:text-2xl">{offer.tagline}</p>}
            <p className="max-w-xl text-[15px] leading-relaxed opacity-85">
              Prepared for {offer.contactName ?? offer.businessName} on {longDate(offer.createdAt)}. This page sets out what we will
              build together, your agreement and your first month with the practitioners who recommend products to their clients.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-black/30">
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero} alt={`${offer.businessName}`} className="aspect-[4/5] w-full object-contain p-6" />
              ) : (
                <div className="grid aspect-[4/5] place-items-center bg-[var(--c-wash)]">
                  <span className="mag-didone text-6xl text-[var(--c-strong)]">{offer.businessName}</span>
                </div>
              )}
              {logo && (
                <div className="absolute bottom-4 left-4 overflow-hidden rounded-lg shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={`${offer.businessName} logo`} className="h-10 w-auto" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The letter */}
      <section aria-label="A letter from the founder" className="border-b border-rule">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
          <p className={chapterLabel}>From the founder</p>
          <div className="mag-body mag-web mt-6">
            {(letter.length
              ? letter
              : [
                  `Dear ${first},`,
                  `Thank you for choosing to build ${site.name} with us from the very beginning. Our members are cosmetic, clinical and medical hair and scalp professionals, and they are the people their clients ask about what really works.`,
                  `As a founding partner, ${offer.businessName} will teach in our member library, write in every edition of Trichozette and meet practitioners in person at our conferences. Everything we publish with you is labelled, reviewed and written to inform, which is why members trust it.`,
                  "This page sets out what we agreed. When you are ready, sign the agreement and choose how you would like to pay. Your partner page opens as soon as your payment is received.",
                ]
            ).map((p, i) => (
              <p key={i} className={i === (letter.length ? 0 : 1) ? "mag-drop" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-1">
            <span className="mag-didone text-4xl italic">{site.founder}</span>
            <span className="text-sm text-ink-2">{site.founderFull}, Founder of {site.name}</span>
          </div>
        </div>
      </section>

      {/* II. Together */}
      <section id="together" className="scroll-mt-14 border-b border-rule">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-4">
              <p className={chapterLabel}>Chapter II</p>
              <h2 className={h2}>What we will make together.</h2>
              <p className="text-[15px] leading-relaxed text-ink-2">
                Every benefit below is part of your agreement, and each one puts {offer.businessName} in front of the professionals your
                customers already trust.
              </p>
            </div>
            <div className="flex flex-col gap-10 lg:col-span-8">
              {groups.map((g, gi) => (
                <div key={g.title} className="flex flex-col gap-4">
                  <h3 className="mag-caps border-b border-ink/80 pb-2 text-[11px]">{g.title}</h3>
                  <ol className="flex flex-col divide-y divide-rule">
                    {g.items.map((item, ii) => (
                      <li key={item} className="grid grid-cols-[3rem_1fr] gap-4 py-4">
                        <span className="mag-didone text-3xl leading-none text-[var(--c-strong)]">
                          {String(starts[gi] + ii + 1).padStart(2, "0")}
                        </span>
                        <span className="mag-serif text-[17px] leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              {(offer.firstMasterclass || offer.firstFeature || offer.specialTerms) && (
                <aside className="flex flex-col gap-5 rounded-3xl bg-[var(--c-wash)] p-6 ring-1 ring-[var(--c-soft)] sm:p-8">
                  <p className={chapterLabel}>Your first month</p>
                  {offer.firstFeature && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-ink-2">Your Trichozette feature</span>
                      <span className="mag-didone text-2xl leading-snug">{offer.firstFeature}</span>
                    </div>
                  )}
                  {offer.firstMasterclass && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-ink-2">Your first masterclass</span>
                      <span className="mag-didone text-2xl leading-snug">{offer.firstMasterclass}</span>
                    </div>
                  )}
                  {offer.specialTerms && <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{offer.specialTerms}</p>}
                </aside>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* III. Your page */}
      <section id="your-page" className="scroll-mt-14 border-b border-rule bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mb-10 flex max-w-2xl flex-col gap-4">
            <p className={chapterLabel}>Chapter III</p>
            <h2 className={h2}>Your page, already drafted.</h2>
            <p className="text-[15px] leading-relaxed text-ink-2">
              This is a first look at your Premium partner page. Once it opens, a short guided setup helps you add your story,
              products, up to 16 photos, a video and your team.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-rule bg-paper shadow-xl shadow-black/5">
            <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-2 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="truncate">trichollective.net/partners/{draft.slug}</span>
              <span className="shrink-0">Draft</span>
            </div>
            <div className="pointer-events-none max-h-[70vh] overflow-hidden" aria-hidden>
              <ShowcaseProfile partner={draft} photos={[]} socials={socialLinks(prefill.socials)} preview />
            </div>
          </div>
        </div>
      </section>

      {/* IV. Agreement */}
      <section id="agreement" className="scroll-mt-14 border-b border-rule">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <p className={chapterLabel}>Chapter IV</p>
            <h2 className={h2}>Your agreement.</h2>
            <div className="flex flex-col gap-2 border-y border-ink/80 py-6">
              <span className="mag-didone text-5xl font-medium sm:text-6xl">{price}</span>
              <span className="text-[15px] leading-relaxed text-ink-2">{offerPriceNote(offer)}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-ink-2">
              Your agreement is this offer, the Premium partner terms opposite and our{" "}
              <Link href="/terms" target="_blank" className="text-ink underline underline-offset-4">
                terms of business
              </Link>
              . The terms were last updated on {PARTNER_TERMS_UPDATED}.
            </p>
            <div
              tabIndex={0}
              aria-label="Premium partner terms"
              className="max-h-[26rem] overflow-y-auto rounded-2xl border border-rule bg-card p-5 text-[14px] leading-relaxed text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
            >
              <ol className="flex flex-col gap-5">
                {partnerTerms.map((s, i) => (
                  <li key={s.id} className="flex flex-col gap-1.5">
                    <h3 className="font-medium text-ink">
                      {i + 1}. {s.heading}
                    </h3>
                    {s.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </li>
                ))}
              </ol>
            </div>
            <Link href="/terms/partners" target="_blank" className="inline-flex items-center gap-1 text-sm text-ink underline underline-offset-4">
              Read the partner terms on their own page <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="lg:col-span-7">
            {withdrawn ? (
              <p role="note" className="rounded-3xl border border-rule bg-paper-2 p-8 text-[15px] text-ink">
                This offer is no longer active. Please write to{" "}
                <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                  {site.contactEmail}
                </a>{" "}
                and we will send you a new link.
              </p>
            ) : signed ? (
              <div className="flex flex-col gap-6 rounded-3xl border border-rule bg-card p-6 sm:p-10">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
                  <Check className="h-5 w-5" aria-hidden />
                </span>
                <div className="flex flex-col gap-1 border-b border-ink/40 pb-2">
                  <span className="mag-didone truncate text-5xl italic text-ink">{offer.signature ?? offer.signerName}</span>
                </div>
                <p className="text-[15px] leading-relaxed text-ink-2">
                  Signed by <strong className="font-semibold text-ink">{offer.signerName}</strong>, {offer.signerRole}, for {offer.legalName}
                  {offer.acceptedAt ? ` on ${longDate(offer.acceptedAt)}` : ""}, and countersigned by {site.founderFull} for {site.name}.
                </p>
                {offer.contractFileId && (
                  <Button asChild variant="outline" className="sm:self-start">
                    <a href={`/onboard/${token}/contract`} target="_blank" rel="noopener">
                      <FileText /> Download your signed agreement
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-rule bg-card p-6 sm:p-10">
                <h3 className="mag-didone mb-2 text-3xl">Sign for {offer.businessName}</h3>
                <p className="mb-8 text-[15px] leading-relaxed text-ink-2">
                  Once you sign, we email you a countersigned copy of the agreement as a PDF and you can pay straight away. Your partner page opens as soon as your payment is received.
                </p>
                <AcceptForm
                  token={token}
                  disabled={preview}
                  defaults={{
                    legalName: offer.legalNameHint ?? offer.businessName,
                    companyNumber: offer.companyNumberHint ?? "",
                    address: offer.addressHint ?? "",
                    email: offer.email,
                    contactName: offer.contactName ?? "",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* V. Payment */}
      <section id="payment" className="scroll-mt-14 border-b border-rule bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mb-10 flex max-w-2xl flex-col gap-4">
            <p className={chapterLabel}>Chapter V</p>
            <h2 className={h2}>Payment.</h2>
          </div>
          {paidAt ? (
            <p className="flex items-center gap-3 text-lg">
              <Check className="h-5 w-5 text-ink" aria-hidden /> Your payment of {price} was received on {longDate(paidAt)}. Thank
              you.
            </p>
          ) : invoiced ? (
            <p className="flex items-start gap-3 text-lg">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-ink" aria-hidden /> Your invoice for {price} has been sent to{" "}
              {offer.accountEmail}. It can be paid by card or bank transfer, and your partner page opens as soon as it is paid.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {!signed && (
                <p className="flex items-center gap-3 text-[15px] text-ink-2">
                  <Lock className="h-4 w-4 shrink-0" aria-hidden /> Both ways to pay open as soon as the agreement is signed.
                </p>
              )}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className={cn("flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6 sm:p-8", !signed && "opacity-70")}>
                  <h3 className="mag-didone text-3xl">Pay by card now</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">
                    Pay {price} securely through Stripe, right here on this page. Your partner page opens the moment your payment goes
                    through, and your receipt is emailed to you.
                  </p>
                  {signed ? (
                    <OfferCheckout token={token} label={`Pay ${price} by card`} disabled={preview} />
                  ) : (
                    <LockedButton />
                  )}
                </div>
                <div className={cn("flex flex-col gap-4 rounded-3xl border border-rule bg-card p-6 sm:p-8", !signed && "opacity-70")}>
                  <h3 className="mag-didone text-3xl">Pay by invoice</h3>
                  <p className="text-[15px] leading-relaxed text-ink-2">
                    We email an invoice to {offer.accountEmail ?? "you"} for {offer.legalName ?? offer.legalNameHint ?? offer.businessName},
                    payable by card or bank transfer. Your partner page opens as soon as it is paid.
                  </p>
                  {signed ? (
                    <form action={requestOfferInvoice.bind(null, token)}>
                      <Button type="submit" size="xl" variant="outline" disabled={preview} className="h-14 w-full text-base sm:w-auto">
                        Send us an invoice <ArrowRight />
                      </Button>
                    </form>
                  ) : (
                    <LockedButton />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* VI. Welcome */}
      <section id="welcome" className="scroll-mt-14 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 md:py-28">
          <p className="mag-caps text-[11px] text-paper/70">Chapter VI</p>
          <h2 className="mag-didone max-w-4xl text-[3rem] font-medium leading-[0.98] tracking-tight sm:text-7xl">
            {settled ? (
              <>
                Welcome to the collective, <em className="italic">{offer.businessName}</em>.
              </>
            ) : signed ? (
              "Your welcome is one payment away."
            ) : (
              "Your welcome is one signature away."
            )}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              ["Today", "Sign in and finish your partner page with your logo, story, products and photos."],
              ["This week", "Give five of your team their Professional seats, and add a member perk."],
              ["This month", "Plan your first masterclass and Trichozette feature with our editorial team."],
            ].map(([when, what]) => (
              <li key={when} className="flex flex-col gap-2 border-t border-paper/30 pt-4">
                <span className="mag-caps text-[10px] text-paper/70">{when}</span>
                <span className="mag-serif text-lg leading-snug">{what}</span>
              </li>
            ))}
          </ol>
          {signed && (paidAt || offer.invoiceUrl) && (
            <div className="flex flex-wrap gap-3">
              {!paidAt ? null : cardSession ? (
                <form action={continueAfterCheckout.bind(null, cardSession, SETUP, SIGN_IN)}>
                  <Button type="submit" size="xl" className="h-14 bg-paper text-base text-ink hover:bg-paper/90">
                    Set up your partner page <ArrowRight />
                  </Button>
                </form>
              ) : (
                <Button asChild size="xl" className="h-14 bg-paper text-base text-ink hover:bg-paper/90">
                  <Link href={SIGN_IN}>
                    Set up your partner page <ArrowRight />
                  </Link>
                </Button>
              )}
              {offer.invoiceUrl && !paidAt && (
                <Button asChild size="xl" variant="outline" className="h-14 border-paper/40 bg-transparent text-base text-paper hover:bg-paper/10">
                  <a href={offer.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    View your invoice <ArrowUpRight />
                  </a>
                </Button>
              )}
            </div>
          )}
          <p className="text-sm text-paper/60">
            Questions at any point? Write to{" "}
            <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
              {site.contactEmail}
            </a>{" "}
            and {site.founder} will reply personally.
          </p>
        </div>
      </section>
    </div>
  );
}

/** Where a payment button will be, before the agreement is signed. */
function LockedButton() {
  return (
    <span className="inline-flex h-14 items-center gap-2 self-start rounded-full border border-dashed border-ink/30 px-6 text-sm text-ink-2">
      <Lock className="h-4 w-4" aria-hidden /> Opens once you sign
    </span>
  );
}
