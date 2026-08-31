import type { DocumentMeta } from "../../types/domain";
import { parseTxt } from "./txtParser";
import { parseDocx } from "./docxParser";
import { parsePdf } from "./pdfParser";

export class UnsupportedFileError extends Error {}

export type SourceType = DocumentMeta["source_type"];

export interface ExtractedFile {
  text: string;
  sourceType: SourceType;
}

// Everything below runs in-browser against the File already selected by the
// user via a local file picker. Nothing here reads from or writes to a
// server; the File/ArrayBuffer stays in memory for the session only.
export async function extractTextFromFile(file: File): Promise<ExtractedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return { text: await parseTxt(file), sourceType: "txt" };
  }
  if (name.endsWith(".docx")) {
    return { text: await parseDocx(file), sourceType: "docx" };
  }
  if (name.endsWith(".pdf")) {
    return { text: await parsePdf(file), sourceType: "pdf" };
  }

  throw new UnsupportedFileError(
    "Unsupported file type. Please open a .txt, .docx or text-based .pdf file, or paste the text directly."
  );
}
