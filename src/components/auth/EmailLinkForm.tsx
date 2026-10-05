"use client";

import { useActionState, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type EmailLinkState = { sent: string | null; error: string | null };

/**
 * The email sign-in form, with a clear confirmation once the link is on its way,
 * a way to send it again and a way to use a different address.
 */
export function EmailLinkForm({
  action,
  defaultEmail,
  mode,
}: {
  action: (prev: EmailLinkState, formData: FormData) => Promise<EmailLinkState>;
  defaultEmail?: string;
  mode: "signin" | "signup";
}) {
  const [state, formAction, pending] = useActionState(action, { sent: null, error: null });
  // The result the visitor chose to move past with "Use a different email".
  const [dismissed, setDismissed] = useState<EmailLinkState | null>(null);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [name, setName] = useState("");
  const sent = state.sent && state !== dismissed ? state.sent : null;

  if (sent) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <MailCheck className="h-7 w-7 stroke-[1.5]" aria-hidden />
        <p className="text-lg font-semibold leading-snug text-ink">
          We have sent a sign-in link to <span className="break-all">{sent}</span>. Open your email app and tap the link.
        </p>
        <p className="text-[15px] leading-relaxed text-ink-2">
          The link opens your account, works once and expires after 24 hours. If it has not arrived within a couple of minutes, please check your
          spam or junk folder.
        </p>
        <form action={formAction} className="flex flex-col gap-3 pt-1 sm:flex-row">
          <input type="hidden" name="email" value={sent} />
          {mode === "signup" && <input type="hidden" name="name" value={name} />}
          <Button type="submit" variant="outline" size="lg" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
            {pending ? "Sending the link…" : "Send the link again"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              setEmail("");
              setDismissed(state);
            }}
          >
            Use a different email
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {mode === "signup" && (
        <>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="First and last name"
            className="h-12 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </>
      )}
      <Label htmlFor="email">Email address</Label>
      <Input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@practice.com"
        className="h-12 text-base"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="h-12 w-full text-base">
        {pending ? "Sending your link…" : mode === "signup" ? "Email me a link to create my account" : "Email me a sign-in link"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">No password to remember. We send a one-time link to your inbox.</p>
    </form>
  );
}
