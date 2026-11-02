import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ContractFacts } from "@/lib/partner-offers";
import { site } from "@/config/site";

/**
 * The signed Premium partner agreement as a PDF: the parties, price and schedule, the full partner
 * terms, both signatures and an audit line with the fingerprint of the agreement text.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 60;
const INK = rgb(0.043, 0.043, 0.043);
const MUTE = rgb(0.42, 0.42, 0.41);
const RULE = rgb(0.85, 0.85, 0.83);

/** The standard PDF fonts only cover Windows-1252, so anything else is swapped for a near match. */
const WIN_ANSI_EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function printable(text: string) {
  return text
    .replace(/[‐-‒]/g, "-")
    .replace(/−/g, "-")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, (c) => (WIN_ANSI_EXTRAS.includes(c) ? c : ""));
}

type Fonts = { sans: PDFFont; bold: PDFFont; serif: PDFFont; italic: PDFFont };

class Writer {
  page: PDFPage;
  y: number;
  constructor(private doc: PDFDocument, private fonts: Fonts, private footer: string) {
    this.page = this.addPage();
    this.y = A4[1] - MARGIN;
  }

  private addPage() {
    const page = this.doc.addPage(A4);
    page.drawText(printable(this.footer), { x: MARGIN, y: 32, size: 7.5, font: this.fonts.sans, color: MUTE });
    return page;
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN + 10) {
      this.page = this.addPage();
      this.y = A4[1] - MARGIN;
    }
  }

  private wrap(text: string, font: PDFFont, size: number, width: number) {
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

  text(text: string, opts: { font?: keyof Fonts; size?: number; color?: ReturnType<typeof rgb>; gap?: number; indent?: number; leading?: number } = {}) {
    const font = this.fonts[opts.font ?? "serif"];
    const size = opts.size ?? 10.5;
    const leading = opts.leading ?? size * 1.42;
    const indent = opts.indent ?? 0;
    for (const line of this.wrap(text, font, size, A4[0] - MARGIN * 2 - indent)) {
      this.ensure(leading);
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= leading;
    }
    this.y -= opts.gap ?? 6;
  }

  label(text: string) {
    this.ensure(30);
    this.y -= 8;
    this.page.drawText(printable(text.toUpperCase()), { x: MARGIN, y: this.y - 8, size: 7.5, font: this.fonts.bold, color: MUTE });
    this.y -= 20;
  }

  rule() {
    this.ensure(16);
    this.page.drawLine({ start: { x: MARGIN, y: this.y - 4 }, end: { x: A4[0] - MARGIN, y: this.y - 4 }, thickness: 0.6, color: RULE });
    this.y -= 16;
  }

  space(h: number) {
    this.y -= h;
  }
}

export async function buildContractPdf(f: ContractFacts & { sha256: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Premium Partner Agreement: ${f.businessName}`);
  doc.setAuthor(site.company.name);
  doc.setSubject("Premium Business partnership");
  doc.setCreationDate(f.signedAt);
  const fonts: Fonts = {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
  };
  const w = new Writer(doc, fonts, `Trichollective Premium Partner Agreement · ${f.businessName} · Ref ${f.offerId} · SHA-256 ${f.sha256.slice(0, 16)}…`);

  // Cover
  w.text("TRICHOLLECTIVE", { font: "bold", size: 11, gap: 2 });
  w.text("Premium Partner Agreement", { font: "serif", size: 28, leading: 34, gap: 4 });
  w.text(`${f.businessName}`, { font: "italic", size: 18, leading: 24, gap: 18 });
  w.rule();

  w.label("The parties");
  w.text(
    `${site.company.name}, a company registered in ${site.company.registeredIn} with number ${site.company.number}, of ${site.company.address}, operator of trichollective.net (“Trichollective”).`,
    { gap: 4 }
  );
  w.text(
    `${f.legalName}${f.companyNumber ? `, company number ${f.companyNumber}` : ""}, trading as ${f.businessName}, of ${f.address.replace(/\s*\n\s*/g, ", ")} (“the Partner”).`
  );

  w.label("Price");
  w.text(f.price, { font: "serif", size: 16, leading: 20, gap: 2 });
  w.text(f.priceNote, { color: MUTE });

  w.label("Schedule: what is included");
  f.inclusions.forEach((item, i) => w.text(`${i + 1}.  ${item}`, { indent: 0, gap: 3 }));
  if (f.specialTerms) {
    w.label("Also agreed");
    w.text(f.specialTerms);
  }
  if (f.firstMasterclass || f.firstFeature) {
    w.label("The first month");
    if (f.firstMasterclass) w.text(`First masterclass: ${f.firstMasterclass}`, { gap: 3 });
    if (f.firstFeature) w.text(`First Trichozette feature: ${f.firstFeature}`);
  }

  w.label(`Premium partner terms, version ${f.termsVersion}`);
  w.text("This agreement is made up of the offer above, the Premium partner terms below and the Trichollective terms of business at trichollective.net/terms.", { color: MUTE });
  f.terms.forEach((t, i) => {
    w.text(`${i + 1}. ${t.heading}`, { font: "bold", size: 10, gap: 3 });
    t.paragraphs.forEach((p) => w.text(p, { size: 10, gap: 4 }));
    w.space(4);
  });

  // Signatures
  w.rule();
  w.label("Signed for the Partner");
  w.text(f.signature, { font: "italic", size: 22, leading: 28, gap: 2 });
  w.text(`${f.signerName}, ${f.signerRole}, for ${f.legalName}`, { font: "sans", size: 9.5, gap: 2 });
  w.text(`Signed electronically on ${f.signedAt.toUTCString()}${f.ip ? ` from IP address ${f.ip}` : ""}. Account email ${f.accountEmail}.`, {
    font: "sans",
    size: 8.5,
    color: MUTE,
  });

  w.label(`Countersigned for ${site.company.name}`);
  w.text(f.countersignedBy.split(",")[0], { font: "italic", size: 22, leading: 28, gap: 2 });
  w.text(f.countersignedBy, { font: "sans", size: 9.5, gap: 2 });
  w.text(`Countersigned on ${f.signedAt.toUTCString()}.`, { font: "sans", size: 8.5, color: MUTE });

  w.label("Record");
  w.text(
    `Offer reference ${f.offerId}. The SHA-256 fingerprint of the agreement text is ${f.sha256}. Trichollective keeps the full record, including the exact offer and terms shown at signing.`,
    { font: "sans", size: 8.5, color: MUTE }
  );

  return doc.save();
}
