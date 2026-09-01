import { describe, expect, it } from "vitest";
import { segmentDocument } from "./sectionSegmenter";

describe("segmentDocument", () => {
  it("splits markdown headings into sections with the right kind", () => {
    const text = [
      "# My unit",
      "## 1. Rationale",
      "Pupils will learn about the environment.",
      "## 3. Learning outcomes",
      "- identify materials",
      "- describe energy use"
    ].join("\n");

    const sections = segmentDocument(text);
    const rationale = sections.find((s) => s.heading.includes("Rationale"));
    const outcomes = sections.find((s) => s.heading.includes("Learning outcomes"));

    expect(rationale?.kind).toBe("rationale");
    expect(rationale?.text).toContain("Pupils will learn");
    expect(outcomes?.kind).toBe("outcomes");
    expect(outcomes?.text).toContain("identify materials");
  });

  it("parses a markdown table into rows", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Week | Focus | Output |",
      "|---|---|---|",
      "| 1 | What is sustainability? | Vocabulary sheet |",
      "| 3 | Energy and water | Checklist |"
    ].join("\n");

    const sections = segmentDocument(text);
    const sequence = sections.find((s) => s.kind === "sequence");
    expect(sequence?.tableRows).toHaveLength(3);
    expect(sequence?.tableRows?.[0]).toEqual(["Week", "Focus", "Output"]);
    expect(sequence?.tableRows?.[2]).toEqual(["3", "Energy and water", "Checklist"]);
  });

  it("falls back to a single 'other' section when no headings are found", () => {
    const text = "Just a plain paragraph of text with no structure at all.";
    const sections = segmentDocument(text);
    expect(sections).toHaveLength(1);
    expect(sections[0].kind).toBe("other");
  });

  it("recognises non-markdown numbered headings as a fallback", () => {
    const text = ["1. Rationale", "", "This unit is about sustainability.", "", "7. Assessment", "", "Weighted by participation."].join(
      "\n"
    );
    const sections = segmentDocument(text);
    expect(sections.some((s) => s.kind === "rationale")).toBe(true);
    expect(sections.some((s) => s.kind === "assessment")).toBe(true);
  });
});
