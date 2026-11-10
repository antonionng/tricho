"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendFeatureApplication, type FeatureState } from "@/lib/actions/feature";
import { FEATURE_FORMATS, FEATURE_ROLES } from "@/lib/feature-application";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

const optionClass =
  "flex cursor-pointer items-start gap-3 rounded-2xl border border-rule bg-paper p-4 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-2";

/** The /featured application. Posts to sendFeatureApplication, which files it in the Studio inbox. */
export function FeatureApplicationForm({
  defaultName = "",
  defaultEmail = "",
  signedIn = false,
}: {
  defaultName?: string;
  defaultEmail?: string;
  signedIn?: boolean;
}) {
  const [state, action, pending] = useActionState<FeatureState, FormData>(sendFeatureApplication, null);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-8 md:p-10">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="display text-3xl">Your application is with the team.</h3>
        <p className="text-[15px] leading-relaxed text-ink-2">{state.message}</p>
      </div>
    );
  }

  const values = state && !state.ok ? (state.fields ?? { name: "", email: "", share: "", format: "", role: "", place: "" }) : null;

  return (
    <form action={action} className="relative flex flex-col gap-6 rounded-3xl border border-rule bg-card p-6 md:p-10">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="ft-hp">Leave this empty</label>
        <input id="ft-hp" name="company_site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ft-name">Your name</Label>
          <Input
            id="ft-name"
            name="name"
            required
            autoComplete="name"
            defaultValue={values?.name ?? defaultName}
            className="bg-paper"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ft-email">Email</Label>
          <Input
            id="ft-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={values?.email ?? defaultEmail}
            className="bg-paper"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ft-share">What would you like to share?</Label>
        <textarea
          id="ft-share"
          name="share"
          required
          rows={6}
          defaultValue={values?.share}
          className={`${controlClass} py-3`}
          placeholder="Your expertise, a story from your practice, or a piece of work other practitioners could learn from."
        />
        <p className="text-sm text-muted-foreground">
          Please leave out a client&apos;s name, photograph or anything else that could identify them.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">Which format suits you?</legend>
        {FEATURE_FORMATS.map((option) => (
          <label key={option.id} className={optionClass}>
            <input
              type="radio"
              name="format"
              value={option.id}
              required
              defaultChecked={values?.format === option.id}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <span>
              <span className="block text-[15px] font-medium text-ink">{option.label}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">How would you like to take part?</legend>
        {FEATURE_ROLES.map((option) => (
          <label key={option.id} className={optionClass}>
            <input
              type="radio"
              name="role"
              value={option.id}
              required
              defaultChecked={values?.role === option.id}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <span>
              <span className="block text-[15px] font-medium text-ink">{option.label}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-2">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ft-place">Where are you based? <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input
          id="ft-place"
          name="place"
          autoComplete="address-level2"
          defaultValue={values?.place}
          className="bg-paper"
          placeholder="Town or city"
        />
        <p className="text-sm text-muted-foreground">
          If you lead the feature, you can record from here. We don&apos;t need to travel to you.
        </p>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {signedIn ? (
            "This application is linked to your membership."
          ) : (
            <>
              Already a member?{" "}
              <Link href="/login?next=/featured" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{" "}
              and we&apos;ll attach it to your account.
            </>
          )}
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send application"}
          {!pending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
