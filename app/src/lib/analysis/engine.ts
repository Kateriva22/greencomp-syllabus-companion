import type { DocumentMeta, DocumentSection, ReviewResult, Suggestion } from "../../types/domain";
import type { GapRule, SuggestionDraft } from "./types";
import { buildRuleContext } from "./context";
import { detectStrengths } from "./strengths";
import { computeCoverage } from "./coverage";
import { valuesRationaleRule } from "./rules/valuesRationale";
import { learningOutcomesRule } from "./rules/learningOutcomes";
import { pupilAgencyRule, pupilAgencyAbsenceRule } from "./rules/pupilAgency";
import { systemsInquiryRule, systemsInquiryAbsenceRule } from "./rules/systemsInquiry";
import { criticalFuturesRule, criticalFuturesAbsenceRule } from "./rules/criticalFutures";
import { authenticActionRule, authenticActionAbsenceRule } from "./rules/authenticAction";
import { assessmentAlignmentRule, assessmentAlignmentAbsenceRule } from "./rules/assessmentAlignment";
import { portfolioReviewRule } from "./rules/portfolioReview";

// Each "...AbsenceRule" is the structural-absence companion to the rule
// before it: it only fires when its sibling's relevant section(s) exist but
// contain neither the sibling's "gap" pattern nor its "already addressed"
// pattern — i.e. there is genuinely no textual signal either way. The two
// are mutually exclusive by construction (both require a distinct, disjoint
// pattern combination), so a category never gets both an explicit-gap and
// an absence finding for the same input.
const GAP_RULES: GapRule[] = [
  pupilAgencyRule,
  pupilAgencyAbsenceRule,
  authenticActionRule,
  authenticActionAbsenceRule,
  assessmentAlignmentRule,
  assessmentAlignmentAbsenceRule,
  learningOutcomesRule,
  valuesRationaleRule,
  systemsInquiryRule,
  systemsInquiryAbsenceRule,
  criticalFuturesRule,
  criticalFuturesAbsenceRule,
  portfolioReviewRule
];

const PRIORITY_ORDER: Record<Suggestion["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};
const CONFIDENCE_ORDER: Record<Suggestion["confidence"], number> = { high: 0, medium: 1, low: 2 };

const MAX_SUGGESTIONS = 10;

const BASE_LIMITATIONS = [
  "This is a deterministic, rule-based Phase 1 prototype, not an AI reading of the document — it matches transparent patterns, not meaning.",
  "Phase 1 analysis rules are English-only. A document in French, German or another language will not be reliably analysed — structure recognition and suggestions may be sparse, missing, or triggered only by incidental English words.",
  "GreenComp is non-prescriptive: not every competence is expected in every syllabus, and an absent score is not a deficiency.",
  "Suggestions are starting points for the teacher's own judgement, not an official or compliance verdict.",
  "Local/institutional requirements and the teacher's professional judgement always take precedence over these suggestions."
];

export interface AnalyzeInput {
  sections: DocumentSection[];
  document: DocumentMeta;
  cycle?: string;
  extraLimitations?: string[];
}

function rankSuggestions(drafts: SuggestionDraft[]): SuggestionDraft[] {
  return [...drafts].sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (byPriority !== 0) return byPriority;
    return CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
  });
}

export function analyzeDocument(input: AnalyzeInput): ReviewResult {
  const ctx = buildRuleContext(input.sections);

  const drafts = GAP_RULES.flatMap((rule) => rule({ ctx, cycle: input.cycle }));
  const ranked = rankSuggestions(drafts).slice(0, MAX_SUGGESTIONS);
  const suggestions: Suggestion[] = ranked.map((draft, i) => ({
    ...draft,
    id: `SUG-${String(i + 1).padStart(2, "0")}`,
    teacher_decision: "pending"
  }));

  const strengths = detectStrengths(ctx);
  const coverage = computeCoverage(input.sections);

  const limitations = [...BASE_LIMITATIONS, ...(input.extraLimitations ?? [])];
  if (input.sections.length === 1 && input.sections[0].kind === "other") {
    limitations.push(
      "No section headings were recognised in this document, so the review was applied to the whole text as a single block."
    );
  }

  return {
    document: input.document,
    strengths,
    coverage,
    suggestions,
    limitations
  };
}
