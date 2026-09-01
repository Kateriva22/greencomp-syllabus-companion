import type { GapRule } from "../types";
import { excerpt } from "../context";
import { getContextNote } from "../../../data/contextPack";

// Matches "- ", "* ", "1. " and "1) " list markers — a DOCX <ol> is
// rendered by htmlToStructuredText as numbered lines ("1. …"), not
// markdown dashes, so this must recognise both list styles.
const BULLET = /^(?:[-*]|\d+[.)])\s+(.*)$/;
const LOW_ORDER_VERB = /^(identify|describe|name|list|record|search|find|state|recall)\b/i;
const HIGH_ORDER_VERB = /(evaluate|compare|propose|decide|justify|design|reflect|frame|question|debate|argue|adapt)/i;

function bulletLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .map((l) => BULLET.exec(l)?.[1])
    .filter((l): l is string => Boolean(l));
}

export const learningOutcomesRule: GapRule = ({ ctx }) => {
  const section = ctx.section("outcomes");
  if (!section) return [];

  const bullets = bulletLines(section.text);
  if (bullets.length === 0) return [];

  const lowOrderCount = bullets.filter((b) => LOW_ORDER_VERB.test(b)).length;
  const highOrderCount = bullets.filter((b) => HIGH_ORDER_VERB.test(b)).length;

  // A single higher-order outcome among many recall outcomes is not enough
  // to call the set balanced — require recall outcomes to outnumber
  // higher-order ones by more than 2:1 before treating it as a genuine gap,
  // so the finding isn't suppressed by one incidental keyword.
  if (lowOrderCount < 2 || lowOrderCount <= highOrderCount * 2) return [];

  // The condition above only requires recall outcomes to outnumber
  // higher-order ones by more than 2:1 — it does not require zero
  // higher-order outcomes. observed_gap must reflect whichever is actually
  // true, never assert "no outcome does X" when the counts show otherwise.
  const observedGap =
    highOrderCount === 0
      ? `Outcomes mainly measure recall and task completion (identify, describe, name, record — ${lowOrderCount} of ${bullets.length}). No outcome asks pupils to frame a problem, evaluate evidence, weigh options or reflect.`
      : `Higher-order outcomes are underrepresented: only ${highOrderCount} of ${bullets.length} outcomes ask pupils to frame a problem, evaluate evidence, weigh options or reflect, against ${lowOrderCount} that mainly measure recall and task completion.`;

  return [
    {
      category: "learning_outcomes",
      priority: "critical",
      confidence: "high",
      location: section.heading,
      current_excerpt: excerpt(bullets.slice(0, 3).join("; ")),
      observed_gap: observedGap,
      competence_ids: ["2.1", "2.2", "2.3", "4.3"],
      suggested_wording:
        "Add outcomes such as: frame a school sustainability question in their own words; judge whether a source or example is trustworthy and relevant; compare at least two possible actions using simple criteria; reflect on what they contributed.",
      implementation_example:
        "Keep the factual outcomes as a foundation, and add one outcome per higher-order skill (framing, judging evidence, comparing options, reflecting) so each is visible and teachable, not assumed.",
      assessment_evidence:
        "A short written or spoken response for each added outcome (a question the pupil framed, a judgement about a source, a choice between two options with a reason, a reflection sentence).",
      european_schools_context: getContextNote("learning_outcomes"),
      rule_basis: [
        `Rule: learning_outcomes — ${lowOrderCount} recall/task-completion outcome(s) found against only ${highOrderCount} using a higher-order verb (evaluate, compare, propose, decide, justify, design, reflect, frame).`
      ]
    }
  ];
};
