import type { DocumentSection, SectionKind } from "../../types/domain";

// Section-kind keyword map. Matching is against the heading text only, so a
// mention of "assessment" inside a paragraph elsewhere does not misclassify
// an unrelated section — this is what PROJECT_BRIEF §4 means by
// "section-aware rules rather than keyword counts alone".
const KIND_KEYWORDS: Array<[SectionKind, RegExp]> = [
  ["rationale", /rationale|purpose|why this unit/i],
  ["objectives", /general objectives?|aims?/i],
  ["outcomes", /learning outcomes?|by the end/i],
  ["content", /core content|content|key vocabulary/i],
  ["pedagogy", /pedagogical approach|teaching approach|methodology/i],
  ["sequence", /learning sequence|week[- ]by[- ]week|weekly (plan|sequence)/i],
  ["assessment", /assessment/i],
  ["resources", /resources|materials/i],
  ["inclusion", /inclusion|multilingual|differentiation/i],
  ["final_product", /final product|expected (final )?product|deliverable/i],
  ["local_adaptation", /local adaptation|adapt(ing|ation) locally/i],
  ["european_dimension", /european dimension/i],
  ["preparation", /preparation checklist|teacher preparation/i],
  ["review", /review after|evaluation of the unit|reflection after/i]
];

function classifyHeading(heading: string): SectionKind {
  for (const [kind, pattern] of KIND_KEYWORDS) {
    if (pattern.test(heading)) return kind;
  }
  return "other";
}

interface RawHeadingLine {
  lineIndex: number;
  level: number;
  heading: string;
}

const MARKDOWN_HEADING = /^(#{1,6})\s+(.+?)\s*$/;
// Fallback for text that has lost markdown formatting (typical of raw text
// pulled from a DOCX/PDF): a short, punctuation-free line, optionally
// numbered, that looks like a heading rather than a sentence.
const FALLBACK_HEADING = /^(?:\d{1,2}[.)]\s*)?[A-Z][A-Za-z0-9 ,'&/-]{2,70}$/;

function findMarkdownHeadings(lines: string[]): RawHeadingLine[] {
  const headings: RawHeadingLine[] = [];
  lines.forEach((line, i) => {
    const match = MARKDOWN_HEADING.exec(line);
    if (match) {
      headings.push({ lineIndex: i, level: match[1].length, heading: match[2].trim() });
    }
  });
  return headings;
}

function findFallbackHeadings(lines: string[]): RawHeadingLine[] {
  const headings: RawHeadingLine[] = [];
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("|")) return; // table row, never a heading
    const endsLikeSentence = /[.;:,]$/.test(trimmed) && !/^\d{1,2}[.)]/.test(trimmed);
    if (endsLikeSentence) return;
    const nextLine = lines[i + 1]?.trim() ?? "";
    const isIsolated = nextLine === "" || nextLine.length > trimmed.length;
    if (FALLBACK_HEADING.test(trimmed) && isIsolated && trimmed.split(/\s+/).length <= 10) {
      headings.push({ lineIndex: i, level: 2, heading: trimmed.replace(/^\d{1,2}[.)]\s*/, "") });
    }
  });
  return headings;
}

function parseTable(lines: string[]): string[][] {
  const rows: string[][] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(trimmed)) continue; // separator row
    const cells = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    rows.push(cells);
  }
  return rows;
}

export function segmentDocument(rawText: string): DocumentSection[] {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\t/g, "    ");
  const lines = normalized.split("\n");

  let headingLines = findMarkdownHeadings(lines);
  if (headingLines.length === 0) {
    headingLines = findFallbackHeadings(lines);
  }

  if (headingLines.length === 0) {
    // No structure could be recognised at all: treat the whole document as
    // one section so analysis can still proceed, but flag it via "other".
    const rows = parseTable(lines);
    return [
      {
        id: "section-0",
        heading: "Untitled document",
        kind: "other",
        level: 1,
        text: normalized.trim(),
        tableRows: rows.length > 0 ? rows : undefined,
        startLine: 0
      }
    ];
  }

  const sections: DocumentSection[] = [];
  headingLines.forEach((h, idx) => {
    const nextStart = headingLines[idx + 1]?.lineIndex ?? lines.length;
    const bodyLines = lines.slice(h.lineIndex + 1, nextStart);
    const rows = parseTable(bodyLines);
    const proseLines = bodyLines.filter((l) => !l.trim().startsWith("|"));
    sections.push({
      id: `section-${idx + 1}`,
      heading: h.heading,
      kind: classifyHeading(h.heading),
      level: h.level,
      text: proseLines.join("\n").trim(),
      tableRows: rows.length > 0 ? rows : undefined,
      startLine: h.lineIndex
    });
  });

  return sections;
}
