import type { DocumentSection, SectionKind } from "../../types/domain";

export interface RuleContext {
  sections: DocumentSection[];
  section(kind: SectionKind): DocumentSection | undefined;
  sectionsOf(kinds: SectionKind[]): DocumentSection[];
  fullText: string;
}

// Rough measure of how much actual content a section carries (prose plus
// flattened table cells). Used to pick the most substantive section when
// several share the same kind — a long document (especially one recovered
// from a PDF) can easily produce a short table-of-contents-style match
// ("Assessment .......... 12") ahead of the real section with that heading,
// and blindly taking the first match would anchor every rule to that
// near-empty stand-in instead of the section with actual content.
function contentSize(section: DocumentSection): number {
  const tableSize = section.tableRows?.reduce((sum, row) => sum + row.join(" ").length, 0) ?? 0;
  return section.text.length + tableSize;
}

export function buildRuleContext(sections: DocumentSection[]): RuleContext {
  return {
    sections,
    section(kind) {
      const matches = sections.filter((s) => s.kind === kind);
      if (matches.length <= 1) return matches[0];
      // Most substantive first; a stable sort keeps document order as the
      // tie-breaker so behaviour stays deterministic when sizes are equal.
      return [...matches].sort((a, b) => contentSize(b) - contentSize(a))[0];
    },
    sectionsOf(kinds) {
      return sections.filter((s) => kinds.includes(s.kind));
    },
    fullText: sections.map((s) => `${s.heading}\n${s.text}`).join("\n\n")
  };
}

// Short, teacher-readable quotation of the wording that triggered a finding.
// Truncated (never the whole section) so the excerpt reads as a pointer back
// to the original text rather than a full copy of it.
export function excerpt(text: string, maxLen = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen).trim()}…`;
}

export function firstMatchingLine(text: string, pattern: RegExp): string | undefined {
  return text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0 && pattern.test(l));
}

export function locationLabel(sections: DocumentSection[]): string {
  return sections.map((s) => s.heading).join(" & ");
}
