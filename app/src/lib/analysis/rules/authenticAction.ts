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
