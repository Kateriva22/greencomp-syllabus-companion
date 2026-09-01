// Versioned age/cycle adaptation notes. These only adjust the *phrasing* of
// an implementation example (concrete verbs, scaffolding) — they never
// change which competences apply or invent a requirement.

export const CYCLE_OPTIONS = [
  "Nursery",
  "P1-P3",
  "P4-P5",
  "S1-S3",
  "S4-S5",
  "S6-S7"
] as const;

export type Cycle = (typeof CYCLE_OPTIONS)[number];

export const CYCLE_ADAPTATION: Record<Cycle, string> = {
  Nursery:
    "Use concrete, sensory activities and adult-modelled choices with two or three options.",
  "P1-P3":
    "Use simple guided choices (for example, picture cards or two-option votes) with strong teacher scaffolding.",
  "P4-P5":
    "Offer bounded pupil choice within a clear, teacher-set structure, and use sentence starters for reasoning.",
  "S1-S3":
    "Give pupils more open choice of sources, roles and options, with explicit criteria for evaluating them.",
  "S4-S5":
    "Expect independent source evaluation, a documented decision process and a real stakeholder contact where feasible.",
  "S6-S7":
    "Expect independent inquiry design, critical evaluation of evidence and an authentic action with measurable follow-up."
};

export function isCycle(value: string): value is Cycle {
  return (CYCLE_OPTIONS as readonly string[]).includes(value);
}

export function getCycleAdaptation(cycle: string): string | undefined {
  return isCycle(cycle) ? CYCLE_ADAPTATION[cycle] : undefined;
}
