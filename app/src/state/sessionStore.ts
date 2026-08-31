import { createContext, useContext, useReducer, type Dispatch, type ReactNode, createElement } from "react";
import type { DocumentSection, IntakeInfo, ReviewResult, TeacherDecision } from "../types/domain";
import type { SourceType } from "../lib/parsing/extractText";

export type Stage = "landing" | "intake" | "structure" | "results";

export interface SessionState {
  stage: Stage;
  intake: IntakeInfo;
  title: string;
  sourceType: SourceType | "paste" | null;
  rawText: string | null;
  sections: DocumentSection[] | null;
  result: ReviewResult | null;
  error: string | null;
}

const initialState: SessionState = {
  stage: "landing",
  intake: { subject: "", cycle: "", language: "" },
  title: "",
  sourceType: null,
  rawText: null,
  sections: null,
  result: null,
  error: null
};

type Action =
  | { type: "SET_STAGE"; stage: Stage }
  | { type: "SET_INTAKE"; intake: IntakeInfo }
  | { type: "SET_DOCUMENT"; title: string; sourceType: SourceType | "paste"; rawText: string }
  | { type: "SET_SECTIONS"; sections: DocumentSection[] }
  | { type: "SET_RESULT"; result: ReviewResult }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_DECISION"; id: string; decision: TeacherDecision; editedText?: string }
  | { type: "CLEAR_SESSION" };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "SET_STAGE":
      return { ...state, stage: action.stage };
    case "SET_INTAKE":
      return { ...state, intake: action.intake };
    case "SET_DOCUMENT":
      return {
        ...state,
        title: action.title,
        sourceType: action.sourceType,
        rawText: action.rawText,
        error: null
      };
    case "SET_SECTIONS":
      return { ...state, sections: action.sections };
    case "SET_RESULT":
      return { ...state, result: action.result, stage: "results" };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_DECISION": {
      if (!state.result) return state;
      const suggestions = state.result.suggestions.map((s) => {
        if (s.id !== action.id) return s;
        // edited_text is only meaningful while the decision is "edited".
        // Moving to "accepted" or "rejected" abandons any draft wording, so
        // it must be cleared here — otherwise a stale edited_text could
        // linger next to a non-"edited" decision and be read inconsistently
        // by the UI, the JSON export and the printable HTML export (each of
        // which would then have to independently guess whether it still
        // applies).
        const edited_text = action.decision === "edited" ? action.editedText ?? s.edited_text : undefined;
        return { ...s, teacher_decision: action.decision, edited_text };
      });
      return { ...state, result: { ...state.result, suggestions } };
    }
    case "CLEAR_SESSION":
      return { ...initialState };
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<Action>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return createElement(SessionContext.Provider, { value: { state, dispatch } }, children);
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
