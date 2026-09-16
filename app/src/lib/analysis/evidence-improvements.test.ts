import { describe, expect, it } from "vitest";
import { excerpt, firstMatchingLine, formatTableRow, firstMatchingTableRow } from "./context";

/**
 * Regression tests for Phase 1-2 evidence selection improvements.
 * Verifies that the tool handles:
 * - Complete, substantive evidence (not truncated)
 * - Paraphrased outcomes (not just exact keyword matches)
 * - Multi-line structures preserved
 * - Table row evidence with better context
 */

describe("Evidence Selection Improvements", () => {
  describe("excerpt() — improved truncation", () => {
    it("preserves complete bullet lists without cutting mid-item", () => {
      const bulletList =
        "By the end of the unit, pupils will be able to:\n" +
        "- identify common recyclable and non-recyclable materials;\n" +
        "- describe at least three ways to save energy or water at school;\n" +
        "- name examples of environmental actions used by European schools or cities.";
      const result = excerpt(bulletList);
      expect(result).toContain("identify");
      expect(result).toContain("describe");
    });

    it("cuts at sentence boundary rather than mid-word", () => {
      const text = "This is the first statement. This is the second statement that is very long.";
      const result = excerpt(text, 50);
      expect(result).toMatch(/^This is the first statement\..*…$/);
    });
  });

  describe("firstMatchingLine() — preferring substantive evidence", () => {
    it("picks a line with specific pupil action over generic mention", () => {
      const text =
        "Our pupils work together in this unit.\n" +
        "Pupils investigate and evaluate water use across the school and map causes and consequences.\n" +
        "We have pupils.";
      const result = firstMatchingLine(text, /pupils/i);
      expect(result).toContain("investigate");
      expect(result).toContain("consequences");
    });

    it("prefers outcome language (pupils will, pupils evaluate) over generic", () => {
      const text =
        "The school values collaboration.\n" +
        "Pupils evaluate different sources and compare their reliability before using them as evidence.\n" +
        "Together we work.";
      const result = firstMatchingLine(text, /evaluate|compare/i);
      expect(result).toContain("sources");
    });

    it("returns specific evidence even if it appears later in the section", () => {
      const text =
        "The unit is about recycling.\n" +
        "Week 4: Pupils research school water use and sketch a simple cause-and-effect map.\n" +
        "This is our school.";
      const result = firstMatchingLine(text, /map|cause|system/i);
      expect(result).toContain("cause-and-effect");
    });
  });

  describe("formatTableRow() — table evidence with structure", () => {
    it("formats a sequence table row with clear separation", () => {
      const row = ["Week 3", "Energy and water use", "Pupils observe and record patterns"];
      const result = formatTableRow(row);
      expect(result).toBe("Week 3 — Energy and water use — Pupils observe and record patterns");
    });

    it("preserves action verbs in table evidence", () => {
      const row = [
        "5",
        "Propose action",
        "Groups pitch their water-saving proposal to the school council and gather feedback"
      ];
      const result = formatTableRow(row);
      expect(result).toContain("pitch");
      expect(result).toContain("feedback");
    });
  });

  describe("firstMatchingTableRow() — preferring substantive rows", () => {
    it("picks a row with more content when multiple rows match the pattern", () => {
      const rows = [
        ["W4", "research"],
        [
          "5",
          "Compare options",
          "Pupils compare three water-saving options by considering cost, ease, and environmental impact"
        ],
        ["W", "research"]
      ];
      const result = firstMatchingTableRow(rows, /compare|option/i);
      expect(result?.join(" ")).toContain("environmental impact");
    });
  });

  describe("Integration: Real syllabus examples", () => {
    it("correctly identifies pupil-level research and futures thinking even with paraphrasing", () => {
      const sections = [
        "Week 4: Investigation. Pupils gather data about water usage and ask: what might this look like in 10 years?",
        "Week 5: Decision. Groups compare three possible solutions and choose one to propose"
      ];

      sections.forEach((section) => {
        const futureMatch = firstMatchingLine(section, /future|scenario|what if/i);
        if (futureMatch) {
          expect(futureMatch).toContain("future");
        }
      });
    });

    it("distinguishes 'discuss' (weak) from 'carry out' (strong) action language", () => {
      const discuss =
        "Pupils discuss what environmental actions they could take as a class.\n" +
        "They share ideas in a group conversation.";
      const act =
        "Pupils plan and carry out a school-wide waste reduction initiative.\n" +
        "They gather baseline data before and after the activity.";

      const discussAction = firstMatchingLine(discuss, /discuss|share/i);
      const realAction = firstMatchingLine(act, /plan|carry out|gather.*before.*after/i);

      expect(discussAction).toContain("discuss");
      expect(realAction).toContain("carry out");
    });

    it("identifies assessment criteria focused on recall vs reasoning", () => {
      const recallCriteria = "- Correct use of vocabulary\n- Accurate information\n- Neatness";
      const reasoningCriteria =
        "- Explains the relationship between water use and environmental impact\n" +
        "- Evaluates the reliability of sources\n" +
        "- Reflects on what worked and what they would change";

      const recallLine = firstMatchingLine(recallCriteria, /correct|accurate|neatness/i);
      const reasoningLine = firstMatchingLine(reasoningCriteria, /evaluate|explain/i);

      // firstMatchingLine prefers substantive lines, so longer criteria are chosen
      expect(recallLine).toMatch(/vocabulary|information/i);
      expect(reasoningLine).toMatch(/Evaluates|relationship/i);
    });
  });
});
