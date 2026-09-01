// Bundled, versioned summary of reference/PUBLIC_CONTEXT_PACK.md. Used to
// attach a short, non-invented European Schools context note to relevant
// suggestions, and to render the "why this note appears" explainer in the UI.
// Nothing here states a mandatory policy; each note is phrased as a design
// condition or boundary already present in the public context pack.

export const EUROPEAN_SCHOOLS_DESIGN_CONDITIONS = [
  "preserve the subject and cycle-specific purpose of the syllabus",
  "distinguish official curriculum requirements from optional implementation suggestions",
  "support competence-based learning and assessment",
  "recognise multilingual, multicultural and inclusive participation as design conditions",
  "allow school and teacher contextualisation without presenting optional ideas as system rules",
  "favour interdisciplinary and whole-school connections only where they add genuine learning value",
  "respect teacher professional judgement"
] as const;

export const INTERPRETATION_BOUNDARIES = [
  "Do not invent a European Schools obligation.",
  "Do not treat recycling vocabulary as embedded GreenComp learning by itself.",
  "Do not treat group work as collective action when decisions and actions are predetermined.",
  "Do not treat a poster as political agency unless pupils engage an authentic decision route or stakeholder.",
  "Do not assess pupils according to whether a school-level environmental outcome was achieved outside their control."
] as const;

export const CONTEXT_NOTES: Record<string, string> = {
  pupil_agency:
    "European Schools syllabi are harmonised at system level, but local implementation may give pupils bounded choices within teacher-set boundaries without breaching that harmonisation.",
  authentic_action:
    "A whole-school connection should be made only when it is educationally relevant and age-appropriate; this is a suggested local link, not an added European Schools requirement.",
  assessment_alignment:
    "Assessment should remain competence-based and evidence-observable, in line with the public context pack's support for competence-based learning and assessment; this does not replace any official assessment regulation.",
  systems_inquiry:
    "Contextualising an inquiry at school or class level is supported by the public context pack; it does not add a system-wide obligation.",
  critical_and_futures_thinking:
    "Comparing European examples fits the harmonised, multicultural character of European Schools education; sources and perspectives remain the teacher's professional judgement to select.",
  values_and_rationale:
    "Naming values and fairness questions is compatible with competence-based learning; it does not assert a school position on a contested issue.",
  learning_outcomes:
    "Outcomes remain the subject's own; this suggestion only makes existing GreenComp-relevant reasoning observable.",
  portfolio_and_review:
    "A shared review with pupils fits multilingual, inclusive participation as a design condition, without changing official assessment weighting."
};

export function getContextNote(category: string): string | undefined {
  return CONTEXT_NOTES[category];
}
