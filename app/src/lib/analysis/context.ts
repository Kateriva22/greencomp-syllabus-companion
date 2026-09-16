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
// Preserves sentence/bullet boundaries up to maxLen, so multi-item outcomes
// like "pupils will: A, B, C" stay readable rather than cutting mid-item.
export function excerpt(text: string, maxLen = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;

  // Try to cut at a sentence boundary (. ! ?) within the limit
  const truncated = clean.slice(0, maxLen);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? ")
  );
  if (lastSentenceEnd > maxLen * 0.6) {
    // Only use sentence boundary if it's reasonably far into the limit (not too early)
    return `${truncated.slice(0, lastSentenceEnd + 1)}…`;
  }

  // Fallback: cut at word boundary
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return `${truncated.slice(0, lastSpace)}…`;
  }
  return `${clean.slice(0, maxLen).trim()}…`;
}

// Find the most substantive matching line, not just the first.
// Scores lines by: word count (longer = more detail), presence of domain
// keywords (pupils, evidence, action, etc.), and position (middle/end of
// section = typically more detail than opening). Returns best match.
export function firstMatchingLine(text: string, pattern: RegExp): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && pattern.test(l));

  if (lines.length === 0) return undefined;
  if (lines.length === 1) return lines[0];

  // Score each matching line by substantiveness
  // Primary factors: word count (longer = more detail), domain keywords (more specific),
  // secondary factor: position (later = elaboration)
  const domainKeywords = /pupils?|pupils will|children|investigate|evaluate|compare|decide|propose|evidence|action|stakeholder|feedback|effect|impact|outcome|learn|understand|reflect/i;

  const scored = lines.map((line, idx) => {
    const wordCount = line.split(/\s+/).length;
    const hasDomainKeywords = domainKeywords.test(line) ? 1 : 0;
    const positionScore = idx / Math.max(lines.length - 1, 1); // 0 at start, 1 at end
    const score =
      wordCount * 2.0 + // Strongly prefer longer lines (more detail/context)
      hasDomainKeywords * 50 + // Prefer domain-specific language
      positionScore * 1; // Weakly prefer later lines (elaboration over intro)
    return { line, score };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.line;
}

export function locationLabel(sections: DocumentSection[]): string {
  return sections.map((s) => s.heading).join(" & ");
}

/**
 * Format a table row for use as evidence in a finding.
 * Joins cells with " — " (em-dash) to preserve column distinction,
 * and wraps the result in excerpt() to ensure reasonable length.
 * Example: ["Week 3", "Observe water use", "Checklist"] becomes
 * "Week 3 — Observe water use — Checklist"
 */
export function formatTableRow(row: string[], maxLen = 220): string {
  return excerpt(row.join(" — "), maxLen);
}

/**
 * Find the first table row matching a pattern, preferring rows with
 * more substantive content (longer combined length) if multiple rows match.
 */
export function firstMatchingTableRow(tableRows: string[][], pattern: RegExp): string[] | undefined {
  const matches = tableRows.filter((row) => pattern.test(row.join(" ")));
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  // Prefer row with more combined content
  return matches.sort((a, b) => b.join(" ").length - a.join(" ").length)[0];
}
