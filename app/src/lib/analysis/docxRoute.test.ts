import { describe, expect, it, vi, beforeEach } from "vitest";

const convertToHtml = vi.fn();
vi.mock("mammoth", () => ({
  default: { convertToHtml: (...args: unknown[]) => convertToHtml(...args) }
}));

const { parseDocx } = await import("../parsing/docxParser");
const { segmentDocument } = await import("../parsing/sectionSegmenter");
const { analyzeDocument } = await import("./engine");

// Regression test for the review finding that htmlToStructuredText's old
// implementation collapsed every <li> into one run of text, which meant a
// DOCX-sourced learning-outcomes list (rendered by mammoth as <ol>/<ul>, not
// markdown dashes) never reached the learningOutcomesRule's bullet parser at
// all. This exercises the real DOCX code path end-to-end — parseDocx →
// segmentDocument → analyzeDocument — with synthetic mammoth-shaped HTML,
// never a fixture built from the markdown Test Case 01 file.
describe("DOCX route detects learning_outcomes (not just the markdown fixture)", () => {
  beforeEach(() => {
    convertToHtml.mockReset();
  });

  it("detects the learning_outcomes gap from a DOCX numbered list", async () => {
    convertToHtml.mockResolvedValue({
      value: [
        "<h1>Our Sustainable School</h1>",
        "<h2>1. Rationale</h2>",
        "<p>Pupils learn to raise awareness and make greener choices.</p>",
        "<h2>3. Learning outcomes</h2>",
        "<ol>",
        "<li>identify common recyclable and non-recyclable materials</li>",
        "<li>describe at least three ways to save energy or water</li>",
        "<li>name examples of environmental actions</li>",
        "<li>record relevant facts from selected websites</li>",
        "</ol>",
        "<h2>7. Assessment</h2>",
        "<table><tr><th>Component</th><th>Criteria</th></tr><tr><td>Poster</td><td>Neatness and correct vocabulary</td></tr></table>"
      ].join("")
    });

    const file = new File([new Uint8Array([1, 2, 3])], "unit.docx");
    const text = await parseDocx(file);
    const sections = segmentDocument(text);

    // The bug this guards against: a numbered list's bullets must reach
    // the outcomes section as separate lines, not one merged string.
    const outcomes = sections.find((s) => s.kind === "outcomes");
    expect(outcomes?.text.split("\n").filter((l) => l.trim().startsWith("1."))).toHaveLength(1);
    expect(outcomes?.text).toContain("2. describe at least three ways");

    const result = analyzeDocument({
      sections,
      document: { title: "t", subject: "s", cycle: "P4-P5", source_type: "docx" },
      cycle: "P4-P5"
    });

    expect(result.suggestions.some((s) => s.category === "learning_outcomes")).toBe(true);
  });
});
