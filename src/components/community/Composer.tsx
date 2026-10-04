"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { createPost, type FormState } from "@/app/members/community/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/members/SubmitButton";
import { fieldClass } from "@/components/members/MemberPage";
import { cn } from "@/lib/utils";

export type ComposerRoom = { id: string; label: string; prompt: string; blurb?: string };

export function Composer({
  rooms,
  defaultSpace,
  lockedSpace,
  chapter,
  chapterDefault = false,
  collapsed = false,
  name,
}: {
  /** Rooms this member may post in. */
  rooms: ComposerRoom[];
  defaultSpace?: string;
  /** Post only into this room: no room picker is shown. */
  lockedSpace?: string;
  /** The member's chapter, if they have one, so a post can be shared with it. */
  chapter?: { city: string } | null;
  chapterDefault?: boolean;
  /** Start as a single tap target that opens the full form. */
  collapsed?: boolean;
  name?: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(createPost, null);
  // When collapsed, the form closes itself after a successful post.
  const [opened, setOpened] = useState<{ with: FormState } | null>(null);
  const open = !collapsed || (opened !== null && !(state?.ok && state !== opened.with));
  const lockedRoom = lockedSpace ? rooms.find((r) => r.id === lockedSpace) : undefined;
  const initial = lockedRoom?.id ?? rooms.find((r) => r.id === defaultSpace)?.id ?? rooms[0]?.id ?? "lounge";
  const [space, setSpace] = useState(initial);
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const current = lockedRoom ?? rooms.find((r) => r.id === space);
  const prompt = current?.prompt || "What would you like to share?";

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  // Links such as "Write your first post" land on #compose: open the form straight away.
  useEffect(() => {
    if (!collapsed) return;
    const openFromHash = () => {
      if (window.location.hash === "#compose") setOpened((o) => o ?? { with: null });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [collapsed]);

  useEffect(() => {
    if (opened && collapsed) {
      textRef.current?.focus({ preventScroll: true });
      document.getElementById("compose")?.scrollIntoView({ block: "nearest" });
    }
  }, [opened, collapsed]);

  if (rooms.length === 0 || (lockedSpace && !lockedRoom)) {
    return (
      <div className="rounded-2xl border border-rule bg-paper-2 p-5 text-sm leading-relaxed text-ink-2">
        Posting here is for Professional members. You are welcome to read along.
      </div>
    );
  }

  if (!open) {
    return (
      <div id="compose" className="scroll-mt-24 space-y-2">
        <button
          type="button"
          onClick={() => setOpened({ with: state })}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-rule bg-card px-4 py-4 text-left text-[15px] text-muted-foreground transition-colors hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <PenLine className="h-5 w-5 shrink-0 stroke-[1.6] text-ink" />
          <span className="min-w-0">
            {lockedRoom
              ? lockedRoom.prompt || `Start a conversation in ${lockedRoom.label}.`
              : name
                ? `Share something with the collective, ${name}.`
                : "Share something with the collective."}
          </span>
        </button>
        {state?.ok && state.id && (
          <p className="px-1 text-sm text-positive" role="status">
            Your post is live.{" "}
            <Link href={`/members/community/${state.id}`} className="underline underline-offset-4">
              View your post
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} id="compose" className="scroll-mt-24 rounded-2xl border border-rule bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        {lockedRoom ? (
          <>
            <input type="hidden" name="space" value={lockedRoom.id} />
            <p className="text-sm text-ink-2">
              Posting in <span className="font-medium text-ink">{lockedRoom.label}</span>
            </p>
          </>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="label text-muted-foreground">Space</span>
            <select
              name="space"
              value={space}
              onChange={(e) => setSpace(e.target.value)}
              className={cn(fieldClass, "h-12")}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {current?.blurb && <span className="text-xs leading-relaxed text-muted-foreground">{current.blurb}</span>}
          </label>
        )}
        <input name="title" maxLength={140} placeholder="Title (optional)" aria-label="Title" className={cn(fieldClass, "h-12")} />
        <textarea
          ref={textRef}
          name="content"
          required
          minLength={2}
          rows={4}
          placeholder={prompt}
          aria-label="Your post"
          className={cn(fieldClass, "resize-y py-3 leading-relaxed")}
        />
        {chapter && (
          <label className="flex min-h-10 items-center gap-2.5 text-sm text-ink-2">
            <input type="checkbox" name="chapter" defaultChecked={chapterDefault} className="h-4 w-4 accent-[var(--ink)]" />
            Also show this in the {chapter.city} chapter
          </label>
        )}
        {state?.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        {state?.ok && state.id && (
          <p className="text-sm text-positive" role="status">
            Your post is live.{" "}
            <Link href={`/members/community/${state.id}`} className="underline underline-offset-4">
              View your post
            </Link>
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">Never share anything that could identify a client.</p>
        <div className="flex items-center justify-end gap-2">
          {collapsed && (
            <Button type="button" variant="ghost" size="lg" onClick={() => setOpened(null)}>
              Cancel
            </Button>
          )}
          <SubmitButton pending="Posting…">Post</SubmitButton>
        </div>
      </div>
    </form>
  );
}
