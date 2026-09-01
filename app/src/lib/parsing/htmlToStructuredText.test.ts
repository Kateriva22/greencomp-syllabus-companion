import { describe, expect, it } from "vitest";
import { htmlToStructuredText } from "./htmlToStructuredText";

describe("htmlToStructuredText", () => {
  it("preserves headings as markdown-style heading lines", () => {
    const html = "<h1>My unit</h1><h2>1. Rationale</h2><p>Some text.</p>";
    const text = htmlToStructuredText(html);
    expect(text).toContain("# My unit");
    expect(text).toContain("## 1. Rationale");
    expect(text).toContain("Some text.");
  });

  it("preserves each <li> in a <ul> as a separate bullet line, not one collapsed run", () => {
    const html = "<h2>3. Learning outcomes</h2><ul><li>identify materials</li><li>describe energy use</li><li>name examples</li></ul>";
    const text = htmlToStructuredText(html);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    expect(lines).toContain("- identify materials");
    expect(lines).toContain("- describe energy use");
    expect(lines).toContain("- name examples");
    // The old buggy behaviour concatenated all <li> text into one line.
    expect(lines.some((l) => l.includes("identify materials") && l.includes("describe energy use"))).toBe(
      false
    );
  });

  it("preserves numbered <ol> items with numeric markers", () => {
    const html = "<h2>3. Learning outcomes</h2><ol><li>identify materials</li><li>describe energy use</li></ol>";
    const text = htmlToStructuredText(html);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    expect(lines).toContain("1. identify materials");
    expect(lines).toContain("2. describe energy use");
  });

  it("preserves nested lists with indentation", () => {
    const html = "<ul><li>Group work<ul><li>Choose roles</li></ul></li></ul>";
    const text = htmlToStructuredText(html);
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.some((l) => l.trim() === "- Group work")).toBe(true);
    expect(lines.some((l) => l.trim() === "- Choose roles" && l.startsWith("  "))).toBe(true);
  });

  it("converts manual <br> line breaks inside a paragraph into real newlines", () => {
    const html = "<p>Line one<br/>Line two<br/>Line three</p>";
    const text = htmlToStructuredText(html);
    expect(text).toContain("Line one");
    expect(text).toContain("Line two");
    expect(text).toContain("Line three");
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(expect.arrayContaining(["Line one", "Line two", "Line three"]));
    // They must be on distinct lines, not joined into one run.
    expect(lines.some((l) => l.includes("Line one") && l.includes("Line two"))).toBe(false);
  });

  it("preserves table rows as pipe-delimited lines with a header separator", () => {
    const html = `<h2>6. Six-week learning sequence</h2>
      <table>
        <tr><th>Week</th><th>Focus</th></tr>
        <tr><td>1</td><td>What is sustainability?</td></tr>
        <tr><td>3</td><td>Energy and water</td></tr>
      </table>`;
    const text = htmlToStructuredText(html);
    expect(text).toContain("| Week | Focus |");
    expect(text).toContain("| 1 | What is sustainability? |");
    expect(text).toContain("| 3 | Energy and water |");
  });

  it("strips literal pipe characters from table cells so rows stay well-formed", () => {
    const html = "<table><tr><td>A | B</td><td>ok</td></tr></table>";
    const text = htmlToStructuredText(html);
    const row = text.split("\n").find((l) => l.startsWith("| A"));
    expect(row).toBe("| A / B | ok |");
  });

  it("preserves document order across headings, lists and tables", () => {
    const html = [
      "<h2>1. Rationale</h2>",
      "<p>Intro text.</p>",
      "<h2>3. Learning outcomes</h2>",
      "<ol><li>identify materials</li><li>describe energy use</li></ol>",
      "<h2>7. Assessment</h2>",
      "<table><tr><th>Component</th></tr><tr><td>Quiz</td></tr></table>"
    ].join("");
    const text = htmlToStructuredText(html);
    const rationaleIdx = text.indexOf("# 1. Rationale");
    const outcomesIdx = text.indexOf("# 3. Learning outcomes");
    const assessmentIdx = text.indexOf("# 7. Assessment");
    expect(rationaleIdx).toBeGreaterThanOrEqual(0);
    expect(outcomesIdx).toBeGreaterThan(rationaleIdx);
    expect(assessmentIdx).toBeGreaterThan(outcomesIdx);
  });
});
