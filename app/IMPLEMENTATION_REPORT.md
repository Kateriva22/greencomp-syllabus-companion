# Phase 1 implementation report — GreenComp Syllabus Companion

## Preliminary note: starter-pack file layout

The reference files CLAUDE.md requires (`reference/PUBLIC_CONTEXT_PACK.md`,
`reference/greencomp.json`, `reference/expected_output_schema.json`,
`test-cases/test-case-01/input_syllabus.md`, `test-cases/test-case-01/gold_standard.json`) were
initially missing from the repository (only the root docs from the first starter-pack commit were
present). This was flagged and held for the user rather than guessed at or reconstructed. Once
the user committed the files (uploaded to the repo root instead of their intended folders), they
were moved into place with `git mv` to preserve history, and their contents were read and used as
the basis for this implementation. No file outside `app/` was modified other than this
reorganisation, which the user explicitly requested.

## What was built

A React + TypeScript + Vite PWA, entirely inside `app/`, implementing the full Phase 1 user
journey from PROJECT_BRIEF §3:

- **Landing** screen stating files stay on-device (§8: no traffic-light verdict, plain language).
- **Intake**: subject / cycle (P1-P3 … S6-S7) / working language, plus "Open locally" for
  `.txt`/`.docx`/text-based `.pdf`, or paste text directly.
- **Local parsing**: `mammoth` (`.docx` → HTML → normalised heading/table text), `pdf.js`
  (`.pdf`, with a heuristic scanned-PDF detector and a clear error message), a passthrough
  `.txt`/paste path — all running in-browser, nothing uploaded.
- **Structure recognition**: a section/table segmenter classifying each section into one of 14
  kinds (rationale, objectives, outcomes, content, pedagogy, sequence, assessment, resources,
  inclusion, final_product, local_adaptation, european_dimension, preparation, review), shown to
  the teacher before analysis runs.
- **Deterministic analysis engine**: 8 section-aware gap-detection rules (one per
  `gold_standard.json` finding category), a strengths detector (checked before gaps, per
  PROJECT_BRIEF §4.3), and a 0–3 coverage scorer for all 12 GreenComp competences using
  "mentioned vs. purposeful-in-how-many-stages" patterns — all backed by versioned TypeScript data
  modules (`src/data/greencomp.ts`, `contextPack.ts`, `ageAdaptations.ts`) mirroring the reference
  files, not hidden magic numbers.
- **Results screen**: strengths first, then a non-verdict coverage overview (Not yet observed /
  Emerging / Purposeful / Embedded, expandable detail table), then ranked suggestion cards (each
  with location, quoted current wording, observed gap, ≤4 competences, suggested wording,
  implementation example tailored by cycle, assessment evidence, an optional European Schools
  context note, priority/confidence, and the exact rule that fired), then limitations, then
  export.
- **Accept / Edit / Reject** controls on every suggestion, flowing through session state so the
  export reflects the teacher's actual decisions and any edited wording.
- **Export**: local-only JSON (matching `reference/expected_output_schema.json`) and a
  self-contained printable HTML report, both generated as an in-memory download.
- **Clear session**: an explicit, two-step confirmable destructive action.
- **PWA/offline**: `vite-plugin-pwa` in `generateSW` mode, precaching only the app's own built
  assets, no runtime-caching network routes; a restrictive CSP meta tag limiting every directive
  to `'self'`; the pdf.js worker bundled and served from the app's own origin instead of a CDN.

## What was tested

`npm test` (Vitest + Testing Library), 23 tests across 5 files, all passing:

- Section segmentation (markdown headings, tables, the non-markdown fallback, and the
  no-structure-found fallback).
- **The required Test Case 01 acceptance test**, run against the actual
  `test-cases/test-case-01/input_syllabus.md` and its `gold_standard.json`. Result on this input:
  **6 of 6 core gap categories** detected (minimum required: 5), **all 3 mandatory categories**
  detected (pupil agency, authentic action, assessment alignment), **8 suggestions** (required
  range 6–10), **5 strengths** (required minimum 2), every suggestion location/excerpt/rule-basis
  populated, competence ids valid and ≤4 per suggestion, and coverage correctly leaves several of
  the 12 competences at 0 ("not observed") rather than forcing full coverage.
- Generalisation tests using hand-written synthetic text (deliberately *not* Test Case 01's
  wording) proving each rule both fires on a genuine gap and correctly stays silent once the
  syllabus already addresses that gap (pupil choice present → no pupil_agency finding; a
  stakeholder + feedback loop present → no authentic_action finding; evidence/reflection criteria
  present → no assessment_alignment finding) — this is the check against the engine being an
  overfit match to one document.
- Component tests: the Accept/Edit/Reject controls actually update session state and are reflected
  back through the same data flow `ResultsScreen` uses in the real app (not a prop the test
  fabricated); a full paste → structure → review flow renders end-to-end from `<App/>`.

Manual/browser verification (not part of `npm test`):

- `npm run build` succeeds cleanly (`tsc -b && vite build`), producing `dist/`.
- Verified in a headless Chromium session: loaded the production `preview` build, confirmed the
  service worker registered and activated, then fully disabled the network and reloaded — the app
  shell still rendered, and the entire paste → structure → analyse → accept/edit flow completed
  successfully with **zero non-origin network requests** observed at any point.
- Inspected `dist/` for `http://`/`https://` occurrences per the SECURITY_AND_PRIVACY.md
  checklist: all matches are inert (XML namespace strings, license/doc-link comments inside
  `mammoth`/`pdf.js`/`react`/`jszip`, one Workbox `console.warn` string) — none are passed to
  `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`. The only reachable `fetch()` call sites are
  Vite's own same-origin asset preloading; pdf.js's optional CMap/standard-font/streaming fetch
  paths are unreachable because no `cMapUrl`/`standardFontDataUrl`/`url` is ever configured
  (`getDocument()` is called with in-memory `data` only, plus `disableStream`/`disableAutoFetch`).
  Full detail in `README.md`.
- Visually reviewed the landing and results screens (screenshots taken during the offline check)
  for the calm/professional/no-traffic-light presentation PROJECT_BRIEF §8 asks for.
- Generated `sample-export/test-case-01-export.json` via `npm run generate:sample-export`,
  simulating one accepted and one edited suggestion, as the required sample export deliverable.

## What was deferred

Everything PROJECT_BRIEF §11/§12 places out of scope for Phase 1 is genuinely absent from this
codebase (not stubbed or hidden behind a flag): remote/local generative AI, cloud
accounts/collaboration/storage, direct DOCX/PDF editing, OCR for scanned PDFs, machine
translation, official certification/compliance scoring, and ingestion of internal/unpublished
European Schools documents. No Phase 2 rewrite-provider interface was added.

Within Phase 1's own scope, a few things were consciously simplified given the size of the task:
table-aware analysis for `.pdf` inputs (PDF text extraction is per-page plain text, not
table-structured — see "Known limitations" in `README.md`), and code-splitting of the production
bundle (currently one ~1 MB JS chunk, dominated by `mammoth`+`pdf.js`, which is a reasonable
trade-off for an app that precaches its whole shell once but was not optimised further).

## What is still risky / needs human review before real use

- **Pattern coverage is necessarily incomplete.** The 8 rules and the strengths/coverage patterns
  were designed from PROJECT_BRIEF §5's required detections and calibrated against Test Case 01,
  but they are regular-expression heuristics, not language understanding. A real syllabus using
  very different phrasing for the same underlying gap may not trigger a rule that should fire, or
  (less likely, since every rule requires an "absence" match) could occasionally fire on wording
  that only superficially resembles the pattern. The `rule_basis` field on every suggestion exists
  specifically so a teacher can sanity-check this rather than trust it blindly — this should be
  treated as a first pass, not a final word, especially on syllabi structured very differently
  from Test Case 01's clear numbered-heading format.
- **Section-kind classification is keyword-based** (matching the heading text against a fixed set
  of regular expressions per kind). An unusually named heading (e.g. "What we will explore"
  instead of "Content") may be classified as `other` and miss section-specific rules, though it
  will still be included in whole-document context.
- **The coverage rubric's "Purposeful"/"Embedded" distinction** (present in one vs. more than one
  of {outcomes, sequence, assessment}) is a reasonable, transparent proxy for "observable in one
  stage" vs. "embedded across the unit," but it is Phase 1's own interpretation of the GreenComp
  0–3 scoring text in `reference/greencomp.json`, not an official scoring standard — this is
  stated in the UI, but worth re-confirming with whoever validated the gold standard before wider
  rollout.
- **This has only been exercised against synthetic, hand-written text** — Test Case 01 and the
  small fixtures in `engine.test.ts`. It has not been run against a real, messy, longer syllabus
  document (varied heading styles, inconsistent tables, mixed languages), which is exactly the
  kind of input most likely to expose gaps in the segmenter's fallback heuristics or the rules'
  pattern coverage. Trying it on a few real (but appropriately reviewed/approved) documents before
  broader use would surface issues no synthetic test case can.
- **`.docx` parsing depends on the source file using Word's built-in Heading styles.** A `.docx`
  where section titles are just bold/larger plain paragraphs (not actually styled as Heading 1–6)
  will not be recognised as headings by `mammoth`, and the document will fall through to the
  single-block "other" analysis path, which is flagged to the teacher but is a materially weaker
  review than a properly-segmented one.

## Stopping point

Phase 1 is complete per the criteria above: `npm test`, `npm run build`, and the offline/CSP
verification all pass, and the required deliverables (source, tests including Test Case 01,
README with install/run/build/offline instructions, privacy/data-flow note, dependency rationale,
known limitations, sample export, this report) are all present inside `app/`. No Phase 2 work was
started.
