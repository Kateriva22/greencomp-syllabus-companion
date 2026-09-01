import { describe, expect, it } from "vitest";
import { segmentDocument } from "../parsing/sectionSegmenter";
import { computeCoverage } from "./coverage";

describe("computeCoverage — 3.2 Adaptability", () => {
  it("does not count a bare 'climate change' mention as evidence of Adaptability", () => {
    const text = [
      "## 1. Rationale",
      "Pupils encounter messages about climate change, waste and responsible behaviour in their daily lives.",
      "## 3. Learning outcomes",
      "- identify common recyclable materials",
      "- describe ways to save energy"
    ].join("\n");
    const coverage = computeCoverage(segmentDocument(text));
    const adaptability = coverage.find((c) => c.competence_id === "3.2");
    expect(adaptability?.score).toBe(0);
    expect(adaptability?.evidence).toBe("Evidence was not found in the reviewed text.");
  });

  it("still recognises genuine Adaptability evidence (responding to feedback/uncertainty)", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Week | Focus | Learning activities | Output |",
      "|---|---|---|---|",
      "| 5 | Adapt the plan | Pupils respond to feedback from the school council and revise the plan. | Updated plan |",
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Portfolio | 100% | Adjust the approach based on feedback received |"
    ].join("\n");
    const coverage = computeCoverage(segmentDocument(text));
    const adaptability = coverage.find((c) => c.competence_id === "3.2");
    expect(adaptability?.score).toBeGreaterThanOrEqual(1);
  });

  it("does not count 'uncertain' inside an unrelated compound word", () => {
    // Sanity check that the narrowed pattern still requires a real word
    // boundary match rather than a naive substring match.
    const text = "## 1. Rationale\nThis is a certainly unambiguous, definite statement.";
    const coverage = computeCoverage(segmentDocument(text));
    const adaptability = coverage.find((c) => c.competence_id === "3.2");
    expect(adaptability?.score).toBe(0);
  });
});
