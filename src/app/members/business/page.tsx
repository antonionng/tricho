import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Check, Circle } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, MemberPage, PageHeader, SectionLabel, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { auth } from "@/auth";
import { BUSINESS_SEATS, isBusinessAccount } from "@/lib/subscription";
import { nextSetupStep, SETUP_STEPS, setupProgress, type SetupStepId } from "@/lib/business-profile";
import { PARTNER_CATEGORIES, partnerLogoSrc, partnerTierLabel } from "@/lib/partners";
import { cn } from "@/lib/utils";
import { saveBusinessPage } from "./actions";
import { loadBusiness } from "./_data";
import { errorText as describeError, SAVED_MESSAGES } from "./messages";
import { TeamSeats } from "./TeamSeats";
import { Results } from "./Results";

export const metadata = { title: "Your business" };

/** How the portal names the next unfinished step, in a sentence and on its button. */
const NEXT_STEP: Record<SetupStepId, { phrase: string; button: string }> = {
  details: { phrase: "adding your brand details", button: "Add your brand details" },
  logo: { phrase: "adding your logo", button: "Add your logo" },
  contact: { phrase: "adding your contact details", button: "Add your contact details" },
  address: { phrase: "adding your business address", button: "Add your business address" },
  perk: { phrase: "offering members a perk", button: "Add a member perk" },
  team: { phrase: "giving your team their Professional seats", button: "Add your team" },
  publish: { phrase: "checking your page and publishing it", button: "Preview and publish" },
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

  const [{ page, org, seats }, business] = await Promise.all([loadBusiness(email), isBusinessAccount(email)]);

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

  // A business account without a page starts the guided setup at the first step.
  if (!page) redirect("/members/business/setup?step=details");

  const logo = partnerLogoSrc(page?.logoUrl);
  const errorText = describeError(error, message);
  const progress = setupProgress({ page, org, seats: seats.length });
  const stepsLeft = SETUP_STEPS.filter((st) => !progress[st.id]).length;
  const next = SETUP_STEPS.find((st) => st.id === nextSetupStep(progress))!;
  const premium = page.tier === "premium";

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

      {saved === "published" && page.published ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-4 sm:px-5" role="status">
          <p className="text-[15px] leading-relaxed text-ink">
            Your page is now live, so anyone browsing the partner directory can find {page.name}
            {page.perk ? ", and signed-in members can see your perk in Member perks." : "."}
          </p>
          <Link
            href={`/partners/${page.slug}`}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink underline underline-offset-4"
          >
            View your public page <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : saved && SAVED_MESSAGES[saved] && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          {SAVED_MESSAGES[saved]}
        </p>
      )}
      {errorText && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorText}
        </p>
      )}

      <section id="setup" className="mb-10 scroll-mt-20">
        <SectionLabel>{stepsLeft ? `Your profile: ${stepsLeft} of ${SETUP_STEPS.length} steps left` : "Your profile is complete"}</SectionLabel>
        <Card className={cn("p-5 sm:p-6", stepsLeft > 0 && !page.published && "border-ink/40")}>
          {stepsLeft > 0 && (
            <p className="mb-2 text-lg font-medium leading-snug text-ink">
              {page.published
                ? `Your page is live, and your next step is ${NEXT_STEP[next.id].phrase}.`
                : `Your page is not live yet, and your next step is ${NEXT_STEP[next.id].phrase}.`}
            </p>
          )}
          <p className="text-[15px] leading-relaxed text-ink-2">
            {stepsLeft
              ? "A complete profile helps professionals understand what you offer and gives our team what it needs for your invoices. Each step takes a minute or two, and you can stop and come back at any time."
              : "Everything is in place. You can change any part of your profile below or step through the guided setup again."}
          </p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2">
            {SETUP_STEPS.map((st) => (
              <li key={st.id}>
                <Link
                  href={`/members/business/setup?step=${st.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-rule px-3.5 py-2.5 text-[15px] hover:border-ink/40"
                >
                  {progress[st.id] ? (
                    <Check className="h-4 w-4 shrink-0 text-positive" aria-label="Done" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="To do" />
                  )}
                  {st.label}
                </Link>
              </li>
            ))}
          </ol>
          {stepsLeft > 0 && (
            <Button asChild size="lg" className="mt-5">
              <Link href={`/members/business/setup?step=${next.id}`}>{NEXT_STEP[next.id].button}</Link>
            </Button>
          )}
        </Card>
      </section>

      {premium && <PremiumStatus isFounding={page.isFounding} />}

      <Results partnerId={page.id} published={page.published} hasPerk={!!page.perk?.trim()} />

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
              <ImageUpload
                name="logo"
                currentUrl={logo}
                shape="wide"
                label={logo ? "Choose a new logo" : "Choose your logo"}
                hint="A PNG, JPG or WebP up to 5MB. We resize it for you and keep a transparent background."
                removeName="removeLogo"
              />
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
            <Field label="Public email" hint="Optional. This is shown on your partner page so professionals can contact you directly.">
              <input type="email" name="publicEmail" maxLength={160} defaultValue={page?.publicEmail ?? ""} placeholder="hello@yourbrand.com" className={cn(fieldClass, "h-12")} />
            </Field>
            <Field label="Public phone" hint="Optional. This is shown on your partner page, so use a number you are happy for anyone to call.">
              <input type="tel" name="publicPhone" maxLength={40} defaultValue={page?.publicPhone ?? ""} className={cn(fieldClass, "h-12")} />
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
        <TeamSeats seats={seats} business={business} />
      </section>
    </MemberPage>
  );
}

/** What Premium Business includes, in full sentences, from the plan in src/config/subscriptions.ts. */
const PREMIUM_INCLUDES = [
  "Everything in the Business plan is included, with your business page, five Professional seats and job posts.",
  "You can run one sponsored masterclass a year, reviewed so that it teaches rather than sells, and it stays in the member library.",
  "You can co-develop a course with a certificate for members, subject to clinical review.",
  "You receive one labelled partner feature in Trichozette each year, and a \u201cSupported by\u201d credit on one edition each quarter.",
  "Your brand is spotlighted in two member newsletters a year.",
  "You have a talk or demo slot at one conference a year, with sampling or a delegate-bag insert at the others.",
  "Your member perk has tracked redemptions, and you can run an opt-in product trial panel with structured feedback.",
  "You receive a quarterly report on how members engaged with your content and perks.",
  "Your partner page carries the Premium partner badge.",
];

function PremiumStatus({ isFounding }: { isFounding: boolean }) {
  return (
    <section id="premium" className="mb-10 scroll-mt-20">
      <SectionLabel>Your plan</SectionLabel>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeCheck className="h-5 w-5 shrink-0 text-ink" aria-hidden />
          <h3 className="text-lg font-medium text-ink">Premium partner</h3>
          {isFounding && <Pill tone="ink">Founding partner</Pill>}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          {isFounding
            ? "You are one of our founding Premium partners, and your plan includes the following throughout the year."
            : "Your Premium Business plan includes the following throughout the year."}
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {PREMIUM_INCLUDES.map((line) => (
            <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
              <Check className="mt-1 h-4 w-4 shrink-0 text-positive" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          To plan your masterclass, Trichozette feature, newsletter spotlights or conference slot, reply to any email from our team
          and we will arrange the dates with you.
        </p>
      </Card>
    </section>
  );
}
