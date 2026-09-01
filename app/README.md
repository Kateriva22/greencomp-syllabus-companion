# GreenComp Syllabus Companion — Phase 1

An offline-first, deterministic (non-AI) reflective companion that helps a teacher review a
syllabus or unit plan against the GreenComp sustainability competence framework and the public
European Schools context. See `../PROJECT_BRIEF.md` and `../SECURITY_AND_PRIVACY.md` in the
starter-pack root for the full requirements this app implements.

**GreenComp is non-prescriptive.** Not every competence belongs in every syllabus. This tool
never issues a compliance verdict, never rewrites a document automatically, and every suggestion
requires an explicit teacher decision (Accept / Edit / Reject).

## Install, run, build

```bash
npm install
npm run dev        # http://localhost:5173, hot-reloading dev server
npm run build       # type-checks then produces the production bundle in dist/
npm run preview     # serves the production build locally, e.g. http://localhost:4173
npm test            # runs the automated test suite once (Vitest)
npm run test:watch  # re-runs tests on change
```

### Verifying offline behaviour

1. `npm run build && npm run preview`.
2. Open the preview URL in a browser and let the page finish loading (the service worker
   registers and precaches the app shell automatically).
3. Disconnect the network (or use your browser devtools' "Offline" network throttling / airplane
   mode) and reload the page.
4. The app should still load and the full paste → structure → review → export flow should still
   work — nothing in Phase 1 requires a network connection at any point.

This was verified during development with a headless Chromium session: after the first load, the
network was fully disabled and the page was reloaded and driven through the entire review flow
(paste text, recognise structure, run the analysis, accept/edit a suggestion) with zero
non-origin network requests observed. `npm run build` also runs two repeatable, automated checks
on every build (not just this one manual pass):

- `npm run verify:offline-pdf` — confirms `dist/sw.js`'s precache manifest actually includes the
  bundled `pdf.worker.min-*.mjs` (fails loudly if a future `workbox.globPatterns` change silently
  drops it, which would otherwise only surface as "PDF opening is broken, but only offline").
- `npm run verify:subpath` — confirms the build contains no root-absolute (`/...`) asset
  references, which is what lets the exact same `dist/` work both at a domain root and from a
  repository subpath (see "Hosting from a subpath" below).

### Hosting from a subpath

`vite.config.ts` sets `base: "./"`, so every emitted asset URL (JS/CSS, the pdf.js worker, icons,
the manifest) resolves relative to wherever `index.html` is actually served from. The same
`dist/` build was verified, in a headless Chromium session, to work both:

- at a domain root (`npm run preview`), and
- from a repository subpath (e.g. `https://<user>.github.io/greencomp-syllabus-companion/`, the
  shape a GitHub Pages deployment of this repo would take) — tested by copying `dist/` under a
  `/greencomp-syllabus-companion/` path on a plain static file server and confirming the full
  paste → structure → review flow works with no failed requests and the service worker registers
  with the correct subpath scope.

This repo is not currently published or deployed anywhere; this only confirms the build itself is
subpath-safe whenever publishing is decided on separately.

### Generating the sample export

`sample-export/test-case-01-export.json` (a required Phase 1 deliverable) was produced with:

```bash
npm run generate:sample-export
```

This runs the same deterministic engine used by the app against
`../test-cases/test-case-01/input_syllabus.md` and simulates one accepted and one edited
suggestion, so the sample shows what a teacher-reviewed export actually looks like.

## What Phase 1 does

1. **Landing** — explains that files never leave the device.
2. **Intake** — subject / cycle / working language, then either open a local `.txt`, `.docx` or
   text-based `.pdf` file, or paste text directly. All parsing happens in-browser
   (`src/lib/parsing/`): `mammoth` for `.docx`, `pdf.js` for `.pdf`, with a clear error for
   scanned/image-only PDFs (detected by an unusually low character count per page). The intake
   screen states explicitly, and the exported report's limitations always repeat, that **Phase 1
   analysis rules are English-only** — a file can be opened or pasted in any language, but only
   English wording is reliably recognised by the GreenComp detection rules.
3. **Recognised structure** — shows the sections/tables the tool could identify before running
   any analysis, so the teacher can sanity-check what will be reviewed. Recognised sections are
   listed immediately; unclassified sections sit inside a collapsed details element showing only
   their count, so a long document (typically PDF-extracted, where many stray lines can each
   become their own unclassified section) doesn't dump hundreds of items into view up front.
4. **Results** — strengths first, then a non-judgemental GreenComp coverage overview
   (Not yet observed / Emerging / Purposeful / Embedded — no traffic-light verdict), then
   prioritised, section-anchored suggestion cards, then limitations, then export.
5. Each suggestion card shows the exact location, a short quotation of the current wording, the
   observed gap, up to four relevant GreenComp competences, suggested wording, an implementation
   example, assessment evidence, an (optional) European Schools context note, priority,
   confidence, the rule that triggered it, and **Accept / Edit / Reject** controls.
6. **Export** — a local JSON matching `../reference/expected_output_schema.json`, or a
   self-contained printable HTML report. Both are generated as an in-memory `Blob` and downloaded
   directly by the browser; nothing is transmitted anywhere.
7. **Clear session** — a two-step confirmable action that wipes all loaded text and decisions.

## How the analysis engine works

The engine (`src/lib/analysis/`) is entirely rule-based and versioned as plain TypeScript data +
pattern modules — there is no AI/model call anywhere in Phase 1.

1. `lib/parsing/sectionSegmenter.ts` splits the normalised text into sections by markdown heading
   (`#`/`##`/…), with a fallback heuristic for text that has lost markdown formatting (typical of
   raw DOCX/PDF extraction), and parses `|`-delimited tables into rows. Each section is classified
   into a `SectionKind` (rationale, objectives, outcomes, content, pedagogy, sequence, assessment,
   resources, inclusion, final_product, local_adaptation, european_dimension, preparation,
   review) by matching keywords against the *heading text only* — this is what keeps the rules
   section-aware rather than simple whole-document keyword counting. When several sections share a
   kind (e.g. a table-of-contents entry and the real section both matching "assessment"), rules
   that need "the" section of a kind (`RuleContext.section(kind)`) get the most substantive match
   by content size (prose plus table cells), not simply the first one in the document — this
   matters most for long, PDF-extracted documents where a TOC line can otherwise out-rank the real
   section it refers to.
2. `lib/analysis/rules/*.ts` — eight finding categories used in
   `test-cases/test-case-01/gold_standard.json` (`values_and_rationale`, `learning_outcomes`,
   `pupil_agency`, `systems_inquiry`, `critical_and_futures_thinking`, `authentic_action`,
   `assessment_alignment`, `portfolio_and_review`). Each category's primary rule inspects the
   specific section kinds relevant to it, matches a "gap" pattern (e.g. teacher controls every
   choice) against an "already-addressed" pattern (e.g. pupils are given a genuine choice) and
   only fires when the gap pattern matches **and** the addressed pattern does not — so a syllabus
   that already does the right thing is not flagged.

   Five of these categories (`pupil_agency`, `authentic_action`, `systems_inquiry`,
   `critical_and_futures_thinking`, `assessment_alignment`) also have a **structural-absence
   companion rule** (`*AbsenceRule` in the same file). It fires, at medium priority/confidence,
   only when the relevant section(s) exist but match *neither* the gap pattern *nor* the
   addressed pattern — i.e. the text is simply silent on the topic. The two rules in a pair are
   mutually exclusive by construction, and the absence rule always uses "evidence was not found"
   framing rather than asserting a confirmed problem, so the engine distinguishes "this syllabus
   has a described gap here" from "this syllabus doesn't say enough here to tell either way."

   Every generated suggestion (from either kind of rule) carries a `rule_basis` string naming
   exactly which heuristic fired. Both kinds of finding are careful never to overclaim: a
   suggestion that fires because recall-dominant evidence outnumbers higher-order evidence says
   so with the actual counts (e.g. "3 of 4 criteria… against only 1…"), never "no criterion
   rewards…" when one demonstrably does; and an absence-rule finding says a *specific* signal
   (e.g. "a stakeholder, decision route, feedback or effect") was not found, never that no
   activity/action/research exists at all — the section may describe one in wording the pattern
   doesn't recognise.
3. `lib/analysis/strengths.ts` looks for positive evidence (school-connected sustainability theme,
   multilingual/inclusion support, European comparison, intention to act, group work) before any
   gap is considered, per PROJECT_BRIEF §4.3.
4. `lib/analysis/coverage.ts` scores each of the 12 competences 0–3 using a "mention" pattern
   (topic named anywhere → 1, "Emerging") and a "purposeful" pattern checked specifically inside
   the outcomes/sequence/assessment sections (present in one stage → 2, "Purposeful"; present in
   more than one stage → 3, "Embedded"). A competence with no textual evidence stays at 0 and is
   reported as absent, not as a deficiency — consistent with GreenComp being non-prescriptive. A
   section's table rows (e.g. the learning-sequence or assessment table) count as evidence too,
   not just its prose. Patterns are deliberately narrow where a broad match would be misleading —
   for example, 3.2 Adaptability requires an "adapt…"/"respond to feedback"/"uncertain…" root, not
   a bare "change", specifically so "climate change" (the single most common phrase in any
   sustainability syllabus) is never counted as evidence of Adaptability by itself.
5. `lib/analysis/engine.ts` collects every rule's output, ranks by priority then confidence, caps
   at 10 suggestions, assigns stable `SUG-NN` ids, and assembles the final result together with a
   base set of limitations (plus a note if no section structure could be recognised at all).

### Why this generalises beyond Test Case 01

`src/lib/analysis/engine.test.ts` deliberately uses hand-written synthetic text — not Test Case
01's wording — to prove each rule can both fire and correctly stay silent (e.g. pupil_agency does
not fire once pupils are given a genuine choice; assessment_alignment does not fire once a
criterion already rewards evidence/reflection). This guards against the engine being an
overfit pattern-match against one document.

## Automated tests

`npm test` runs (Vitest + Testing Library), 96 tests across 18 files:

- `sectionSegmenter.test.ts` — heading/table recognition and the non-markdown fallback.
- `htmlToStructuredText.test.ts` — the DOCX→pseudo-markdown converter preserves headings, `<ul>`
  bullets, `<ol>` numbered items (including nested lists), manual `<br>` line breaks, and table
  rows as distinct lines, rather than collapsing them into one run of text.
- `docxParser.test.ts` — `parseDocx()` itself, with `mammoth.convertToHtml` mocked, including its
  error paths (no readable text, mammoth throws).
- `docxRoute.test.ts` — an end-to-end regression test for the review finding that a DOCX
  numbered-list learning-outcomes section never reached the `learning_outcomes` rule: synthetic
  mammoth-shaped HTML → `parseDocx` → `segmentDocument` → `analyzeDocument`, asserting the finding
  is actually detected (never using the markdown Test Case 01 fixture for this).
- `pdfParser.test.ts` — `reconstructPageText()`, the pdf.js text-item → line reconstruction logic,
  using synthetic text items (`hasEOL`, baseline y-jumps, sub-pixel jitter, non-text marked
  content) to prove multiple lines/headings survive instead of collapsing into one line per page.
- `pdfRoute.test.ts` — an end-to-end regression test with a mocked `pdfjs-dist.getDocument`,
  proving a synthetic multi-heading PDF page segments into multiple distinct recognised sections
  (`rationale`/`outcomes`/`assessment`), plus the scanned-PDF error path.
- `engine.test.ts` — synthetic-document generalisation checks: rules fire and correctly don't
  fire, across varied bullet styles (`-`, `*`, `1.`, `1)`), alternate section-heading wording
  (Aims/Methodology), the non-markdown heading fallback, and reordered table columns.
- `absenceRules.test.ts` — each of the five structural-absence companion rules fires only when its
  section exists but is silent, and never fires when the section is missing entirely or when
  either the gap or the addressed pattern is present.
- `assessmentSuppression.test.ts` — a regression test proving `assessment_alignment` is no longer
  suppressed by a single incidental higher-order keyword; it now weighs recall-dominant criteria
  against higher-order ones (table-based and prose-only assessment sections both covered).
- `coverage.test.ts` — a regression test proving a bare "climate change" mention no longer counts
  as Adaptability (3.2) evidence, while genuine adaptability wording still does.
- `context.test.ts` — `RuleContext.section(kind)` picks the most substantive section by content
  size when several sections share a kind (e.g. a table-of-contents entry followed by the real
  section), rather than blindly the first match; `StructurePreview.test.tsx` — recognised sections
  render immediately while unclassified ("other") sections sit inside a collapsed `<details>`
  showing just their count, and expand on request.
- `suggestionWording.test.ts` / `exportConsistency.test.ts` / `sessionStore.test.ts` — a
  regression test suite for the review finding that an edited suggestion's wording could keep
  showing after the teacher changed the decision away from "edited": the reducer clears
  `edited_text` on any non-"edited" decision, and the shared `effectiveWording()` helper (used by
  the UI, the JSON export and the printable HTML export) is proven consistent across all three
  surfaces.
- `testCase01.test.ts` — the required Phase 1 acceptance test. It loads
  `../test-cases/test-case-01/input_syllabus.md` and `gold_standard.json` directly and asserts
  the `minimum_pass` criteria: ≥5 of the 6 core gap categories detected, all three mandatory
  categories detected (pupil agency, authentic action, assessment alignment), ≥6 and ≤10
  suggestions, ≥2 strengths, every suggestion anchored with a location/excerpt/rule basis, valid
  competence ids (≤4 per suggestion), non-prescriptive coverage (not all 12 forced to a score),
  and every suggestion starting as `pending`. It compares **stable categories/ids/shape**, never
  exact prose, since the engine is deterministic pattern matching rather than a reproduction of
  the gold text.
- `SuggestionCard.test.tsx` / `App.test.tsx` — the Accept/Edit/Reject controls actually update
  session state (including the edit → accept/reject wording-reversion regression case above), and
  a full paste → structure → review flow renders end-to-end, including the English-only notice.

## Privacy / data-flow note

- There is no backend, database, account, authentication, analytics or telemetry anywhere in this
  codebase.
- A file selected via "Open locally" is read with the browser's own `File`/`ArrayBuffer` APIs and
  parsed in-memory (`mammoth` for `.docx`, `pdf.js` for `.pdf`, both running fully client-side).
  The file and its extracted text are held only in React state for the session; nothing is
  written to disk or a database automatically.
- Export (JSON or HTML) is only produced on an explicit button click, and is generated as an
  in-memory `Blob` downloaded directly by the browser (`URL.createObjectURL` + a synthetic `<a
  download>` click) — there is no upload step.
- "Clear session" (an explicit, two-step confirmable action) resets all in-memory state,
  including the loaded text and every teacher decision.
- `index.html` sets a restrictive Content-Security-Policy (`default-src 'self'`, `connect-src
  'self'`, `worker-src 'self'`, `object-src 'none'`, …) so the browser itself blocks any runtime
  request to a third-party host even if one were ever introduced by mistake.
- The PWA service worker (`vite-plugin-pwa`, Workbox `generateSW` mode) only precaches the app's
  own built assets; there are no `runtimeCaching` routes, so it never opens a network request of
  its own beyond the browser's ordinary same-origin update check for the files it already
  downloaded.
- The pdf.js worker is bundled and served from the app's own origin
  (`pdfjs-dist/build/pdf.worker.min.mjs?url`) rather than pdf.js's default CDN. `getDocument()` is
  called with in-memory `data` (never a remote `url`) and no `cMapUrl`/`standardFontDataUrl`, so
  pdf.js's optional network-fetch code paths (for non-embedded CJK fonts/CMaps) are never
  reachable; `disableStream`/`disableAutoFetch` are also set defensively. See "Known limitations"
  for what this means for less common PDFs.

### A note on the verification checklist in `../SECURITY_AND_PRIVACY.md`

Searching the production bundle in `dist/` for `http://`/`https://` does surface matches. All of
them were inspected and are inert: XML/DrawingML namespace URIs used as string identifiers inside
`mammoth`'s DOCX-parsing code, license header comments and documentation links bundled inside
`react`, `mammoth`, `jszip` and `pdf.js`, and one `console.warn` string inside Workbox. None of
these strings are ever passed to `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon` — the only
`fetch(...)` call sites actually reachable at runtime are (a) Vite's own same-origin
module/stylesheet preloading and (b) pdf.js's CMap/standard-font/streaming factories, which are
unreachable here because no `cMapUrl`/`standardFontDataUrl`/`url` is ever configured (see above).

## Dependency rationale

| Dependency | Why it's needed |
|---|---|
| `react` 18, `react-dom` 18 | UI framework specified by PROJECT_BRIEF. |
| `mammoth` | The only actively-maintained, browser-compatible library for extracting structured text (headings, lists, tables) from `.docx` files client-side, as suggested by PROJECT_BRIEF §2. |
| `pdfjs-dist` | Mozilla's PDF.js, the standard browser-compatible library for extracting a text layer (with per-item position/line data) from `.pdf` files client-side, as suggested by PROJECT_BRIEF §2. |
| `vite` 7, `@vitejs/plugin-react` 5, `typescript` | Build tooling specified by PROJECT_BRIEF. |
| `vite-plugin-pwa` 1.x | Generates the web app manifest and a Workbox service worker (precache-only, no runtime network routes) for the required PWA/offline support. |
| `vitest` 3.2.x, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` | Test runner and component-testing utilities specified by PROJECT_BRIEF. |

No UI component library, analytics SDK, telemetry SDK, remote font, or AI/LLM SDK is used, per
`../SECURITY_AND_PRIVACY.md`.

`npm audit` (both the full dev+prod audit and `npm audit --omit=dev`) reports **0 vulnerabilities**
as of this build. `vite`, `vitest` and `vite-plugin-pwa` were upgraded from an earlier revision
that had a moderate/high/critical dev-server-only advisory chain (`esbuild <=0.24.2`, transitively
pulled in by `vite <=6.4.2`) — `vite` moved to 7.3.6 (the first major with a patched `esbuild`;
there is no patched 6.x release), `vitest` to 3.2.7 (same major, patched `@vitest/mocker`/
`vite-node`), and `vite-plugin-pwa` to 1.3.0 for `vite` 7 compatibility. `@vitejs/plugin-react` was
bumped from 4.x to 5.2.0 as a required companion upgrade (4.x does not support `vite` 7). No other
dependency was changed. Re-run `npm audit` before any real deployment, since this reflects the
advisory database at the time of this build.

## Known limitations

- **Phase 1 analysis rules are English-only.** A file can be opened or pasted in any language, but
  the GreenComp detection patterns only recognise English wording. A syllabus in French, German or
  another language will not be reliably analysed — this is stated explicitly on the intake screen
  and repeated in every result's limitations list, not just documented here.
- **Deterministic pattern matching, not comprehension.** The engine matches transparent regular
  expressions against section text; it does not understand meaning. Unusual phrasing that
  expresses the same idea very differently from the patterns in `src/lib/analysis/rules/` may be
  missed, and in rare cases a pattern may match text that does not really represent the gap it
  describes. Every card names its `rule_basis` so a teacher can judge this for themselves.
- **Section recognition depends on structure.** The engine works best when a document uses clear
  headings (or already carries Word "Heading" styles, for `.docx`). A document with no
  recognisable headings at all is analysed as a single block, which the results screen flags as a
  limitation, and section-specific rules (e.g. the systems-inquiry rule, which specifically reads
  the learning-sequence table) will not have anything to check.
- **Table extraction is markdown/DOCX-only.** `.docx` tables are converted from Word's own table
  markup, and pasted/`.txt` tables are read as `|`-delimited markdown tables. PDF extraction now
  preserves line boundaries (using pdf.js's per-item position and `hasEOL` data — see
  `reconstructPageText()` in `pdfParser.ts`), so headings and list items in a PDF are recognised
  just like in plain text, but tables are still not specially reconstructed: pdf.js returns
  positioned text runs, not table structure, so a suggestion that depends on a specific table row
  (e.g. the learning-sequence or assessment table) may not fire for a PDF-only input even if the
  same content would be recognised from a `.docx` or pasted-markdown version of the same syllabus.
  This is an accepted Phase 1 limitation, not a bug to fix silently — reliable table reconstruction
  from raw PDF positions is a materially harder problem than line reconstruction.
- **Scanned/image-only PDFs are out of scope**, per PROJECT_BRIEF §11 (no OCR). The parser detects
  this heuristically (very low extracted-character count per page) and returns a clear error
  asking the teacher to paste the text instead; a PDF with an unusually sparse but genuine text
  layer could in principle trip this same heuristic.
- **pdf.js CMap/standard-font fetching is intentionally disabled** (see Privacy note above). A PDF
  that relies on a non-embedded CJK font or an external CMap to render its text correctly may
  extract that portion of text incorrectly or incompletely. This was judged an acceptable
  trade-off for Phase 1, whose target inputs are typical European-language syllabus documents.
- **Coverage scoring is a heuristic rubric, not a certified assessment.** The 0–3 levels
  (Not yet observed / Emerging / Purposeful / Embedded) are computed from the same kind of pattern
  matching as the suggestions, calibrated against Test Case 01's baseline scores, and are
  explicitly presented as non-prescriptive — never as an official or compliance judgement.
- **The production bundle is not code-split** (~1 MB JS before gzip, mostly `mammoth` + `pdf.js`).
  This is a fine trade-off for an offline-first tool that precaches its whole shell once, but
  would be worth revisiting with route-level code-splitting if Phase 2 adds more screens.
- **No persistence between page reloads without the service worker cache.** Per
  `SECURITY_AND_PRIVACY.md`, the loaded document and decisions are kept in memory only for the
  session (React state) and are not written to `localStorage`/IndexedDB — closing or reloading
  the tab loses unsaved work, by design. Exporting is the only way to keep a result.

## Deferred to Phase 2 (not implemented here)

Per PROJECT_BRIEF §12, Phase 1 defines no interface for a future rewrite provider and does not
call one. Everything in "Out of scope for Phase 1" (§11) — remote or local generative AI, cloud
accounts/collaboration/storage, direct DOCX/PDF editing, OCR, machine translation, official
certification/compliance scoring, ingestion of internal/unpublished European Schools documents —
is genuinely absent from this codebase, not merely hidden behind a flag.
