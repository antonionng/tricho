"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptPartnerOffer, type AcceptState } from "./actions";

const controlClass =
  "w-full min-w-0 rounded-xl border border-input bg-paper px-3.5 text-base outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

type Defaults = { legalName: string; companyNumber: string; address: string; email: string; contactName: string };

/** The brand signs for the business: their details, a typed signature and two confirmations. */
export function AcceptForm({ token, defaults, disabled = false }: { token: string; defaults: Defaults; disabled?: boolean }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptPartnerOffer.bind(null, token), null);
  const v = state?.fields ?? {};
  const [signature, setSignature] = useState(v.signature ?? "");
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset disabled={disabled} className="contents">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ac-name">Your full name</Label>
            <Input id="ac-name" name="signerName" required autoComplete="name" defaultValue={v.signerName ?? defaults.contactName} className="bg-paper" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ac-role">Your job title</Label>
            <Input id="ac-role" name="signerRole" required autoComplete="organization-title" placeholder="For example, Managing Director" defaultValue={v.signerRole} className="bg-paper" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ac-legal">Registered company name</Label>
            <Input id="ac-legal" name="legalName" required autoComplete="organization" defaultValue={v.legalName ?? defaults.legalName} className="bg-paper" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ac-number">
              Company number <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="ac-number" name="companyNumber" defaultValue={v.companyNumber ?? defaults.companyNumber} className="bg-paper" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ac-address">Registered office address</Label>
          <textarea id="ac-address" name="address" required rows={3} autoComplete="street-address" defaultValue={v.address ?? defaults.address} className={`${controlClass} py-3`} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ac-email">The email address you will sign in with</Label>
          <Input id="ac-email" name="accountEmail" type="email" required autoComplete="email" defaultValue={v.accountEmail ?? defaults.email} className="bg-paper" />
          <p className="text-sm text-muted-foreground">
            Your partner page, team seats, invoices and reports are all managed from this account.
          </p>
        </div>

        {/* The signature line: typed, and shown as it will appear on the agreement. */}
        <div className="flex flex-col gap-3 rounded-2xl border border-rule bg-paper p-5">
          <Label htmlFor="ac-signature" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" aria-hidden /> Type your full name to sign
          </Label>
          <Input
            id="ac-signature"
            name="signature"
            required
            autoComplete="off"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="bg-card"
          />
          <div className="flex min-h-20 flex-col justify-end border-b border-ink/40 pb-1" aria-hidden>
            <span className="mag-didone truncate text-4xl italic leading-tight text-[var(--c-strong)] sm:text-5xl">{signature || " "}</span>
          </div>
          <p className="text-xs text-muted-foreground">Signed electronically on {today}. Your typed name is your signature on this agreement.</p>
        </div>

        <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-2">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" />
            <span>
              I agree to this offer, the{" "}
              <Link href="/terms/partners" target="_blank" className="text-ink underline underline-offset-4">
                Premium partner terms
              </Link>{" "}
              and the{" "}
              <Link href="/terms" target="_blank" className="text-ink underline underline-offset-4">
                terms of business
              </Link>{" "}
              on behalf of the company named above.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="authorised" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" />
            <span>I confirm that I am authorised to sign this agreement for the company.</span>
          </label>
        </div>

        {state?.error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          size="xl"
          disabled={pending || disabled}
          className="h-14 w-full bg-[var(--c-accent)] text-base text-[var(--c-on)] hover:bg-[var(--c-accent)]/90 sm:w-auto sm:self-start"
        >
          {pending ? "Signing and preparing your copy" : "Sign the agreement"} <ArrowRight />
        </Button>
      </fieldset>
    </form>
  );
}
