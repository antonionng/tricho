"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendContactMessage, type ContactState } from "@/lib/actions/contact";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

/** The /contact form. Posts to sendContactMessage, which files it in the Studio inbox. */
export function ContactForm({ topics, defaultTopic }: { topics: readonly string[]; defaultTopic?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, null);

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-3xl border border-rule bg-card p-8 md:p-10">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="display text-3xl">Your message is on its way to us.</h3>
        <p className="text-[15px] leading-relaxed text-ink-2">{state.message}</p>
      </div>
    );
  }

  const values = state && !state.ok ? (state.fields ?? {}) : {};

  return (
    <form action={action} className="relative flex flex-col gap-5 rounded-3xl border border-rule bg-card p-6 md:p-10">
      {/* Honeypot: people never see or fill this in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="ct-hp">Leave this empty</label>
        <input id="ct-hp" name="company_site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ct-name">Your name</Label>
          <Input id="ct-name" name="name" required autoComplete="name" defaultValue={values.name} className="bg-paper" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ct-email">Email</Label>
          <Input id="ct-email" name="email" type="email" required autoComplete="email" defaultValue={values.email} className="bg-paper" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ct-topic">What is it about?</Label>
        <select
          id="ct-topic"
          name="topic"
          required
          defaultValue={values.topic || (defaultTopic && topics.includes(defaultTopic) ? defaultTopic : "")}
          className={`${controlClass} h-11`}
        >
          <option value="" disabled>
            Choose a topic
          </option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ct-message">Your message</Label>
        <textarea
          id="ct-message"
          name="message"
          required
          rows={6}
          defaultValue={values.message}
          className={`${controlClass} py-3`}
          placeholder="Tell us how we can help, and include anything that will help us answer in one reply."
        />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">A real person reads every message and replies by email.</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
          {!pending && <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}
