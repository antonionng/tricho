import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { resources } from "./resources";
import { buildResourcePdf } from "@/lib/resource-pdf";

describe("practice resources", () => {
  it("have unique slugs and file names", () => {
    expect(new Set(resources.map((r) => r.slug)).size).toBe(resources.length);
    expect(new Set(resources.map((r) => r.filename)).size).toBe(resources.length);
  });

  it("each render to a PDF with the pages they describe", async () => {
    for (const r of resources) {
      const bytes = await buildResourcePdf(r);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount(), r.slug).toBe(r.pages.length);
      expect(doc.getTitle()).toBe(r.title);
    }
  });
});
