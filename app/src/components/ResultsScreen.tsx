import { useSession } from "../state/sessionStore";
import StrengthsPanel from "./StrengthsPanel";
import CoveragePanel from "./CoveragePanel";
import SuggestionCard from "./SuggestionCard";
import LimitationsPanel from "./LimitationsPanel";
import ExportControls from "./ExportControls";

export default function ResultsScreen() {
  const { state } = useSession();
  const result = state.result;
  if (!result) return null;

  return (
    <div>
      <h2>Review results — {result.document.title}</h2>
      <StrengthsPanel strengths={result.strengths} />
      <CoveragePanel coverage={result.coverage} />

      <section aria-labelledby="suggestions-heading">
        <h2 id="suggestions-heading">Suggestions ({result.suggestions.length})</h2>
        {result.suggestions.length === 0 ? (
          <p className="helper-text">No section-anchored suggestions were generated.</p>
        ) : (
          result.suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)
        )}
      </section>

      <LimitationsPanel limitations={result.limitations} />
      <ExportControls result={result} />
    </div>
  );
}
