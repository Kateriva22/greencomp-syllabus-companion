import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Vite 7 tightened its default filesystem-access allowlist for the
  // dev/test server to the project root only. The Test Case 01 acceptance
  // test intentionally reads the shared fixtures one level up, from
  // ../test-cases and ../reference (outside app/, at the repo root), so
  // that fixture stays the single source of truth instead of a duplicated
  // copy. This allowlist only affects this local test/dev server process —
  // it has no bearing on the production bundle or its CSP.
  server: {
    fs: {
      allow: [repoRoot]
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false
  }
});
