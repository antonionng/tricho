"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONCERNS } from "@/config/consumer";
import { updateSettings, type SettingsState } from "../actions";

export function SettingsForm(props: {
  marketing: boolean;
  activity: boolean;
  healthConsent: boolean;
  concerns: string[];
  region: string;
  country: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateSettings, null);
  const [health, setHealth] = useState(props.healthConsent);
  return (
    <form action={action} className="space-y-10">
      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-ink">Emails</legend>
        <label className="flex items-start gap-3 text-[15px] text-ink-2">
          <input type="checkbox" name="activity" defaultChecked={props.activity} className="mt-1" />
          <span>Email me when a professional replies to an enquiry or something changes with it.</span>
        </label>
        <label className="flex items-start gap-3 text-[15px] text-ink-2">
          <input type="checkbox" name="marketing" defaultChecked={props.marketing} className="mt-1" />
          <span>Send me occasional news, new guides and articles from Trichollective. We never share your email.</span>
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-ink">What you would like help with</legend>
        <p className="text-[15px] text-ink-2">
          Telling us what you want help with lets us suggest reading and professionals that fit. This counts as information about
          your health, so we only keep it if you agree below. Nobody else on Trichollective can see it, and turning this off deletes
          it straight away.
        </p>
        <label className="flex items-start gap-3 rounded-2xl border border-rule p-4 text-[15px] text-ink">
          <input type="checkbox" name="healthConsent" checked={health} onChange={(e) => setHealth(e.target.checked)} className="mt-1" />
          <span>I agree that Trichollective can keep the categories I choose below to tailor what it shows me.</span>
        </label>
        {health && (
          <div className="space-y-3">
            {CONCERNS.map((c) => (
              <label key={c.id} className="flex items-start gap-3 text-[15px] text-ink-2">
                <input type="checkbox" name="concerns" value={c.id} defaultChecked={props.concerns.includes(c.id)} className="mt-1" />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xl font-semibold text-ink">Where you are</legend>
        <p className="text-[15px] text-ink-2">This is optional, and it helps us show you professionals near you.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="region">Town, city or county</Label>
            <Input id="region" name="region" defaultValue={props.region} maxLength={60} autoComplete="address-level2" className="h-12 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={props.country} maxLength={60} autoComplete="country-name" className="h-12 text-base" />
          </div>
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save my settings"}
      </Button>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ink-2" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
