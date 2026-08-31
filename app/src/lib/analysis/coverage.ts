import type { CoverageEntry, DocumentSection, SectionKind } from "../../types/domain";
import { ALL_COMPETENCE_IDS } from "../../data/greencomp";
import { excerpt, firstMatchingLine } from "./context";

interface CompetencePattern {
  mention: RegExp;
  purposeful: RegExp;
}

// A competence scores 1 ("mentioned or isolated") once its topic is named
// anywhere; 2 ("purposeful") once the deeper, observable-action pattern
// appears in at least one place; 3 ("embedded") once that deeper pattern
// appears in more than one of {outcomes, sequence, assessment} — i.e. it
// shows up in more than a single stage of the unit.
const COMPETENCE_PATTERNS: Record<string, CompetencePattern> = {
  "1.1": {
    mention: /sustainab|environment(al)? (matters|important)|protecting the environment/i,
    purposeful: /reflect on (why|values)|discuss(es|ing)? values|values (that )?(shape|influence)/i
  },
  "1.2": {
    mention: /\bfair(ness)?\b|\bequit|\bjustice\b|inequal/i,
    purposeful: /who (benefits|is affected)|winners and losers|different groups (are|were) affected/i
  },
  "1.3": {
    mention: /\bnature\b|ecosystem|biodiversity|natural resource|part of nature/i,
    purposeful: /restor(e|ation|ing)|protect(ing)? (a |the )?(habitat|ecosystem)/i
  },
  "2.1": {
    mention: /\bsystem\b|systems?\b|interconnect|relationship between/i,
    purposeful: /systems? map|feedback loop|multiple (causes|actors)/i
  },
  "2.2": {
    mention: /evaluat|\bjudge\b|reliab|credib|\bsource\b/i,
    purposeful: /evaluate (the )?(reliability|credibility)|compare sources|missing (perspective|voice)/i
  },
  "2.3": {
    mention: /\bproblem\b|\bchallenge\b|\bissue\b/i,
    purposeful: /pupils (frame|define|formulate) the (problem|question)|revise the (problem|question)/i
  },
  "3.1": {
    mention: /\bfuture\b/i,
    purposeful: /scenario|plausible future|preferred future|imagine (a|the) future/i
  },
  "3.2": {
    // Deliberately does NOT match a bare "change" — "climate change" is the
    // single most common phrase in any sustainability syllabus and has
    // nothing to do with the Adaptability competence (responding to
    // feedback/uncertainty/limits). Only "adapt(...)" or "change" in an
    // explicit response/uncertainty context counts as even a mention.
    mention: /\badapt(s|ed|ing|ability|ive)?\b|respond(s|ed|ing)? to (feedback|change|uncertainty)|cope with (change|uncertainty)|\buncertain(ty)?\b/i,
    purposeful: /respond to feedback|revise (the )?plan|adjust (the )?(plan|approach)/i
  },
  "3.3": {
    mention: /\bcompare\b|different (countries|perspectives|approaches)|european example/i,
    purposeful: /compare (alternatives|options)|creative alternative|cross-disciplinary/i
  },
  "4.1": {
    mention: /decision[- ]mak|\bstakeholder\b|responsib(le|ility) (route|authority)/i,
    purposeful: /present (the proposal )?to|petition|contact (the |a )?(headteacher|council|principal)/i
  },
  "4.2": {
    mention: /group work|\btogether\b|collaborat|as a (group|team)/i,
    purposeful: /group (decide|decides|agrees)|collective decision|joint action/i
  },
  "4.3": {
    mention: /\bindividual\b|personal (action|initiative)|pupils? will (present|propose)/i,
    purposeful: /pupil.s? own initiative|personal (commitment|pledge)|individual reflection/i
  }
};

const SCORING_SECTION_KINDS: SectionKind[] = ["outcomes", "sequence", "assessment"];

// A section's table rows (e.g. the learning-sequence or assessment table)
// carry real content that must count as evidence too — the sequence and
// assessment sections in particular are almost always tables, so omitting
// tableRows here would make coverage scoring blind to most of what those
// two section kinds actually say.
function sectionBodyText(s: DocumentSection): string {
  const rowText = s.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  return [s.text, rowText].filter(Boolean).join("\n");
}

export function computeCoverage(sections: DocumentSection[]): CoverageEntry[] {
  // Used only to test *whether* a competence is mentioned anywhere,
  // including headings (a heading like "European dimension" is itself
  // relevant signal for 3.3).
  const detectionText = sections.map((s) => `${s.heading}\n${sectionBodyText(s)}`).join("\n\n");
  // Used to pick the *quoted* evidence line. Front-matter/title sections
  // ("other") are excluded and headings are left out so a document title
  // that happens to contain a keyword (e.g. "Sustainable School") is never
  // quoted as if it were supporting evidence from the body text.
  const evidenceText = sections
    .filter((s) => s.kind !== "other")
    .map((s) => sectionBodyText(s))
    .join("\n\n");
  const scoringSections = sections.filter((s) => SCORING_SECTION_KINDS.includes(s.kind));

  return ALL_COMPETENCE_IDS.map((id) => {
    const pattern = COMPETENCE_PATTERNS[id];
    if (!pattern) {
      return { competence_id: id, score: 0, evidence: "Evidence was not found in the reviewed text." };
    }

    if (!pattern.mention.test(detectionText)) {
      return { competence_id: id, score: 0, evidence: "Evidence was not found in the reviewed text." };
    }

    const purposefulSectionCount = scoringSections.filter((s) =>
      pattern.purposeful.test(`${s.heading}\n${sectionBodyText(s)}`)
    ).length;

    if (purposefulSectionCount >= 2) {
      const line = firstMatchingLine(evidenceText, pattern.purposeful) ?? evidenceText;
      return { competence_id: id, score: 3, evidence: excerpt(line) };
    }
    if (purposefulSectionCount === 1) {
      const line = firstMatchingLine(evidenceText, pattern.purposeful) ?? evidenceText;
      return { competence_id: id, score: 2, evidence: excerpt(line) };
    }

    const line = firstMatchingLine(evidenceText, pattern.mention) ?? evidenceText;
    return { competence_id: id, score: 1, evidence: excerpt(line) };
  });
}
