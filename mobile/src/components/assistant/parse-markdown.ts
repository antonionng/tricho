/**
 * Just enough Markdown for the Assistant's replies: headings, paragraphs,
 * bulleted and numbered lists, rules, code and inline bold, italics, code and
 * links. Pure, so it can be tested on its own; Markdown.tsx renders the result.
 */

export type Inline = { text: string; bold?: boolean; italic?: boolean; code?: boolean; href?: string };

export type MdBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string }
  | { type: "rule" };

const LIST = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/;

export function parseBlocks(source: string): MdBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const endPara = () => {
    if (para.length) blocks.push({ type: "paragraph", text: para.join(" ").trim() });
    para = [];
  };
  const endList = () => {
    if (list) blocks.push({ type: "list", ...list });
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      endPara();
      endList();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }
    if (!line.trim()) {
      endPara();
      // A blank line between items keeps the list going.
      if (list && !LIST.test(lines[i + 1] ?? "")) endList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      endPara();
      endList();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].replace(/\s*#+\s*$/, "") });
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      endPara();
      endList();
      blocks.push({ type: "rule" });
      continue;
    }
    const item = LIST.exec(line);
    if (item) {
      endPara();
      const ordered = !!item[2];
      if (list && list.ordered !== ordered) endList();
      if (!list) list = { ordered, items: [] };
      list.items.push(item[3].trim());
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      // A continuation of the last item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    endList();
    para.push(line.trim());
  }
  endPara();
  endList();
  return blocks;
}

const INLINE = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s][^*]*)\*)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at) });
    if (m[2]) out.push({ text: m[2], bold: true });
    else if (m[3]) out.push({ text: m[3], code: true });
    else if (m[4]) out.push({ text: m[4], href: m[5] });
    else out.push({ text: m[6], italic: true });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
