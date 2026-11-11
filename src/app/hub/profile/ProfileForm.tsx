"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileState } from "../actions";

export function ProfileForm({ firstName, displayMode, alias }: { firstName: string; displayMode: "name" | "alias"; alias: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [name, setName] = useState(firstName);
  return (
    <form action={action} className="space-y-5">
      <h2 className="text-xl font-semibold text-ink">How other people see you</h2>
      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          name="firstName"
          autoComplete="given-name"
          maxLength={40}
          className="h-12 text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">This is optional. We only use it to greet you, unless you choose to show it below.</p>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink">Show other people</legend>
        <label className="flex items-start gap-3 text-[15px] text-ink-2">
          <input type="radio" name="displayMode" value="alias" defaultChecked={displayMode === "alias"} className="mt-1" />
          <span>
            My alias, <strong className="text-ink">{alias}</strong>, so nobody else knows who I am.
          </span>
        </label>
        <label className="flex items-start gap-3 text-[15px] text-ink-2">
          <input type="radio" name="displayMode" value="name" defaultChecked={displayMode === "name"} disabled={!name.trim()} className="mt-1" />
          <span>My first name{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}. Add a first name above to choose this.</span>
        </label>
      </fieldset>
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : "Save my profile"}
      </Button>
      {state && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-ink-2" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
