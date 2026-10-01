"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Answer = { label: string; score: { cosmetic?: number; clinical?: number; medical?: number }; urgent?: boolean };

const QUESTIONS: { q: string; help: string; options: Answer[] }[] = [
  {
    q: "What's happening?",
    help: "Choose the one that sounds most like you.",
    options: [
      { label: "My scalp feels dry, oily, itchy or tight", score: { cosmetic: 2, clinical: 1 } },
      { label: "I'm shedding more hair than usual", score: { clinical: 2, medical: 1 } },
      { label: "My hair is gradually getting thinner", score: { clinical: 2, medical: 1 } },
      { label: "I've noticed a bald patch appear", score: { medical: 2, clinical: 1 }, urgent: true },
      { label: "I'd like a relaxing treatment and healthier-feeling hair", score: { cosmetic: 3 } },
    ],
  },
  {
    q: "How long has it been going on?",
    help: "A rough idea is fine.",
    options: [
      { label: "Less than a month", score: { cosmetic: 1 } },
      { label: "One to six months", score: { clinical: 1 } },
      { label: "More than six months", score: { clinical: 1, medical: 1 } },
      { label: "It's not a problem, I just want to look after my scalp", score: { cosmetic: 2 } },
    ],
  },
  {
    q: "Do any of these apply?",
    help: "These are signs that a doctor should see you first.",
    options: [
      { label: "Pain, burning, redness, sores or pus on the scalp", score: { medical: 4 }, urgent: true },
      { label: "Hair loss from eyebrows, lashes or body too", score: { medical: 4 }, urgent: true },
      { label: "Feeling unwell, tired, or losing weight without trying", score: { medical: 4 }, urgent: true },
      { label: "It's for a child", score: { medical: 4 }, urgent: true },
      { label: "None of these", score: {} },
    ],
  },
];

const RESULTS = {
  cosmetic: {
    title: "A head spa or cosmetic scalp specialist is a good place to start.",
    body: "For scalp comfort, care and relaxation, a cosmetic practitioner can help, and will refer you on if they notice anything that needs a closer look.",
    href: "/directory?discipline=cosmetic",
    cta: "See cosmetic professionals",
  },
  clinical: {
    title: "A trichologist is likely the right next step.",
    body: "Trichologists take a detailed history, look closely at your hair and scalp, and work with your GP if blood tests or treatment are needed.",
    href: "/directory?discipline=clinical",
    cta: "See trichologists",
  },
  medical: {
    title: "Please see a doctor first.",
    body: "What you've described is best checked by your GP, who can refer you to a dermatologist if needed. Once a doctor has seen you, a trichologist or cosmetic specialist can support your care.",
    href: "/directory?discipline=medical",
    cta: "See medical professionals",
  },
} as const;

export function FindFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const done = step >= QUESTIONS.length;
  const pick = (a: Answer) => {
    setAnswers((prev) => [...prev.slice(0, step), a]);
    setStep((s) => s + 1);
  };

  if (done) {
    const totals = { cosmetic: 0, clinical: 0, medical: 0 };
    for (const a of answers) for (const [k, v] of Object.entries(a.score)) totals[k as keyof typeof totals] += v ?? 0;
    const urgent = answers.some((a) => a.urgent);
    const key = urgent ? "medical" : (Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof RESULTS);
    const r = RESULTS[key];
    return (
      <div className="flex flex-col gap-8 animate-rise" aria-live="polite">
        <p className="label text-muted-foreground">Our suggestion</p>
        <h2 className="display text-4xl md:text-5xl">{r.title}</h2>
        <p className="lede">{r.body}</p>
        {urgent && (
          <p className="flex gap-3 rounded-2xl border border-rule bg-card p-5 text-[15px] text-ink-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            If your symptoms are severe or getting worse quickly, contact your GP today or use an out-of-hours service.
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href={r.href}>{r.cta} <ArrowRight /></Link></Button>
          <Button size="lg" variant="outline" onClick={() => { setStep(0); setAnswers([]); }}>Start again</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          This is signposting, not a diagnosis. Only a professional who sees you in person can tell you what&apos;s going on.
        </p>
      </div>
    );
  }

  const current = QUESTIONS[step];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3" aria-hidden>
        {QUESTIONS.map((_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-ink" : "bg-rule")} />
        ))}
      </div>
      <div key={step} className="flex flex-col gap-6 animate-rise">
        <div>
          <p className="label text-muted-foreground">Question {step + 1} of {QUESTIONS.length}</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">{current.q}</h2>
          <p className="mt-3 text-ink-2">{current.help}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {current.options.map((o) => (
            <li key={o.label}>
              <button
                type="button"
                onClick={() => pick(o)}
                className={cn(
                  "group flex w-full items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 text-left text-[16px] transition-colors hover:border-ink",
                  answers[step]?.label === o.label ? "border-ink" : "border-rule"
                )}
              >
                {o.label}
                <ArrowRight className="h-4 w-4 shrink-0 opacity-30 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-2 self-start text-sm text-ink-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
      </div>
    </div>
  );
}
