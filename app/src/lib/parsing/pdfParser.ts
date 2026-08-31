import * as pdfjsLib from "pdfjs-dist";
// Vite bundles the worker as a local asset (served from the app's own
// origin). This intentionally avoids pdf.js's default behaviour of loading
// its worker from a CDN, which would be a runtime network request.
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export class PdfParseError extends Error {}

const MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER = 15;

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
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pageTexts.push(pageText);
  }

  const totalChars = pageTexts.reduce((sum, t) => sum + t.length, 0);
  const averagePerPage = pdf.numPages > 0 ? totalChars / pdf.numPages : 0;
  if (averagePerPage < MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER) {
    throw new PdfParseError(
      "This PDF does not appear to contain a text layer (it may be a scanned or image-only document). " +
        "Scanned PDFs are out of scope for Phase 1 — please paste the text instead."
    );
  }

  return pageTexts.join("\n\n");
}
