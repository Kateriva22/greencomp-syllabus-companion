import type { DocumentSection, SectionKind } from "../../types/domain";

export interface RuleContext {
  sections: DocumentSection[];
  section(kind: SectionKind): DocumentSection | undefined;
  sectionsOf(kinds: SectionKind[]): DocumentSection[];
  fullText: string;
}

export function buildRuleContext(sections: DocumentSection[]): RuleContext {
  return {
    sections,
    section(kind) {
      return sections.find((s) => s.kind === kind);
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
