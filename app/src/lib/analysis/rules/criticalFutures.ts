import type { GapRule } from "../types";
import { excerpt, locationLabel } from "../context";
import { getContextNote } from "../../../data/contextPack";

const RECORD_FACTS = /record(ed)? (relevant )?facts|note (down )?facts|search .* record|search selected websites/i;
const CRITICAL_OR_FUTURES = /evaluat|judge|reliab|credib|compare sources|missing (perspective|voice)|whose voice|\bfuture\b|scenario|plausible|preferred future|imagine (a|the) future|what if/i;

export const criticalFuturesRule: GapRule = ({ ctx }) => {
  const sequence = ctx.section("sequence");
  const european = ctx.section("european_dimension");
  const sections = [sequence, european].filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (sections.length === 0) return [];

  const sequenceText = sequence?.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  const combined = [sequenceText, european?.text ?? ""].join("\n");
  if (!RECORD_FACTS.test(combined) || CRITICAL_OR_FUTURES.test(combined)) return [];

  const triggerRow = sequence?.tableRows?.find((r) => RECORD_FACTS.test(r.join(" ")));
  const excerptText = triggerRow ? triggerRow.join(" — ") : combined;

  return [
    {
      category: "critical_and_futures_thinking",
      priority: "high",
      confidence: "medium",
      location: locationLabel(sections),
      current_excerpt: excerpt(excerptText),
      observed_gap:
        "European examples are recorded as facts. No wording asks pupils to judge sources, notice missing perspectives, imagine future scenarios, or compare options.",
      competence_ids: ["1.2", "2.2", "3.1", "3.3"],
      suggested_wording:
        "After recording facts, ask pupils one evaluative question (is this source reliable? whose viewpoint is missing?) and one futures question (what might this look like in 10 years, or what else could be tried?).",
      implementation_example:
        "Add a short 'source check' box to the research notes template (who wrote this, when, is it reliable?) and a 'what if' prompt asking pupils to sketch one alternative future or option.",
      assessment_evidence:
        "Completed source-check notes and a one or two sentence future-scenario or alternative-option response per group.",
      european_schools_context: getContextNote("critical_and_futures_thinking"),
      rule_basis: [
        "Rule: critical_and_futures_thinking — matched 'record facts' research wording without matching source-evaluation or futures/scenario wording in the learning-sequence or European-dimension sections."
      ]
    }
  ];
};

// Structural-absence companion: the learning-sequence/European-dimension
// sections exist and have content, but match neither "record facts"
// research wording nor source-evaluation/futures wording — there is no
// describable research or futures activity here to classify either way.
// Reported as an absence of evidence, at medium confidence, never as a
// confirmed gap.
export const criticalFuturesAbsenceRule: GapRule = ({ ctx }) => {
  const sequence = ctx.section("sequence");
  const european = ctx.section("european_dimension");
  const sections = [sequence, european].filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (sections.length === 0) return [];

  const sequenceText = sequence?.tableRows?.map((r) => r.join(" ")).join("\n") ?? "";
  const combined = [sequenceText, european?.text ?? ""].join("\n");
  if (!combined.trim()) return [];
  if (RECORD_FACTS.test(combined) || CRITICAL_OR_FUTURES.test(combined)) return [];

  return [
    {
      category: "critical_and_futures_thinking",
      priority: "medium",
      confidence: "medium",
      location: locationLabel(sections),
      current_excerpt: excerpt(combined),
      observed_gap:
        "Evidence was not found in the reviewed text for critical or futures thinking — no research or comparison activity was found that could be checked for source evaluation or futures/scenario thinking.",
      competence_ids: ["1.2", "2.2", "3.1", "3.3"],
      suggested_wording:
        "If pupils research or compare examples in this unit, add a prompt asking them to judge a source or consider an alternative/future option.",
      implementation_example:
        "Add one evaluative or 'what if' question to whatever research or comparison activity already exists in this unit.",
      assessment_evidence:
        "A short pupil response to the added evaluative or futures question.",
      european_schools_context: getContextNote("critical_and_futures_thinking"),
      rule_basis: [
        "Rule: critical_and_futures_thinking (structural absence) — the learning-sequence/European-dimension sections exist but matched neither 'record facts' wording nor source-evaluation/futures wording; absence of evidence is not evidence of absence."
      ]
    }
  ];
};
