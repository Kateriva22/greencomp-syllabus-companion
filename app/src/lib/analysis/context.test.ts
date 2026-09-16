import { describe, expect, it } from "vitest";
import { buildRuleContext, excerpt, firstMatchingLine, formatTableRow, firstMatchingTableRow } from "./context";
import type { DocumentSection } from "../../types/domain";

function section(overrides: Partial<DocumentSection>): DocumentSection {
  return {
    id: "s",
    heading: "Section",
    kind: "other",
    level: 2,
    text: "",
    startLine: 0,
    ...overrides
  };
}

describe("buildRuleContext().section() — most-substantive selection", () => {
  it("picks the section with more content when two sections share a kind", () => {
    const toc = section({ id: "s1", heading: "2. Assessment", kind: "assessment", text: "" });
    const real = section({
      id: "s2",
      heading: "7. Assessment",
      kind: "assessment",
      text: "",
      tableRows: [
        ["Component", "Weight", "Main criteria"],
        ["Poster", "100%", "Neatness and correct vocabulary"]
      ]
    });
    const ctx = buildRuleContext([toc, real]);
    expect(ctx.section("assessment")).toBe(real);
  });

  it("still picks the substantive section when the table-of-contents entry comes first in the array", () => {
    const toc = section({ id: "s1", heading: "3. Learning outcomes", kind: "outcomes", text: "" });
    const real = section({
      id: "s2",
      heading: "3. Learning outcomes",
      kind: "outcomes",
      text: "- identify materials\n- describe energy use\n- name examples\n- record findings"
    });
    const ctx = buildRuleContext([toc, real]);
    expect(ctx.section("outcomes")).toBe(real);
  });

  it("falls back to document order when content sizes are exactly equal (deterministic tie-break)", () => {
    const first = section({ id: "s1", heading: "A", kind: "rationale", text: "same length!!" });
    const second = section({ id: "s2", heading: "B", kind: "rationale", text: "same length!!" });
    const ctx = buildRuleContext([first, second]);
    expect(ctx.section("rationale")).toBe(first);
  });

  it("returns the only match unchanged when a kind appears once", () => {
    const only = section({ id: "s1", heading: "Only", kind: "pedagogy", text: "some text" });
    const ctx = buildRuleContext([only]);
    expect(ctx.section("pedagogy")).toBe(only);
  });

  it("returns undefined when no section of that kind exists", () => {
    const ctx = buildRuleContext([section({ kind: "rationale" })]);
    expect(ctx.section("assessment")).toBeUndefined();
  });
});

describe("excerpt", () => {
  it("returns short text unchanged", () => {
    const text = "Pupils will investigate water use.";
    expect(excerpt(text)).toBe(text);
  });

  it("truncates long text at a sentence boundary when possible", () => {
    const text = "First sentence. Second sentence. Third sentence with more details.";
    const result = excerpt(text, 40);
    expect(result).toContain("First sentence");
    expect(result).toMatch(/…$/);
  });

  it("falls back to word boundary if no sentence boundary is within range", () => {
    const text = "Thisisaverylongwordwithoutanybreaksthatwillnotstopuntilawordbreakisencountered";
    const result = excerpt(text, 40);
    expect(result).toMatch(/…$/);
    expect(result.length).toBeLessThan(50);
  });

  it("normalizes multiple spaces/newlines into single spaces", () => {
    const text = "Pupils   will\n\ninvestigate    water  use.";
    const result = excerpt(text);
    expect(result).toBe("Pupils will investigate water use.");
  });
});

describe("firstMatchingLine", () => {
  it("returns the single matching line when only one exists", () => {
    const pattern = /evaluate/i;
    const text = "line 1\nline 2 evaluate this\nline 3";
    const result = firstMatchingLine(text, pattern);
    expect(result).toBe("line 2 evaluate this");
  });

  it("prefers longer, more substantive lines when multiple match", () => {
    const pattern = /pupils/i;
    const text = "Pupils work.\nPupils investigate and evaluate water use across the school and map causes and consequences.";
    const result = firstMatchingLine(text, pattern);
    expect(result).toContain("investigate");
  });

  it("strongly prefers lines with domain keywords (pupils, evidence, evaluate, etc.)", () => {
    const pattern = /./; // matches everything
    const text = "some unrelated text\nPupils evaluate and compare evidence from different sources\nanother line";
    const result = firstMatchingLine(text, pattern);
    expect(result).toContain("evidence");
  });

  it("returns undefined if no lines match", () => {
    const pattern = /nonexistent/;
    const text = "line 1\nline 2\nline 3";
    const result = firstMatchingLine(text, pattern);
    expect(result).toBeUndefined();
  });

  it("ignores empty lines", () => {
    const pattern = /evaluate/i;
    const text = "\n\n  Pupils evaluate sources  \n  ";
    const result = firstMatchingLine(text, pattern);
    expect(result).toBe("Pupils evaluate sources");
  });
});

describe("formatTableRow", () => {
  it("joins table cells with em-dash for readability", () => {
    const row = ["Week 3", "Energy and water", "Checklist"];
    const result = formatTableRow(row);
    expect(result).toBe("Week 3 — Energy and water — Checklist");
  });

  it("truncates very long rows using excerpt rules", () => {
    const row = ["Week", "Very long content".repeat(50)];
    const result = formatTableRow(row, 50);
    expect(result.length).toBeLessThan(100);
    expect(result).toMatch(/…$/);
  });
});

describe("firstMatchingTableRow", () => {
  it("returns the only matching row", () => {
    const rows = [
      ["Week 1", "intro"],
      ["Week 2", "research"],
      ["Week 3", "action"]
    ];
    const result = firstMatchingTableRow(rows, /action/);
    expect(result).toEqual(["Week 3", "action"]);
  });

  it("prefers rows with more combined content when multiple match", () => {
    const rows = [
      ["W", "a"],
      ["Week 3", "Pupils evaluate and compare evidence from different sources to decide on an action"],
      ["Week", "action"]
    ];
    const result = firstMatchingTableRow(rows, /action/);
    expect(result?.join(" ")).toContain("evaluate");
  });

  it("returns undefined if no rows match", () => {
    const rows = [["Week 1", "intro"]];
    const result = firstMatchingTableRow(rows, /nonexistent/);
    expect(result).toBeUndefined();
  });
});
