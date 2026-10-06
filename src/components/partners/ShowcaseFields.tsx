import Link from "next/link";
import type { Partner } from "@prisma/client";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { fieldClass } from "@/components/members/MemberPage";
import { partnerLogoSrc } from "@/lib/partners";
import { partnerAllowance, readHighlights, readOfferings, readSections, safeHex } from "@/lib/showcase";
import { cn } from "@/lib/utils";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/**
 * The fields for one showcase step, without the form around them. The business portal and the
 * Studio both use these, so a page looks and saves the same whoever edits it. The package limits
 * (how many numbers, products and sections) come from the page itself.
 */
export function ShowcaseFields({ step, page }: { step: "logo" | "story" | "offerings" | "extras"; page: Partner }) {
  const allow = partnerAllowance(page);
  const logo = partnerLogoSrc(page.logoUrl);
  const cover = partnerLogoSrc(page.coverUrl);
  return (
    <>
      {step === "logo" && (
        <>
          <p className="text-sm font-medium">Logo</p>
          <ImageUpload
            name="logo"
            currentUrl={logo}
            shape="wide"
            label={logo ? "Choose a new logo" : "Choose your logo"}
            hint="A PNG, JPG or WebP up to 5MB. We resize it for you and keep a transparent background."
            removeName="removeLogo"
          />
          <p className="pt-3 text-sm font-medium">Cover photo</p>
          <ImageUpload
            name="cover"
            currentUrl={cover}
            shape="wide"
            label={cover ? "Choose a new cover photo" : "Choose a cover photo"}
            hint="A wide landscape photo up to 8MB, at least 2000 pixels across. It runs across the top of your page."
            removeName="removeCover"
          />
          {allow.colour && (
            <Field label="Brand colour" hint="Your page's main colour. We choose white or black text on it automatically, so it always reads clearly.">
              <span className="flex items-center gap-3">
                <input
                  type="color"
                  name="accentColor"
                  defaultValue={safeHex(page?.accentColor, "#0B0B0B").toLowerCase()}
                  className="h-12 w-20 cursor-pointer rounded-xl border border-rule bg-card p-1"
                />
                <span className="text-sm text-muted-foreground">Pick a colour, or use the hex code from your brand guidelines.</span>
              </span>
            </Field>
          )}
        </>
      )}

      {step === "story" && allow && (
        <>
          <Field label="One-line summary" hint="Shown under your name at the top of your page. One sentence on what you do and who it helps.">
            <input name="tagline" maxLength={200} defaultValue={page?.tagline ?? ""} className={cn(fieldClass, "h-12")} />
          </Field>
          <Field
            label="Your story"
            hint="A few short paragraphs, with a blank line between them. Start a line with ## to make it a heading. Please avoid medical claims."
          >
            <textarea name="story" rows={8} maxLength={6000} defaultValue={page?.story ?? ""} className={cn(fieldClass, "py-3")} />
          </Field>
          {allow.highlights > 0 && (
            <>
              <p className="pt-2 text-sm font-medium">Headline numbers (up to {allow.highlights})</p>
              <p className="-mt-2 text-sm text-muted-foreground">For example, &ldquo;400&rdquo; and &ldquo;clinics stock our range&rdquo;.</p>
              {Array.from({ length: allow.highlights }, (_, i) => {
                const h = readHighlights(page?.highlights)[i];
                return (
                  <div key={i} className="grid grid-cols-[7rem_1fr] gap-3">
                    <input name={`hValue${i}`} maxLength={12} defaultValue={h?.value ?? ""} placeholder="Number" aria-label={`Number ${i + 1}`} className={cn(fieldClass, "h-12")} />
                    <input name={`hLabel${i}`} maxLength={80} defaultValue={h?.label ?? ""} placeholder="What it counts" aria-label={`What number ${i + 1} counts`} className={cn(fieldClass, "h-12")} />
                  </div>
                );
              })}
            </>
          )}
          {allow.cta && (
            <>
              <p className="pt-2 text-sm font-medium">Main button</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
                <input name="ctaLabel" maxLength={40} defaultValue={page?.ctaLabel ?? ""} placeholder="Book a demo" aria-label="Button label" className={cn(fieldClass, "h-12")} />
                <input name="ctaUrl" maxLength={500} defaultValue={page?.ctaUrl ?? ""} placeholder="https://" aria-label="Button link" className={cn(fieldClass, "h-12")} />
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">Shown at the top of your page. Leave both empty if you would rather not have one.</p>
            </>
          )}
        </>
      )}

      {step === "offerings" && allow && (
        <>
          <p className="text-sm text-muted-foreground">Add up to {allow.offerings}. Empty rows are left off your page.</p>
          {Array.from({ length: allow.offerings }, (_, i) => {
            const o = readOfferings(page?.offerings)[i];
            return (
              <div key={i} className="flex flex-col gap-2 rounded-2xl border border-rule p-4">
                <input name={`oTitle${i}`} maxLength={80} defaultValue={o?.title ?? ""} placeholder={`Product or service ${i + 1}`} aria-label={`Name of product or service ${i + 1}`} className={cn(fieldClass, "h-11")} />
                <textarea name={`oBody${i}`} rows={2} maxLength={400} defaultValue={o?.body ?? ""} placeholder="One or two sentences on what it is and who it is for" aria-label={`Description of product or service ${i + 1}`} className={cn(fieldClass, "py-2.5")} />
              </div>
            );
          })}
        </>
      )}

      {step === "extras" && allow && (
        <>
          {allow.video ? (
            <Field label="Video" hint="A YouTube or Vimeo link. It plays on your page without cookies until someone presses play.">
              <input name="videoUrl" maxLength={500} defaultValue={page?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" className={cn(fieldClass, "h-12")} />
            </Field>
          ) : (
            <p className="rounded-2xl bg-paper-2 px-4 py-3 text-sm text-ink-2">
              A video on your page is part of Premium Business.{" "}
              <Link href="/for-business#compare" className="underline underline-offset-4">
                Compare plans
              </Link>
            </p>
          )}
          {Array.from({ length: allow.sections }, (_, i) => {
            const sec = readSections(page?.sections)[i];
            return (
              <fieldset key={i} className="flex flex-col gap-2 rounded-2xl border border-rule p-4">
                <legend className="px-1 text-sm font-medium">Feature section {i + 1}</legend>
                <input name={`sEyebrow${i}`} maxLength={40} defaultValue={sec?.eyebrow ?? ""} placeholder="Small label, e.g. For clinics" aria-label="Small label" className={cn(fieldClass, "h-11")} />
                <input name={`sTitle${i}`} maxLength={140} defaultValue={sec?.title ?? ""} placeholder="Heading, as a full sentence" aria-label="Heading" className={cn(fieldClass, "h-11")} />
                <textarea name={`sBody${i}`} rows={3} maxLength={1200} defaultValue={sec?.body ?? ""} placeholder="A short paragraph" aria-label="Paragraph" className={cn(fieldClass, "py-2.5")} />
                <textarea name={`sSteps${i}`} rows={4} maxLength={2000} defaultValue={sec?.steps?.join("\n") ?? ""} placeholder="Steps or points, one per line (up to 6)" aria-label="Steps, one per line" className={cn(fieldClass, "py-2.5")} />
                <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr]">
                  <input name={`sCtaLabel${i}`} maxLength={40} defaultValue={sec?.ctaLabel ?? ""} placeholder="Button label" aria-label="Button label" className={cn(fieldClass, "h-11")} />
                  <input name={`sCtaUrl${i}`} maxLength={500} defaultValue={sec?.ctaUrl ?? ""} placeholder="https://" aria-label="Button link" className={cn(fieldClass, "h-11")} />
                </div>
              </fieldset>
            );
          })}
        </>
      )}
    </>
  );
}
