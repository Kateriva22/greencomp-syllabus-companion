// One-off local script (not part of the shipped app) used to produce
// sample-export/test-case-01-export.json as a deliverable showing what a
// real export looks like. Run with: npx vite-node scripts/generateSampleExport.ts
import { writeFileSync } from "node:fs";
import inputSyllabus from "../../test-cases/test-case-01/input_syllabus.md?raw";
import { segmentDocument } from "../src/lib/parsing/sectionSegmenter";
import { analyzeDocument } from "../src/lib/analysis/engine";
import { toJsonString } from "../src/lib/export/jsonExport";

const sections = segmentDocument(inputSyllabus);
const result = analyzeDocument({
  sections,
  document: {
    title: "Our Sustainable School: Small Actions, Big Difference",
    subject: "European Hours",
    cycle: "P4-P5",
    source_type: "txt"
  },
  cycle: "P4-P5"
});

// Simulate a teacher having reviewed the first two suggestions, to show the
// Accept/Edit controls reflected in an export (per PROJECT_BRIEF §3.7).
if (result.suggestions[0]) result.suggestions[0].teacher_decision = "accepted";
if (result.suggestions[1]) {
  result.suggestions[1].teacher_decision = "edited";
  result.suggestions[1].edited_text =
    "Teacher-edited: keep the clean-up, and add a short pitch to the school council before it happens.";
}

writeFileSync("sample-export/test-case-01-export.json", toJsonString(result) + "\n");
console.log("Wrote sample-export/test-case-01-export.json");
