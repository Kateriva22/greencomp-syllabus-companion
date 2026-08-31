export class TxtParseError extends Error {}

export async function parseTxt(file: File): Promise<string> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new TxtParseError("This .txt file could not be read from disk.");
  }
  if (!text.trim()) {
    throw new TxtParseError("This .txt file appears to be empty.");
  }
  return text;
}
