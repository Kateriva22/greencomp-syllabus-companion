import type { ReviewResult } from "../../types/domain";
import { getCompetence, SCORE_LABELS } from "../../data/greencomp";
import { downloadFile } from "./jsonExport";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decisionLabel(result: ReviewResult, id: string): string {
  const s = result.suggestions.find((x) => x.id === id);
  return s?.teacher_decision ?? "pending";
}

export function toPrintableHtml(result: ReviewResult): string {
  const strengthsHtml = result.strengths
    .map(
      (s) => `<li><strong>${esc(s.location)}:</strong> ${esc(s.evidence)} — <em>${esc(s.reason)}</em></li>`
    )
    .join("\n");

  const coverageHtml = result.coverage
    .map((c) => {
      const comp = getCompetence(c.competence_id);
      return `<tr><td>${esc(c.competence_id)} ${esc(comp?.name ?? "")}</td><td>${SCORE_LABELS[c.score]}</td><td>${esc(c.evidence)}</td></tr>`;
    })
    .join("\n");

  const suggestionsHtml = result.suggestions
    .map(
      (s) => `
      <article class="suggestion">
        <h3>${esc(s.id)} · ${esc(s.category.replace(/_/g, " "))} <span class="tag">${esc(s.priority)} priority · ${esc(s.confidence)} confidence</span></h3>
        <p class="location"><strong>Location:</strong> ${esc(s.location)}</p>
        <p><strong>Current wording:</strong> “${esc(s.current_excerpt)}”</p>
        <p><strong>Observed gap:</strong> ${esc(s.observed_gap)}</p>
        <p><strong>Related GreenComp competences:</strong> ${s.competence_ids.map(esc).join(", ")}</p>
        <p><strong>Suggested wording:</strong> ${esc(s.teacher_decision === "edited" && s.edited_text ? s.edited_text : s.suggested_wording)}</p>
        <p><strong>Implementation example:</strong> ${esc(s.implementation_example)}</p>
        <p><strong>Assessment evidence:</strong> ${esc(s.assessment_evidence)}</p>
        ${s.european_schools_context ? `<p><strong>European Schools context:</strong> ${esc(s.european_schools_context)}</p>` : ""}
        <p><strong>Rule basis:</strong> ${s.rule_basis.map(esc).join(" ")}</p>
        <p><strong>Teacher decision:</strong> ${esc(decisionLabel(result, s.id))}</p>
      </article>`
    )
    .join("\n");

  const limitationsHtml = result.limitations.map((l) => `<li>${esc(l)}</li>`).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>GreenComp review — ${esc(result.document.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; color: #1c2a1e; line-height: 1.5; }
  h1, h2 { color: #2f5233; }
  .meta { color: #46543f; margin-bottom: 1.5rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #cbd6c8; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
  .suggestion { border: 1px solid #cbd6c8; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  .tag { font-weight: normal; font-size: 0.8em; color: #46543f; }
  .location { font-size: 0.9em; color: #46543f; }
  @media print { .suggestion { break-inside: avoid; } }
</style>
</head>
<body>
  <h1>GreenComp syllabus review</h1>
  <p class="meta">${esc(result.document.title)} — ${esc(result.document.subject)}, ${esc(result.document.cycle)}</p>

  <h2>Strengths to preserve</h2>
  <ul>${strengthsHtml || "<li>No strengths were confidently detected in the reviewed text.</li>"}</ul>

  <h2>GreenComp coverage overview</h2>
  <table>
    <thead><tr><th>Competence</th><th>Level</th><th>Evidence</th></tr></thead>
    <tbody>${coverageHtml}</tbody>
  </table>

  <h2>Suggestions</h2>
  ${suggestionsHtml || "<p>No suggestions were generated.</p>"}

  <h2>Limitations and confidence</h2>
  <ul>${limitationsHtml}</ul>

  <p class="meta">GreenComp is non-prescriptive. This report reflects a deterministic, rule-based review, not an official judgement.</p>
</body>
</html>`;
}

export function exportHtml(result: ReviewResult): void {
  const filename = `greencomp-review-${result.document.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}.html`;
  downloadFile(filename, toPrintableHtml(result), "text/html");
}
