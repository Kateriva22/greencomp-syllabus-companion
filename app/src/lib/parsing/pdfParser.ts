import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
// Vite bundles the worker as a local asset (served from the app's own
// origin). This intentionally avoids pdf.js's default behaviour of loading
// its worker from a CDN, which would be a runtime network request.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export class PdfParseError extends Error {}

const MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER = 15;
// A same-line item whose baseline y moves by more than this fraction of the
// item's own height is treated as starting a new line. pdf.js's `hasEOL`
// flag (set when the content stream itself marks a line break) is the
// primary signal; this y-jump check is a fallback for PDFs where hasEOL is
// not reliably set.
const LINE_BREAK_Y_JUMP_RATIO = 0.5;

function isTextItem(item: unknown): item is TextItem {
  return typeof item === "object" && item !== null && "str" in item;
}

// Reconstructs line boundaries from pdf.js's flat list of positioned text
// runs. Earlier versions of this parser joined every item on a page with a
// single space, which is fine for reading a paragraph but destroys heading
// and list-line boundaries entirely (a "## 3. Learning outcomes" heading
// and the outcome bullets that follow it would collapse into one line no
// section-heading regex could ever match). This keeps items on the same
// visual line joined by a space, but starts a new output line whenever
// pdf.js marks an end-of-line or the text jumps to a new baseline.
export function reconstructPageText(items: unknown[]): string {
  const lines: string[] = [];
  let current: string[] = [];
  let currentY: number | null = null;

  const flushLine = () => {
    if (current.length > 0) {
      lines.push(current.join(" ").replace(/[ \t]+/g, " ").trim());
      current = [];
    }
  };

  for (const raw of items) {
    if (!isTextItem(raw)) continue;
    const y = raw.transform?.[5];
    const height = raw.height || 1;
    const isNewLine =
      typeof y === "number" &&
      currentY !== null &&
      Math.abs(y - currentY) > height * LINE_BREAK_Y_JUMP_RATIO;

    if (isNewLine) flushLine();
    if (raw.str) current.push(raw.str);
    if (typeof y === "number") currentY = y;

    if (raw.hasEOL) {
      flushLine();
      currentY = null;
    }
  }
  flushLine();

  return lines.filter((l) => l.length > 0).join("\n");
}

export async function parsePdf(file: File): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new PdfParseError("This .pdf file could not be read from disk.");
  }

  let pdf;
  try {
    // Deliberately omit cMapUrl/standardFontDataUrl and pass `data` (an
    // in-memory buffer) rather than `url`: pdf.js's optional CMap/standard
    // font and streamed-download code paths only ever call fetch() when a
    // baseUrl/url is configured, so this keeps every network-capable path
    // in pdf.js unreachable. disableStream/disableAutoFetch reinforce that
    // no background fetch is attempted for range-requests either.
    pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      disableStream: true,
      disableAutoFetch: true
    }).promise;
  } catch {
    throw new PdfParseError(
      "This .pdf file could not be parsed. It may be corrupted or password-protected."
    );
  }

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    pageTexts.push(reconstructPageText(content.items));
  }

  const totalChars = pageTexts.reduce((sum, t) => sum + t.replace(/\s/g, "").length, 0);
  const averagePerPage = pdf.numPages > 0 ? totalChars / pdf.numPages : 0;
  if (averagePerPage < MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER) {
    throw new PdfParseError(
      "This PDF does not appear to contain a text layer (it may be a scanned or image-only document). " +
        "Scanned PDFs are out of scope for Phase 1 — please paste the text instead."
    );
  }

  // Tables inside a PDF are not reconstructed (pdf.js returns flat
  // positioned text, not table structure) — a known Phase 1 limitation
  // documented in README.md. Table-dependent rules simply won't have
  // anything to match for a PDF-only input.
  return pageTexts.join("\n\n");
}
