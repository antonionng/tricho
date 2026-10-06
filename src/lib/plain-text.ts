/**
 * The house format for library pieces and Trichozette articles: blank lines
 * separate paragraphs and a line starting with "## " is a heading. Nothing is
 * interpreted as HTML. Used by the website's PlainTextBody and the app.
 */
export type PlainBlock = { type: "h2" | "p"; text: string };

export function plainTextBlocks(text: string | null | undefined): PlainBlock[] {
  const blocks: PlainBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };
  for (const raw of (text ?? "").replace(/\r\n/g, "\n").split("\n")) {
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
  return blocks;
}
