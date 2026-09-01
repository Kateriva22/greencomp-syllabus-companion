import type { Suggestion } from "../types/domain";

// The single source of truth for "what wording is currently in force" for a
// suggestion, shared by the UI (SuggestionCard), the JSON export and the
// printable HTML export so all three always agree. edited_text is only
// meaningful while teacher_decision is "edited" — the session-store reducer
// clears it whenever the decision moves away from "edited", but this checks
// the decision explicitly too, so nothing downstream has to trust that
// invariant blindly.
export function effectiveWording(suggestion: Suggestion): string {
  return suggestion.teacher_decision === "edited" && suggestion.edited_text
    ? suggestion.edited_text
    : suggestion.suggested_wording;
}
