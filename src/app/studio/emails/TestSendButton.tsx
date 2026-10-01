"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendTestEmailAction, type TestSendState } from "./actions";

export function TestSendButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<TestSendState, FormData>(sendTestEmailAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Send /> {pending ? "Sending" : "Send me a test"}
      </Button>
      {state && <span className={state.ok ? "text-sm text-muted-foreground" : "text-sm text-red-700"}>{state.message}</span>}
    </form>
  );
}
