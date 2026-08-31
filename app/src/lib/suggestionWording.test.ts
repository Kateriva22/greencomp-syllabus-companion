import { describe, expect, it } from "vitest";
import { effectiveWording } from "./suggestionWording";
import type { Suggestion } from "../types/domain";

const base: Suggestion = {
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
  teacher_decision: "pending"
};

describe("effectiveWording", () => {
  it("returns the original suggested_wording while pending", () => {
    expect(effectiveWording(base)).toBe("Give pupils a bounded choice.");
  });

  it("returns edited_text when the decision is 'edited'", () => {
    const edited = { ...base, teacher_decision: "edited" as const, edited_text: "My custom wording." };
    expect(effectiveWording(edited)).toBe("My custom wording.");
  });

  it("returns the original suggested_wording when accepted, even if a stale edited_text is present", () => {
    // Regression: a suggestion that was edited and then accepted must not
    // keep surfacing the abandoned draft anywhere (UI, JSON, HTML export).
    const staleEdit = {
      ...base,
      teacher_decision: "accepted" as const,
      edited_text: "An abandoned draft that should never resurface."
    };
    expect(effectiveWording(staleEdit)).toBe("Give pupils a bounded choice.");
  });

  it("returns the original suggested_wording when rejected, even if a stale edited_text is present", () => {
    const staleEdit = {
      ...base,
      teacher_decision: "rejected" as const,
      edited_text: "An abandoned draft that should never resurface."
    };
    expect(effectiveWording(staleEdit)).toBe("Give pupils a bounded choice.");
  });
});
