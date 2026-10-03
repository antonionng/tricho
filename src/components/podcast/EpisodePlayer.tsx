"use client";

import { useRef } from "react";
import { Play } from "lucide-react";

type Moment = { t: number; label: string };

function stamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The episode player. With the host's own player (an iframe) the key moments
 * are listed with their times; with a plain audio file each key moment jumps
 * the player to that point.
 */
export function EpisodePlayer({
  title,
  audioUrl,
  embedUrl,
  moments,
  transcriptAnchors = false,
}: {
  title: string;
  audioUrl: string | null;
  embedUrl: string | null;
  moments: Moment[];
  /** When the transcript is on the page, iframe moments link to its paragraphs. */
  transcriptAnchors?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);

  const seek = (t: number) => {
    const el = audio.current;
    if (!el) return;
    el.currentTime = t;
    void el.play().catch(() => {});
  };

  return (
    <div className="space-y-6">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={`Listen to ${title}`}
          className="h-[180px] w-full rounded-2xl border border-rule bg-card"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media"
        />
      ) : audioUrl ? (
        <audio ref={audio} controls preload="metadata" src={audioUrl} className="w-full">
          <a href={audioUrl}>Download the episode</a>
        </audio>
      ) : null}

      {moments.length > 0 && (
        <div className="space-y-3">
          <h2 className="label text-muted-foreground">Key moments</h2>
          <ol className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {moments.map((m) => (
              <li key={m.t}>
                {!embedUrl && audioUrl ? (
                  <button
                    type="button"
                    onClick={() => seek(m.t)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left text-[15px] transition-colors hover:bg-paper-2"
                  >
                    <span className="flex w-16 shrink-0 items-center gap-1.5 tabular-nums text-muted-foreground">
                      <Play className="h-3 w-3" aria-hidden />
                      {stamp(m.t)}
                    </span>
                    <span className="text-ink">{m.label}</span>
                    <span className="sr-only">. Play from {stamp(m.t)}.</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-4 px-4 py-3 text-[15px]">
                    {transcriptAnchors ? (
                      <a href={`#t-${m.t}`} className="w-16 shrink-0 tabular-nums text-muted-foreground underline underline-offset-4">
                        {stamp(m.t)}
                      </a>
                    ) : (
                      <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{stamp(m.t)}</span>
                    )}
                    <span className="text-ink">{m.label}</span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
