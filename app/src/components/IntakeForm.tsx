import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useSession } from "../state/sessionStore";
import { CYCLE_OPTIONS } from "../data/ageAdaptations";
import { extractTextFromFile } from "../lib/parsing/extractText";
import { segmentDocument } from "../lib/parsing/sectionSegmenter";

function deriveTitle(text: string, fallback: string): string {
  const firstHeading = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^#{1,3}\s+/.test(l));
  return firstHeading ? firstHeading.replace(/^#{1,3}\s+/, "") : fallback;
}

export default function IntakeForm() {
  const { state, dispatch } = useSession();
  const [subject, setSubject] = useState(state.intake.subject);
  const [cycle, setCycle] = useState(state.intake.cycle);
  const [language, setLanguage] = useState(state.intake.language);
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const { text, sourceType } = await extractTextFromFile(file);
      setPastedText(text);
      setFileName(file.name);
      dispatch({ type: "SET_DOCUMENT", title: deriveTitle(text, file.name), sourceType, rawText: text });
    } catch (err) {
      const message = err instanceof Error ? err.message : "This file could not be opened.";
      dispatch({ type: "SET_ERROR", error: message });
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  }

  function handleContinue(event: FormEvent) {
    event.preventDefault();
    if (!pastedText.trim()) {
      dispatch({ type: "SET_ERROR", error: "Open a local file or paste the syllabus text before continuing." });
      return;
    }
    dispatch({ type: "SET_INTAKE", intake: { subject, cycle, language } });
    if (!fileName) {
      dispatch({
        type: "SET_DOCUMENT",
        title: deriveTitle(pastedText, subject || "Pasted syllabus"),
        sourceType: "paste",
        rawText: pastedText
      });
    }
    const sections = segmentDocument(pastedText);
    dispatch({ type: "SET_SECTIONS", sections });
    dispatch({ type: "SET_STAGE", stage: "structure" });
  }

  return (
    <form className="card" onSubmit={handleContinue}>
      <h2>1. Tell us about this syllabus</h2>
      <div className="two-col">
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. European Hours"
          />
        </div>
        <div className="field">
          <label htmlFor="cycle">Cycle</label>
          <select id="cycle" value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="">Select a cycle</option>
            {CYCLE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="language">Working language</label>
          <input
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. English"
          />
        </div>
      </div>

      <h2>2. Open a local file or paste the text</h2>
      <p className="helper-text">
        Supported files: .txt, .docx and text-based .pdf. The file is opened locally — it is never
        uploaded anywhere.
      </p>
      <div className="field">
        <label htmlFor="file-input">Open locally</label>
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={handleFileChange}
          disabled={isParsing}
        />
        {fileName && <span className="helper-text">Loaded: {fileName}</span>}
        {isParsing && <span className="helper-text">Reading file…</span>}
      </div>

      <div className="field">
        <label htmlFor="paste-area">Or paste the syllabus text</label>
        <textarea
          id="paste-area"
          value={pastedText}
          onChange={(e) => {
            setPastedText(e.target.value);
            setFileName(null);
          }}
          placeholder="Paste the syllabus or unit plan text here…"
        />
      </div>

      {state.error && (
        <p role="alert" className="priority-critical">
          {state.error}
        </p>
      )}

      <button className="button" type="submit">
        Continue
      </button>
    </form>
  );
}
