import { cn } from "@/lib/utils";
import { plainTextBlocks } from "@/lib/plain-text";

/**
 * Renders plain text as prose: blank lines separate paragraphs and a line
 * starting with "## " becomes a heading. Nothing is interpreted as HTML.
 */
export function PlainTextBody({ text, className }: { text: string; className?: string }) {
  const blocks = plainTextBlocks(text);

  return (
    <div className={cn("prose-tricho", className)}>
      {blocks.map((b, i) =>
        b.type === "h2" ? (
          <h2 key={i}>{b.text}</h2>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        )
      )}
    </div>
  );
}
