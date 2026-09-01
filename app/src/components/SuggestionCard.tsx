import { useState } from "react";
import type { Suggestion } from "../types/domain";
import { useSession } from "../state/sessionStore";
import { effectiveWording } from "../lib/suggestionWording";

const CATEGORY_LABEL: Record<string, string> = {
  values_and_rationale: "Values and rationale",
  learning_outcomes: "Learning outcomes",
  pupil_agency: "Pupil agency",
  systems_inquiry: "Systems inquiry",
  critical_and_futures_thinking: "Critical and futures thinking",
  authentic_action: "Authentic action",
  assessment_alignment: "Assessment alignment",
  portfolio_and_review: "Portfolio and review"
};

export default function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const { dispatch } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(effectiveWording(suggestion));

  function decide(decision: Suggestion["teacher_decision"], editedText?: string) {
    dispatch({ type: "SET_DECISION", id: suggestion.id, decision, editedText });
    setIsEditing(false);
  }

  function startEditing() {
    // Always start from the wording currently in force, never from
    // whatever was left in the textarea by a previous edit session that
    // was since abandoned (e.g. Edit -> Accept -> Edit again).
    setDraft(effectiveWording(suggestion));
    setIsEditing(true);
  }

  return (
    <article className="card suggestion-card" aria-labelledby={`${suggestion.id}-heading`}>
      <header>
        <h3 id={`${suggestion.id}-heading`}>
          {CATEGORY_LABEL[suggestion.category] ?? suggestion.category}
        </h3>
        <span className={`badge priority-${suggestion.priority}`}>
          {suggestion.priority} priority · {suggestion.confidence} confidence
        </span>
      </header>

      <dl>
        <dt>Location</dt>
        <dd>{suggestion.location}</dd>

        <dt>Current wording</dt>
        <dd>“{suggestion.current_excerpt}”</dd>

        <dt>Observed gap</dt>
        <dd>{suggestion.observed_gap}</dd>

        <dt>Related competences</dt>
        <dd>{suggestion.competence_ids.join(", ")}</dd>

        <dt>Suggested wording</dt>
        <dd>
          {isEditing ? (
            <textarea
              aria-label={`Edit suggested wording for ${suggestion.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            effectiveWording(suggestion)
          )}
        </dd>

        <dt>Implementation example</dt>
        <dd>{suggestion.implementation_example}</dd>

        <dt>Assessment evidence</dt>
        <dd>{suggestion.assessment_evidence}</dd>

        {suggestion.european_schools_context && (
          <>
            <dt>European Schools context</dt>
            <dd>{suggestion.european_schools_context}</dd>
          </>
        )}

        <dt>Rule basis</dt>
        <dd className="helper-text">{suggestion.rule_basis.join(" ")}</dd>
      </dl>

      <div className="decision-controls">
        {isEditing ? (
          <>
            <button className="button" onClick={() => decide("edited", draft)}>
              Save edit
            </button>
            <button className="button secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="button" onClick={() => decide("accepted")}>
              Accept
            </button>
            <button className="button secondary" onClick={startEditing}>
              Edit
            </button>
            <button className="button danger" onClick={() => decide("rejected")}>
              Reject
            </button>
          </>
        )}
        <span className="decision-status">{`Status: ${suggestion.teacher_decision}`}</span>
      </div>
    </article>
  );
}
