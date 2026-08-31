import { describe, expect, it } from "vitest";
import { segmentDocument } from "../parsing/sectionSegmenter";
import { analyzeDocument } from "./engine";

// These fixtures are synthetic, hand-written text used only to prove each
// rule can fire and can also correctly stay silent — they are not modelled
// on any real syllabus. This guards against the engine being overfit to
// Test Case 01's exact wording.

describe("analyzeDocument — generalisation beyond Test Case 01", () => {
  it("does not flag pupil_agency when pupils are given genuine choice", () => {
    const text = [
      "## 5. Pedagogical approach",
      "Pupils will choose which local issue to investigate in their group and will decide how to present their findings.",
      "## 9. Inclusion and multilingual support",
      "Pupils negotiate roles within mixed-ability groups."
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "pupil_agency")).toBe(false);
  });

  it("flags pupil_agency when the teacher is described as controlling every choice", () => {
    const text = [
      "## 5. Pedagogical approach",
      "The teacher will select the topic, the teacher will assign roles, and pupils will follow the task instructions."
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "pupil_agency")).toBe(true);
  });

  it("does not flag authentic_action once a stakeholder and feedback loop are present", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Week | Focus | Learning activities | Output |",
      "|---|---|---|---|",
      "| 6 | Share and act | Present the proposal to the school council and gather feedback from them; measure impact before and after. | Clean-up |",
      "## 10. Expected final product",
      "Each group will produce a poster."
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "authentic_action")).toBe(false);
  });

  it("does not flag assessment_alignment once evidence/reflection criteria are present", () => {
    const text = [
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Portfolio | 100% | Uses evidence and perspectives, shows a group decision among alternatives, and reflects on the process |"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "assessment_alignment")).toBe(false);
  });

  it("caps suggestions at 10 and always starts them as pending", () => {
    const text = [
      "## 1. Rationale",
      "Pupils learn to raise awareness and make greener choices.",
      "## 3. Learning outcomes",
      "- identify materials",
      "- describe energy use",
      "## 5. Pedagogical approach",
      "The teacher will select the topics and pupils will follow instructions.",
      "## 6. Six-week learning sequence",
      "| Week | Focus | Learning activities | Output |",
      "|---|---|---|---|",
      "| 3 | Energy | Use a checklist to observe lights and taps. | Checklist |",
      "| 4 | Research | Search websites and record facts. | Notes |",
      "| 6 | Act | Join a supervised clean-up. | Clean-up |",
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Poster | 100% | Neatness and correct vocabulary |",
      "## 10. Expected final product",
      "A poster displayed in the corridor.",
      "## 12. European dimension",
      "Examples from three countries.",
      "## 14. Review after the unit",
      "The teacher will record which activities engaged pupils."
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.length).toBeLessThanOrEqual(10);
    expect(result.suggestions.every((s) => s.teacher_decision === "pending")).toBe(true);
  });
});
