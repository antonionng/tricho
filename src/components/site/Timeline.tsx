import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** The real Trichollective story so far: past conferences, the Dublin launch, what's next. */
export function Timeline({ tone = "paper" }: { tone?: "paper" | "ink" }) {
  const past = [...site.pastGatherings].reverse();
  const items = [
    ...past.map((g) => ({
      when: fmt(g.date),
      title: g.title,
      where: g.venue,
      detail: g.topics.length ? `On the programme: ${g.topics.join(", ").toLowerCase()}.` : undefined,
      speakers: g.speakers,
      link: g.review ?? undefined,
      state: "past" as const,
    })),
    {
      when: fmt(site.launch.startsAt),
      title: site.launch.title,
      where: site.launch.venue,
      detail: "The launch of Trichollective Online and the founding directory.",
      speakers: [],
      link: { label: "Tickets on Eventbrite", url: site.launch.ticketUrl },
      state: "now" as const,
    },
    {
      when: site.next.status,
      title: `Trichollective ${site.next.city}`,
      where: site.next.city,
      detail: "Members will hear first.",
      speakers: [],
      link: undefined,
      state: "next" as const,
    },
  ];
  const muted = tone === "ink" ? "text-paper/60" : "text-muted-foreground";

  return (
    <ol className="relative flex flex-col">
      {items.map((it, i) => (
        <li key={it.title + it.when} className="relative grid gap-3 pb-12 pl-10 last:pb-0 md:grid-cols-12 md:gap-8 md:pl-0">
          <span
            aria-hidden
            className={cn(
              "absolute left-[7px] top-2 h-full w-px md:left-[calc(25%+3px)]",
              tone === "ink" ? "bg-paper/20" : "bg-rule",
              i === items.length - 1 && "hidden"
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 md:left-[25%] md:-translate-x-[1px]",
              it.state === "now"
                ? tone === "ink" ? "border-paper bg-paper" : "border-ink bg-ink"
                : it.state === "next"
                  ? tone === "ink" ? "border-paper/40 bg-transparent" : "border-mute bg-paper"
                  : tone === "ink" ? "border-paper/70 bg-ink" : "border-ink bg-paper"
            )}
          />
          <p className={cn("label md:col-span-3 md:pt-1 md:text-right md:pr-8", it.state === "now" ? "" : muted)}>
            {it.state === "now" ? `Launch · ${it.when}` : it.when}
          </p>
          <div className="flex flex-col gap-2 md:col-span-9 md:pl-8">
            <p className="display text-2xl md:text-3xl">{it.title}</p>
            <p className={cn("text-[15px]", muted)}>{it.where}</p>
            {it.detail && <p className="text-[15px] leading-relaxed opacity-90">{it.detail}</p>}
            {it.speakers.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1">
                {it.speakers.map((s) => (
                  <li key={s.name} className="text-[15px]">
                    <span className="font-medium">{s.name}</span>
                    <span className={muted}>, {s.role}: {s.topic.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
            {it.link && (
              <a href={it.link.url} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
                {it.link.label} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
