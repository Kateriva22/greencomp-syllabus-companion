import { describe, expect, it } from "vitest";
import {
  detectSectionContentTypes,
  confidenceMultiplier,
  isInstitutional,
  isAssessment,
  isPupilInitiated,
  isConcreteAction
} from "./contentTypeDetector";

describe("detectSectionContentTypes", () => {
  it("identifies outcome-focused sections", () => {
    const outcomeText = "By the end of the unit, pupils will be able to:\n" +
      "- identify common recyclable materials\n" +
      "- describe three ways to save water\n" +
      "- evaluate the effectiveness of conservation methods";
    const types = detectSectionContentTypes(outcomeText);
    expect(types).toContain("outcome");
  });

  it("identifies assessment-focused sections", () => {
    const assessmentText = "Assessment\n" +
      "- Correct use of vocabulary (20%)\n" +
      "- Evidence of investigation (40%)\n" +
      "- Quality of recommendations (40%)";
    const types = detectSectionContentTypes(assessmentText);
    expect(types).toContain("assessment");
  });

  it("identifies activity-focused sections", () => {
    const activityText = "Week 3: Pupils investigate water use in the school.\n" +
      "In groups, students map the water flows and identify waste.\n" +
      "The teacher provides a simple systems diagram template.";
    const types = detectSectionContentTypes(activityText);
    expect(types).toContain("activity");
  });

  it("identifies institutional/mission statements", () => {
    const institutionalText = "Pupils encounter messages about climate change in their daily lives.\n" +
      "This unit introduces practical environmental actions.\n" +
      "It aims to raise awareness and encourage greener choices.";
    const types = detectSectionContentTypes(institutionalText);
    expect(types).toContain("institutional");
  });

  it("detects mixed content types", () => {
    const mixedText = "Learning Outcomes\n" +
      "Pupils will be able to evaluate different energy sources.\n" +
      "Assessment: Pupils present a choice between two options with justified reasoning.";
    const types = detectSectionContentTypes(mixedText);
    expect(types).toContain("mixed");
  });

  it("returns empty array for non-content text", () => {
    const otherText = "Resources: worksheets, videos, poster paper, markers";
    const types = detectSectionContentTypes(otherText);
    expect(types).toHaveLength(0);
  });
});

describe("confidenceMultiplier", () => {
  it("returns 1.0 for outcome-type content (high confidence)", () => {
    expect(confidenceMultiplier(["outcome"])).toBe(1.0);
  });

  it("returns 1.0 for assessment-type content (high confidence)", () => {
    expect(confidenceMultiplier(["assessment"])).toBe(1.0);
  });

  it("returns 0.7 for activity-type content (medium confidence)", () => {
    expect(confidenceMultiplier(["activity"])).toBe(0.7);
  });

  it("returns 0.3 for institutional content (low confidence)", () => {
    expect(confidenceMultiplier(["institutional"])).toBe(0.3);
  });

  it("returns 0.6 for mixed content (medium-low confidence)", () => {
    expect(confidenceMultiplier(["mixed"])).toBe(0.6);
  });

  it("returns 1.0 for empty content type array (default)", () => {
    expect(confidenceMultiplier([])).toBe(1.0);
  });

  it("prefers outcome/assessment over activity when multiple specific types present", () => {
    expect(confidenceMultiplier(["activity", "outcome"])).toBe(1.0);
    expect(confidenceMultiplier(["activity", "assessment"])).toBe(1.0);
  });
});

describe("isInstitutional", () => {
  it("recognizes mission statement language", () => {
    expect(isInstitutional("Pupils encounter messages about climate change.")).toBe(true);
    expect(isInstitutional("This unit aims to raise awareness.")).toBe(true);
    expect(isInstitutional("Our school values environmental stewardship.")).toBe(true);
  });

  it("returns false for outcome language", () => {
    expect(isInstitutional("By the end, pupils will be able to evaluate sources.")).toBe(false);
  });

  it("returns false for activity language", () => {
    expect(isInstitutional("Pupils investigate water use in the school.")).toBe(false);
  });
});

describe("isAssessment", () => {
  it("recognizes assessment criteria language", () => {
    expect(isAssessment("Assessment: Pupils present evidence of their decision.")).toBe(true);
    expect(isAssessment("- Demonstrates understanding through justified reasoning (40%)")).toBe(true);
    expect(isAssessment("Criterion: Explains relationships between variables.")).toBe(true);
  });

  it("returns false for learning outcome language", () => {
    expect(isAssessment("By the end, pupils will identify key concepts.")).toBe(false);
  });
});

describe("isPupilInitiated", () => {
  it("recognizes pupil-led/pupil-choice language", () => {
    expect(isPupilInitiated("Pupils choose which local issue to investigate.")).toBe(true);
    expect(isPupilInitiated("Students decide among three proposed solutions.")).toBe(true);
    expect(isPupilInitiated("Pupil-led research project where students propose topics.")).toBe(true);
    expect(isPupilInitiated("The group chooses their focus for the unit.")).toBe(true);
  });

  it("returns false for teacher-directed language", () => {
    expect(isPupilInitiated("The teacher selects the research topic.")).toBe(false);
    expect(isPupilInitiated("Pupils follow the teacher-provided instructions.")).toBe(false);
    expect(isPupilInitiated("Students complete the assigned worksheet.")).toBe(false);
  });

  it("returns false for activity description without agency marker", () => {
    expect(isPupilInitiated("Pupils investigate water use in the school.")).toBe(false);
  });
});

describe("isConcreteAction", () => {
  it("recognizes concrete action language", () => {
    expect(isConcreteAction("Pupils carry out a school-wide waste reduction initiative.")).toBe(true);
    expect(isConcreteAction("The class plants 50 native trees in the school garden.")).toBe(true);
    expect(isConcreteAction("Groups pitch their proposal to the school council and gather feedback.")).toBe(true);
    expect(isConcreteAction("Before-and-after measurements show the impact of the action.")).toBe(true);
  });

  it("returns false for discussion/awareness without action", () => {
    expect(isConcreteAction("Pupils discuss environmental actions they could take.")).toBe(false);
    expect(isConcreteAction("Students share ideas about climate solutions.")).toBe(false);
    expect(isConcreteAction("The class talks about ways to save water.")).toBe(false);
  });

  it("returns false for research-only activities", () => {
    expect(isConcreteAction("Pupils research different energy sources.")).toBe(false);
    expect(isConcreteAction("Students investigate global warming causes.")).toBe(false);
  });

  it("recognizes action with measurement/evidence", () => {
    expect(isConcreteAction("Measure water use before and after the initiative.")).toBe(true);
    expect(isConcreteAction("Gather feedback from stakeholders on the impact.")).toBe(true);
    expect(isConcreteAction("Evidence of effect: litter count decreased by 30%.")).toBe(true);
  });
});
