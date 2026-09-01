import { useSession } from "./state/sessionStore";
import Landing from "./components/Landing";
import IntakeForm from "./components/IntakeForm";
import StructurePreview from "./components/StructurePreview";
import ResultsScreen from "./components/ResultsScreen";
import ClearSessionButton from "./components/ClearSessionButton";

export default function App() {
  const { state } = useSession();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>GreenComp Syllabus Companion</h1>
        {state.stage !== "landing" && <ClearSessionButton />}
      </header>
      <main>
        {state.stage === "landing" && <Landing />}
        {state.stage === "intake" && <IntakeForm />}
        {state.stage === "structure" && <StructurePreview />}
        {state.stage === "results" && <ResultsScreen />}
      </main>
    </div>
  );
}
