#!/usr/bin/env node
// Repeatable build verification (run automatically as part of `npm run
// build`, and available standalone as `npm run verify:offline-pdf`):
// confirms the pdf.js worker is actually part of the service worker's
// precache manifest. Without this, PDF opening would silently break the
// moment the app is used offline, since the worker file would never have
// been cached in the first place. See vite.config.ts's workbox config.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const swPath = join(distDir, "sw.js");

if (!existsSync(swPath)) {
  console.error(
    `Offline-PDF verification failed: ${swPath} not found. Run "vite build" before this check.`
  );
  process.exit(1);
}

const sw = readFileSync(swPath, "utf8");
const workerPattern = /pdf\.worker\.min-[^"'\\]*\.mjs/;
const match = sw.match(workerPattern);

if (!match) {
  console.error(
    "Offline-PDF verification FAILED: dist/sw.js does not reference a precached " +
      "pdf.worker.min-*.mjs file.\n" +
      "This means opening a .pdf file after the app has gone offline would fail, " +
      "because the pdf.js worker would not be available from the service worker's " +
      "cache. Check that vite.config.ts's workbox.globPatterns includes \"mjs\"."
  );
  process.exit(1);
}

console.log(`Offline-PDF verification passed: ${match[0]} is precached in dist/sw.js.`);
