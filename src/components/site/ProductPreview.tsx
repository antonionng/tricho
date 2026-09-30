import { BadgeCheck, Heart, MessageCircle, Play } from "lucide-react";

/**
 * A faithful, static rendering of the member app — feed, Trichozette, certificate
 * and live session — so visitors see what they are paying for.
 */
export function ProductPreview() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[28px] border border-rule bg-paper shadow-[0_40px_100px_-50px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2 border-b border-rule bg-card px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="h-2.5 w-2.5 rounded-full bg-rule" />
          <span className="ml-3 text-xs text-muted-foreground">Your community</span>
        </div>
        <div className="grid grid-cols-12">
          <aside className="col-span-4 hidden border-r border-rule p-5 sm:block">
            <p className="label text-muted-foreground mb-3">Spaces</p>
            <ul className="flex flex-col gap-1 text-sm">
              {["Head Spa & Scalp Care", "Hair Loss & Trichology", "Case Room", "Devices & Technology", "Business & Marketing"].map(
                (s, i) => (
                  <li key={s} className={`rounded-lg px-2.5 py-1.5 ${i === 0 ? "bg-ink text-paper" : "text-ink-2"}`}>
                    {s}
                  </li>
                )
              )}
            </ul>
            <p className="label text-muted-foreground mt-6 mb-3">Chapter</p>
            <p className="rounded-lg px-2.5 py-1.5 text-sm text-ink-2">Dublin</p>
          </aside>
          <div className="col-span-12 sm:col-span-8 flex flex-col gap-3 p-5">
            <article className="rounded-2xl border border-rule bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-3 text-xs font-medium">CL</span>
                <div className="leading-tight">
                  <p className="text-sm font-medium">A trichologist in Cork</p>
                  <p className="text-xs text-muted-foreground">Clinical · Hair Loss & Trichology</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Seeing more post-viral shedding again this autumn. How are you all explaining the timeline
                to clients who are understandably worried?
              </p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Useful</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Replies</span>
              </div>
            </article>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col justify-between rounded-2xl bg-ink p-4 text-paper min-h-36">
                <p className="label opacity-60">Trichozette</p>
                <p className="display text-xl leading-tight">This month&apos;s edition</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-rule bg-card p-4 min-h-36">
                <p className="label text-muted-foreground">Live · Thursday</p>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
                    <Play className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-medium leading-tight">Monthly masterclass</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating certificate */}
      <div className="absolute -bottom-8 -left-4 hidden w-64 rotate-[-3deg] rounded-2xl border border-rule bg-card p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)] md:block">
        <p className="label text-muted-foreground">Certificate of completion</p>
        <p className="mt-3 font-semibold leading-snug">The scalp consultation for stylists</p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-positive">
          <BadgeCheck className="h-4 w-4" /> Verifiable online
        </p>
      </div>
    </div>
  );
}
