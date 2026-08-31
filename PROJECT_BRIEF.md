# Project brief — GreenComp Syllabus Companion for European Schools

## 1. Product outcome

Build an offline-first progressive web application that helps a teacher review a newly created syllabus or unit plan against GreenComp and the public European Schools context.

The application must identify **specific passages or sections** that could be improved and return practical, age-appropriate suggestions. It is a reflective companion, not a compliance checker and not an automatic curriculum author.

## 2. Phase 1 scope

Phase 1 is a deterministic, rule-based prototype. It must work without a backend or AI service.

Supported inputs:

- pasted text;
- `.txt`;
- `.docx`, parsed locally in the browser;
- text-based `.pdf`, parsed locally in the browser;
- clear error for scanned/image-only PDFs.

Suggested implementation stack:

- React + TypeScript + Vite;
- PWA/service worker support;
- local DOCX parsing with a browser-compatible library such as Mammoth;
- local PDF text extraction with PDF.js;
- Vitest and Testing Library for automated tests;
- no external UI, analytics, font or AI service.

Equivalent choices are acceptable if the privacy and offline requirements remain demonstrably true.

## 3. Primary user journey

1. Landing screen explains that files stay on the device.
2. Teacher selects subject/cycle/language, then opens a local file or pastes text.
3. Application extracts headings and sections and shows the recognised structure.
4. Teacher starts the review.
5. Results screen shows:
   - strengths to preserve;
   - a restrained overview of current GreenComp coverage;
   - prioritised section-level suggestion cards;
   - limitations and confidence.
6. Each suggestion card contains:
   - exact section/location;
   - short quotation of current wording;
   - observed gap;
   - one to four relevant GreenComp competences;
   - concrete suggested wording;
   - implementation/activity example;
   - assessment evidence;
   - European Schools context note;
   - priority and confidence;
   - Accept, Edit and Reject controls.
7. Teacher can review accepted changes and export a local JSON or printable HTML report.
8. Teacher can clear the session.

## 4. Analysis engine

Create transparent, versioned data files for:

- the 12 GreenComp competences;
- public European Schools context rules;
- indicators of existing strengths;
- weak/partial/embedded evidence patterns;
- section-aware suggestion templates;
- age/cycle adaptations;
- scoring rubric 0-3.

The engine should:

1. normalise extracted text without losing section boundaries;
2. recognise common syllabus sections and table rows;
3. detect existing evidence before detecting gaps;
4. apply section-aware rules rather than keyword counts alone;
5. avoid duplicate or overlapping suggestions;
6. rank suggestions by pedagogical importance and confidence;
7. return a maximum of 8-10 recommendations by default;
8. explain which rule/evidence triggered each result.

Do not claim semantic certainty. Use language such as “consider”, “could strengthen” and “evidence was not found in the reviewed text”.

## 5. Required Phase 1 detections

The engine must be able to detect, when supported by the input:

- sustainability framed only as awareness or prescribed individual behaviour;
- absence of systems relationships, actors, causes and consequences;
- research tasks that record facts without judging sources or perspectives;
- teacher control that removes pupil problem framing and initiative;
- absence of futures/scenario thinking and alternative options;
- group work without genuine collective decision or action;
- action disconnected from evidence, stakeholder influence or reflection;
- assessment focused on recall, compliance or product neatness;
- strengths such as local relevance, multilingual support, European comparison and practical action.

## 6. European Schools context rules

- Preserve the subject’s purpose and the harmonised syllabus intent.
- Distinguish an official syllabus from a teacher-created implementation plan.
- Support multilingual, multicultural and inclusive participation.
- Allow contextual implementation at school/class level.
- Use competence-based, observable learning and assessment evidence.
- Connect curricular learning with school life where appropriate.
- Do not invent mandatory European Schools requirements.

## 7. GreenComp interpretation

- Use the official four areas and 12 competence names in `reference/greencomp.json`.
- GreenComp is non-prescriptive; not all competences belong in every unit.
- Map only competences supported by a specific finding.
- Prefer depth and coherence over maximum coverage.
- Do not grade pupils’ environmental beliefs; assess reasoning, participation, action process and reflection.

## 8. Interface requirements

- Calm, accessible and professional design suitable for educators.
- Plain language and expandable detail.
- Keyboard-accessible controls and visible focus states.
- Responsive layout for laptop and tablet.
- No traffic-light “compliance” verdict.
- Use labels such as **Emerging**, **Purposeful** and **Embedded** with an explanation of the rubric.
- Always show the original text beside or immediately above the proposed change.
- Make destructive actions, such as Clear session, explicit and confirmable.

## 9. Test Case 01 acceptance

Use:

- `test-cases/test-case-01/input_syllabus.md`
- `test-cases/test-case-01/gold_standard.json`

Minimum functional pass:

- detect at least five of six core gaps in the gold standard;
- pupil agency, action and assessment gaps are mandatory detections;
- return at least six actionable, section-anchored suggestions;
- acknowledge at least two existing strengths;
- keep recommendations appropriate for P4-P5 and roughly six weeks;
- produce no invented policy claim and no runtime network request.

Automated tests should compare stable finding IDs/categories and required fields, not exact prose.

## 10. Required deliverables inside `app/`

- working source code;
- production build command;
- automated tests including Test Case 01;
- README with install, run, build and offline test instructions;
- privacy/data-flow note;
- dependency rationale;
- known limitations;
- sample local export from Test Case 01;
- final implementation report.

## 11. Out of scope for Phase 1

- remote or local generative AI;
- cloud accounts, collaboration or storage;
- direct editing of the original DOCX/PDF;
- OCR for scanned PDFs;
- multilingual machine translation;
- official certification or compliance scoring;
- ingestion of internal/unpublished European Schools documents.

## 12. Phase 2 placeholder only

The architecture may define an interface for an optional future rewrite provider, but Phase 1 must not implement or call it. A future provider could be an institution-approved AI, a local model or a user-operated copy/paste prompt. The core application must remain usable without it.

