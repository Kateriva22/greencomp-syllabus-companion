import type { GapRule } from "../types";
import { excerpt, locationLabel } from "../context";
import { getContextNote } from "../../../data/contextPack";

const FIXED_ACTION = /clean-?up|displayed in the corridor|the final poster format .* should remain the same|will (join|take part in|complete) a (supervised )?(playground )?clean-?up/i;
const STAKEHOLDER_OR_EFFECT = /stakeholder|decision-maker|headteacher|principal|council|present (the proposal )?to|feedback from|before\/after|before and after|measur(e|ed|able) (impact|effect|change)/i;

export const authenticActionRule: GapRule = ({ ctx }) => {
  const sequence = ctx.section("sequence");
  const finalProduct = ctx.section("final_product");
  const sections = [sequence, finalProduct].filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (sections.length === 0) return [];

  const sequenceText = sequence?.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  const combined = [sequenceText, finalProduct?.text ?? ""].join("\n");
  if (!FIXED_ACTION.test(combined) || STAKEHOLDER_OR_EFFECT.test(combined)) return [];

  return [
    {
      category: "authentic_action",
      priority: "critical",
      confidence: "high",
      location: locationLabel(sections),
      current_excerpt: excerpt(combined),
      observed_gap:
        "The action (clean-up, poster display) is predetermined and fixed. It is not linked to a decision route, a stakeholder, evidence of effect, or any adaptation based on feedback.",
      competence_ids: ["4.1", "4.2", "4.3", "3.2"],
      suggested_wording:
        "Keep the clean-up and poster if useful, and add one authentic step: pupils present their evidence-based proposal to a real stakeholder (e.g., the class teacher responsible for a resource, the school council or a caretaker), agree a small feasible pilot, then gather before/after feedback or evidence.",
      implementation_example:
        "Before the clean-up, have groups pitch their 'ten things' proposal to a real audience (school council representative, another class, or a staff member) and note one piece of feedback each group receives and acts on.",
      assessment_evidence:
        "A short record of the stakeholder's feedback and how (or whether) the group adjusted their plan, plus any before/after evidence collected (photo, count, short survey).",
      european_schools_context: getContextNote("authentic_action"),
      rule_basis: [
        "Rule: authentic_action — matched fixed/predetermined action wording (clean-up, unchanged poster format) without matching stakeholder, decision-route or before/after-evidence wording."
      ]
    }
  ];
};

// Structural-absence companion: the sequence/final-product sections exist,
// but their wording matched neither a fixed/predetermined action pattern
// nor a stakeholder/decision-route/evidence-of-effect pattern — there is no
// describable action content here to classify either way (e.g. the unit may
// simply not include an action stage). Reported as an absence of evidence,
// at medium confidence, never as a confirmed gap.
export const authenticActionAbsenceRule: GapRule = ({ ctx }) => {
  const sequence = ctx.section("sequence");
  const finalProduct = ctx.section("final_product");
  const sections = [sequence, finalProduct].filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (sections.length === 0) return [];

  const sequenceText = sequence?.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  const combined = [sequenceText, finalProduct?.text ?? ""].join("\n");
  if (!combined.trim() || FIXED_ACTION.test(combined) || STAKEHOLDER_OR_EFFECT.test(combined)) return [];

  return [
    {
      category: "authentic_action",
      priority: "medium",
      confidence: "medium",
      location: locationLabel(sections),
      current_excerpt: excerpt(combined),
      observed_gap:
        "Evidence was not found in the reviewed text for how (or whether) pupils act on their learning — no described action was found that could be checked against a decision route, stakeholder or evidence of effect.",
      competence_ids: ["4.1", "4.2", "4.3", "3.2"],
      suggested_wording:
        "If pupils are meant to act on what they learn, describe that action explicitly, including who it involves beyond the class and what would show whether it made a difference.",
      implementation_example:
        "Add a short 'what pupils will do with this' note to the final product or last learning-sequence stage, naming any stakeholder involved and how feedback or effect will be gathered.",
      assessment_evidence:
        "A brief description of the action taken, who was involved, and what feedback or evidence of effect was collected.",
      european_schools_context: getContextNote("authentic_action"),
      rule_basis: [
        "Rule: authentic_action (structural absence) — the sequence/final-product sections exist but matched neither fixed-action wording nor stakeholder/decision-route/evidence wording; absence of evidence is not evidence of absence."
      ]
    }
  ];
};
