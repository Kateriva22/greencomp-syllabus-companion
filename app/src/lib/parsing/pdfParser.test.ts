import { describe, expect, it } from "vitest";
import { reconstructPageText } from "./pdfParser";

// Minimal fake pdf.js TextItem builder. Real pdf.js items carry a 6-value
// transform matrix; only transform[4]/[5] (x/y) matter for reconstruction.
function item(str: string, x: number, y: number, opts: { height?: number; hasEOL?: boolean } = {}) {
  return {
    str,
    dir: "ltr",
    transform: [10, 0, 0, 10, x, y],
    width: str.length * 6,
    height: opts.height ?? 10,
    fontName: "f1",
    hasEOL: opts.hasEOL ?? false
  };
}

describe("reconstructPageText", () => {
  it("keeps items on the same baseline joined onto one line", () => {
    const items = [item("Hello", 0, 700), item("world", 40, 700)];
    expect(reconstructPageText(items)).toBe("Hello world");
  });

  it("starts a new output line when hasEOL is set", () => {
    const items = [
      item("## 3. Learning outcomes", 0, 700, { hasEOL: true }),
      item("identify materials", 0, 685, { hasEOL: true }),
      item("describe energy use", 0, 670, { hasEOL: true })
    ];
    const text = reconstructPageText(items);
    expect(text.split("\n")).toEqual([
      "## 3. Learning outcomes",
      "identify materials",
      "describe energy use"
    ]);
  });

  it("falls back to a y-coordinate jump to detect a new line when hasEOL is absent", () => {
    // Same line: two items sharing a baseline (y=700).
    // New line: y drops to 685, more than half the item height (10) away.
    const items = [
      item("Line", 0, 700),
      item("one", 30, 700),
      item("Line", 0, 685),
      item("two", 30, 685)
    ];
    const text = reconstructPageText(items);
    expect(text.split("\n")).toEqual(["Line one", "Line two"]);
  });

  it("does not split a line for tiny sub-pixel baseline jitter", () => {
    const items = [item("Hello", 0, 700.02), item("world", 40, 699.98)];
    expect(reconstructPageText(items)).toBe("Hello world");
  });

  it("ignores non-text marked-content items", () => {
    const items = [item("Hello", 0, 700), { type: "beginMarkedContent" }, item("world", 40, 700)];
    expect(reconstructPageText(items)).toBe("Hello world");
  });

  it("recovers multiple distinct headings/sections from a synthetic multi-line page", () => {
    const items = [
      item("## 1. Rationale", 0, 800, { hasEOL: true }),
      item("Raise awareness and make greener choices.", 0, 785, { hasEOL: true }),
      item("## 3. Learning outcomes", 0, 760, { hasEOL: true }),
      item("identify materials", 0, 745, { hasEOL: true }),
      item("## 7. Assessment", 0, 700, { hasEOL: true }),
      item("Neatness and correct vocabulary.", 0, 685, { hasEOL: true })
    ];
    const text = reconstructPageText(items);
    const lines = text.split("\n");
    expect(lines).toContain("## 1. Rationale");
    expect(lines).toContain("## 3. Learning outcomes");
    expect(lines).toContain("## 7. Assessment");
    expect(lines.indexOf("## 1. Rationale")).toBeLessThan(lines.indexOf("## 3. Learning outcomes"));
    expect(lines.indexOf("## 3. Learning outcomes")).toBeLessThan(lines.indexOf("## 7. Assessment"));
  });
});
