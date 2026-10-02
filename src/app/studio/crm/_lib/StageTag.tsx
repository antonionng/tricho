import { Tag } from "@/components/studio/ui";
import { STAGE_LABEL, type OrgStageId } from "@/lib/crm";

export function StageTag({ stage }: { stage: string }) {
  const tone = stage === "customer" || stage === "won" ? "positive" : stage === "lost" || stage === "churned" ? "danger" : "default";
  return <Tag tone={tone}>{STAGE_LABEL[stage as OrgStageId]?.label ?? stage}</Tag>;
}
