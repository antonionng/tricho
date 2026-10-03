import type { TrichologistProfile } from "@prisma/client";
import { fieldClass } from "@/components/members/MemberPage";
import { LISTING_COUNTRIES } from "@/content/chapters";
import {
  GOALS,
  INTEREST_GROUPS,
  MEMBERSHIP_BODIES,
  SOCIAL_KEYS,
  SOCIAL_NETWORKS,
  readQualifications,
  readSocials,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

/** Form fields shared by onboarding and the profile page. Field names match profileDataFromForm. */

type Profile = TrichologistProfile | null | undefined;

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const input = cn(fieldClass, "h-12");
const area = cn(fieldClass, "resize-y py-3 leading-relaxed");
const chip =
  "flex cursor-pointer items-center gap-2 rounded-full border border-rule bg-card px-3.5 py-2 text-sm transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-2";

/** Tells profileDataFromForm that a checkbox group or toggle was on the form, even if nothing is ticked. */
export function Present({ names }: { names: string[] }) {
  return (
    <>
      {names.map((n) => (
        <input key={n} type="hidden" name="_present" value={n} />
      ))}
    </>
  );
}

export function IdentityFields({ profile, fallbackCity }: { profile: Profile; fallbackCity?: string | null }) {
  const country = profile?.country ?? "";
  const countries: readonly string[] = LISTING_COUNTRIES;
  return (
    <>
      <Field label="Headline" hint="One sentence about what you do and who you help.">
        <input
          name="headline"
          maxLength={140}
          defaultValue={profile?.headline ?? ""}
          placeholder="Trichologist helping women with shedding and thinning hair"
          className={input}
        />
      </Field>
      <Field label="Practice or clinic name" hint="Leave this empty if you work under your own name.">
        <input name="practiceName" maxLength={120} defaultValue={profile?.practiceName ?? ""} className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Town or city">
          <input
            name="city"
            maxLength={80}
            autoComplete="address-level2"
            defaultValue={profile?.city ?? profile?.location ?? fallbackCity ?? ""}
            className={input}
          />
        </Field>
        <Field label="Country">
          <select name="country" defaultValue={country} className={input}>
            <option value="">Choose one</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {country && !countries.includes(country) && <option value={country}>{country}</option>}
          </select>
        </Field>
      </div>
    </>
  );
}

export function PracticeFields({ profile, withBio = false }: { profile: Profile; withBio?: boolean }) {
  return (
    <>
      {withBio && (
        <Field label="About your practice" hint="A short paragraph on how you work and the clients you see most often.">
          <textarea name="bio" rows={5} maxLength={800} defaultValue={profile?.bio ?? ""} className={area} />
        </Field>
      )}
      <Field
        label="Specialisms"
        hint="Separate each one with a comma, for example: Female pattern hair loss, Alopecia areata, Scalp conditions."
      >
        <input
          name="specialisms"
          defaultValue={profile?.specialisms.length ? profile.specialisms.join(", ") : (profile?.specialization ?? "")}
          className={input}
        />
      </Field>
      <Field label="Services" hint="Separate each one with a comma, for example: Scalp consultation, Trichoscopy, Head spa.">
        <input name="services" defaultValue={profile?.services.join(", ") ?? ""} className={input} />
      </Field>
      <Field label="Years in practice" className="sm:max-w-[12rem]">
        <input
          name="yearsInPractice"
          type="number"
          inputMode="numeric"
          min={0}
          max={70}
          defaultValue={profile?.yearsInPractice ?? ""}
          className={input}
        />
      </Field>
    </>
  );
}

export function QualificationFields({ profile, extraRows = 2 }: { profile: Profile; extraRows?: number }) {
  const saved = readQualifications(profile?.qualifications);
  const rows = [...saved, ...Array.from({ length: Math.max(extraRows, 3 - saved.length) }, () => ({ title: "", year: undefined }))];
  const known = new Set<string>(MEMBERSHIP_BODIES.map((b) => b.id));
  const other = (profile?.memberships ?? []).filter((m) => !known.has(m));
  return (
    <>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Qualifications and training</legend>
        {rows.map((q, i) => (
          <div key={i} className="grid grid-cols-[1fr_6.5rem] gap-2">
            <input
              name="qualTitle"
              aria-label={`Qualification ${i + 1}`}
              maxLength={140}
              defaultValue={q.title}
              placeholder={i === 0 ? "Diploma in Trichology" : ""}
              className={input}
            />
            <input
              name="qualYear"
              aria-label={`Year of qualification ${i + 1}`}
              inputMode="numeric"
              maxLength={4}
              defaultValue={q.year ?? ""}
              placeholder="Year"
              className={input}
            />
          </div>
        ))}
        <span className="text-xs text-muted-foreground">Leave a row empty to remove it. You can add more rows each time you save.</span>
      </fieldset>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-medium">Professional memberships</legend>
        <Present names={["memberships"]} />
        <div className="flex flex-wrap gap-2">
          {MEMBERSHIP_BODIES.map((b) => (
            <label key={b.id} className={chip}>
              <input
                type="checkbox"
                name="memberships"
                value={b.id}
                defaultChecked={profile?.memberships.includes(b.id)}
                className="accent-[var(--ink)]"
              />
              {b.label}
            </label>
          ))}
        </div>
        <Field label="Other bodies or registrations" hint="Separate each one with a comma.">
          <input name="membershipsOther" defaultValue={other.join(", ")} className={input} />
        </Field>
      </fieldset>
    </>
  );
}

export function ContactFields({ profile }: { profile: Profile }) {
  const socials = readSocials(profile?.socials);
  return (
    <>
      <p className="rounded-xl bg-paper-2 p-4 text-sm leading-relaxed text-ink-2">
        Your phone number and business address are private by default. They only appear on your public profile if you
        choose to show them below, and members of the public can always reach you through the enquiry form instead.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={profile?.phone ?? ""} className={input} />
        </Field>
        <Field label="Website">
          <input
            name="website"
            inputMode="url"
            placeholder="yourclinic.ie"
            defaultValue={profile?.website ?? ""}
            className={input}
          />
        </Field>
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Social profiles</legend>
        {SOCIAL_KEYS.map((k) => (
          <Field key={k} label={SOCIAL_NETWORKS[k].label}>
            <input name={`social_${k}`} placeholder="@handle or link" defaultValue={socials[k] ?? ""} className={input} />
          </Field>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-medium">Business address</legend>
        <Field label="Address line 1">
          <input name="addressLine1" autoComplete="address-line1" maxLength={120} defaultValue={profile?.addressLine1 ?? ""} className={input} />
        </Field>
        <Field label="Address line 2">
          <input name="addressLine2" autoComplete="address-line2" maxLength={120} defaultValue={profile?.addressLine2 ?? ""} className={input} />
        </Field>
        <Field label="Postcode or Eircode" className="sm:max-w-[14rem]">
          <input name="postcode" autoComplete="postal-code" maxLength={20} defaultValue={profile?.postcode ?? ""} className={input} />
        </Field>
      </fieldset>
      <Present names={["showPhone", "showAddress"]} />
      <div className="flex flex-col gap-3">
        <Toggle name="showPhone" checked={!!profile?.showPhone} title="Show my phone number on my public profile" />
        <Toggle name="showAddress" checked={!!profile?.showAddress} title="Show my business address on my public profile" />
      </div>
    </>
  );
}

function Toggle({ name, checked, title }: { name: string; checked: boolean; title: string }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
      <span className="text-[15px]">{title}</span>
    </label>
  );
}

export function GoalsFields({ profile }: { profile: Profile }) {
  return (
    <>
      <Present names={["goals", "interests"]} />
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-medium">What would you like from the community?</legend>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <label key={g.id} className={chip}>
              <input type="checkbox" name="goals" value={g.id} defaultChecked={profile?.goals.includes(g.id)} className="accent-[var(--ink)]" />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium">Topics you want to follow</legend>
        {INTEREST_GROUPS.map((group) => (
          <div key={group.topic}>
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">{group.topic}</p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((i) => (
                <label key={i.id} className={chip}>
                  <input
                    type="checkbox"
                    name="interests"
                    value={i.id}
                    defaultChecked={profile?.interests.includes(i.id)}
                    className="accent-[var(--ink)]"
                  />
                  {i.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
    </>
  );
}
