import { describe, expect, it } from "vitest";
import { segmentDocument } from "../parsing/sectionSegmenter";
import { analyzeDocument } from "./engine";

// Regression test for the review finding: the assessment_alignment rule
// used to suppress the whole finding the moment ANY single higher-order
// keyword appeared anywhere in the assessment section, even if the actual
// criteria were overwhelmingly recall/compliance-based. It must now weigh
// recall-dominant criteria against higher-order ones instead.
describe("assessment_alignment is not suppressed by one incidental higher-order keyword", () => {
  function run(text: string) {
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "P4-P5", source_type: "paste" },
      cycle: "P4-P5"
    });
    return result.suggestions.find((s) => s.category === "assessment_alignment");
  }

  it("still fires when 3 of 4 criteria are recall/compliance and only 1 mentions a higher-order word", () => {
    const text = [
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Participation | 20% | Attention, task completion and cooperation |",
      "| Quiz | 20% | Correct use of vocabulary and factual accuracy |",
      "| Poster | 30% | Neatness and clear presentation |",
      "| Reflection | 30% | Reflects on what they learned |"
    ].join("\n");
    const finding = run(text);
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("critical");
  });

  it("does not fire once higher-order criteria are genuinely balanced or dominant", () => {
    const text = [
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Portfolio | 50% | Uses evidence and shows a group decision among alternatives |",
      "| Reflection | 50% | Reflects on the inquiry process and adapts the plan |"
    ].join("\n");
    const finding = run(text);
    expect(finding).toBeUndefined();
  });

  it("does not fire when recall and higher-order criteria are exactly tied", () => {
    const text = [
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Quiz | 50% | Correct use of vocabulary and factual accuracy |",
      "| Portfolio | 50% | Uses evidence and reflects on the process |"
    ].join("\n");
    const finding = run(text);
    expect(finding).toBeUndefined();
  });

  it("works the same way for a prose-only assessment section (no table)", () => {
    const text = [
      "## 7. Assessment",
      "Pupils are assessed on attention and task completion.",
      "Correct use of vocabulary and factual accuracy in the quiz.",
      "Neatness and clear presentation of the final poster."
    ].join("\n");
    const finding = run(text);
    expect(finding).toBeDefined();
  });
});
