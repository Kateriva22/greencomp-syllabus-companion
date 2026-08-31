import { useSession } from "../state/sessionStore";
import { analyzeDocument } from "../lib/analysis/engine";

const KIND_LABEL: Record<string, string> = {
  rationale: "Rationale",
  objectives: "Objectives",
  outcomes: "Learning outcomes",
  content: "Content",
  pedagogy: "Pedagogy",
  sequence: "Learning sequence",
  assessment: "Assessment",
  resources: "Resources",
  inclusion: "Inclusion",
  final_product: "Final product",
  local_adaptation: "Local adaptation",
  european_dimension: "European dimension",
  preparation: "Preparation",
  review: "Review",
  other: "Unclassified"
};

export default function StructurePreview() {
  const { state, dispatch } = useSession();
  const sections = state.sections ?? [];

  function handleStartReview() {
    if (!state.sections) return;
    const result = analyzeDocument({
      sections: state.sections,
      document: {
        title: state.title || "Untitled syllabus",
        subject: state.intake.subject || "Not specified",
        cycle: state.intake.cycle || "Not specified",
        source_type: state.sourceType === "paste" ? "paste" : state.sourceType ?? "paste"
      },
      cycle: state.intake.cycle
    });
    dispatch({ type: "SET_RESULT", result });
  }

  return (
    <div className="card">
      <h2>3. Recognised structure</h2>
      <p className="helper-text">
        These are the sections and tables the tool could recognise in the text you provided.
        Review them before starting the analysis — a section that was not recognised will still be
        analysed as part of the whole document, but section-specific rules may not apply to it.
      </p>
      <ul className="section-list">
        {sections.map((s) => (
          <li key={s.id}>
            <span>{s.heading}</span>
            <span className="badge">{KIND_LABEL[s.kind] ?? s.kind}</span>
          </li>
        ))}
      </ul>
      <div className="decision-controls">
        <button
          className="button secondary"
          onClick={() => dispatch({ type: "SET_STAGE", stage: "intake" })}
        >
          Back
        </button>
        <button className="button" onClick={handleStartReview}>
          Start review
        </button>
      </div>
    </div>
  );
}
