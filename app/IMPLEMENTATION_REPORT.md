# Phase 1 implementation report — GreenComp Syllabus Companion

## Review-response round — 8 blockers fixed

A human review of the initial Phase 1 PR found 8 blockers. All 8 were fixed on the same branch;
nothing was merged or deployed. Exact final verification results are at the bottom of this
section; each blocker is summarised with the file(s) changed and the regression test added.

1. **DOCX parsing collapsed lists.** `htmlToStructuredText.ts`'s non-heading/table branch used
   `el.textContent`, which concatenates every `<li>` in a `<ul>`/`<ol>` into one run of text with
   no separators, and dropped manual `<br>` line breaks. Rewrote it to walk `<ul>`/`<ol>`/`<li>`
   explicitly (including nested lists) and to turn `<br>` into a real newline. Added
   `htmlToStructuredText.test.ts` (headings/bullets/numbered lists/nesting/line breaks/tables),
   `docxParser.test.ts` (the real `parseDocx()` function, mammoth mocked), and `docxRoute.test.ts`
   — a full `parseDocx → segmentDocument → analyzeDocument` regression test with synthetic
   mammoth-shaped HTML proving the `learning_outcomes` finding is detected from a DOCX numbered
   list, not only from the markdown Test Case 01 fixture. Also fixed `learningOutcomesRule`'s
   bullet regex, which only matched `-`/`*` and would have missed a DOCX `<ol>`'s numbered output
   entirely.
2. **PDF parsing joined every page into one line.** `pdfParser.ts` joined all of a page's text
   items with a single space, destroying every line/heading boundary. Rewrote it as
   `reconstructPageText()`, which keeps items on the same visual line joined by a space but starts
   a new line on pdf.js's `hasEOL` flag or a baseline y-coordinate jump. Added `pdfParser.test.ts`
   (unit tests against synthetic text items: same-line joining, `hasEOL`, y-jump fallback,
   sub-pixel jitter, non-text marked content, multi-heading recovery) and `pdfRoute.test.ts` (a
   mocked-`pdfjs-dist` end-to-end test proving a synthetic page segments into 3 distinct sections).
   PDF **table** reconstruction was deliberately left as a documented limitation (see
   `README.md`) — pdf.js returns positioned text runs, not table structure, and reliable table
   reconstruction from raw positions is a materially harder problem than line reconstruction. No
   real or internal PDF/syllabus was added to the repository; all fixtures are hand-written
   synthetic text items or mocked `pdfjs-dist` responses.
3. **The pdf.js worker wasn't in the offline precache.** `vite.config.ts`'s
   `workbox.globPatterns` didn't include `mjs`, so `pdf.worker.min-*.mjs` was silently excluded
   from the service worker's precache — PDF opening would have broken the moment the app was used
   offline. Added `mjs`/`webmanifest` to the glob and an explicit `maximumFileSizeToCacheInBytes`.
   Added `scripts/verifyOfflinePdfPrecache.mjs`, wired into `npm run build` itself (not just a
   one-off manual check), which fails the build if `dist/sw.js` doesn't reference the worker file.
   Re-verified in a headless Chromium session: after the SW controlled the page, a raw `fetch()` of
   the worker URL succeeded with the network fully disabled.
4. **Rule-engine generalisation.** Added a structural-absence companion rule for each of
   `pupil_agency`, `authentic_action`, `systems_inquiry`, `critical_and_futures_thinking` and
   `assessment_alignment` (`*AbsenceRule` in the same rule file), firing at medium
   priority/confidence with "evidence was not found" wording when the relevant section exists but
   matches neither the gap pattern nor the addressed pattern — never asserting a confirmed
   problem. Fixed `assessmentAlignmentRule` so one incidental higher-order keyword no longer
   suppresses the whole finding: it now counts recall-vs-higher-order criteria per table
   row/prose line and only stays silent once they're genuinely balanced. Fixed
   `coverage.ts`'s 3.2 Adaptability pattern, which matched a bare `change` — meaning "climate
   change" (the most common phrase in any sustainability syllabus) counted as Adaptability
   evidence — to require an actual "adapt…"/"respond to feedback"/"uncertain…" root. Also found
   and fixed, while writing the regression test for the above, that `coverage.ts` never scanned
   `tableRows` at all, only section prose — meaning any competence evidence living only in a table
   (the sequence/assessment sections are almost always tables) was invisible to coverage scoring;
   fixed to scan both. Added `absenceRules.test.ts`, `assessmentSuppression.test.ts`,
   `coverage.test.ts`, and broadened `engine.test.ts` with numbered/`*`-bullet lists, alternate
   section headings (Aims/Methodology), the non-markdown heading fallback, and reordered table
   columns.
5. **Language scope wasn't disclosed.** Added an explicit "Phase 1 analysis rules are
   English-only" notice on the intake screen (`IntakeForm.tsx`) and a permanent entry in every
   result's `limitations` array (`engine.ts`), stating a non-English document will not be reliably
   analysed. Extended `App.test.tsx`/`engine.test.ts` to assert both.
6. **Hosting from a subpath wasn't supported.** `vite.config.ts` previously used the default
   absolute base, so every asset URL would 404 under a path like
   `/greencomp-syllabus-companion/`. Set `base: "./"` (all URLs relative to `index.html`) and added
   `scripts/verifySubpathBuild.mjs` (wired into `npm run build`), which fails if any root-absolute
   asset reference reappears in the built HTML or manifest. Verified in a headless Chromium
   session: the same `dist/` build works both at a domain root and copied under a
   `/greencomp-syllabus-companion/` subpath on a plain static server, full flow, no failed
   requests, correct service-worker scope. **Nothing was published or deployed** — this only
   confirms the build artifact itself is subpath-safe.
7. **Dependencies had known vulnerabilities.** `npm audit` previously reported 6 vulnerabilities
   (4 moderate, 1 high, 1 critical) in the `esbuild`/`vite` dev-server chain. Upgraded `vite`
   5.4→7.3.6 (the first major with a patched `esbuild`; there is no patched 6.x release), `vitest`
   2.1→3.2.7 (same major, patched `@vitest/mocker`/`vite-node`), `vite-plugin-pwa` 0.20→1.3.0, and
   `@vitejs/plugin-react` 4.7→5.2.0 (required companion bump — 4.x doesn't support `vite` 7). Fixed
   one resulting break: `vite` 7 tightened its dev/build-time filesystem-access allowlist to the
   project root, which blocked the Test Case 01 test and `generateSampleExport.ts`'s intentional
   read of `../test-cases` one level above `app/`; added an explicit `server.fs.allow` in both
   `vite.config.ts` and `vitest.config.ts` (a local dev/test-tooling setting only — it has no
   effect on the production bundle or its CSP). `npm audit` and `npm audit --omit=dev` both now
   report **0 vulnerabilities**; there is no remaining dev-only finding to report.
8. **Edited wording could go stale after a later decision change.** `SuggestionCard.tsx` displayed
   `suggestion.edited_text ?? suggestion.suggested_wording` unconditionally, so a suggestion that
   was edited and then Accepted or Rejected kept showing the abandoned draft under the new status.
   The session-store reducer also never cleared `edited_text` when the decision moved away from
   `"edited"`, so a stale draft could leak into the JSON export too. Fixed the reducer to clear
   `edited_text` on any non-`"edited"` decision, and extracted a single shared
   `effectiveWording()` helper (`src/lib/suggestionWording.ts`) used by the UI, the JSON export
   and the printable HTML export, so all three surfaces are provably consistent by construction
   rather than by three independently-maintained conditionals. Added `suggestionWording.test.ts`,
   `sessionStore.test.ts`, `exportConsistency.test.ts`, and two new `SuggestionCard.test.tsx`
   cases reproducing the exact edit→accept and edit→reject→edit-again scenarios.

**Final verification for this round** (exact commands and output in "What was tested" below and
in the PR description): `npx tsc --noEmit` — clean. `npm test` — **79 tests passing across 16
files** (up from 23/5 in the initial PR). `npm run build` (which now also runs
`verify:offline-pdf` and `verify:subpath`) — clean. `npm audit` and `npm audit --omit=dev` — **0
vulnerabilities** (down from 6: 4 moderate, 1 high, 1 critical). Offline behaviour and subpath
hosting were each re-verified in a headless Chromium session after all fixes landed, with zero
non-origin requests observed in both cases. Nothing was merged, deployed, or published.

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
- **Deterministic analysis engine**: 8 section-aware finding categories from
  `gold_standard.json`, each with a primary gap-detection rule and, for 5 of the 8 categories, a
  structural-absence companion rule (added in the review-response round above) for when a section
  exists but is simply silent on the topic; a strengths detector (checked before gaps, per
  PROJECT_BRIEF §4.3); and a 0–3 coverage scorer for all 12 GreenComp competences using
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

`npm test` (Vitest + Testing Library), **79 tests across 16 files** as of the review-response
round above (originally 23 tests across 5 files), all passing:

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

- `npm run build` succeeds cleanly (`tsc --noEmit && vite build && verify:offline-pdf &&
  verify:subpath`), producing `dist/`.
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

- **Pattern coverage is necessarily incomplete.** The rules and the strengths/coverage patterns
  were designed from PROJECT_BRIEF §5's required detections and calibrated against Test Case 01,
  but they are regular-expression heuristics, not language understanding. A real syllabus using
  very different phrasing for the same underlying gap may not trigger a rule that should fire, or
  could occasionally fire on wording that only superficially resembles the pattern. The five
  structural-absence companion rules added in the review-response round reduce (not eliminate)
  the first failure mode for their categories — a section that's simply silent on a topic now
  produces an honest "evidence was not found" note instead of nothing at all — but they cannot
  help where the section itself uses phrasing the patterns don't recognise as either a gap or an
  absence. The `rule_basis` field on every suggestion exists specifically so a teacher can
  sanity-check this rather than trust it blindly — this should be treated as a first pass, not a
  final word, especially on syllabi structured very differently from Test Case 01's clear
  numbered-heading format.
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

Phase 1, including the review-response round above, is complete per the criteria stated: `npm
test` (79/79), `npm run build` (typecheck + bundle + offline-PDF-precache check + subpath check),
`npm audit`/`npm audit --omit=dev` (0/0), and the offline/subpath browser verification all pass,
and the required deliverables (source, tests including Test Case 01, README with
install/run/build/offline/subpath instructions, privacy/data-flow note, dependency rationale,
known limitations, sample export, this report) are all present inside `app/`. Nothing was merged,
deployed, or published — per this round's explicit instructions, the branch was pushed to the
existing PR only. No Phase 2 work was started.
