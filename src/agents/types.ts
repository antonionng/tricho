import type { Prisma } from "@prisma/client";

export type AgentRisk = "low" | "high";

export type DraftInput = {
  kind: string;
  title: string;
  body: string;
  summary?: string | null;
  payload?: Prisma.InputJsonObject | null;
  /**
   * Overrides the agent's risk for this one draft. Only drafts that end up
   * "low" can ever publish themselves, and only when autonomy is "auto".
   */
  risk?: AgentRisk;
  /**
   * A stable key for "this exact thing" (for example "welcome:<userId>").
   * createDraft skips the draft when a live (not rejected) draft with the
   * same ref already exists, so daily runs never duplicate work.
   */
  ref?: string;
};

export type AgentContext = {
  agentId: string;
  runId: string;
  trigger: string;
  now: Date;
  /** Returns the new draft, or null when an identical one is already waiting or done. */
  createDraft: (input: DraftInput) => Promise<{ id: string; status: string } | null>;
};

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  /** Human-readable, e.g. "Daily at 7am". */
  schedule: string;
  /** Cron expression (UTC, as Vercel Cron runs it). */
  cron: string;
  risk: AgentRisk;
  run: (ctx: AgentContext) => Promise<{ summary: string }>;
};
