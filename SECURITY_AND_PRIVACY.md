# Security and privacy requirements

These requirements are release blockers, not optional enhancements.

## Processing model

- The interface must say **Open locally**, not **Upload**.
- The selected file is parsed in the user’s browser.
- The original document and extracted text are not transmitted to a server.
- No backend, database, authentication, account or cloud storage is used.
- No analytics, telemetry, crash-reporting SDK, tracking pixel or third-party font is used.
- No runtime `fetch`, WebSocket, beacon or external asset request is permitted.
- Do not persist the original file automatically. Keep it in memory for the session.
- Any optional local persistence must be explicit, clearly labelled and erasable by the user.
- Provide a visible **Clear session** action that removes loaded text and decisions.

## Content boundaries

- The tool is for syllabus/curriculum text, not pupil records or personnel evaluation.
- Warn users not to open documents containing personal, sensitive or confidential data.
- Do not log extracted document text to the console, test snapshots or error messages.
- Errors must describe the technical problem without reproducing long document passages.
- Export occurs only after an explicit user action and remains local.

## Build and dependency controls

- Use local, bundled application assets only.
- Add a restrictive Content Security Policy. At minimum, runtime connections must be limited to the application origin.
- Keep dependencies minimal and document why each is required.
- Do not add an AI SDK in Phase 1.
- Do not add a service that silently checks for updates at runtime.
- The production build must remain usable after the network is disconnected once local assets are cached.

## Teacher control and pedagogical safety

- Never replace or save syllabus text automatically.
- Every recommendation must provide Accept, Edit and Reject controls.
- Clearly distinguish the original text, suggested wording and teacher-edited wording.
- Label confidence and rule basis; do not present heuristic analysis as an official judgement.
- State that GreenComp is non-prescriptive and that local/institutional requirements prevail.

## Verification checklist

- Inspect the production bundle for remote URLs.
- Search source and built files for `http://`, `https://`, analytics, telemetry and AI SDK references.
- Test the app with the browser network disabled.
- Confirm that the synthetic syllabus produces traceable section-level suggestions.
- Confirm that clearing the session removes the document text from the interface.

