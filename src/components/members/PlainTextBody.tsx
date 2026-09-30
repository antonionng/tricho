import { cn } from "@/lib/utils";

/**
 * Renders plain text as prose: blank lines separate paragraphs and a line
 * starting with "## " becomes a heading. Nothing is interpreted as HTML.
 */
export function PlainTextBody({ text, className }: { text: string; className?: string }) {
  const blocks: { type: "h2" | "p"; text: string }[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (!line.trim()) {
      flush();
    } else {
      para.push(line);
    }
  }
  flush();

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
