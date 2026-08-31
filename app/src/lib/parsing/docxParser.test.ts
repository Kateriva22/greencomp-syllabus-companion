import { describe, expect, it, vi, beforeEach } from "vitest";

const convertToHtml = vi.fn();
vi.mock("mammoth", () => ({
  default: { convertToHtml: (...args: unknown[]) => convertToHtml(...args) }
}));

// Imported after the mock so parseDocx picks up the mocked mammoth.
const { parseDocx, DocxParseError } = await import("./docxParser");

function docxFile(): File {
  return new File([new Uint8Array([1, 2, 3])], "unit.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
}

beforeEach(() => {
  convertToHtml.mockReset();
});

describe("parseDocx", () => {
  it("preserves headings, bullet lists and tables from mammoth's HTML output", async () => {
    convertToHtml.mockResolvedValue({
      value:
        "<h2>3. Learning outcomes</h2><ul><li>identify materials</li><li>describe energy use</li></ul>" +
        "<h2>7. Assessment</h2><table><tr><th>Component</th></tr><tr><td>Quiz</td></tr></table>"
    });

    const text = await parseDocx(docxFile());
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    expect(lines).toContain("## 3. Learning outcomes");
    expect(lines).toContain("- identify materials");
    expect(lines).toContain("- describe energy use");
    expect(lines).toContain("## 7. Assessment");
    expect(lines.some((l) => l.startsWith("| Component"))).toBe(true);
  });

  it("throws a DocxParseError when mammoth returns no readable text", async () => {
    convertToHtml.mockResolvedValue({ value: "<p></p>" });
    await expect(parseDocx(docxFile())).rejects.toBeInstanceOf(DocxParseError);
  });

  it("throws a DocxParseError when mammoth itself fails to parse the file", async () => {
    convertToHtml.mockRejectedValue(new Error("not a valid zip"));
    await expect(parseDocx(docxFile())).rejects.toBeInstanceOf(DocxParseError);
  });
});
