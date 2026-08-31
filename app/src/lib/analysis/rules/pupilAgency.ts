import type { GapRule } from "../types";
import { excerpt, firstMatchingLine, locationLabel } from "../context";
import { getContextNote } from "../../../data/contextPack";
import { getCycleAdaptation } from "../../../data/ageAdaptations";

const TEACHER_CONTROL = /the teacher will (select|choose|assign|provide|determine)|teacher-selected|teacher-provided|pupils will follow the (task )?instructions/i;
const PUPIL_CHOICE = /pupils (choose|select|decide|will decide|propose|vote|negotiate)|pupil choice|pupil-led/i;

export const pupilAgencyRule: GapRule = ({ ctx, cycle }) => {
  const sections = ctx.sectionsOf(["pedagogy", "inclusion", "preparation"]);
  if (sections.length === 0) return [];

  const combined = sections.map((s) => s.text).join("\n");
  if (!TEACHER_CONTROL.test(combined) || PUPIL_CHOICE.test(combined)) return [];

  const triggerLine = firstMatchingLine(combined, TEACHER_CONTROL) ?? combined;
  const adaptation = getCycleAdaptation(cycle ?? "");

  return [
    {
      category: "pupil_agency",
      priority: "critical",
      confidence: "high",
      location: locationLabel(sections),
      current_excerpt: excerpt(triggerLine),
      observed_gap:
        "The teacher selects the problem, sources, roles and actions; pupils are described as following instructions. No wording gives pupils a genuine choice within the task.",
      competence_ids: ["2.3", "3.3", "4.2", "4.3"],
      suggested_wording:
        "Keep the teacher-set safety and learning boundaries, and add pupil choice over one or more of: the exact question to investigate, their group role, which evidence to use, or which option to propose.",
      implementation_example: adaptation
        ? `Offer a short menu of two or three teacher-vetted options at one decision point (e.g., which local example to research, or which of two actions to propose) so pupils choose rather than receive. ${adaptation}`
        : "Offer a short menu of two or three teacher-vetted options at one decision point (e.g., which local example to research, or which of two actions to propose) so pupils choose rather than receive.",
      assessment_evidence:
        "A record of the choice each pupil or group made and a one-line reason for it (e.g., in a research log or portfolio entry).",
      european_schools_context: getContextNote("pupil_agency"),
      rule_basis: [
        "Rule: pupil_agency — matched teacher-controls-the-task phrasing (selects/assigns/provides) without matching any pupil-choice phrasing (choose/decide/propose/vote) in the pedagogy, inclusion or preparation sections."
      ]
    }
  ];
};
