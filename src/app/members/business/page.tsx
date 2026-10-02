import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, MemberPage, PageHeader, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { shortDate } from "@/components/members/format";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BUSINESS_SEATS, isBusinessAccount } from "@/lib/subscription";
import { PARTNER_CATEGORIES, partnerLogoSrc, partnerTierLabel } from "@/lib/partners";
import { cn } from "@/lib/utils";
import { addSeat, removeSeat, saveBusinessPage } from "./actions";

export const metadata = { title: "Your business" };

const MESSAGES: Record<string, string> = {
  live: "Your page is saved and live in the partner directory.",
  draft: "Your page is saved. It stays hidden until you tick Show my page.",
  hidden: "Your changes are saved. The Trichollective team has paused your page, so it isn't showing yet. Reply to any of our emails and we'll help.",
  seat: "Your team member is added, and we've emailed them to say their Professional membership is ready.",
  "seat-removed": "That seat is free again.",
};
const ERRORS: Record<string, string> = {
  plan: "The business portal comes with the Business and Premium Business plans.",
  name: "Please add your business name.",
  category: "Please choose the category closest to what you do.",
  blurb: "Please describe your business in at least a sentence.",
  website: "Please check your website address.",
  contact: "Please check the contact email.",
  "logo-size": "Your logo needs to be under 1MB. A PNG of about 600 pixels wide is plenty.",
  "logo-type": "Please upload your logo as a PNG, JPG or WebP image.",
  "seat-email": "Please check that email address.",
  "seat-self": "You already have your own membership, so add someone else from your team.",
  "seat-full": `All ${BUSINESS_SEATS} seats are in use. Remove someone to add a new team member.`,
  "seat-exists": "That person already has one of your seats.",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; message?: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login?next=/members/business");
  const { saved, error, message } = await searchParams;

  const [page, seats, business] = await Promise.all([
    prisma.partner.findUnique({ where: { ownerEmail: email } }),
    prisma.businessSeat.findMany({ where: { ownerEmail: email }, orderBy: { createdAt: "asc" } }),
    isBusinessAccount(email),
  ]);

  if (!page && !business) {
    return (
      <MemberPage size="narrow">
        <PageHeader
          label="Your business"
          title="Put your business in front of hair and scalp professionals."
          lede="The Business plan gives you a page in the partner directory with your logo, a perk for members, and Professional membership for five of your team."
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/for-business#compare">See the Business plan</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/for-business#apply">Apply for Premium</Link>
          </Button>
        </div>
      </MemberPage>
    );
  }

  const logo = partnerLogoSrc(page?.logoUrl);
  const errorText = error === "cap" ? message : error ? ERRORS[error] : null;

  return (
    <MemberPage size="narrow">
      <PageHeader
        label="Your business"
        title={page?.name ?? "Set up your business page."}
        lede="Your page appears in the partner directory, and your perk is shown to every member. Changes go live as soon as you save."
      />

      {page && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {page.hidden ? (
            <Pill>Paused by Trichollective</Pill>
          ) : page.published ? (
            <Pill tone="positive">Live</Pill>
          ) : (
            <Pill>Hidden</Pill>
          )}
          <Pill>{partnerTierLabel(page.tier)}</Pill>
          {page.isFounding && <Pill tone="ink">Founding partner</Pill>}
          {page.published && (
            <Link
              href={`/partners/${page.slug}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule bg-card px-4 text-sm hover:border-ink/40"
            >
              View your page <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {saved && MESSAGES[saved] && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          {MESSAGES[saved]}
        </p>
      )}
      {errorText && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorText}
        </p>
      )}

      <section id="page" className="scroll-mt-20">
        <SectionLabel>Your page</SectionLabel>
        <Card className="p-5 sm:p-6">
          <form action={saveBusinessPage} className="flex flex-col gap-4">
            <Field label="Business name">
              <input name="name" required maxLength={120} defaultValue={page?.name ?? ""} className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Category">
              <select name="category" required defaultValue={page?.category ?? ""} className={cn(fieldClass, "h-12")}>
                <option value="" disabled>
                  Choose one
                </option>
                {PARTNER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Logo</span>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl border border-rule bg-paper p-2">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt={`${page?.name ?? "Your"} logo`} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No logo yet</span>
                  )}
                </div>
                <input
                  type="file"
                  name="logo"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-sm file:mr-3 file:h-10 file:rounded-full file:border file:border-rule file:bg-card file:px-4 file:text-sm"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                A PNG, JPG or WebP under 1MB. A logo on a transparent or white background looks best.
              </span>
              {logo && (
                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="removeLogo" className="h-4 w-4 accent-ink" /> Remove my logo
                </label>
              )}
            </div>

            <Field label="About your business" hint="Two or three sentences on what you make or offer, and who it helps.">
              <textarea name="blurb" required rows={5} maxLength={4000} defaultValue={page?.blurb ?? ""} className={cn(fieldClass, "py-3")} />
            </Field>
            <Field label="Website">
              <input name="website" maxLength={500} defaultValue={page?.website ?? ""} placeholder="https://" className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Contact email" hint="Private. We use it to reach you, and it is never shown on the website.">
              <input type="email" name="contactEmail" maxLength={160} defaultValue={page?.contactEmail ?? ""} className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Member perk" hint="An offer for Trichollective members, such as 15% off with a code. It appears in Member perks.">
              <textarea name="perk" rows={3} maxLength={2000} defaultValue={page?.perk ?? ""} className={cn(fieldClass, "py-3")} />
            </Field>

            <label className="flex items-start gap-3">
              <input type="checkbox" name="show" defaultChecked={page ? page.published || page.hidden : true} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-medium">Show my page</span>
                <span className="text-sm text-muted-foreground">Untick to hide your page and perk while you update them.</span>
              </span>
            </label>

            <SubmitButton className="self-start">{page ? "Save my page" : "Create my page"}</SubmitButton>
          </form>
        </Card>
      </section>

      <section id="team" className="mt-10 scroll-mt-20">
        <SectionLabel>
          Your team: {seats.length} of {BUSINESS_SEATS} seats used
        </SectionLabel>
        <Card className="p-5 sm:p-6">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Give up to {BUSINESS_SEATS} people on your team Professional membership, paid for by your plan. They sign in with
            the email you add here.
          </p>
          {!business && (
            <p className="mt-3 text-sm text-destructive">
              Seats only work while your Business plan is active.{" "}
              <Link href="/members/billing" className="underline underline-offset-4">
                Check your plan
              </Link>
              .
            </p>
          )}

          {seats.length > 0 && (
            <ul className="mt-5 flex flex-col divide-y divide-rule rounded-xl border border-rule">
              {seats.map((seat) => (
                <li key={seat.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{seat.email}</p>
                    <p className="text-xs text-muted-foreground">Added {shortDate(seat.createdAt)}</p>
                  </div>
                  <form action={removeSeat}>
                    <input type="hidden" name="id" value={seat.id} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-rule px-3 text-sm hover:border-ink/40"
                      aria-label={`Remove ${seat.email}`}
                    >
                      <X className="h-4 w-4" /> Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {seats.length < BUSINESS_SEATS && (
            <form action={addSeat} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                name="email"
                required
                maxLength={160}
                placeholder="colleague@yourbusiness.com"
                aria-label="Team member's email"
                className={cn(fieldClass, "h-12 flex-1")}
              />
              <SubmitButton pending="Adding…">Add to my team</SubmitButton>
            </form>
          )}
        </Card>
      </section>
    </MemberPage>
  );
}
