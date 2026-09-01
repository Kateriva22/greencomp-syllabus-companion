import type { GapRule } from "../types";
import { excerpt } from "../context";
import { getContextNote } from "../../../data/contextPack";

const RECALL_OR_COMPLIANCE = /\brecall\b|accuracy|accurate|correct use of vocabulary|neatness|\battention\b|task completion|cooperation|clear presentation/i;
const HIGHER_ORDER_CRITERIA = /reasoning|evidence|inquiry|systems?|alternative|decision|reflect|adapt|perspective|collective action/i;

// Splits the assessment section into independent "criteria units" to count
// against, rather than testing the whole section as one blob. A table
// (Component | Weight | Main criteria) contributes one unit per row; a
// prose-only assessment section contributes one unit per non-empty line.
// Counting per unit is what lets the rule tell "one incidental higher-order
// word in a sea of recall criteria" apart from "criteria are genuinely
// balanced" — testing the whole blob for a single keyword match cannot.
function criteriaUnits(section: { text: string; tableRows?: string[][] }): string[] {
  if (section.tableRows && section.tableRows.length > 1) {
    const [, ...rows] = section.tableRows;
    return rows.map((r) => r.join(" | "));
  }
  return section.text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export const assessmentAlignmentRule: GapRule = ({ ctx }) => {
  const section = ctx.section("assessment");
  if (!section) return [];

  const units = criteriaUnits(section);
  if (units.length === 0) return [];

  const recallCount = units.filter((u) => RECALL_OR_COMPLIANCE.test(u)).length;
  const higherOrderCount = units.filter((u) => HIGHER_ORDER_CRITERIA.test(u)).length;

  // A single higher-order criterion among many recall/compliance ones is
  // not "balanced" — require recall criteria to genuinely outnumber
  // higher-order ones before calling it a gap, so the finding is not
  // suppressed by one incidental keyword appearing anywhere in the section.
  if (recallCount === 0 || recallCount <= higherOrderCount) return [];

  const flaggedUnits = units.filter((u) => RECALL_OR_COMPLIANCE.test(u));

  // The condition above only requires recall criteria to outnumber
  // higher-order ones — it does not require zero higher-order criteria.
  // observed_gap must say what the counts actually show, never assert "no
  // criterion rewards X" when higherOrderCount could be > 0.
  const observedGap =
    higherOrderCount === 0
      ? `Assessment criteria reward attention, recall, cooperation, neatness and presentation (${recallCount} of ${units.length} criteria). No criterion rewards GreenComp reasoning: inquiry, evidence use, weighing alternatives, collective action or reflection.`
      : `Recall/compliance criteria dominate: ${recallCount} of ${units.length} criteria reward attention, recall, cooperation, neatness or presentation, against only ${higherOrderCount} rewarding GreenComp reasoning (inquiry, evidence use, alternatives, collective action or reflection).`;

  return [
    {
      category: "assessment_alignment",
      priority: "critical",
      confidence: "high",
      location: section.heading,
      current_excerpt: excerpt(flaggedUnits.join(" — ")),
      observed_gap: observedGap,
      competence_ids: ["2.1", "2.2", "3.2", "4.2"],
      suggested_wording:
        "Keep the quiz formative (not weighted), and assess: the quality of the group's inquiry/systems thinking, their use of evidence and perspectives, how they weighed alternatives, and their reflection on collective action.",
      implementation_example:
        "Replace or reweight the poster/presentation criteria to include: 'uses evidence and at least one source check', 'shows a group decision among options', and 'reflects on what worked and what would change next time'.",
      assessment_evidence:
        "A simple rubric or checklist covering inquiry quality, evidence use, decision-making and reflection, applied to the group's portfolio or presentation.",
      european_schools_context: getContextNote("assessment_alignment"),
      rule_basis: [
        `Rule: assessment_alignment — ${recallCount} of ${units.length} assessment criteria matched recall/compliance/neatness wording, against only ${higherOrderCount} matching inquiry, evidence, alternatives, decision, reflection or collective-action wording.`
      ]
    }
  ];
};

// Structural-absence companion: the assessment section exists, but its
// criteria contain neither recall/compliance language nor GreenComp-aligned
// higher-order language — there simply isn't enough textual signal here to
// say whether assessment is aligned or not. This is deliberately a weaker,
// medium-confidence note ("evidence was not found"), never a claim that a
// gap was confirmed.
export const assessmentAlignmentAbsenceRule: GapRule = ({ ctx }) => {
  const section = ctx.section("assessment");
  if (!section) return [];

  const units = criteriaUnits(section);
  if (units.length === 0) return [];

  const recallCount = units.filter((u) => RECALL_OR_COMPLIANCE.test(u)).length;
  const higherOrderCount = units.filter((u) => HIGHER_ORDER_CRITERIA.test(u)).length;
  if (recallCount > 0 || higherOrderCount > 0) return [];

  return [
    {
      category: "assessment_alignment",
      priority: "medium",
      confidence: "medium",
      location: section.heading,
      current_excerpt: excerpt(units.slice(0, 3).join(" — ")),
      observed_gap:
        "Evidence was not found in the reviewed text for how assessment relates to GreenComp reasoning (inquiry, evidence use, alternatives, decision-making or reflection) — the criteria described here could not be classified either way from this wording alone.",
      competence_ids: ["2.1", "2.2", "3.2", "4.2"],
      suggested_wording:
        "Make assessment criteria explicit enough to judge: name what is actually being assessed (e.g. inquiry quality, evidence use, decision-making, reflection) rather than leaving criteria implicit.",
      implementation_example:
        "Add a short rubric line for each criterion actually used, so a reader (and a future review) can tell what is being rewarded without guessing.",
      assessment_evidence:
        "An explicit rubric or criteria list attached to the assessment component.",
      european_schools_context: getContextNote("assessment_alignment"),
      rule_basis: [
        "Rule: assessment_alignment (structural absence) — the assessment section exists but its criteria matched neither recall/compliance wording nor GreenComp-aligned higher-order wording; absence of evidence is not evidence of absence."
      ]
    }
  ];
};
