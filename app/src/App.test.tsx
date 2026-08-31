import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { SessionProvider } from "./state/sessionStore";

function renderApp() {
  return render(
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}

describe("App", () => {
  it("shows the privacy-first landing screen first", () => {
    renderApp();
    expect(screen.getByText(/Your files stay on this device/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear session" })).not.toBeInTheDocument();
  });

  it("moves to the intake form and can run a review end-to-end from pasted text", async () => {
    renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Start a review" }));
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByText(/Phase 1 analysis rules are English-only/)).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/Or paste the syllabus text/),
      "## 1. Rationale\nRaise awareness and make greener choices.\n## 7. Assessment\nNeatness and correct vocabulary."
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("3. Recognised structure")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start review" }));

    expect(await screen.findByText(/Review results/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear session" })).toBeInTheDocument();
  });
});
