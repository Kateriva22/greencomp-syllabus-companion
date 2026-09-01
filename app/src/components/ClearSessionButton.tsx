import { useState } from "react";
import { useSession } from "../state/sessionStore";

// Explicit, confirmable destructive action per SECURITY_AND_PRIVACY.md: a
// second, clearly-labelled click is required before the session is wiped.
export default function ClearSessionButton() {
  const { dispatch } = useSession();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="decision-controls">
        <span className="helper-text">Clear the loaded text and all decisions?</span>
        <button className="button danger" onClick={() => dispatch({ type: "CLEAR_SESSION" })}>
          Yes, clear session
        </button>
        <button className="button secondary" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button className="button secondary" onClick={() => setConfirming(true)}>
      Clear session
    </button>
  );
}
