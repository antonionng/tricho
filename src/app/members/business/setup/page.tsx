import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Card, MemberPage, PageHeader, fieldClass } from "@/components/members/MemberPage";
import { SubmitButton } from "@/components/members/SubmitButton";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { auth } from "@/auth";
import { isBusinessAccount } from "@/lib/subscription";
import { displayHost, PARTNER_CATEGORIES, partnerLogoSrc, partnerTierLabel } from "@/lib/partners";
import { ORGANISATION_KINDS, ORGANISATION_SIZES } from "@/lib/crm-intake";
import {
  isSetupStep,
  nextSetupStep,
  readyToPublish,
  SETUP_STEPS,
  setupProgress,
  SOCIAL_NETWORKS,
  socialLinks,
  type SetupStepId,
} from "@/lib/business-profile";
import { cn } from "@/lib/utils";
import { publishBusinessPage, saveSetupStep } from "../actions";
import { loadBusiness } from "../_data";
import { errorText as describeError, SAVED_MESSAGES } from "../messages";
import { TeamSeats } from "../TeamSeats";

export const metadata = { title: "Set up your business" };

const INTRO: Record<SetupStepId, { title: string; lede: string }> = {
  details: {
    title: "Tell professionals who you are.",
    lede: "Your name, category and a short description appear on your partner page, so trichologists and hair professionals can see at a glance whether you are relevant to their work.",
  },
  logo: {
    title: "Add your logo.",
    lede: "Your logo appears on your partner page and beside your member perk, which makes your brand easy to recognise.",
  },
  contact: {
    title: "Add your contact details.",
    lede: "Your website and social links appear on your page. Your email and phone number stay private and are only used by our team to reach you.",
  },
  address: {
    title: "Add your business address and records.",
    lede: "These details are private. We use them for your invoices and our records, and they are never shown on the website.",
  },
  perk: {
    title: "Offer members a perk.",
    lede: "A perk, such as a discount or a free trial, gives professionals a reason to try what you offer, and it appears in Member perks for every member.",
  },
  team: {
    title: "Give your team Professional membership.",
    lede: "Your plan includes Professional membership for five people on your team, so they can join discussions, events and the directory.",
  },
  publish: {
    title: "Check your page and publish it.",
    lede: "This is how your page will look in the partner directory. You can keep editing it at any time after it goes live.",
  },
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

function StepForm({ step, children, submit = "Save and continue" }: { step: SetupStepId; children: React.ReactNode; submit?: string }) {
  return (
    <form action={saveSetupStep} className="flex flex-col gap-4">
      <input type="hidden" name="step" value={step} />
      {children}
      <SubmitButton className="self-start">{submit}</SubmitButton>
    </form>
  );
}

export default async function BusinessSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; saved?: string; error?: string; message?: string }>;
}) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/login?next=/members/business/setup");
  const sp = await searchParams;

  const [{ page, org, seats }, business] = await Promise.all([loadBusiness(email), isBusinessAccount(email)]);
  if (!page && !business) redirect("/members/business");

  const progress = setupProgress({ page, org, seats: seats.length });
  const step: SetupStepId = isSetupStep(sp.step) ? sp.step : nextSetupStep(progress);
  const index = SETUP_STEPS.findIndex((s) => s.id === step);
  const intro = INTRO[step];
  const errorText = describeError(sp.error, sp.message);
  const savedText = sp.saved ? SAVED_MESSAGES[sp.saved] : null;
  const logo = partnerLogoSrc(page?.logoUrl);
  const socials = (org?.socials && typeof org.socials === "object" ? org.socials : {}) as Record<string, string>;
  const needsPage = !page && step !== "details";

  return (
    <MemberPage size="narrow">
      <Link href="/members/business" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Your business
      </Link>

      <nav aria-label="Setup progress" className="mb-8">
        <p className="label mb-3 text-muted-foreground">
          Step {index + 1} of {SETUP_STEPS.length}
        </p>
        <ol className="flex flex-wrap gap-2">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/members/business/setup?step=${s.id}`}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm",
                  s.id === step ? "border-ink bg-ink text-paper" : "border-rule bg-card hover:border-ink/40"
                )}
              >
                {progress[s.id] ? <Check className="h-3.5 w-3.5" aria-label="Done" /> : <span aria-hidden>{i + 1}</span>}
                {s.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <PageHeader label="Set up your business" title={intro.title} lede={intro.lede} />

      {savedText && (
        <p className="mb-6 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive" role="status">
          {savedText}
        </p>
      )}
      {errorText && (
        <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {errorText}
        </p>
      )}

      {needsPage ? (
        <Card className="p-5 sm:p-6">
          <p className="text-[15px] leading-relaxed text-ink-2">
            Please start with your brand details, so there is a page to add the rest to.
          </p>
          <Button asChild className="mt-4">
            <Link href="/members/business/setup?step=details">Add your brand details</Link>
          </Button>
        </Card>
      ) : step === "team" ? (
        <div className="flex flex-col gap-4">
          <TeamSeats seats={seats} business={business} returnTo="setup" />
          <StepForm step="team" submit={seats.length ? "Continue" : "Skip for now"}>
            {null}
          </StepForm>
        </div>
      ) : step === "publish" ? (
        <PublishStep
          page={page!}
          logo={logo}
          socials={socialLinks(org?.socials)}
          progress={progress}
          canPublish={business || page!.published}
        />
      ) : (
        <Card className="p-5 sm:p-6">
          {step === "details" && (
            <StepForm step="details">
              <Field label="Business name">
                <input name="name" required maxLength={120} defaultValue={page?.name ?? org?.name ?? ""} className={cn(fieldClass, "h-12")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type of business">
                  <select name="kind" defaultValue={org?.kind ?? "brand"} className={cn(fieldClass, "h-12")}>
                    {ORGANISATION_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
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
              </div>
              <Field label="Website">
                <input name="website" maxLength={500} defaultValue={page?.website ?? ""} placeholder="https://" className={cn(fieldClass, "h-12")} />
              </Field>
              <Field
                label="About your business"
                hint="Two or three sentences on what you make or offer, who it helps and how professionals use it. Please avoid medical claims."
              >
                <textarea name="blurb" required rows={5} maxLength={4000} defaultValue={page?.blurb ?? ""} className={cn(fieldClass, "py-3")} />
              </Field>
            </StepForm>
          )}

          {step === "logo" && (
            <StepForm step="logo">
              <ImageUpload
                name="logo"
                currentUrl={logo}
                shape="wide"
                label={logo ? "Choose a new logo" : "Choose your logo"}
                hint="A PNG, JPG or WebP up to 5MB. We resize it for you and keep a transparent background."
                removeName="removeLogo"
              />
            </StepForm>
          )}

          {step === "contact" && (
            <StepForm step="contact">
              <Field label="Contact email" hint="Private. Our team uses it to reach you about your page, and it is never shown on the website.">
                <input type="email" name="contactEmail" maxLength={160} defaultValue={page?.contactEmail ?? ""} className={cn(fieldClass, "h-12")} />
              </Field>
              <Field label="Phone" hint="Private, and optional.">
                <input type="tel" name="phone" maxLength={40} defaultValue={org?.phone ?? ""} className={cn(fieldClass, "h-12")} />
              </Field>
              <p className="pt-2 text-sm font-medium">Social profiles, shown on your page</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {SOCIAL_NETWORKS.map((n) => (
                  <Field key={n.id} label={n.label}>
                    <input
                      name={n.id}
                      maxLength={300}
                      defaultValue={socials[n.id] ?? ""}
                      placeholder={`@yourbrand or ${n.host}/…`}
                      className={cn(fieldClass, "h-12")}
                    />
                  </Field>
                ))}
              </div>
            </StepForm>
          )}

          {step === "address" && (
            <StepForm step="address">
              <Field label="Address line 1">
                <input name="addressLine1" maxLength={200} autoComplete="address-line1" defaultValue={org?.addressLine1 ?? ""} className={cn(fieldClass, "h-12")} />
              </Field>
              <Field label="Address line 2">
                <input name="addressLine2" maxLength={200} autoComplete="address-line2" defaultValue={org?.addressLine2 ?? ""} className={cn(fieldClass, "h-12")} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Town or city">
                  <input name="city" maxLength={120} autoComplete="address-level2" defaultValue={org?.city ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <Field label="County or region">
                  <input name="region" maxLength={120} autoComplete="address-level1" defaultValue={org?.region ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <Field label="Postcode">
                  <input name="postcode" maxLength={20} autoComplete="postal-code" defaultValue={org?.postcode ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <Field label="Country">
                  <input name="country" maxLength={80} autoComplete="country-name" defaultValue={org?.country ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <Field label="Company number" hint="Optional. For a UK limited company, from Companies House.">
                  <input name="companyNumber" maxLength={20} defaultValue={org?.companyNumber ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
                <Field label="VAT number" hint="Optional. Include the country code, such as GB.">
                  <input name="vatNumber" maxLength={20} defaultValue={org?.vatNumber ?? ""} className={cn(fieldClass, "h-12")} />
                </Field>
              </div>
              <Field label="Team size">
                <select name="size" defaultValue={org?.size ?? ""} className={cn(fieldClass, "h-12")}>
                  <option value="">Choose one</option>
                  {ORGANISATION_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size === "1" ? "Just me" : `${size} people`}
                    </option>
                  ))}
                </select>
              </Field>
            </StepForm>
          )}

          {step === "perk" && (
            <StepForm step="perk">
              <Field
                label="Member perk"
                hint="For example, 15% off your first order with the code TRICHO15, or a free consultation for clinics. Leave it empty if you would rather add one later."
              >
                <textarea name="perk" rows={4} maxLength={2000} defaultValue={page?.perk ?? ""} className={cn(fieldClass, "py-3")} />
              </Field>
            </StepForm>
          )}
        </Card>
      )}

      {step !== "publish" && step !== "details" && !needsPage && (
        <p className="mt-4 text-sm text-muted-foreground">
          This step is optional. You can{" "}
          <Link href={`/members/business/setup?step=${SETUP_STEPS[index + 1]?.id ?? "publish"}`} className="underline underline-offset-4">
            skip it for now
          </Link>{" "}
          and come back to it from Your business at any time.
        </p>
      )}
    </MemberPage>
  );
}

function PublishStep({
  page,
  logo,
  socials,
  progress,
  canPublish,
}: {
  page: NonNullable<Awaited<ReturnType<typeof loadBusiness>>["page"]>;
  logo: string | null;
  socials: { id: string; label: string; url: string }[];
  progress: Record<SetupStepId, boolean>;
  canPublish: boolean;
}) {
  const ready = readyToPublish(page);
  const host = displayHost(page.website);
  const missing = SETUP_STEPS.filter((s) => s.id !== "publish" && !progress[s.id]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>{partnerTierLabel(page.tier)}</Pill>
          <Pill>{page.category}</Pill>
          {page.published && <Pill tone="positive">Live</Pill>}
        </div>
        {logo && (
          <div className="flex h-24 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={`${page.name} logo`} className="max-h-24 max-w-[260px] object-contain" />
          </div>
        )}
        <h2 className="display text-4xl">{page.name}</h2>
        {page.blurb ? (
          <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
            {page.blurb.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your description will appear here.</p>
        )}
        {(host || socials.length > 0) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {host && <span className="text-ink underline underline-offset-4">{host}</span>}
            {socials.map((s) => (
              <span key={s.id} className="text-ink-2">
                {s.label}
              </span>
            ))}
          </p>
        )}
        {page.perk && (
          <div className="rounded-xl border border-rule bg-paper-2 p-4">
            <p className="label mb-1 text-muted-foreground">Member perk</p>
            <p className="text-[15px]">{page.perk}</p>
          </div>
        )}
      </Card>

      {missing.length > 0 && (
        <p className="text-sm text-ink-2">
          You can publish now and finish the rest later. Still to do:{" "}
          {missing.map((s, i) => (
            <span key={s.id}>
              <Link href={`/members/business/setup?step=${s.id}`} className="underline underline-offset-4">
                {s.label.toLowerCase()}
              </Link>
              {i < missing.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      )}

      {page.hidden ? (
        <p className="text-sm text-destructive">
          The Trichollective team has paused your page, so it can&apos;t go live yet. Reply to any of our emails and we&apos;ll help.
        </p>
      ) : page.published ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/partners/${page.slug}`}>View your live page</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/members/business">Back to Your business</Link>
          </Button>
        </div>
      ) : !ready ? (
        <p className="text-sm text-ink-2">
          Your page needs a name, a category and a short description before it can go live.{" "}
          <Link href="/members/business/setup?step=details" className="underline underline-offset-4">
            Add your brand details
          </Link>
          .
        </p>
      ) : !canPublish ? (
        <p className="text-sm text-destructive">
          Your page can go live while your Business or Premium Business plan is active.{" "}
          <Link href="/members/billing" className="underline underline-offset-4">
            Check your plan
          </Link>
          .
        </p>
      ) : (
        <form action={publishBusinessPage} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SubmitButton pending="Publishing…">Publish my page</SubmitButton>
          <Link href="/members/business" className="text-sm text-ink-2 underline underline-offset-4">
            Keep it hidden for now
          </Link>
        </form>
      )}
    </div>
  );
}
