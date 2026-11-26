"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy, Gift, Lock, Mail, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ClaimReveal, PublicDoor } from "@/lib/advent";
import { gazetteFonts } from "@/components/gazette/fonts";

const STORAGE_KEY = "tc-12days-2026-opened";
const SWING_MS = 1050;

function readOpened(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function saveOpened(days: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch {
    // Private windows and blocked storage: the doors simply close again next visit.
  }
}

/** Gold sparks thrown out from the middle of whatever they sit in. */
function Sparks({ count = 18, spread = 150 }: { count?: number; spread?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      <span className="advent-flare" />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.25 : -0.1);
        const dist = spread * (0.55 + ((i * 37) % 50) / 100);
        const style = {
          "--dx": `${Math.cos(angle) * dist}px`,
          "--dy": `${Math.sin(angle) * dist - 20}px`,
          "--s": `${4 + ((i * 13) % 5)}px`,
          "--t": `${0.9 + ((i * 7) % 6) / 10}s`,
          "--d": `${0.18 + ((i * 11) % 8) / 40}s`,
          borderRadius: i % 3 === 0 ? "999px" : "1px",
          background: i % 4 === 0 ? "#ffffff" : undefined,
        } as CSSProperties;
        return <span key={i} className="advent-spark" style={style} />;
      })}
    </span>
  );
}

export function AdventCalendar({
  doors,
  signedIn,
  initialDoor,
  source,
  basePath,
}: {
  doors: PublicDoor[];
  signedIn: boolean;
  /** A door to open straight away, from an email or social link (?door=4). */
  initialDoor?: number | null;
  /** Where the visitor came from, recorded with a claim. */
  source?: string | null;
  /** The page the calendar is on, so signing in brings the reader back to the same door. */
  basePath: string;
}) {
  const [opened, setOpened] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [swinging, setSwinging] = useState<number | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [active, setActive] = useState<PublicDoor | null>(null);
  const [reveals, setReveals] = useState<Record<number, ClaimReveal>>({});
  const autoOpened = useRef(false);

  const today = Math.max(0, ...doors.filter((d) => d.open).map((d) => d.day));
  const openedCount = doors.filter((d) => d.open && opened.includes(d.day)).length;

  const open = useCallback(
    (d: PublicDoor, already: number[]) => {
      if (!d.open) {
        setShaking(d.day);
        window.setTimeout(() => setShaking(null), 500);
        return;
      }
      if (already.includes(d.day)) {
        setActive(d);
        return;
      }
      setSwinging(d.day);
      const next = [...already, d.day];
      setOpened(next);
      saveOpened(next);
      fetch("/api/advent/track", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ door: d.day }) }).catch(
        () => undefined
      );
      // Let the door swing and the light spill out before the gift opens.
      window.setTimeout(() => {
        setSwinging(null);
        setActive(d);
      }, SWING_MS);
    },
    []
  );

  useEffect(() => {
    // After the first paint, so doors opened on an earlier visit swing open as the page arrives.
    const id = window.setTimeout(() => {
      const stored = readOpened();
      setOpened(stored);
      setReady(true);
      if (initialDoor && !autoOpened.current) {
        autoOpened.current = true;
        const d = doors.find((x) => x.day === initialDoor && x.open);
        if (d) {
          document.getElementById(`door-${d.day}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
          window.setTimeout(() => open(d, stored), 700);
        }
      }
    }, 150);
    return () => window.clearTimeout(id);
  }, [doors, initialDoor, open]);

  return (
    <>
      <div className="mag-caps mb-6 flex items-center justify-between gap-4 text-[9px] text-paper/60">
        <p aria-live="polite">
          {today === 0
            ? "The doors are still closed."
            : `You have opened ${openedCount} of the ${today} ${today === 1 ? "door" : "doors"} open so far.`}
        </p>
        <div className="hidden gap-1.5 sm:flex" aria-hidden>
          {doors.map((d) => (
            <span
              key={d.day}
              className={cn(
                "h-1.5 w-5 rounded-full transition-colors duration-500",
                d.open && opened.includes(d.day) ? "bg-paper" : d.open ? "bg-paper/40" : "bg-paper/12"
              )}
            />
          ))}
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {doors.map((d) => {
          const isOpened = ready && d.open && opened.includes(d.day);
          const state = !d.open ? "locked" : swinging === d.day ? "opening" : isOpened ? "opened" : "ready";
          const isToday = d.open && d.day === today && state === "ready";
          const accent = d.door?.brand?.accent;
          return (
            <li key={d.day} id={`door-${d.day}`} className={cn("advent-tile scroll-mt-28", isToday && "advent-today")} data-state={state} data-shake={shaking === d.day ? "1" : undefined}>
              <button
                type="button"
                onClick={() => open(d, opened)}
                aria-disabled={!d.open}
                aria-label={
                  d.open
                    ? `Day ${d.day}, ${d.dateLabel}: ${isOpened ? `${d.door?.headline}, open again` : "open this door"}`
                    : `Day ${d.day} opens on ${d.dateLabel}`
                }
                className={cn("advent-frame", d.open ? "cursor-pointer" : "cursor-not-allowed")}
              >
                {/* Behind the door. */}
                <span className="advent-inside" style={accent ? { backgroundColor: accent } : undefined} aria-hidden>
                  {d.door && (
                    <span className="advent-inside-content flex flex-col justify-between p-4 sm:p-5">
                      <span className="flex items-start justify-between gap-2">
                        <span className="mag-caps text-[9px] text-paper/70">Day {d.day}</span>
                        {d.door.brand?.logoUrl ? (
                          <span className={cn("grid h-9 max-w-[62%] place-items-center rounded-lg px-2.5 shadow-lg", d.door.brand.logoOn === "dark" ? "bg-ink ring-1 ring-paper/15" : "bg-paper")}>
                            {/* Brand logos come from anywhere, so a plain img rather than next/image. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={d.door.brand.logoUrl} alt="" className="max-h-6 max-w-full object-contain" loading="lazy" />
                          </span>
                        ) : (
                          <Gift className="h-5 w-5 stroke-[1.4] text-paper" />
                        )}
                      </span>
                      <span className="flex flex-col gap-1.5">
                        <span className="mag-didone text-[30px] italic leading-[1] text-paper sm:text-[36px]">{d.door.headline}</span>
                        <span className="line-clamp-2 text-[13px] leading-snug text-paper/75">{d.door.brand?.name ?? "From Trichollective"}</span>
                        <span className="mag-caps mt-1 inline-flex items-center gap-1 text-[9px] text-paper">
                          {d.door.claimable ? "See your gift" : "Open again"} <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </span>
                  )}
                </span>

                {swinging === d.day && <Sparks />}

                {/* The door, hinged on the left. */}
                <span className="advent-door" aria-hidden>
                  <span className="advent-door-face advent-door-front flex flex-col justify-between p-5 sm:p-6">
                    <span className="relative flex items-center justify-between">
                      <span className="mag-caps text-[9px] opacity-70">{d.dateLabel}</span>
                      {!d.open ? <Lock className="h-4 w-4 stroke-[1.4]" /> : isToday ? <Sparkles className="h-4 w-4 stroke-[1.4]" /> : null}
                    </span>
                    <span className="mag-didone relative text-[92px] italic leading-none sm:text-[118px]">{d.day}</span>
                    <span className="mag-caps relative text-[9px] opacity-70">
                      {d.open ? (isToday ? "Today's door, tap to open" : "Tap to open") : "Opens at midnight"}
                    </span>
                    <span className="advent-knob" />
                  </span>
                  <span className="advent-door-face advent-door-back" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        {active?.door && (
          <GiftDialog
            key={active.day}
            d={active}
            signedIn={signedIn}
            source={source ?? null}
            basePath={basePath}
            reveal={reveals[active.day] ?? active.door.claimed}
            onReveal={(r) => setReveals((prev) => ({ ...prev, [active.day]: r }))}
          />
        )}
      </Dialog>
    </>
  );
}

function GiftDialog({
  d,
  signedIn,
  source,
  basePath,
  reveal,
  onReveal,
}: {
  d: PublicDoor;
  signedIn: boolean;
  source: string | null;
  basePath: string;
  reveal: ClaimReveal | null;
  onReveal: (r: ClaimReveal) => void;
}) {
  const door = d.door!;
  const accent = door.brand?.accent ?? "#1b1916";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState(false);
  const back = `${basePath}?door=${d.day}`;

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/advent/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door: d.day, source }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ClaimReveal & { first?: boolean };
      setJustClaimed(true);
      onReveal({ code: data.code, redeem: data.redeem });
    } catch {
      setError("We couldn't claim your gift just now. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const stagger = (i: number): CSSProperties => ({ animationDelay: `${0.12 + i * 0.09}s` });

  return (
    <DialogContent className={cn(gazetteFonts, "max-h-[92dvh] gap-0 overflow-y-auto rounded-none border border-black bg-[#fbfaf7] p-0 sm:max-w-lg")}>
      <div className="advent-scene relative flex flex-col gap-5 overflow-hidden p-6 sm:p-8" style={{ background: `radial-gradient(90% 90% at 50% 0%, rgba(255,255,255,0.2), transparent 70%), ${accent}` }}>
        <Sparks count={22} spread={230} />
        <div className="advent-rise relative flex items-center justify-between gap-3 pr-8" style={stagger(0)}>
          <p className="mag-caps text-[9px] text-paper/75">
            Day {d.day} · {d.dateLabel}
          </p>
          {door.brand?.logoUrl && (
            <span className={cn("grid h-11 place-items-center rounded-xl px-3.5 shadow-lg", door.brand.logoOn === "dark" ? "bg-ink ring-1 ring-paper/15" : "bg-paper")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={door.brand.logoUrl} alt={`${door.brand.name} logo`} className="max-h-7 max-w-[150px] object-contain" />
            </span>
          )}
        </div>
        <p className="advent-rise mag-didone relative text-[54px] italic leading-[0.95] text-paper sm:text-[68px]" style={stagger(1)}>
          {door.headline}
        </p>
        <p className="advent-rise mag-caps relative text-[9px] text-paper/75" style={stagger(2)}>
          {door.kind === "brand" ? `A gift from ${door.brand?.name}` : door.kind === "charity" ? `A cause we support: ${door.brand?.name}` : "A gift from Trichollective"}
        </p>
      </div>

      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <DialogTitle className="advent-rise mag-didone text-[26px] font-medium leading-[1.12]" style={stagger(3)}>
          {door.title}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="advent-rise mag-serif space-y-3 whitespace-pre-line text-[16px] leading-[1.6] text-black/80" style={stagger(4)}>
            {door.body}
          </div>
        </DialogDescription>

        {door.claimable && (
          <div className="advent-rise relative border border-black bg-white p-4 sm:p-5" style={stagger(5)}>
            {reveal ? (
              <div className="relative flex flex-col gap-3">
                {justClaimed && <Sparks count={16} spread={170} />}
                <p className="mag-caps text-[9px] text-black/60">{reveal.code ? "Your code" : "Your gift is claimed"}</p>
                {reveal.code && <CodeChip code={reveal.code} />}
                {reveal.redeem && <p className="text-[14px] leading-relaxed text-ink-2">{reveal.redeem}</p>}
                <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" aria-hidden /> We have emailed you a copy to keep.
                </p>
              </div>
            ) : signedIn ? (
              <div className="flex flex-col gap-3">
                <p className="mag-caps text-[9px] text-black/60">Step 2 of 2</p>
                <p className="text-[14px] leading-relaxed text-ink-2">Press Claim to see {door.brand?.name}&rsquo;s gift, and we will email you a copy to keep.</p>
                <button
                  type="button"
                  onClick={claim}
                  disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium text-paper transition-transform hover:scale-[1.01] disabled:opacity-60"
                >
                  <Gift className="h-4 w-4" aria-hidden /> {busy ? "Unwrapping your gift…" : "Claim this gift"}
                </button>
                {error && (
                  <p role="alert" className="text-[13px] text-destructive">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="mag-caps text-[9px] text-black/60">Claim your gift</p>
                <p className="text-[14px] leading-relaxed text-ink-2">
                  Gifts are free for everyone in the Trichollective community. Create a free account or sign in, and you will come straight back to this door to claim it.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link href={`/signup?next=${encodeURIComponent(back)}`} className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-paper">
                    Create a free account
                  </Link>
                  <Link href={`/login?next=${encodeURIComponent(back)}`} className="inline-flex h-11 items-center text-sm underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {door.terms && (
          <p className="advent-rise text-[13px] leading-relaxed text-muted-foreground" style={stagger(6)}>
            {door.terms}
          </p>
        )}

        <div className="advent-rise flex flex-wrap items-center gap-x-5 gap-y-3 pt-1" style={stagger(7)}>
          <a
            href={door.cta.href}
            target={door.cta.external ? "_blank" : undefined}
            rel={door.cta.external ? (door.kind === "brand" ? "noopener nofollow sponsored" : "noopener") : undefined}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-medium",
              door.claimable && !reveal ? "border border-ink/20 text-ink hover:border-ink" : "bg-ink text-paper"
            )}
          >
            {door.cta.label} {door.cta.external && <ArrowUpRight className="h-4 w-4" aria-hidden />}
          </a>
          {door.kind === "brand" && <span className="text-sm text-muted-foreground">Partner offer</span>}
        </div>
      </div>
    </DialogContent>
  );
}

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked: the code is still on screen to copy by hand.
        }
      }}
      className="flex w-full items-center justify-between gap-3 bg-ink px-4 py-3.5 font-mono text-xl tracking-[0.12em] text-paper"
    >
      <span className="select-all">{code}</span>
      <span className="inline-flex items-center gap-1.5 font-sans text-[13px] tracking-normal text-paper/75">
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
