import mammoth from "mammoth";
import { htmlToStructuredText } from "./htmlToStructuredText";

export class DocxParseError extends Error {}

// mammoth runs entirely on the ArrayBuffer already in memory — it never
// makes a network request and does not need a server component.
export async function parseDocx(file: File): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new DocxParseError("This .docx file could not be read from disk.");
  }

  let html: string;
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    html = result.value;
  } catch {
    throw new DocxParseError(
      "This .docx file could not be parsed. It may be corrupted or password-protected."
    );
  }

  const text = htmlToStructuredText(html);
  if (!text.trim()) {
    throw new DocxParseError("No readable text was found in this .docx file.");
  }
  return text;
}
