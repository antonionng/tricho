import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Resource, ResourceBlock, ResourcePage } from "@/content/resources";

/**
 * Renders a practice resource (src/content/resources.ts) to a printable A4 PDF in the house style:
 * a discipline strip and the page's kind in the header, "Trichollective | Professional education"
 * and the page count in the footer, serif body text and sans labels, and ruled fields, boxes and
 * grids to write on.
 */

const PORTRAIT: [number, number] = [595.28, 841.89];
const MARGIN = 44;
const INK = rgb(0.043, 0.043, 0.043);
const MUTE = rgb(0.42, 0.42, 0.41);
const RULE = rgb(0.78, 0.78, 0.76);
const FAINT = rgb(0.955, 0.955, 0.945);

/** The standard PDF fonts only cover Windows-1252, so anything else is swapped for a near match. */
const WIN_ANSI_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function printable(text: string) {
  return text
    .replace(/[‐-‒]/g, "-")
    .replace(/−/g, "-")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, (c) => (WIN_ANSI_EXTRAS.includes(c) ? c : ""));
}

type Fonts = { sans: PDFFont; bold: PDFFont; serif: PDFFont; italic: PDFFont };
type TextOpts = { font?: keyof Fonts; size?: number; color?: ReturnType<typeof rgb>; leading?: number };

class Writer {
  page!: PDFPage;
  y = 0;
  readonly width: number;
  readonly height: number;
  readonly cw: number;
  private label = "";

  constructor(private doc: PDFDocument, private fonts: Fonts, size: [number, number]) {
    this.width = size[0];
    this.height = size[1];
    this.cw = this.width - MARGIN * 2;
  }

  newPage(label: string) {
    this.label = label;
    this.page = this.doc.addPage([this.width, this.height]);
    const top = this.height - 30;
    this.page.drawText("COSMETIC  /  CLINICAL  /  MEDICAL  /  DIGITAL", { x: MARGIN, y: top, size: 6.5, font: this.fonts.bold, color: MUTE });
    this.right(label.toUpperCase(), top, this.fonts.bold, 6.5, INK);
    this.page.drawLine({ start: { x: MARGIN, y: top - 8 }, end: { x: this.width - MARGIN, y: top - 8 }, thickness: 0.6, color: INK });
    this.page.drawText("TRICHOLLECTIVE  |  PROFESSIONAL EDUCATION", { x: MARGIN, y: 26, size: 6.5, font: this.fonts.bold, color: MUTE });
    this.y = top - 26;
  }

  private right(text: string, y: number, font: PDFFont, size: number, color = INK) {
    const t = printable(text);
    this.page.drawText(t, { x: this.width - MARGIN - font.widthOfTextAtSize(t, size), y, size, font, color });
  }

  /** Starts a new page when `height` would run into the footer. */
  ensure(height: number) {
    if (this.y - height < MARGIN + 6) this.newPage(this.label);
  }

  wrap(text: string, font: PDFFont, size: number, width: number) {
    const lines: string[] = [];
    for (const para of printable(text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      lines.push(line);
    }
    return lines;
  }

  /** Height a block of wrapped text will take, for layout decisions. */
  measure(text: string, opts: TextOpts, width: number) {
    const font = this.fonts[opts.font ?? "serif"];
    const size = opts.size ?? 9.5;
    const leading = opts.leading ?? size * 1.38;
    return this.wrap(text, font, size, width).length * leading;
  }

  /** Writes wrapped text at an x offset and returns the height used. Does not move `y` unless `advance`. */
  textAt(text: string, x: number, y: number, width: number, opts: TextOpts = {}) {
    const font = this.fonts[opts.font ?? "serif"];
    const size = opts.size ?? 9.5;
    const leading = opts.leading ?? size * 1.38;
    let used = 0;
    for (const line of this.wrap(text, font, size, width)) {
      this.page.drawText(line, { x, y: y - used - size, size, font, color: opts.color ?? INK });
      used += leading;
    }
    return used;
  }

  text(text: string, opts: TextOpts & { gap?: number; indent?: number } = {}) {
    const indent = opts.indent ?? 0;
    const width = this.cw - indent;
    const font = this.fonts[opts.font ?? "serif"];
    const size = opts.size ?? 9.5;
    const leading = opts.leading ?? size * 1.38;
    for (const line of this.wrap(text, font, size, width)) {
      this.ensure(leading);
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= leading;
    }
    this.y -= opts.gap ?? 5;
  }

  hr(color = RULE, thickness = 0.6) {
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: this.width - MARGIN, y: this.y }, thickness, color });
  }

  box(x: number, y: number, w: number, h: number, fill?: ReturnType<typeof rgb>) {
    this.page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: RULE, borderWidth: 0.6, color: fill });
  }

  block(b: ResourceBlock) {
    switch (b.type) {
      case "title": {
        this.ensure(60);
        this.text(b.text, { font: "serif", size: 21, leading: 25, gap: b.sub ? 2 : 6 });
        if (b.sub) this.text(b.sub, { font: "sans", size: 8.5, color: MUTE, gap: 6 });
        this.hr(INK, 0.8);
        this.y -= 12;
        return;
      }
      case "h": {
        this.ensure(26);
        this.y -= 4;
        this.text(b.text.toUpperCase(), { font: "bold", size: 7.5, color: MUTE, gap: 2 });
        this.hr();
        this.y -= 8;
        return;
      }
      case "p":
        this.text(b.text, { color: b.muted ? MUTE : INK, gap: 6 });
        return;
      case "note":
        this.y -= 2;
        this.text(b.text, { font: "sans", size: 7.2, color: MUTE, leading: 10, gap: 6 });
        return;
      case "ul": {
        for (const item of b.items) {
          const size = 9.5;
          this.ensure(size * 1.38);
          this.page.drawText("•", { x: MARGIN + 3, y: this.y - size, size, font: this.fonts.serif, color: INK });
          this.text(item, { indent: 14, gap: 3 });
        }
        this.y -= 4;
        return;
      }
      case "defs":
        return this.defs(b.items);
      case "fields":
        return this.fields(b.rows);
      case "box": {
        const lines = b.lines ?? 2;
        const h = 14 + lines * 15;
        this.ensure(h + 6);
        this.page.drawText(printable(b.label.toUpperCase()), { x: MARGIN, y: this.y - 7, size: 6.5, font: this.fonts.bold, color: MUTE });
        let y = this.y - 14;
        for (let i = 0; i < lines; i++) {
          y -= 15;
          this.page.drawLine({ start: { x: MARGIN, y }, end: { x: this.width - MARGIN, y }, thickness: 0.5, color: RULE });
        }
        this.y = y - 8;
        return;
      }
      case "checks":
        return this.checks(b.label, b.items);
      case "table":
        return this.table(b.columns, b.rows, b.rowHeight ?? 36);
    }
  }

  private defs(items: { term: string; text: string }[]) {
    const gutter = 18;
    const colW = (this.cw - gutter) / 2;
    const termOpts: TextOpts = { font: "bold", size: 8.5, leading: 11 };
    const bodyOpts: TextOpts = { font: "serif", size: 9.2, leading: 12.6 };
    const heights = items.map((it) => this.measure(it.term, termOpts, colW) + 1 + this.measure(it.text, bodyOpts, colW) + 9);
    const total = heights.reduce((a, b) => a + b, 0);

    // Fill the left column to about half the total, the rest goes right.
    let split = 0;
    let acc = 0;
    while (split < items.length && acc + heights[split] / 2 < total / 2) acc += heights[split++];
    const left = items.slice(0, split);
    const right = items.slice(split);
    const tallest = Math.max(heights.slice(0, split).reduce((a, b) => a + b, 0), heights.slice(split).reduce((a, b) => a + b, 0));

    if (tallest > this.height - MARGIN * 2 - 40) {
      // Too tall for two columns on one page: fall back to a single column that can page-break.
      for (const it of items) {
        this.text(it.term, { ...termOpts, gap: 1 });
        this.text(it.text, { ...bodyOpts, gap: 8 });
      }
      return;
    }
    this.ensure(tallest);
    const draw = (col: typeof items, x: number) => {
      let y = this.y;
      for (const it of col) {
        y -= this.textAt(it.term, x, y, colW, termOpts) + 1;
        y -= this.textAt(it.text, x, y, colW, bodyOpts) + 9;
      }
      return this.y - y;
    };
    const used = Math.max(draw(left, MARGIN), draw(right, MARGIN + colW + gutter));
    this.y -= used + 2;
  }

  private fields(rows: (string | [string, number])[][]) {
    const rowH = 22;
    for (const row of rows) {
      this.ensure(rowH);
      const given = row.map((f) => (Array.isArray(f) ? f[1] : 1 / row.length));
      const sum = given.reduce((a, b) => a + b, 0);
      let x = MARGIN;
      row.forEach((f, i) => {
        const label = printable(Array.isArray(f) ? f[0] : f);
        const w = (this.cw * given[i]) / sum;
        const size = 7.5;
        this.page.drawText(label, { x, y: this.y - 14, size, font: this.fonts.sans, color: INK });
        const lw = this.fonts.sans.widthOfTextAtSize(label, size);
        const gapAfter = i === row.length - 1 ? 0 : 12;
        this.page.drawLine({ start: { x: x + lw + 5, y: this.y - 16 }, end: { x: x + w - gapAfter, y: this.y - 16 }, thickness: 0.5, color: RULE });
        x += w;
      });
      this.y -= rowH;
    }
    this.y -= 2;
  }

  private checks(label: string | undefined, items: string[]) {
    const size = 7.8;
    const boxSize = 8;
    const lineH = 15;
    let x = MARGIN;
    const maxX = this.width - MARGIN;
    this.ensure(lineH + 4);
    if (label) {
      const t = printable(label.toUpperCase());
      this.page.drawText(t, { x, y: this.y - 10, size: 6.5, font: this.fonts.bold, color: MUTE });
      x += this.fonts.bold.widthOfTextAtSize(t, 6.5) + 14;
    }
    for (const item of items) {
      const t = printable(item);
      const w = boxSize + 5 + this.fonts.sans.widthOfTextAtSize(t, size) + 16;
      if (x + w > maxX && x > MARGIN) {
        x = MARGIN;
        this.y -= lineH;
        this.ensure(lineH);
      }
      this.page.drawRectangle({ x, y: this.y - 12, width: boxSize, height: boxSize, borderColor: INK, borderWidth: 0.6 });
      this.page.drawText(t, { x: x + boxSize + 5, y: this.y - 10.5, size, font: this.fonts.sans, color: INK });
      x += w;
    }
    this.y -= lineH + 6;
  }

  private table(columns: { label: string; width: number }[], rows: { title: string; sub?: string; cells?: string[] }[], rowH: number) {
    const sum = columns.reduce((a, c) => a + c.width, 0);
    const widths = columns.map((c) => (this.cw * c.width) / sum);
    const pad = 5;
    const headSize = 6.8;
    const headLines = columns.map((c, i) => this.wrap(c.label, this.fonts.bold, headSize, widths[i] - pad * 2).length);
    const headH = Math.max(...headLines) * 9 + 9;

    const drawHead = () => {
      this.box(MARGIN, this.y, this.cw, headH, FAINT);
      let x = MARGIN;
      columns.forEach((c, i) => {
        this.textAt(c.label, x + pad, this.y - 4, widths[i] - pad * 2, { font: "bold", size: headSize, leading: 9, color: MUTE });
        x += widths[i];
      });
      this.y -= headH;
    };

    this.ensure(headH + rowH * Math.min(rows.length, 2));
    drawHead();
    for (const row of rows) {
      if (this.y - rowH < MARGIN + 6) {
        this.newPage(this.label);
        drawHead();
      }
      this.box(MARGIN, this.y, this.cw, rowH);
      let x = MARGIN;
      columns.forEach((_, i) => {
        if (i > 0) this.page.drawLine({ start: { x, y: this.y }, end: { x, y: this.y - rowH }, thickness: 0.5, color: RULE });
        if (i === 0) {
          this.page.drawText(printable(row.title), { x: x + pad, y: this.y - 12, size: 7.8, font: this.fonts.bold, color: INK });
          if (row.sub) this.page.drawText(printable(row.sub), { x: x + pad, y: this.y - 22, size: 6.5, font: this.fonts.sans, color: MUTE });
        } else if (row.cells?.[i - 1]) {
          this.textAt(row.cells[i - 1], x + pad, this.y - 4, widths[i] - pad * 2, { font: "sans", size: 7.2, leading: 9.5 });
        }
        x += widths[i];
      });
      this.y -= rowH;
    }
    this.y -= 10;
  }

  /** Page numbers go on at the end, once the count is known. */
  finish() {
    const pages = this.doc.getPages();
    pages.forEach((page, i) => {
      const t = `trichollective.net   /   ${i + 1} of ${pages.length}`;
      page.drawText(t, { x: this.width - MARGIN - this.fonts.sans.widthOfTextAtSize(t, 6.5), y: 26, size: 6.5, font: this.fonts.sans, color: MUTE });
    });
  }
}

export async function buildResourcePdf(resource: Resource): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(resource.title);
  doc.setAuthor("Trichollective");
  doc.setSubject(resource.summary);
  doc.setProducer("Trichollective");
  const fonts: Fonts = {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
  const size: [number, number] = resource.orientation === "landscape" ? [PORTRAIT[1], PORTRAIT[0]] : PORTRAIT;
  const w = new Writer(doc, fonts, size);
  resource.pages.forEach((page: ResourcePage) => {
    w.newPage(page.label);
    page.blocks.forEach((b) => w.block(b));
  });
  w.finish();
  return doc.save();
}
