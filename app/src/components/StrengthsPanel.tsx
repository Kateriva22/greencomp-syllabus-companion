import type { Strength } from "../types/domain";

export default function StrengthsPanel({ strengths }: { strengths: Strength[] }) {
  return (
    <section className="card" aria-labelledby="strengths-heading">
      <h2 id="strengths-heading">Strengths to preserve</h2>
      {strengths.length === 0 ? (
        <p className="helper-text">
          No strengths were confidently detected from the wording alone — this does not mean the
          syllabus has none, only that this pass did not find clear textual evidence.
        </p>
      ) : (
        <ul>
          {strengths.map((s, i) => (
            <li key={i}>
              <strong>{s.location}:</strong> {s.evidence} — <em>{s.reason}</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
