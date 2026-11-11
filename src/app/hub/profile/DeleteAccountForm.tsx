"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount, type DeleteState } from "../actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, null);
  return (
    <form action={action} className="space-y-3">
      <Label htmlFor="confirm">Type the word delete to confirm</Label>
      <Input id="confirm" name="confirm" autoComplete="off" className="h-12 max-w-xs text-base" />
      <Button type="submit" variant="outline" size="lg" disabled={pending} aria-busy={pending} className="border-destructive text-destructive">
        {pending ? "Deleting your account…" : "Delete my account"}
      </Button>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
