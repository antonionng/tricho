/** Renders the house plain-text format: blank-line paragraphs, "## " subheadings, "- " bullet lines. */
export function DraftBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/).filter((b) => b.trim());
  return (
    <div className="prose-tricho text-[15px]">
      {blocks.map((block, i) => {
        const t = block.trim();
        if (t.startsWith("## ")) return <h2 key={i} className="!text-2xl !mt-8">{t.slice(3)}</h2>;
        const lines = t.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {t}
          </p>
        );
      })}
    </div>
  );
}
