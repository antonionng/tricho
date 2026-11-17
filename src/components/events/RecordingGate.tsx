"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Visitor = { signedIn: boolean; member: boolean };

/**
 * The recording of a past event, on the public site. The page is cached for
 * everyone and never carries the video link, so this asks who is visiting:
 * members get a button through to the player in the members' area, and
 * everyone else sees why membership is the way to watch it.
 */
export function RecordingGate({ slug, title }: { slug: string; title: string }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/events/visitor", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Visitor | null) => live && v && setVisitor(v))
      .catch(() => null);
    return () => {
      live = false;
    };
  }, []);

  const watch = `/members/events/${slug}`;
  const signIn = `/login?next=${encodeURIComponent(watch)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink text-paper lg:col-span-7">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          {visitor?.member ? (
            <Link href={watch} className="flex flex-col items-center gap-3">
              <PlayCircle className="h-14 w-14 stroke-[1.25]" aria-hidden />
              <span className="text-lg font-medium">Watch the recording</span>
            </Link>
          ) : (
            <>
              <Lock className="h-10 w-10 stroke-[1.25] opacity-80" aria-hidden />
              <span className="text-lg font-medium">Members watch this recording on Trichollective TV.</span>
              <span className="text-sm text-paper/70">{title}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4 lg:col-span-5">
        {visitor?.member ? (
          <>
            <p className="text-ink-2 leading-relaxed">
              This recording is part of your membership. It plays on the event page in the members&apos; area, with every other recording under Watch again.
            </p>
            <Button asChild size="lg" className="self-start">
              <Link href={watch}>
                Watch the recording <ArrowRight />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-ink-2 leading-relaxed">
              Every month members meet online for a live masterclass and a case round, and the recordings stay on the platform afterwards.
              Membership is what lets you watch this one, and every one that follows, whenever you have the time.
            </p>
            <Button asChild size="lg" className="self-start">
              <Link href="/pricing">
                Become a member to watch <ArrowRight />
              </Link>
            </Button>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {visitor?.signedIn ? (
                <>
                  You are signed in with a free account, and recordings are part of membership. Already a member?{" "}
                  <Link href={signIn} className="underline underline-offset-4">
                    Sign in with the email you joined with
                  </Link>
                  .
                </>
              ) : (
                <>
                  Already a member?{" "}
                  <Link href={signIn} className="underline underline-offset-4">
                    Sign in
                  </Link>{" "}
                  to watch.
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
