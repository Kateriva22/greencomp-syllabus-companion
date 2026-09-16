// Mirrors reference/expected_output_schema.json. Kept intentionally close to
// that schema so the shape of an exported report matches the project's
// documented contract, not an ad-hoc structure invented for the UI.

export type Priority = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";
export type TeacherDecision = "pending" | "accepted" | "edited" | "rejected";

export interface DocumentMeta {
  title: string;
  subject: string;
  cycle: string;
  source_type: "paste" | "txt" | "docx" | "pdf";
}

export interface Strength {
  location: string;
  evidence: string;
  reason: string;
}

export interface CoverageEntry {
  competence_id: string;
  score: 0 | 1 | 2 | 3;
  evidence: string;
}

export interface Suggestion {
  id: string;
  category: string;
  priority: Priority;
  confidence: Confidence;
  location: string;
  current_excerpt: string;
  observed_gap: string;
  competence_ids: string[];
  suggested_wording: string;
  implementation_example: string;
  assessment_evidence: string;
  european_schools_context?: string;
  rule_basis: string[];
  teacher_decision: TeacherDecision;
  edited_text?: string;
}

export interface ReviewResult {
  document: DocumentMeta;
  strengths: Strength[];
  coverage: CoverageEntry[];
  suggestions: Suggestion[];
  limitations: string[];
}

// --- Intermediate analysis-engine types (not part of the export schema) ---

export interface DocumentSection {
  id: string;
  heading: string;
  kind: SectionKind;
  level: number;
  text: string;
  tableRows?: string[][];
  startLine: number;
  
  // Provenance tracking (Phase 3-4 enhancements)
  pageNumber?: number;  // For PDFs/DOCX with page metadata
  contentTypes?: ContentType[]; // Flags for institutional vs outcome vs activity vs assessment
  paragraphBoundaries?: number[]; // Character indices of paragraph breaks within text
}

/**
 * Content-type flags for section text.
 * Multiple flags can apply to one section (e.g., pedagogy section may have both
 * "activity" and "assessment" content in different paragraphs).
 */
export type ContentType =
  | "institutional" // Mission statement, values, generic opening (low confidence)
  | "outcome" // Intended learning outcome (high confidence)
  | "activity" // Suggested activity/task the teacher/pupils do (medium confidence)
  | "assessment" // Assessment criterion or rubric (high confidence)
  | "mixed"; // Mixed content types in same section

export type SectionKind =
  | "rationale"
  | "objectives"
  | "outcomes"
  | "content"
  | "pedagogy"
  | "sequence"
  | "assessment"
  | "resources"
  | "inclusion"
  | "final_product"
  | "local_adaptation"
  | "european_dimension"
  | "preparation"
  | "review"
  | "other";

export interface ParsedDocument {
  rawText: string;
  sections: DocumentSection[];
}

export interface IntakeInfo {
  subject: string;
  cycle: string;
  language: string;
}
