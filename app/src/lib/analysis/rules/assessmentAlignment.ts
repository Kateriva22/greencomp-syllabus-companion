import type { GapRule } from "../types";
import { excerpt } from "../context";
import { getContextNote } from "../../../data/contextPack";

const RECALL_OR_COMPLIANCE = /\brecall\b|accuracy|accurate|correct use of vocabulary|neatness|\battention\b|task completion|cooperation|clear presentation/i;
const HIGHER_ORDER_CRITERIA = /reasoning|evidence|inquiry|systems?|alternative|decision|reflect|adapt|perspective|collective action/i;

export const assessmentAlignmentRule: GapRule = ({ ctx }) => {
  const section = ctx.section("assessment");
  if (!section) return [];

  const rowText = section.tableRows?.map((r) => r.join(" | ")).join("\n") ?? "";
  const combined = [rowText, section.text].join("\n");
  if (!RECALL_OR_COMPLIANCE.test(combined) || HIGHER_ORDER_CRITERIA.test(combined)) return [];

  return [
    {
      category: "assessment_alignment",
      priority: "critical",
      confidence: "high",
      location: section.heading,
      current_excerpt: excerpt(rowText || section.text),
      observed_gap:
        "Assessment criteria reward attention, recall, cooperation, neatness and presentation. No criterion rewards GreenComp reasoning: inquiry, evidence use, weighing alternatives, collective action or reflection.",
      competence_ids: ["2.1", "2.2", "3.2", "4.2"],
      suggested_wording:
        "Keep the quiz formative (not weighted), and assess: the quality of the group's inquiry/systems thinking, their use of evidence and perspectives, how they weighed alternatives, and their reflection on collective action.",
      implementation_example:
        "Replace or reweight the poster/presentation criteria to include: 'uses evidence and at least one source check', 'shows a group decision among options', and 'reflects on what worked and what would change next time'.",
      assessment_evidence:
        "A simple rubric or checklist covering inquiry quality, evidence use, decision-making and reflection, applied to the group's portfolio or presentation.",
      european_schools_context: getContextNote("assessment_alignment"),
      rule_basis: [
        "Rule: assessment_alignment — assessment criteria matched recall/compliance/neatness wording without matching any inquiry, evidence, alternatives, decision, reflection or collective-action wording."
      ]
    }
  ];
};
