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
non-origin network requests observed.

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
   scanned/image-only PDFs (detected by an unusually low character count per page).
3. **Recognised structure** — shows the sections/tables the tool could identify before running
   any analysis, so the teacher can sanity-check what will be reviewed.
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
   section-aware rather than simple whole-document keyword counting.
2. `lib/analysis/rules/*.ts` — eight independent gap-detection rules, one per finding category
   used in `test-cases/test-case-01/gold_standard.json` (`values_and_rationale`,
   `learning_outcomes`, `pupil_agency`, `systems_inquiry`, `critical_and_futures_thinking`,
   `authentic_action`, `assessment_alignment`, `portfolio_and_review`). Each rule inspects the
   specific section kinds relevant to its category, matches an "absence" pattern (e.g. teacher
   controls every choice) against an "already-addressed" pattern (e.g. pupils are given a genuine
   choice) and only fires when the gap pattern matches **and** the addressed pattern does not —
   so a syllabus that already does the right thing is not flagged. Every generated suggestion
   carries a `rule_basis` string naming exactly which heuristic fired.
3. `lib/analysis/strengths.ts` looks for positive evidence (school-connected sustainability theme,
   multilingual/inclusion support, European comparison, intention to act, group work) before any
   gap is considered, per PROJECT_BRIEF §4.3.
4. `lib/analysis/coverage.ts` scores each of the 12 competences 0–3 using a "mention" pattern
   (topic named anywhere → 1, "Emerging") and a "purposeful" pattern checked specifically inside
   the outcomes/sequence/assessment sections (present in one stage → 2, "Purposeful"; present in
   more than one stage → 3, "Embedded"). A competence with no textual evidence stays at 0 and is
   reported as absent, not as a deficiency — consistent with GreenComp being non-prescriptive.
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

`npm test` runs (Vitest + Testing Library):

- `sectionSegmenter.test.ts` — heading/table recognition and the non-markdown fallback.
- `engine.test.ts` — synthetic-document generalisation checks (rules fire and correctly don't
  fire).
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
  session state, and a full paste → structure → review flow renders end-to-end.

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
| `react`, `react-dom` | UI framework specified by PROJECT_BRIEF. |
| `mammoth` | The only actively-maintained, browser-compatible library for extracting structured text (headings, tables) from `.docx` files client-side, as suggested by PROJECT_BRIEF §2. |
| `pdfjs-dist` | Mozilla's PDF.js, the standard browser-compatible library for extracting a text layer from `.pdf` files client-side, as suggested by PROJECT_BRIEF §2. |
| `vite`, `@vitejs/plugin-react`, `typescript` | Build tooling specified by PROJECT_BRIEF. |
| `vite-plugin-pwa` | Generates the web app manifest and a Workbox service worker (precache-only, no runtime network routes) for the required PWA/offline support. |
| `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` | Test runner and component-testing utilities specified by PROJECT_BRIEF. |

No UI component library, analytics SDK, telemetry SDK, remote font, or AI/LLM SDK is used, per
`../SECURITY_AND_PRIVACY.md`.

`npm audit` currently reports vulnerabilities in `esbuild`/`vite`'s **development server** only
(a dev-server request-forgery class of issue, see the advisory linked in the audit output). These
do not affect the production build in `dist/`, which contains no dev-server code; they were left
unpatched rather than force-upgrading to an unreleased-at-time-of-writing major `vite`/`vitest`
line that would need its own compatibility verification. Re-run `npm audit` before any real
deployment.

## Known limitations

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
  markup, and pasted/`.txt` tables are read as `|`-delimited markdown tables. Tables inside a
  `.pdf` are not specially recognised — PDF text extraction returns plain per-page text, so a
  suggestion that depends on a specific table row (e.g. the learning-sequence or assessment
  table) may not fire for a PDF-only input even if the same content would be recognised from a
  `.docx` or pasted-markdown version of the same syllabus.
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
