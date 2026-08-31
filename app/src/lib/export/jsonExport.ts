import type { ReviewResult } from "../../types/domain";

export function toJsonString(result: ReviewResult): string {
  return JSON.stringify(result, null, 2);
}

// Local-only download: builds an object URL from an in-memory Blob and
// revokes it immediately after triggering the click. No network request,
// no server round-trip — the browser writes straight to the user's disk.
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportJson(result: ReviewResult): void {
  downloadFile(
    `greencomp-review-${slug(result.document.title)}.json`,
    toJsonString(result),
    "application/json"
  );
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "syllabus"
  );
}
