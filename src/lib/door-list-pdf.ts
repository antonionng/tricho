import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CheckInPerson } from "@/lib/checkin-list";

/**
 * The printed door list: the backup when the hotel signal drops. A4, sorted by
 * surname, with a box to tick, the ticket type, dietary and access needs, and
 * the ticket code to match against a phone screen.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 36;
const INK = rgb(0.043, 0.043, 0.043);
const MUTE = rgb(0.42, 0.42, 0.41);
const RULE = rgb(0.85, 0.85, 0.83);

/** The standard PDF fonts only cover Windows-1252, so anything else is dropped. */
function printable(text: string) {
  return text.replace(/[‐-―−]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF‘’“”•…]/g, "");
}

const COLUMNS = [
  { key: "box", label: "", width: 18 },
  { key: "name", label: "Name", width: 150 },
  { key: "type", label: "Ticket", width: 80 },
  { key: "needs", label: "Dietary and access", width: 205 },
  { key: "code", label: "Code", width: 70 },
] as const;

export async function doorListPdf(opts: { title: string; when: string; people: CheckInPerson[]; printedAt: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Door list: ${printable(opts.title)}`);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const size = 8.5;
  const lineHeight = 11;

  const fit = (text: string, width: number, font = sans) => {
    const words = printable(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  let page = doc.addPage(A4);
  let y = A4[1] - MARGIN;
  let pageNo = 1;

  const header = () => {
    page.drawText(printable(opts.title), { x: MARGIN, y, size: 14, font: bold, color: INK });
    y -= 16;
    page.drawText(printable(`${opts.when} · ${opts.people.length} attendees · printed ${opts.printedAt} · page ${pageNo}`), { x: MARGIN, y, size: 8, font: sans, color: MUTE });
    y -= 18;
    let x = MARGIN;
    for (const c of COLUMNS) {
      page.drawText(c.label, { x, y, size: 7.5, font: bold, color: MUTE });
      x += c.width + 6;
    }
    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.5, color: RULE });
    y -= 12;
  };
  header();

  for (const p of opts.people) {
    const cells = {
      box: [""],
      name: fit(p.name, COLUMNS[1].width, bold),
      type: fit(p.ticketType ?? "", COLUMNS[2].width),
      needs: fit([p.dietary && `Dietary: ${p.dietary}`, p.accessNeeds && `Access: ${p.accessNeeds}`].filter(Boolean).join(". "), COLUMNS[3].width),
      code: [p.code],
    };
    const rows = Math.max(...Object.values(cells).map((l) => l.length));
    const height = rows * lineHeight + 6;
    if (y - height < MARGIN) {
      page = doc.addPage(A4);
      pageNo += 1;
      y = A4[1] - MARGIN;
      header();
    }
    let x = MARGIN;
    for (const c of COLUMNS) {
      if (c.key === "box") {
        page.drawRectangle({ x, y: y - 2, width: 9, height: 9, borderColor: INK, borderWidth: 0.7 });
        if (p.checkedInAt) page.drawText("x", { x: x + 2, y: y - 0.5, size: 8, font: bold, color: INK });
      } else {
        cells[c.key].forEach((text, i) =>
          page.drawText(text, { x, y: y - i * lineHeight, size: size, font: c.key === "name" ? bold : sans, color: c.key === "code" ? MUTE : INK })
        );
      }
      x += c.width + 6;
    }
    y -= height;
    page.drawLine({ start: { x: MARGIN, y: y + lineHeight - 3 }, end: { x: A4[0] - MARGIN, y: y + lineHeight - 3 }, thickness: 0.3, color: RULE });
  }

  return doc.save();
}
