import type { Suggestion } from "../../types/domain";
import type { RuleContext } from "./context";
import type { Cycle } from "../../data/ageAdaptations";

export type SuggestionDraft = Omit<Suggestion, "id" | "teacher_decision">;

export interface RuleInput {
  ctx: RuleContext;
  cycle?: Cycle | string;
}

// Each gap-category rule inspects specific section kinds and returns zero or
// one suggestion. Returning an array keeps the door open for a rule to find
// more than one instance of the same category without changing the engine.
export type GapRule = (input: RuleInput) => SuggestionDraft[];
