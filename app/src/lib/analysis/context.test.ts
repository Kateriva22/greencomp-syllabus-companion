import { describe, expect, it } from "vitest";
import { buildRuleContext } from "./context";
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
