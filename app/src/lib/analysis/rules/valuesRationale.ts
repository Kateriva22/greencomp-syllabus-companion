import type { GapRule } from "../types";
import { excerpt, firstMatchingLine, locationLabel } from "../context";
import { getContextNote } from "../../../data/contextPack";
import { getCycleAdaptation } from "../../../data/ageAdaptations";

const GENERIC_AWARENESS = /raise awareness|greener choices|responsible behaviour|protecting the environment is important|make (a )?differen/i;
const SYSTEMIC_FRAMING = /fairness|justice|equit|ecosystem|biodiversity|interdependen|systems? (relationship|thinking)|cause and effect|who is affected|winners and losers/i;

export const valuesRationaleRule: GapRule = ({ ctx, cycle }) => {
  const sections = ctx.sectionsOf(["rationale", "objectives"]);
  if (sections.length === 0) return [];

  const combined = sections.map((s) => s.text).join("\n");
  if (!GENERIC_AWARENESS.test(combined) || SYSTEMIC_FRAMING.test(combined)) return [];

  const triggerLine = firstMatchingLine(combined, GENERIC_AWARENESS) ?? combined;
  const adaptation = getCycleAdaptation(cycle ?? "");

  return [
    {
      category: "values_and_rationale",
      priority: "high",
      confidence: "medium",
      location: locationLabel(sections),
      current_excerpt: excerpt(triggerLine),
      observed_gap:
        "Sustainability is framed mainly as awareness and prescribed individual behaviour. Connected impacts, fairness questions and the human-nature relationship were not found in this wording.",
      competence_ids: ["1.1", "1.2", "1.3", "2.1"],
      suggested_wording:
        "Reframe the rationale around a real, local sustainability challenge: what is happening, who and what is affected, and why it matters — before moving to any individual action.",
      implementation_example: adaptation
        ? `Open with a short local example (a school data snapshot, a walkabout or a news item) and ask pupils what is happening and who is affected. ${adaptation}`
        : "Open with a short local example (a school data snapshot, a walkabout or a news item) and ask pupils what is happening and who is affected.",
      assessment_evidence:
        "A brief pupil reflection (written, drawn or spoken) that names at least one cause-effect relationship and one value at stake (fairness, care for nature).",
      european_schools_context: getContextNote("values_and_rationale"),
      rule_basis: [
        "Rule: values_and_rationale — matched generic awareness/behaviour phrasing without matching systemic, fairness or nature-relationship vocabulary in the rationale/objectives sections."
      ]
    }
  ];
};
