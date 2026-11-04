"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, Check, RotateCcw, Search, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchesSearch, type CheckInPerson, type CheckInResult } from "@/lib/checkin-list";
import { checkInAction, undoCheckInAction } from "@/app/studio/events/[id]/checkin/actions";

/** The browser's barcode reader, where there is one (Chrome on Android, Safari 17+ on iPhone). */
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorClass = new (opts: { formats: string[] }) => Detector;

const REFRESH_MS = 30_000;
/** The same QR code is not read twice in this window, so holding a phone over it checks in once. */
const SAME_CODE_MS = 4_000;

/**
 * Check-in at the door, made for a phone held in one hand. Scan QR codes with
 * the camera, or search the preloaded list by name when the camera cannot read
 * a code. The list refreshes every 30 seconds so several phones stay in step.
 */
export function CheckInDesk({ eventId, people: initial, timeZone }: { eventId: string; people: CheckInPerson[]; timeZone: string }) {
  const router = useRouter();
  const [people, setPeople] = useState(initial);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const last = useRef<{ raw: string; at: number }>({ raw: "", at: 0 });
  const working = useRef(false);

  useEffect(() => setPeople(initial), [initial]);
  useEffect(() => setCanScan(typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia), []);
  useEffect(() => {
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  const time = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
    [timeZone]
  );
  const hhmm = (iso: string) => time.format(new Date(iso));

  const remember = (p: CheckInPerson) => setPeople((list) => list.map((x) => (x.id === p.id ? p : x)));

  const run = useCallback(async (input: { scan?: string; id?: string }) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setProblem(null);
    try {
      const r = await checkInAction({ eventId, ...input });
      setResult(r);
      if (r.status === "checked_in" || r.status === "already") remember(r.person);
      if (r.status === "checked_in") navigator.vibrate?.(80);
      else navigator.vibrate?.([60, 60, 60]);
    } catch {
      setProblem("That could not reach the server. Check the signal and try again, or tick them off the printed list.");
    } finally {
      working.current = false;
      setBusy(false);
    }
  }, [eventId]);

  async function undo(p: CheckInPerson) {
    setBusy(true);
    setProblem(null);
    try {
      const r = await undoCheckInAction({ eventId, id: p.id });
      if (r.ok) {
        remember({ ...p, checkedInAt: null });
        setResult(null);
      }
    } catch {
      setProblem("The check-in could not be undone. Check the signal and try again.");
    } finally {
      setBusy(false);
    }
  }

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setScanning(false);
  }, []);

  async function start() {
    setProblem(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = media;
      setScanning(true);
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
    } catch {
      setProblem("The camera could not be opened. Allow camera access for this site, or search by name below.");
      stop();
    }
  }

  // Read the camera a few times a second while scanning.
  useEffect(() => {
    if (!scanning) return;
    const Ctor = (window as unknown as { BarcodeDetector: DetectorClass }).BarcodeDetector;
    const detector = new Ctor({ formats: ["qr_code"] });
    let live = true;
    const tick = async () => {
      if (!live) return;
      const v = video.current;
      if (v && v.readyState >= 2 && !working.current) {
        try {
          const [code] = await detector.detect(v);
          const now = Date.now();
          if (code?.rawValue && !(code.rawValue === last.current.raw && now - last.current.at < SAME_CODE_MS)) {
            last.current = { raw: code.rawValue, at: now };
            await run({ scan: code.rawValue });
          }
        } catch {
          // A frame that cannot be read is skipped.
        }
      }
      if (live) setTimeout(tick, 250);
    };
    tick();
    return () => {
      live = false;
    };
  }, [scanning, run]);

  useEffect(() => stop, [stop]);

  const inCount = people.filter((p) => p.checkedInAt).length;
  const shown = people.filter((p) => matchesSearch(p, query)).slice(0, 60);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-2" aria-live="polite">
          <span className="text-2xl font-semibold text-ink tabular-nums">{inCount}</span> of {people.length} checked in
        </p>
        {canScan &&
          (scanning ? (
            <Button variant="outline" onClick={stop}>
              <CameraOff /> Stop camera
            </Button>
          ) : (
            <Button onClick={start}>
              <Camera /> Scan tickets
            </Button>
          ))}
      </div>

      <div className={cn("overflow-hidden rounded-2xl bg-ink", !scanning && "hidden")}>
        <video ref={video} muted playsInline className="aspect-square w-full object-cover" />
      </div>
      {!canScan && (
        <p className="text-sm text-muted-foreground">
          This browser cannot read QR codes, so search by name or type the code under the QR code instead.
        </p>
      )}

      {problem && (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-ink">
          {problem}
        </p>
      )}
      {result && <Outcome result={result} hhmm={hhmm} onUndo={undo} onClose={() => setResult(null)} busy={busy} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // A typed ticket code checks in directly; anything else just filters the list.
          if (/^[A-Za-z0-9]{16}$/.test(query.trim())) {
            run({ scan: query.trim() });
            setQuery("");
          }
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or ticket code"
          aria-label="Search attendees"
          className="h-12 pl-9 text-base"
          autoComplete="off"
          autoCapitalize="off"
        />
      </form>

      <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
        {shown.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nobody on the list matches that.</li>}
        {shown.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{[p.ticketType, p.email].filter(Boolean).join(" · ")}</p>
              <Needs person={p} compact />
            </div>
            {p.checkedInAt ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm text-positive">
                  <Check className="h-4 w-4" aria-hidden /> {hhmm(p.checkedInAt)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => undo(p)} disabled={busy} aria-label={`Undo check-in for ${p.name}`}>
                  <RotateCcw />
                </Button>
              </div>
            ) : (
              <Button size="sm" className="shrink-0" onClick={() => run({ id: p.id })} disabled={busy}>
                Check in
              </Button>
            )}
          </li>
        ))}
      </ul>
      {people.filter((p) => matchesSearch(p, query)).length > shown.length && (
        <p className="text-center text-sm text-muted-foreground">Type more of the name to see everyone else.</p>
      )}
    </div>
  );
}

function Needs({ person, compact = false }: { person: CheckInPerson; compact?: boolean }) {
  if (!person.dietary && !person.accessNeeds) return null;
  return (
    <p className={cn("text-ink", compact ? "mt-0.5 text-xs" : "text-base")}>
      {person.dietary && <span className="mr-2 inline-block rounded-full bg-paper-2 px-2 py-0.5">Dietary: {person.dietary}</span>}
      {person.accessNeeds && <span className="inline-block rounded-full bg-paper-2 px-2 py-0.5">Access: {person.accessNeeds}</span>}
    </p>
  );
}

function Outcome({
  result,
  hhmm,
  onUndo,
  onClose,
  busy,
}: {
  result: CheckInResult;
  hhmm: (iso: string) => string;
  onUndo: (p: CheckInPerson) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const tone =
    result.status === "checked_in" ? "border-positive/40 bg-positive/10" : result.status === "already" ? "border-amber-500/50 bg-amber-100/60" : "border-destructive/40 bg-destructive/10";
  const person = "person" in result ? result.person : null;
  const heading = {
    checked_in: "Checked in.",
    already: result.status === "already" ? `Already checked in at ${hhmm(result.at)}.` : "",
    cancelled: "This ticket has been cancelled.",
    unpaid: "This ticket has not been paid for.",
    other_event: result.status === "other_event" ? `This ticket is for ${result.eventTitle}.` : "",
    not_found: "That is not a ticket we recognise.",
  }[result.status];
  return (
    <div role="status" className={cn("relative flex flex-col gap-2 rounded-2xl border p-4", tone)}>
      <button type="button" onClick={onClose} className="absolute right-3 top-3 text-ink-2" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
      <p className="flex items-center gap-2 text-lg font-semibold text-ink">
        {result.status === "checked_in" ? <Check className="h-5 w-5" aria-hidden /> : <TriangleAlert className="h-5 w-5" aria-hidden />}
        {heading}
      </p>
      {person && (
        <>
          <p className="text-2xl font-semibold text-ink">{person.name}</p>
          {person.ticketType && <p className="text-sm text-ink-2">{person.ticketType}</p>}
          <Needs person={person} />
        </>
      )}
      {person && (result.status === "checked_in" || result.status === "already") && (
        <div>
          <Button size="sm" variant="outline" onClick={() => onUndo(person)} disabled={busy}>
            <RotateCcw /> Undo check-in
          </Button>
        </div>
      )}
    </div>
  );
}
