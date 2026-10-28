"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Visitor = { signedIn: boolean; member: boolean };

/**
 * On a public event page, members who are signed in get "Save your place",
 * which takes them to the event in the members' area. Everyone else sees the
 * fallback (membership plans, Eventbrite, and so on), with a sign-in link for
 * members who are on a device where they are not signed in yet.
 */
export function MemberPlace({ slug, fallback }: { slug: string; fallback: React.ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/events/visitor", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((v: Visitor) => live && setVisitor(v))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  if (visitor?.member) {
    return (
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/members/events/${slug}`}>
            Save your place <ArrowRight />
          </Link>
        </Button>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This event is part of your membership. Say you are going and the joining details are sent to you.
        </p>
      </div>
    );
  }

  if (!visitor && !failed) {
    return (
      <Button size="lg" className="w-full" disabled>
        Save your place
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fallback}
      {!visitor?.signedIn && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Already a member?{" "}
          <Link href={`/login?next=${encodeURIComponent(`/events/${slug}`)}`} className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to save your place.
        </p>
      )}
    </div>
  );
}
