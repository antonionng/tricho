import { Tag } from "@/components/studio/ui";

export function ScoreTag({ score }: { score: number }) {
  return (
    <Tag tone={score >= 90 ? "positive" : score >= 70 ? "warn" : "danger"} className="tabular-nums">
      {score} / 100
    </Tag>
  );
}
