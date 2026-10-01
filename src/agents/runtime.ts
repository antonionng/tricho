import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAgent } from "./index";
import { publishDraft } from "./publish";
import type { AgentContext, AgentRisk, DraftInput } from "./types";

export { generate, generateStructured, aiAvailable, HOUSE_RULES } from "./ai";

export type AgentSettingView = { enabled: boolean; autonomy: "ask" | "auto" };

export async function getAgentSetting(agent: string): Promise<AgentSettingView> {
  const row = await prisma.agentSetting.findUnique({ where: { agent } });
  return {
    enabled: row?.enabled ?? true,
    autonomy: row?.autonomy === "auto" ? "auto" : "ask",
  };
}

/**
 * True when a draft with this ref already exists, in any state. Rejected drafts
 * count too, so a rejected idea doesn't come back the next day. Regenerate
 * frees the ref first (see releaseDraftRef).
 */
export async function draftRefExists(ref: string) {
  const found = await prisma.draft.findFirst({
    where: { payload: { path: ["ref"], equals: ref } },
    select: { id: true },
  });
  return !!found;
}

/**
 * Save a draft for the team. Links it to the run, skips duplicates by ref, and
 * publishes it straight away only when the draft is low risk AND the team has set
 * the agent to "auto".
 */
export async function createDraft(
  input: DraftInput & { agent: string; runId?: string | null; agentRisk: AgentRisk }
) {
  if (input.ref && (await draftRefExists(input.ref))) return null;

  const payload: Prisma.InputJsonObject = {
    ...(input.payload ?? {}),
    ...(input.ref ? { ref: input.ref } : {}),
  };

  const draft = await prisma.draft.create({
    data: {
      agent: input.agent,
      kind: input.kind,
      title: input.title.slice(0, 200),
      summary: input.summary ?? null,
      body: input.body,
      payload,
      runId: input.runId ?? null,
    },
  });

  const risk = input.risk ?? input.agentRisk;
  if (risk === "low") {
    const setting = await getAgentSetting(input.agent);
    if (setting.autonomy === "auto") {
      try {
        const result = await publishDraft(draft.id);
        return { id: draft.id, status: result.status };
      } catch (error) {
        console.error(`[agents] auto-publish failed for draft ${draft.id}`, error);
      }
    }
  }
  return { id: draft.id, status: draft.status };
}

export type RunOutcome = {
  agent: string;
  runId: string | null;
  status: "succeeded" | "failed" | "skipped";
  summary: string;
  error?: string;
};

export async function runAgent(id: string, trigger: string): Promise<RunOutcome> {
  const agent = getAgent(id);
  if (!agent) {
    return { agent: id, runId: null, status: "failed", summary: "", error: `No agent called "${id}".` };
  }

  const setting = await getAgentSetting(id);
  if (!setting.enabled) {
    return {
      agent: id,
      runId: null,
      status: "skipped",
      summary: `${agent.name} is switched off, so it didn't run.`,
    };
  }

  const run = await prisma.agentRun.create({ data: { agent: id, trigger } });

  const ctx: AgentContext = {
    agentId: id,
    runId: run.id,
    trigger,
    now: new Date(),
    createDraft: (input) => createDraft({ ...input, agent: id, runId: run.id, agentRisk: agent.risk }),
  };

  try {
    const { summary } = await agent.run(ctx);
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "succeeded", summary, finishedAt: new Date() },
    });
    return { agent: id, runId: run.id, status: "succeeded", summary };
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}`.trim() : String(error);
    console.error(`[agents] ${id} failed`, error);
    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "failed", error: message.slice(0, 4000), finishedAt: new Date() },
    });
    return { agent: id, runId: run.id, status: "failed", summary: "", error: message.split("\n")[0] };
  }
}

/** Let the agent draft this item again, by moving the old draft off its ref. */
export async function releaseDraftRef(draftId: string) {
  const draft = await prisma.draft.findUnique({ where: { id: draftId }, select: { payload: true } });
  const payload = (draft?.payload ?? {}) as Record<string, unknown>;
  if (typeof payload.ref !== "string") return null;
  await prisma.draft.update({
    where: { id: draftId },
    data: { payload: { ...(payload as Prisma.InputJsonObject), ref: `${payload.ref}#replaced-${draftId}`, replacedRef: payload.ref } },
  });
  return payload.ref;
}
