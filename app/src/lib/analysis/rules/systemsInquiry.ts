import type { GapRule } from "../types";
import { excerpt } from "../context";
import { getContextNote } from "../../../data/contextPack";

const ISOLATED_OBSERVATION = /checklist|observe (lights|taps|equipment|the classroom)|observation checklist/i;
const CAUSES_ACTORS = /caus(e|es)|actor|stakeholder|\brule\b|policy|routine|natural resource|consequence|why (does|is|do)/i;

export const systemsInquiryRule: GapRule = ({ ctx }) => {
  const section = ctx.section("sequence");
  if (!section?.tableRows || section.tableRows.length < 2) return [];

  const [, ...rows] = section.tableRows;
  const flaggedRow = rows.find((row) => {
    const rowText = row.join(" | ");
    return ISOLATED_OBSERVATION.test(rowText) && !CAUSES_ACTORS.test(rowText);
  });
  if (!flaggedRow) return [];

  const weekLabel = flaggedRow[0] ? `Week ${flaggedRow[0]}` : section.heading;

  return [
    {
      category: "systems_inquiry",
      priority: "high",
      confidence: "medium",
      location: `${section.heading} (${weekLabel})`,
      current_excerpt: excerpt(flaggedRow.join(" — ")),
      observed_gap:
        "The observation activity records isolated objects (lights, taps, equipment) but does not ask pupils to look at causes, actors, rules, natural resources or consequences behind what they observe.",
      competence_ids: ["1.2", "1.3", "2.1", "2.3"],
      suggested_wording:
        "Extend the checklist into a short baseline data collection, then ask pupils to sketch a simple systems map: what/who causes the pattern observed, and what it affects.",
      implementation_example:
        "After the checklist, ask each group to add one sticky note per item answering 'why is this happening?' and 'who or what does it affect?', then group the notes into a simple cause-and-effect map.",
      assessment_evidence:
        "The completed systems map or cause-effect diagram, plus a one-sentence revised problem statement written by the group.",
      european_schools_context: getContextNote("systems_inquiry"),
      rule_basis: [
        "Rule: systems_inquiry — a learning-sequence row matched isolated-observation/checklist wording without matching causes, actors, rules, resources or consequences wording in the same row."
      ]
    }
  ];
};

// Structural-absence companion: the learning-sequence section exists and
// has content, but it matches neither the isolated-observation/checklist
// pattern nor any causes/actors/systems pattern anywhere — there simply is
// no describable inquiry activity here to classify. Reported as an absence
// of evidence, at medium confidence, never as a confirmed gap.
export const systemsInquiryAbsenceRule: GapRule = ({ ctx }) => {
  const section = ctx.section("sequence");
  if (!section) return [];

  const rowText = section.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  const combined = [rowText, section.text].join("\n");
  if (!combined.trim()) return [];
  if (ISOLATED_OBSERVATION.test(combined) || CAUSES_ACTORS.test(combined)) return [];

  return [
    {
      category: "systems_inquiry",
      priority: "medium",
      confidence: "medium",
      location: section.heading,
      current_excerpt: excerpt(combined),
      observed_gap:
        "Evidence was not found in the reviewed text for systems inquiry — no activity was found that could be checked for attention to causes, actors, rules or consequences.",
      competence_ids: ["1.2", "1.3", "2.1", "2.3"],
      suggested_wording:
        "If pupils investigate a real situation in this unit, name what they look at and add a prompt connecting it to causes, actors or consequences.",
      implementation_example:
        "Add one investigation step to the learning sequence (even brief) and ask pupils to note one cause and one consequence they observe.",
      assessment_evidence:
        "A short note from pupils naming one cause and one consequence related to the topic investigated.",
      european_schools_context: getContextNote("systems_inquiry"),
      rule_basis: [
        "Rule: systems_inquiry (structural absence) — the learning-sequence section exists but matched neither isolated-observation wording nor causes/actors/systems wording; absence of evidence is not evidence of absence."
      ]
    }
  ];
};
