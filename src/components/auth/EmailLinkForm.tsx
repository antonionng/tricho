"use client";

import { useActionState, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROFESSIONS } from "@/config/rooms";
import { HEARD_FROM } from "@/config/signup";

const SIGNUP_FIELDS = [
  "name",
  "phone",
  "profession",
  "practiceName",
  "city",
  "country",
  "heardFrom",
] as const;
type SignupFields = Record<(typeof SIGNUP_FIELDS)[number], string>;

/** The consumer sign-up asks for less: an optional first name and the unticked marketing opt-in. */
const CONSUMER_FIELDS = ["firstName", "marketing"] as const;
type ConsumerFields = Record<(typeof CONSUMER_FIELDS)[number], string>;

const selectClass =
  "h-12 w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

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
  mode: "signin" | "signup" | "consumer";
}) {
  const [state, formAction, pending] = useActionState(action, {
    sent: null,
    error: null,
  });
  // The result the visitor chose to move past with "Use a different email".
  const [dismissed, setDismissed] = useState<EmailLinkState | null>(null);
  const [email, setEmail] = useState(defaultEmail ?? "");
  // Kept so "Send the link again" sends the same sign-up details.
  const [fields, setFields] = useState<SignupFields>(
    () => Object.fromEntries(SIGNUP_FIELDS.map((f) => [f, ""])) as SignupFields,
  );
  const bind = (f: keyof SignupFields) => ({
    name: f,
    value: fields[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFields((v) => ({ ...v, [f]: e.target.value })),
  });
  const [consumer, setConsumer] = useState<ConsumerFields>({ firstName: "", marketing: "" });
  const sent = state.sent && state !== dismissed ? state.sent : null;

  if (sent) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <MailCheck className="h-7 w-7 stroke-[1.5]" aria-hidden />
        <p className="text-lg font-semibold leading-snug text-ink">
          We have sent a sign-in link to{" "}
          <span className="break-all">{sent}</span>. Open your email app and tap
          the button, or type the 6-digit code.
        </p>
        <p className="text-[15px] leading-relaxed text-ink-2">
          The button and the code both work once and expire after 24 hours. If
          the email has not arrived within a couple of minutes, please check
          your spam or junk folder. On an iPhone, type the code if the button
          does not open your account.
        </p>
        <form
          action={formAction}
          className="flex flex-col gap-3 pt-1 sm:flex-row"
        >
          <input type="hidden" name="email" value={sent} />
          {mode === "signup" &&
            SIGNUP_FIELDS.map((f) => (
              <input key={f} type="hidden" name={f} value={fields[f]} />
            ))}
          {mode === "consumer" &&
            CONSUMER_FIELDS.map((f) =>
              consumer[f] ? <input key={f} type="hidden" name={f} value={consumer[f]} /> : null,
            )}
          <Button
            type="submit"
            variant="outline"
            size="lg"
            disabled={pending}
            aria-busy={pending}
            className="w-full sm:w-auto"
          >
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

  const emailField = (
    <>
      <Label htmlFor="email">Email address</Label>
      <Input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder={mode === "consumer" ? "you@example.com" : "you@practice.com"}
        className="h-12 text-base"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </>
  );

  return (
    <form action={formAction} className="space-y-3">
      {mode === "signup" && (
        <>
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            placeholder="First name and surname"
            className="h-12 text-base"
            {...bind("name")}
          />
          {emailField}
          <Label htmlFor="signup-profession">Your work</Label>
          <select
            id="signup-profession"
            required
            className={selectClass}
            {...bind("profession")}
          >
            <option value="" disabled>
              Choose the closest
            </option>
            {PROFESSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}: {p.blurb}
              </option>
            ))}
          </select>
          <Label htmlFor="signup-practice">
            Clinic, salon or business name
          </Label>
          <Input
            id="signup-practice"
            type="text"
            autoComplete="organization"
            placeholder="Leave empty if you don't have one"
            className="h-12 text-base"
            {...bind("practiceName")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="signup-city">Town or city</Label>
              <Input
                id="signup-city"
                type="text"
                required
                autoComplete="address-level2"
                className="h-12 text-base"
                {...bind("city")}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="signup-country">Country</Label>
              <Input
                id="signup-country"
                type="text"
                required
                autoComplete="country-name"
                className="h-12 text-base"
                {...bind("country")}
              />
            </div>
          </div>
          <Label htmlFor="signup-phone">Mobile number</Label>
          <Input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={40}
            placeholder="+44 7700 900123"
            className="h-12 text-base"
            {...bind("phone")}
          />
          <p className="text-xs text-muted-foreground">
            Your number is optional, and it lets us welcome you personally. It
            stays private.
          </p>
          <Label htmlFor="signup-heard">
            How did you hear about Trichollective?
          </Label>
          <select
            id="signup-heard"
            className={selectClass}
            {...bind("heardFrom")}
          >
            <option value="">Choose one, if you like</option>
            {HEARD_FROM.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </>
      )}
      {mode === "consumer" && (
        <>
          <Label htmlFor="signup-first-name">First name (optional)</Label>
          <Input
            id="signup-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            maxLength={40}
            className="h-12 text-base"
            value={consumer.firstName}
            onChange={(e) =>
              setConsumer((v) => ({ ...v, firstName: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            We use it to greet you. Other people see a random alias instead
            unless you choose otherwise.
          </p>
          {emailField}
          <label className="flex items-start gap-3 pt-1 text-sm text-ink-2">
            <input
              type="checkbox"
              name="marketing"
              className="mt-0.5"
              checked={consumer.marketing === "on"}
              onChange={(e) =>
                setConsumer((v) => ({
                  ...v,
                  marketing: e.target.checked ? "on" : "",
                }))
              }
            />
            <span>
              Send me occasional news, new guides and articles from
              Trichollective. You can stop them at any time.
            </span>
          </label>
        </>
      )}
      {mode === "signin" && emailField}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        aria-busy={pending}
        className="h-12 w-full text-base"
      >
        {pending
          ? "Sending your link…"
          : mode !== "signin"
            ? "Email me a link to create my account"
            : "Email me a sign-in link"}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        No password to remember. We send a one-time link and a short code to
        your inbox.
      </p>
    </form>
  );
}
