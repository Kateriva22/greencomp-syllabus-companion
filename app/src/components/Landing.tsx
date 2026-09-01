import { useSession } from "../state/sessionStore";

export default function Landing() {
  const { dispatch } = useSession();

  return (
    <div>
      <div className="privacy-banner">
        <strong>Your files stay on this device.</strong>
        <p className="helper-text">
          Everything you open or paste here is read and analysed inside your browser. Nothing is
          uploaded, and there is no account, server or AI service involved — this tool works
          fully offline once the page has loaded.
        </p>
      </div>

      <div className="card">
        <h2>GreenComp Syllabus Companion</h2>
        <p>
          A reflective companion for reviewing a syllabus or unit plan against the GreenComp
          sustainability competence framework and the public European Schools context. It is not
          a compliance checker and does not write curriculum for you — it points to specific
          passages and suggests wording you can accept, edit or reject.
        </p>
        <p className="helper-text">
          GreenComp is non-prescriptive: not every competence belongs in every syllabus. Local and
          institutional requirements, and your own professional judgement, always take precedence
          over anything suggested here.
        </p>
        <p className="helper-text">
          Please avoid opening documents containing pupil records, staff evaluations or other
          personal or confidential information — this tool is intended for syllabus/curriculum
          text only.
        </p>
        <button className="button" onClick={() => dispatch({ type: "SET_STAGE", stage: "intake" })}>
          Start a review
        </button>
      </div>
    </div>
  );
}
