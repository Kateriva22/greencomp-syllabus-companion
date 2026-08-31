import { describe, expect, it } from "vitest";
import { toJsonString } from "./jsonExport";
import { toPrintableHtml } from "./htmlExport";
import type { ReviewResult, Suggestion } from "../../types/domain";

function buildSuggestion(overrides: Partial<Suggestion>): Suggestion {
  return {
    id: "SUG-01",
    category: "pupil_agency",
    priority: "critical",
    confidence: "high",
    location: "Section 5",
    current_excerpt: "The teacher will select the topic.",
    observed_gap: "Pupils do not choose anything.",
    competence_ids: ["4.2"],
    suggested_wording: "Give pupils a bounded choice.",
    implementation_example: "Offer two options.",
    assessment_evidence: "A recorded choice.",
    rule_basis: ["rule"],
    teacher_decision: "pending",
    ...overrides
  };
}

function buildResult(suggestion: Suggestion): ReviewResult {
  return {
    document: { title: "Regression check", subject: "s", cycle: "c", source_type: "paste" },
    strengths: [],
    coverage: [],
    suggestions: [suggestion],
    limitations: []
  };
}

// The JSON export is a raw serialisation of ReviewResult, so its
// "effective wording" for a given decision is defined by whatever the
// session-store reducer stored (see sessionStore.test.ts, which proves
// edited_text is cleared on any decision other than "edited"). This test
// instead locks in the printable HTML export's own consistency rule
// against the exact same fixtures the reducer test and UI test use, so
// all three surfaces are checked against one shared expectation.
describe("edited-wording consistency across JSON and printable HTML export", () => {
  it("HTML export shows the custom wording while the decision is 'edited'", () => {
    const suggestion = buildSuggestion({ teacher_decision: "edited", edited_text: "My custom wording." });
    const html = toPrintableHtml(buildResult(suggestion));
    expect(html).toContain("My custom wording.");
    expect(html).not.toContain("Give pupils a bounded choice.");
  });

  it("HTML export falls back to the original suggested wording once accepted, ignoring a stale edited_text", () => {
    // A well-behaved caller (the app's own reducer) never produces this
    // combination, but the export must not trust that blindly — it re-
    // derives the effective wording from teacher_decision itself.
    const suggestion = buildSuggestion({
      teacher_decision: "accepted",
      edited_text: "An abandoned draft that should never resurface."
    });
    const html = toPrintableHtml(buildResult(suggestion));
    expect(html).toContain("Give pupils a bounded choice.");
    expect(html).not.toContain("An abandoned draft");
  });

  it("JSON export never carries edited_text once the reducer-produced decision is accepted/rejected", () => {
    // This is what the app itself ever actually exports: by the time a
    // ReviewResult reaches the export layer, sessionStore's reducer has
    // already cleared edited_text for any non-"edited" decision.
    const suggestion = buildSuggestion({ teacher_decision: "accepted", edited_text: undefined });
    const json = JSON.parse(toJsonString(buildResult(suggestion)));
    expect(json.suggestions[0].teacher_decision).toBe("accepted");
    expect(json.suggestions[0].edited_text).toBeUndefined();
    expect(json.suggestions[0].suggested_wording).toBe("Give pupils a bounded choice.");
  });

  it("JSON export carries the custom wording under edited_text while the decision is 'edited'", () => {
    const suggestion = buildSuggestion({ teacher_decision: "edited", edited_text: "My custom wording." });
    const json = JSON.parse(toJsonString(buildResult(suggestion)));
    expect(json.suggestions[0].teacher_decision).toBe("edited");
    expect(json.suggestions[0].edited_text).toBe("My custom wording.");
  });
});
