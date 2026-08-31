import { describe, expect, it } from "vitest";
import { segmentDocument } from "../parsing/sectionSegmenter";
import { analyzeDocument } from "./engine";

// The structural-absence rules are the complement of the explicit-gap
// rules: they fire only when a relevant section exists but is silent on the
// topic (neither a gap pattern nor an "already addressed" pattern matches).
// They must never assert a confirmed problem — every one uses "evidence was
// not found" framing and medium confidence/priority.
describe("structural-absence rules", () => {
  function findByCategory(text: string, category: string, cycle = "P4-P5") {
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle, source_type: "paste" },
      cycle
    });
    return result.suggestions.find((s) => s.category === category);
  }

  it("pupil_agency: fires when the pedagogy section is silent on who decides", () => {
    const text = [
      "## 5. Pedagogical approach",
      "Pupils work in small groups using worksheets and a shared discussion."
    ].join("\n");
    const finding = findByCategory(text, "pupil_agency");
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("medium");
    expect(finding?.confidence).toBe("medium");
    expect(finding?.observed_gap.toLowerCase()).toContain("evidence was not found");
  });

  it("pupil_agency: does not fire once teacher-control language is present (explicit gap takes over)", () => {
    const text = "## 5. Pedagogical approach\nThe teacher will select the topic and pupils will follow the task instructions.";
    const finding = findByCategory(text, "pupil_agency");
    expect(finding?.confidence).toBe("high");
    expect(finding?.priority).toBe("critical");
  });

  it("pupil_agency: does not fire once pupil-choice language is present", () => {
    const text = "## 5. Pedagogical approach\nPupils choose their own topic and negotiate group roles.";
    const finding = findByCategory(text, "pupil_agency");
    expect(finding).toBeUndefined();
  });

  it("authentic_action: fires when the final product is described with no action-related wording", () => {
    const text = "## 10. Expected final product\nEach group will submit a written summary of what they learned.";
    const finding = findByCategory(text, "authentic_action");
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("medium");
    expect(finding?.observed_gap.toLowerCase()).toContain("evidence was not found");
  });

  it("systems_inquiry: fires when the learning sequence has content but no inquiry-related wording", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Week | Focus | Learning activities | Output |",
      "|---|---|---|---|",
      "| 1 | Introduction | Watch a video and discuss as a class. | Notes |"
    ].join("\n");
    const finding = findByCategory(text, "systems_inquiry");
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("medium");
  });

  it("critical_and_futures_thinking: fires when the sequence/European sections are silent on research or futures", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Week | Focus | Learning activities | Output |",
      "|---|---|---|---|",
      "| 4 | Discussion | Pupils discuss the topic as a class. | Notes |",
      "## 12. European dimension",
      "The unit connects to other subjects taught in the school."
    ].join("\n");
    const finding = findByCategory(text, "critical_and_futures_thinking");
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("medium");
  });

  it("assessment_alignment: fires when assessment criteria can't be classified either way", () => {
    const text = [
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Project | 100% | Assessed by the class teacher at the end of the unit |"
    ].join("\n");
    const finding = findByCategory(text, "assessment_alignment");
    expect(finding).toBeDefined();
    expect(finding?.priority).toBe("medium");
    expect(finding?.observed_gap.toLowerCase()).toContain("evidence was not found");
  });

  it("no absence rule fires when its section is entirely absent from the document", () => {
    const text = "## 1. Rationale\nA short unit about local biodiversity.";
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "P4-P5", source_type: "paste" },
      cycle: "P4-P5"
    });
    // No pedagogy/sequence/assessment/final_product/european_dimension
    // sections exist at all, so none of the absence rules have anything to
    // report — this guards against them firing on missing sections instead
    // of silent-but-present ones.
    const absenceCategories = [
      "pupil_agency",
      "authentic_action",
      "systems_inquiry",
      "critical_and_futures_thinking",
      "assessment_alignment"
    ];
    for (const category of absenceCategories) {
      expect(result.suggestions.some((s) => s.category === category)).toBe(false);
    }
  });
});
