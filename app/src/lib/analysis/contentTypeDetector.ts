import type { ContentType } from "../../types/domain";

/**
 * Detects content types in syllabus text to adjust confidence and handling.
 * Returns flags indicating whether text contains institutional statements,
 * learning outcomes, activities, assessment criteria, or a mix.
 */

// Patterns indicating institutional/mission statement language (generic, low confidence)
const INSTITUTIONAL_PATTERNS = [
  /^(Pupils? encounter|This unit|It aims to|Our school|We believe|The purpose)/i,
  /^(This course|Students will learn about|In this|We provide)/i,
  /^(The goal is|Designed to|Intended to provide)/i,
];

// Patterns indicating intended learning outcomes (high confidence)
const OUTCOME_PATTERNS = [
  /^(By the end|Pupils? will be able to|Students will|Learners will)/i,
  /^(- (identify|describe|name|analyze|evaluate|compare|propose|demonstrate|understand))/i,
  /(know|understand|be able to|will learn|will gain)/i,
];

// Patterns indicating suggested activities/tasks (medium confidence)
const ACTIVITY_PATTERNS = [
  /^(Pupils? (will |may |can )?investigate|research|explore|discuss|carry out)/i,
  /^(The teacher (will|provides|asks|shows|guides))/i,
  /^(In groups|Individually|Whole-class|Paired)/i,
  /^(Activities?:|Learning activities|Pupils do|Pupils work on)/i,
  /^(Week \d|Lesson \d|Session \d)/i,
];

// Patterns indicating assessment criteria/rubric (high confidence)
const ASSESSMENT_PATTERNS = [
  /^(Assessment|Criterion|Criteria|Rubric)/i,
  /^(Component|Weight|Main criteria)/i,
  /^(- (correct|accurate|demonstrates|shows|uses|meets|exceeds|appropriate))/i,
  /\b(marks?|points?)\b.*(%|score|grade|rubric)/i, // "marks" or "points" with nearby score/grade context
  /^\d+%|^points?:|weight:/i,
];

/**
 * Detect content types in a line of text.
 * Returns all applicable types (multiple types can apply).
 */
function detectLineContentTypes(line: string): ContentType[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const types: ContentType[] = [];

  // Check patterns (order matters—more specific patterns first)
  if (OUTCOME_PATTERNS.some((p) => p.test(trimmed))) {
    types.push("outcome");
  }
  if (ASSESSMENT_PATTERNS.some((p) => p.test(trimmed))) {
    types.push("assessment");
  }
  if (ACTIVITY_PATTERNS.some((p) => p.test(trimmed))) {
    types.push("activity");
  }
  if (INSTITUTIONAL_PATTERNS.some((p) => p.test(trimmed))) {
    types.push("institutional");
  }

  return types.length > 0 ? types : [];
}

/**
 * Detect content types in a full section of text.
 * Scans all lines and returns the overall content-type classification.
 *
 * Returns:
 * - Single type if all detected lines are one type (e.g., all "outcome")
 * - "mixed" if multiple types are found
 * - [] (empty) if no content types detected
 */
export function detectSectionContentTypes(text: string): ContentType[] {
  const lines = text.split("\n").map((l) => l.trim());
  const allTypes = new Set<ContentType>();

  lines.forEach((line) => {
    detectLineContentTypes(line).forEach((t) => allTypes.add(t));
  });

  if (allTypes.size === 0) return [];
  if (allTypes.size === 1) return Array.from(allTypes);
  return ["mixed"];
}

/**
 * Calculate a confidence multiplier based on content type.
 * Used to adjust rule confidence when evidence is detected.
 *
 * - outcome: 1.0 (full confidence, specific curriculum language)
 * - assessment: 1.0 (full confidence, formalized evidence requirement)
 * - activity: 0.7 (medium confidence, activity described but not guaranteed to happen)
 * - institutional: 0.3 (low confidence, generic mission/values statement)
 * - mixed: 0.6 (medium-low, unclear mix of content types)
 */
export function confidenceMultiplier(contentTypes: ContentType[]): number {
  if (contentTypes.length === 0) return 1.0; // No type info, assume default

  if (contentTypes.includes("mixed")) return 0.6;

  // Prefer highest confidence type if multiple specific types
  if (contentTypes.includes("outcome") || contentTypes.includes("assessment")) return 1.0;
  if (contentTypes.includes("activity")) return 0.7;
  if (contentTypes.includes("institutional")) return 0.3;

  return 1.0; // Fallback
}

/**
 * Check if a line is primarily institutional/boilerplate.
 * Useful for deciding whether to use a line as evidence.
 */
export function isInstitutional(text: string): boolean {
  return INSTITUTIONAL_PATTERNS.some((p) => p.test(text.trim()));
}

/**
 * Check if a line is primarily an assessment-related statement.
 * Useful for identifying assessment evidence vs other content types.
 */
export function isAssessment(text: string): boolean {
  return ASSESSMENT_PATTERNS.some((p) => p.test(text.trim()));
}

/**
 * Check if a line describes a pupil-initiated action vs teacher-controlled activity.
 * Useful for distinguishing autonomy/agency from directed tasks.
 */
export function isPupilInitiated(text: string): boolean {
  const pupilActionPatterns = [
    /(pupils?|students?|learners?|children?) (choose|select|decide|propose|volunteer|lead|plan|organize|create)/i,
    /(pupils?|students?|learners?) will decide|pupil-led|student-led/i,
    /group (decides|chooses)/i,
  ];
  return pupilActionPatterns.some((p) => p.test(text.trim()));
}

/**
 * Check if a line describes actual action/implementation vs discussion/awareness.
 * Useful for authentic action vs talk-about-action distinctions.
 */
export function isConcreteAction(text: string): boolean {
  const actionPatterns = [
    /carry out|implement|conduct|execute|do|perform|take action/i,
    /before.*after|gather.*feedback|measure.*effect|evidence of/i,
    /propose.*to.*stakeholder|present.*to|pitch to/i,
    /clean-?up|plant|build|make|create|change/i,
  ];
  return actionPatterns.some((p) => p.test(text.trim()));
}
