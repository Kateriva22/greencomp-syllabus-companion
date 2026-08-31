import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuggestionCard from "./SuggestionCard";
import { SessionProvider, useSession } from "../state/sessionStore";
import type { ReviewResult, Suggestion } from "../types/domain";

const suggestion: Suggestion = {
  id: "SUG-01",
  category: "pupil_agency",
  priority: "critical",
  confidence: "high",
  location: "Section 5",
  current_excerpt: "The teacher will select the topic.",
  observed_gap: "Pupils do not choose anything.",
  competence_ids: ["4.2", "4.3"],
  suggested_wording: "Give pupils a bounded choice.",
  implementation_example: "Offer two options.",
  assessment_evidence: "A recorded choice.",
  rule_basis: ["Rule: pupil_agency — matched teacher-control wording."],
  teacher_decision: "pending"
};

const result: ReviewResult = {
  document: { title: "t", subject: "s", cycle: "c", source_type: "paste" },
  strengths: [],
  coverage: [],
  suggestions: [suggestion],
  limitations: []
};

// Mirrors how ResultsScreen actually renders a card: the suggestion prop
// comes from session state and is re-read after every dispatch, so a
// decision made in the card is reflected back through context, not through
// a prop the card owns itself.
function Harness() {
  const { state, dispatch } = useSession();
  useEffect(() => {
    dispatch({ type: "SET_RESULT", result });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const current = state.result?.suggestions.find((s) => s.id === "SUG-01");
  if (!current) return null;
  return <SuggestionCard suggestion={current} />;
}

function renderCard() {
  return render(
    <SessionProvider>
      <Harness />
    </SessionProvider>
  );
}

describe("SuggestionCard", () => {
  it("shows the required anchoring fields", () => {
    renderCard();
    expect(screen.getByText("Section 5")).toBeInTheDocument();
    expect(screen.getByText(/The teacher will select the topic\./)).toBeInTheDocument();
    expect(screen.getByText("Status: pending")).toBeInTheDocument();
  });

  it("lets the teacher accept a suggestion", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(screen.getByText("Status: accepted")).toBeInTheDocument();
  });

  it("lets the teacher reject a suggestion", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByText("Status: rejected")).toBeInTheDocument();
  });

  it("lets the teacher edit and save custom wording", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const textarea = screen.getByLabelText(/Edit suggested wording/);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "My own wording.");
    await userEvent.click(screen.getByRole("button", { name: "Save edit" }));
    expect(screen.getByText("Status: edited")).toBeInTheDocument();
    expect(screen.getByText("My own wording.")).toBeInTheDocument();
  });
});
