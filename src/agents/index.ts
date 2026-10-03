import { communityAgent } from "./community";
import { gazetteAgent } from "./gazette";
import { membershipAgent } from "./membership";
import { newsletterAgent } from "./newsletter";
import { releasesAgent } from "./releases";
import type { AgentDefinition } from "./types";

export const AGENTS: AgentDefinition[] = [communityAgent, membershipAgent, gazetteAgent, newsletterAgent, releasesAgent];

export function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id);
}

/** Friendly names for draft sources that aren't agents. */
export function agentLabel(id: string) {
  if (id === "website") return "Website";
  if (id === "podcast") return "Podcast";
  if (id === "retention") return "Retention";
  return getAgent(id)?.name ?? id;
}

export type { AgentDefinition } from "./types";
