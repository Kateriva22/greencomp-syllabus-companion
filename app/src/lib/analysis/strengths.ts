import type { Strength } from "../../types/domain";
import type { RuleContext } from "./context";
import { excerpt, firstMatchingLine, locationLabel } from "./context";

const SCHOOL_LINK = /\bschool\b/i;
const SUSTAINABILITY_THEME = /sustainab|environment|recycl|energy|water|waste/i;
const MULTILINGUAL = /multilingual|translat|language section|mixed-ability/i;
const EUROPEAN_COMPARISON = /european (countries|examples|dimension)|different (language sections|countries)|partner class/i;
const ACTION_INTENT = /clean-?up|take action|propose (an? )?action|greener school|practical action/i;
const GROUP_WORK = /\bgroup\b/i;

export function detectStrengths(ctx: RuleContext): Strength[] {
  const strengths: Strength[] = [];

  const rationaleContent = ctx.sectionsOf(["rationale", "content"]);
  if (rationaleContent.length > 0) {
    const combined = rationaleContent.map((s) => s.text).join("\n");
    if (SCHOOL_LINK.test(combined) && SUSTAINABILITY_THEME.test(combined)) {
      strengths.push({
        location: locationLabel(rationaleContent),
        evidence: "Explicit sustainability theme connected to school life",
        reason: "Provides a relevant, concrete starting point for pupils rather than an abstract topic."
      });
    }
  }

  const inclusion = ctx.section("inclusion");
  if (inclusion && MULTILINGUAL.test(inclusion.text)) {
    strengths.push({
      location: inclusion.heading,
      evidence: excerpt(firstMatchingLine(inclusion.text, MULTILINGUAL) ?? inclusion.text),
      reason: "Supports multilingual and inclusive participation, a design condition for European Schools education."
    });
  }

  const europeanSections = ctx.sectionsOf(["european_dimension", "content"]);
  const europeanCombined = europeanSections.map((s) => s.text).join("\n");
  if (europeanSections.length > 0 && EUROPEAN_COMPARISON.test(europeanCombined)) {
    strengths.push({
      location: locationLabel(europeanSections),
      evidence: excerpt(firstMatchingLine(europeanCombined, EUROPEAN_COMPARISON) ?? europeanCombined),
      reason: "Supports intercultural learning and comparison across the European Schools' multicultural context."
    });
  }

  const actionSections = ctx.sectionsOf(["sequence", "final_product"]);
  const actionCombined =
    (actionSections.find((s) => s.kind === "sequence")?.tableRows?.map((r) => r.join(" ")).join("\n") ?? "") +
    "\n" +
    actionSections.map((s) => s.text).join("\n");
  if (actionSections.length > 0 && ACTION_INTENT.test(actionCombined)) {
    strengths.push({
      location: locationLabel(actionSections),
      evidence: "Intention to connect learning with practical action",
      reason: "Can be developed into an authentic action cycle rather than discarded."
    });
  }

  const pedagogy = ctx.sectionsOf(["pedagogy", "sequence"]);
  const pedagogyCombined = pedagogy.map((s) => s.text).join("\n");
  if (pedagogy.length > 0 && GROUP_WORK.test(pedagogyCombined)) {
    strengths.push({
      location: locationLabel(pedagogy),
      evidence: excerpt(firstMatchingLine(pedagogyCombined, GROUP_WORK) ?? pedagogyCombined),
      reason: "Group work offers a collaborative starting point that can grow into genuine collective decision-making."
    });
  }

  return strengths;
}
