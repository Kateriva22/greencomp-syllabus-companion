import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StructurePreview from "./StructurePreview";
import { SessionProvider, useSession } from "../state/sessionStore";
import { segmentDocument } from "../lib/parsing/sectionSegmenter";

// Simulates a long document (typically PDF-extracted) with two recognised
// headings plus a large number of headings whose wording doesn't match any
// known SectionKind, so they land in "other" — the exact shape that used to
// dump hundreds of items straight into the visible list.
function buildLongDocumentText(unclassifiedCount: number): string {
  const lines = ["## 1. Rationale", "A short unit about local biodiversity.", "## 7. Assessment", "Graded on participation."];
  for (let i = 0; i < unclassifiedCount; i++) {
    lines.push(`## Stray heading ${i}`, "Some unrelated stray paragraph text that follows it.");
  }
  return lines.join("\n");
}

function Harness({ text }: { text: string }) {
  const { state, dispatch } = useSession();
  useEffect(() => {
    dispatch({ type: "SET_SECTIONS", sections: segmentDocument(text) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!state.sections) return null;
  return <StructurePreview />;
}

function renderPreview(text: string) {
  return render(
    <SessionProvider>
      <Harness text={text} />
    </SessionProvider>
  );
}

describe("StructurePreview", () => {
  it("shows recognised sections prominently, outside any collapsed element", () => {
    renderPreview("## 1. Rationale\nSome text.\n## 7. Assessment\nGraded on participation.");
    expect(screen.getByText("1. Rationale")).toBeInTheDocument();
    expect(screen.getByText("7. Assessment")).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument(); // no <details> needed
  });

  it("puts unclassified sections inside a collapsed <details> with a count, not the main list", () => {
    const text = buildLongDocumentText(20);
    renderPreview(text);

    // Recognised sections are visible immediately.
    expect(screen.getByText("1. Rationale")).toBeInTheDocument();
    expect(screen.getByText("7. Assessment")).toBeInTheDocument();

    // The count is shown, and the <details> element is closed by default —
    // its content exists in the DOM (native <details> semantics) but is not
    // rendered/exposed until the teacher opens it.
    expect(screen.getByText(/20 unclassified sections/)).toBeInTheDocument();
    const details = screen.getByRole("group");
    expect(details).not.toHaveAttribute("open");
  });

  it("reveals unclassified sections once the details element is opened", async () => {
    const text = buildLongDocumentText(3);
    renderPreview(text);

    const details = screen.getByRole("group");
    expect(details).not.toHaveAttribute("open");
    await userEvent.click(screen.getByText(/3 unclassified sections/));

    expect(details).toHaveAttribute("open");
    expect(screen.getByText("Stray heading 0")).toBeInTheDocument();
  });

  it("uses singular wording for exactly one unclassified section", () => {
    const text = buildLongDocumentText(1);
    renderPreview(text);
    expect(screen.getByText("1 unclassified section (not shown by default)")).toBeInTheDocument();
  });

  it("does not render the collapsed details element when there are no unclassified sections", () => {
    renderPreview("## 1. Rationale\nSome text.");
    expect(screen.queryByText(/unclassified section/)).not.toBeInTheDocument();
  });
});
