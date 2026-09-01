import { describe, expect, it } from "vitest";
import inputSyllabus from "../../../../test-cases/test-case-01/input_syllabus.md?raw";
import goldStandard from "../../../../test-cases/test-case-01/gold_standard.json";
import { segmentDocument } from "../parsing/sectionSegmenter";
import { analyzeDocument } from "./engine";

// Acceptance test required by PROJECT_BRIEF §9: Test Case 01. Compares
// stable finding categories and required-field shapes against
// gold_standard.json's minimum_pass criteria — never exact prose, since the
// engine is deterministic pattern-matching, not a copy of the gold text.
describe("Test Case 01 acceptance", () => {
  const sections = segmentDocument(inputSyllabus);
  const result = analyzeDocument({
    sections,
    document: {
      title: "Our Sustainable School: Small Actions, Big Difference",
      subject: "European Hours",
      cycle: "P4-P5",
      source_type: "txt"
    },
    cycle: "P4-P5"
  });

  it("detects at least 5 of the 6 core gap categories", () => {
    const detectedCategories = new Set(result.suggestions.map((s) => s.category));
    const coreCategories: string[] = goldStandard.core_gap_categories;
    const detectedCoreCount = coreCategories.filter((c) => detectedCategories.has(c)).length;
    expect(detectedCoreCount).toBeGreaterThanOrEqual(goldStandard.minimum_pass.core_gap_categories_detected);
  });

  it("detects every mandatory category (pupil agency, authentic action, assessment alignment)", () => {
    const detectedCategories = new Set(result.suggestions.map((s) => s.category));
    for (const mandatory of goldStandard.minimum_pass.mandatory_categories) {
      expect(detectedCategories.has(mandatory)).toBe(true);
    }
  });

  it("returns at least the minimum number of actionable suggestions, capped at the maximum", () => {
    expect(result.suggestions.length).toBeGreaterThanOrEqual(
      goldStandard.minimum_pass.minimum_actionable_suggestions
    );
    expect(result.suggestions.length).toBeLessThanOrEqual(goldStandard.minimum_pass.maximum_default_suggestions);
  });

  it("acknowledges at least the minimum number of strengths", () => {
    expect(result.strengths.length).toBeGreaterThanOrEqual(goldStandard.minimum_pass.minimum_strengths);
  });

  it("every suggestion is anchored to a specific location and quotes the current text", () => {
    for (const s of result.suggestions) {
      expect(s.location.length).toBeGreaterThan(0);
      expect(s.current_excerpt.length).toBeGreaterThan(0);
      expect(s.rule_basis.length).toBeGreaterThan(0);
    }
  });

  it("maps at most 4 competences per suggestion and only uses valid competence ids", () => {
    const validIds = new Set(goldStandard.baseline_scores ? Object.keys(goldStandard.baseline_scores) : []);
    for (const s of result.suggestions) {
      expect(s.competence_ids.length).toBeGreaterThan(0);
      expect(s.competence_ids.length).toBeLessThanOrEqual(4);
      for (const id of s.competence_ids) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it("does not treat all 12 competences as compulsory (coverage includes absent competences)", () => {
    const absentCount = result.coverage.filter((c) => c.score === 0).length;
    expect(absentCount).toBeGreaterThan(0);
    expect(result.coverage).toHaveLength(12);
  });

  it("every suggestion starts as pending, requiring an explicit teacher decision", () => {
    for (const s of result.suggestions) {
      expect(s.teacher_decision).toBe("pending");
    }
  });
});
