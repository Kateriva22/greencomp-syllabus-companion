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

  it("detects learning_outcomes from a numbered list, not only markdown dashes", () => {
    const text = [
      "## 3. Learning outcomes",
      "1. identify common materials",
      "2. describe energy use at school",
      "3. name examples from other schools",
      "4. record findings from research"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "learning_outcomes")).toBe(true);
  });

  it("detects learning_outcomes from '*' bullets mixed with '1)' numbering", () => {
    const text = [
      "## 3. Learning outcomes",
      "* identify common materials",
      "* describe energy use at school",
      "1) name examples from other schools",
      "2) record findings from research"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "learning_outcomes")).toBe(true);
  });

  it("does not flag learning_outcomes when higher-order verbs are genuinely balanced against recall verbs", () => {
    const text = [
      "## 3. Learning outcomes",
      "- identify common materials",
      "- describe energy use",
      "- evaluate two possible actions and justify a choice",
      "- reflect on their own contribution"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "learning_outcomes")).toBe(false);
  });

  it("reports underrepresentation (not absence) when one higher-order outcome exists among many recall ones", () => {
    const text = [
      "## 3. Learning outcomes",
      "- identify common materials",
      "- describe energy use at school",
      "- name examples from other schools",
      "- record findings from research",
      "- reflect on their own contribution"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    const finding = result.suggestions.find((s) => s.category === "learning_outcomes");
    expect(finding).toBeDefined();
    // Regression: observed_gap must not claim "No outcome asks..." when one
    // outcome genuinely does — it must say higher-order outcomes are
    // underrepresented and report the actual counts.
    expect(finding?.observed_gap).not.toMatch(/no outcome asks/i);
    expect(finding?.observed_gap).toMatch(/underrepresented/i);
    expect(finding?.observed_gap).toContain("1 of 5");
  });

  it("still uses 'no outcome asks' wording when there are genuinely zero higher-order outcomes", () => {
    const text = [
      "## 3. Learning outcomes",
      "- identify common materials",
      "- describe energy use at school",
      "- name examples from other schools"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    const finding = result.suggestions.find((s) => s.category === "learning_outcomes");
    expect(finding?.observed_gap).toMatch(/no outcome asks/i);
  });

  it("recognises section kinds under alternate heading wording (Aims / Methodology)", () => {
    const text = [
      "## Aims",
      "Pupils will learn simple ways to help the environment.",
      "## Methodology",
      "The teacher will select the topic and pupils will follow the task instructions."
    ].join("\n");
    const sections = segmentDocument(text);
    expect(sections.some((s) => s.kind === "objectives")).toBe(true);
    expect(sections.some((s) => s.kind === "pedagogy")).toBe(true);

    const result = analyzeDocument({
      sections,
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "pupil_agency")).toBe(true);
  });

  it("still classifies sections and fires rules when headings use the non-markdown fallback style", () => {
    // No leading "#" at all — simulates text extracted from a source that
    // lost markdown formatting entirely (plain .txt paste, for instance).
    const text = [
      "5. Pedagogical approach",
      "",
      "The teacher will select the topic and pupils will follow the task instructions.",
      "",
      "7. Assessment",
      "",
      "Graded on attention, task completion and neatness."
    ].join("\n");
    const sections = segmentDocument(text);
    expect(sections.some((s) => s.kind === "pedagogy")).toBe(true);
    expect(sections.some((s) => s.kind === "assessment")).toBe(true);

    const result = analyzeDocument({
      sections,
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "pupil_agency")).toBe(true);
    expect(result.suggestions.some((s) => s.category === "assessment_alignment")).toBe(true);
  });

  it("recognises a learning-sequence table regardless of column order/naming", () => {
    const text = [
      "## 6. Six-week learning sequence",
      "| Output | Learning activities | Focus | Week |",
      "|---|---|---|---|",
      "| Checklist | Use a checklist to observe lights and taps in the classroom. | Energy | 3 |"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "systems_inquiry")).toBe(true);
  });

  it("detects pupil_agency gaps phrased with different synonyms for teacher control", () => {
    const text = [
      "## 5. Pedagogical approach",
      "The teacher will determine the research questions and pupils will follow the task instructions closely."
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.suggestions.some((s) => s.category === "pupil_agency")).toBe(true);
  });

  it("uses the substantive assessment section, not an earlier near-empty table-of-contents-style match", () => {
    // Simulates a long document (e.g. PDF-extracted) where a table of
    // contents produces its own short heading matching the same
    // SectionKind before the real section appears later in the document.
    const text = [
      "## 2. Assessment",
      "## 7. Assessment",
      "| Component | Weight | Main criteria |",
      "|---|---|---|",
      "| Poster | 100% | Neatness and correct vocabulary |"
    ].join("\n");
    const result = analyzeDocument({
      sections: segmentDocument(text),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    // If the engine had anchored to the empty "2. Assessment" TOC entry
    // instead of the real "7. Assessment" table, this would never fire.
    expect(result.suggestions.some((s) => s.category === "assessment_alignment")).toBe(true);
  });

  it("always discloses that Phase 1 analysis rules are English-only", () => {
    const result = analyzeDocument({
      sections: segmentDocument("## 1. Rationale\nA short unit."),
      document: { title: "t", subject: "s", cycle: "c", source_type: "paste" }
    });
    expect(result.limitations.some((l) => /english-only/i.test(l))).toBe(true);
  });
});
