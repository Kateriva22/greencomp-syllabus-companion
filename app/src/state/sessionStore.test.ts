import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SessionProvider, useSession } from "./sessionStore";
import type { ReviewResult, Suggestion } from "../types/domain";

const suggestion: Suggestion = {
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

const result: ReviewResult = {
  document: { title: "t", subject: "s", cycle: "c", source_type: "paste" },
  strengths: [],
  coverage: [],
  suggestions: [suggestion],
  limitations: []
};

function setup() {
  return renderHook(() => useSession(), { wrapper: SessionProvider });
}

describe("sessionStore SET_DECISION — edited_text consistency", () => {
  it("clears edited_text once the decision moves from 'edited' to 'accepted'", () => {
    const { result: hook } = setup();
    act(() => hook.current.dispatch({ type: "SET_RESULT", result }));
    act(() =>
      hook.current.dispatch({
        type: "SET_DECISION",
        id: "SUG-01",
        decision: "edited",
        editedText: "My custom wording."
      })
    );

    let current = hook.current.state.result!.suggestions[0];
    expect(current.teacher_decision).toBe("edited");
    expect(current.edited_text).toBe("My custom wording.");

    act(() => hook.current.dispatch({ type: "SET_DECISION", id: "SUG-01", decision: "accepted" }));

    current = hook.current.state.result!.suggestions[0];
    expect(current.teacher_decision).toBe("accepted");
    expect(current.edited_text).toBeUndefined();
  });

  it("clears edited_text once the decision moves from 'edited' to 'rejected'", () => {
    const { result: hook } = setup();
    act(() => hook.current.dispatch({ type: "SET_RESULT", result }));
    act(() =>
      hook.current.dispatch({
        type: "SET_DECISION",
        id: "SUG-01",
        decision: "edited",
        editedText: "My custom wording."
      })
    );
    act(() => hook.current.dispatch({ type: "SET_DECISION", id: "SUG-01", decision: "rejected" }));

    const current = hook.current.state.result!.suggestions[0];
    expect(current.teacher_decision).toBe("rejected");
    expect(current.edited_text).toBeUndefined();
  });

  it("keeps edited_text intact across repeated edits", () => {
    const { result: hook } = setup();
    act(() => hook.current.dispatch({ type: "SET_RESULT", result }));
    act(() =>
      hook.current.dispatch({ type: "SET_DECISION", id: "SUG-01", decision: "edited", editedText: "First draft." })
    );
    act(() =>
      hook.current.dispatch({ type: "SET_DECISION", id: "SUG-01", decision: "edited", editedText: "Second draft." })
    );

    const current = hook.current.state.result!.suggestions[0];
    expect(current.teacher_decision).toBe("edited");
    expect(current.edited_text).toBe("Second draft.");
  });
});
