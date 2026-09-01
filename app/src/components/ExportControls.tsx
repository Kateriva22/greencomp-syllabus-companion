import type { ReviewResult } from "../types/domain";
import { exportJson } from "../lib/export/jsonExport";
import { exportHtml } from "../lib/export/htmlExport";

export default function ExportControls({ result }: { result: ReviewResult }) {
  const counts = result.suggestions.reduce(
    (acc, s) => {
      acc[s.teacher_decision] += 1;
      return acc;
    },
    { pending: 0, accepted: 0, edited: 0, rejected: 0 }
  );

  return (
    <section className="card" aria-labelledby="export-heading">
      <h2 id="export-heading">Review and export</h2>
      <p className="helper-text">
        {counts.accepted} accepted · {counts.edited} edited · {counts.rejected} rejected ·{" "}
        {counts.pending} still pending.
      </p>
      <p className="helper-text">
        Export happens locally: a file is generated in your browser and saved to your device. No
        data is sent anywhere.
      </p>
      <div className="decision-controls">
        <button className="button" onClick={() => exportJson(result)}>
          Export JSON
        </button>
        <button className="button secondary" onClick={() => exportHtml(result)}>
          Export printable HTML report
        </button>
      </div>
    </section>
  );
}
