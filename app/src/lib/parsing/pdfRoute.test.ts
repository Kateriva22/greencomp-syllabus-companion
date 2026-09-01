import { describe, expect, it, vi, beforeEach } from "vitest";

const getDocument = vi.fn();
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument
}));

const { parsePdf, PdfParseError } = await import("./pdfParser");
const { segmentDocument } = await import("./sectionSegmenter");

function item(str: string, x: number, y: number, hasEOL = true) {
  return { str, dir: "ltr", transform: [10, 0, 0, 10, x, y], width: str.length * 6, height: 10, hasEOL };
}

function fakePdf(pagesOfItems: ReturnType<typeof item>[][]) {
  return {
    numPages: pagesOfItems.length,
    getPage: (pageNum: number) =>
      Promise.resolve({
        getTextContent: () => Promise.resolve({ items: pagesOfItems[pageNum - 1] })
      })
  };
}

function pdfFile(): File {
  return new File([new Uint8Array([1, 2, 3])], "unit.pdf", { type: "application/pdf" });
}

beforeEach(() => {
  getDocument.mockReset();
});

// Regression test for the review finding that the old parser joined every
// page into one long space-separated line, which meant no heading could
// ever be recognised in a PDF-sourced document (a single 2000-character
// line does not match any heading pattern). This proves multiple distinct
// sections are recovered from synthetic pdf.js text items — never a real
// PDF file, per the "no real syllabus/PDF in the repo" constraint.
describe("PDF route recovers multiple sections (not one flattened line)", () => {
  it("segments a synthetic multi-heading page into separate recognised sections", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve(
        fakePdf([
          [
            item("## 1. Rationale", 0, 800),
            item("Raise awareness and make greener choices.", 0, 785),
            item("## 3. Learning outcomes", 0, 760),
            item("identify materials", 0, 745),
            item("describe energy use", 0, 730),
            item("## 7. Assessment", 0, 700),
            item("Neatness and correct vocabulary.", 0, 685)
          ]
        ])
      )
    });

    const text = await parsePdf(pdfFile());
    expect(text.split("\n").length).toBeGreaterThan(1);

    const sections = segmentDocument(text);
    const kinds = sections.map((s) => s.kind);
    expect(kinds).toContain("rationale");
    expect(kinds).toContain("outcomes");
    expect(kinds).toContain("assessment");
    expect(sections).toHaveLength(3);
  });

  it("still throws PdfParseError for a scanned/image-only PDF with (near) no text layer", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve(fakePdf([[], []]))
    });
    await expect(parsePdf(pdfFile())).rejects.toBeInstanceOf(PdfParseError);
  });
});
