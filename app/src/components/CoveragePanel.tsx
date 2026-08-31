import { useState } from "react";
import type { CoverageEntry } from "../types/domain";
import { getCompetence, SCORE_LABELS, GREENCOMP } from "../data/greencomp";

export default function CoveragePanel({ coverage }: { coverage: CoverageEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="card" aria-labelledby="coverage-heading">
      <h2 id="coverage-heading">Current GreenComp coverage</h2>
      <p className="helper-text">
        GreenComp is non-prescriptive — a low or absent score is not a failing grade, and not every
        competence needs to appear in this unit. Levels: <strong>Not yet observed</strong>,{" "}
        <strong>Emerging</strong> (mentioned or isolated), <strong>Purposeful</strong> (observable
        in one stage of the unit), <strong>Embedded</strong> (observable across more than one
        stage).
      </p>
      <button
        type="button"
        className="button secondary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <table className="coverage-table">
          <thead>
            <tr>
              <th>Competence</th>
              <th>Area</th>
              <th>Level</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {coverage.map((c) => {
              const comp = getCompetence(c.competence_id);
              const area = GREENCOMP.areas.find((a) =>
                a.competences.some((x) => x.id === c.competence_id)
              );
              return (
                <tr key={c.competence_id}>
                  <td>
                    {c.competence_id} {comp?.name}
                  </td>
                  <td>{area?.name}</td>
                  <td>{SCORE_LABELS[c.score]}</td>
                  <td>{c.evidence}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
