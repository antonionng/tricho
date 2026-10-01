import { prisma } from "@/lib/prisma";
import { AGENTS } from "@/agents";
import { nextRun } from "@/agents/cron";
import { aiAvailable } from "@/agents/ai";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Empty, Notice, PageHeader, Tag, dateTime } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { runAgentNowAction, setAgentAutonomyAction, setAgentEnabledAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ notice?: string; tone?: string }> }) {
  if (!(await studioPage("/studio/agents"))) return null;
  const sp = await searchParams;

  const [settings, runs] = await Promise.all([
    prisma.agentSetting.findMany(),
    Promise.all(
      AGENTS.map((a) =>
        prisma.agentRun.findMany({
          where: { agent: a.id },
          orderBy: { startedAt: "desc" },
          take: 10,
          include: { _count: { select: { drafts: true } } },
        })
      )
    ),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agents"
        intro="The helpers that do the routine work and leave it in your inbox. Switch one off if you want a break from it, or run it now if you don't want to wait. Schedules are set in GMT, so in summer they run an hour later by the clock."
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}
      {!aiAvailable() && (
        <Notice>
          The AI connection isn&apos;t set up here, so the agents are using their built-in templates. Drafts will be plainer, but
          everything still works.
        </Notice>
      )}

      <div className="space-y-6">
        {AGENTS.map((agent, i) => {
          const setting = settings.find((s) => s.agent === agent.id);
          const enabled = setting?.enabled ?? true;
          const autonomy = setting?.autonomy === "auto" ? "auto" : "ask";
          const next = nextRun(agent.cron);
          return (
            <article key={agent.id} className="space-y-5 rounded-3xl border border-rule bg-card p-5 sm:p-7">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-ink">{agent.name}</h2>
                    {enabled ? <Tag tone="positive">On</Tag> : <Tag>Off</Tag>}
                    <Tag>{agent.risk === "low" ? "Low risk" : "Always asks you"}</Tag>
                  </div>
                  <p className="text-[15px] text-ink-2">{agent.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {agent.schedule}.{enabled && next ? ` Next run ${dateTime(next)}, UK time.` : ""}
                  </p>
                </div>
                <form action={runAgentNowAction}>
                  <input type="hidden" name="agent" value={agent.id} />
                  <SubmitButton pendingLabel="Running…" disabled={!enabled}>
                    Run now
                  </SubmitButton>
                </form>
              </header>

              <div className="flex flex-col gap-4 rounded-2xl bg-paper-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <form action={setAgentEnabledAction} className="flex items-center gap-3 text-sm">
                  <input type="hidden" name="agent" value={agent.id} />
                  <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
                  <span className="text-ink-2">{enabled ? "Running on schedule." : "Switched off."}</span>
                  <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                    {enabled ? "Switch off" : "Switch on"}
                  </SubmitButton>
                </form>

                {agent.risk === "low" ? (
                  <form action={setAgentAutonomyAction} className="flex flex-wrap items-center gap-2 text-sm">
                    <input type="hidden" name="agent" value={agent.id} />
                    <span className="text-ink-2">Welcome posts:</span>
                    <div className="inline-flex rounded-full border border-rule bg-card p-0.5" role="group" aria-label="Autonomy">
                      {(
                        [
                          ["ask", "Ask me first"],
                          ["auto", "Post on their own"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="submit"
                          name="autonomy"
                          value={value}
                          aria-pressed={autonomy === value}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            autonomy === value ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-ink-2">Everything this agent writes waits for your approval.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="label text-muted-foreground">Last 10 runs</h3>
                {runs[i].length === 0 ? (
                  <Empty>It hasn&apos;t run yet.</Empty>
                ) : (
                  <ul className="divide-y divide-rule rounded-2xl border border-rule">
                    {runs[i].map((run) => (
                      <li key={run.id} className="space-y-1 px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag tone={run.status === "succeeded" ? "positive" : run.status === "failed" ? "danger" : "warn"}>
                            {run.status === "succeeded" ? "Done" : run.status === "failed" ? "Problem" : "Running"}
                          </Tag>
                          <span className="text-muted-foreground">
                            {dateTime(run.startedAt)} · {run.trigger === "cron" ? "on schedule" : run.trigger === "manual" ? "run by hand" : run.trigger}
                            {run._count.drafts > 0 && ` · ${run._count.drafts} draft${run._count.drafts === 1 ? "" : "s"}`}
                          </span>
                        </div>
                        {run.summary && <p className="text-ink-2">{run.summary}</p>}
                        {run.error && (
                          <details className="text-destructive">
                            <summary className="cursor-pointer">{run.error.split("\n")[0]}</summary>
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{run.error}</pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
