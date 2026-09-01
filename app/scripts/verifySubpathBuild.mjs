#!/usr/bin/env node
// Repeatable build verification (run automatically as part of `npm run
// build`, and available standalone as `npm run verify:subpath`): confirms
// the production build contains no root-absolute ("/...") asset references
// that would break when the app is served from a repository subpath (e.g.
// GitHub Pages at https://<user>.github.io/greencomp-syllabus-companion/)
// instead of a domain root. See vite.config.ts's `base: "./"`.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");

if (!existsSync(distDir)) {
  console.error(`Subpath verification failed: ${distDir} not found. Run "vite build" first.`);
  process.exit(1);
}

// Root-absolute src/href attribute values are the failure mode: they always
// resolve against the domain root regardless of where index.html itself is
// served from, breaking a subpath deployment. A protocol-relative "//host"
// URL or a fragment/query-only value ("/?x") is not this failure mode, so
// they're excluded.
const ABSOLUTE_ASSET_REF = /(?:href|src)="\/(?!\/)[^"]*"/g;

function checkFile(relPath) {
  const content = readFileSync(join(distDir, relPath), "utf8");
  const matches = content.match(ABSOLUTE_ASSET_REF) ?? [];
  return matches.map((m) => `${relPath}: ${m}`);
}

const htmlFiles = readdirSync(distDir).filter((f) => f.endsWith(".html"));
const problems = htmlFiles.flatMap(checkFile);

const manifestPath = join(distDir, "manifest.webmanifest");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (typeof manifest.start_url === "string" && manifest.start_url.startsWith("/")) {
    problems.push(`manifest.webmanifest: start_url is root-absolute ("${manifest.start_url}")`);
  }
  if (typeof manifest.scope === "string" && manifest.scope.startsWith("/")) {
    problems.push(`manifest.webmanifest: scope is root-absolute ("${manifest.scope}")`);
  }
  for (const icon of manifest.icons ?? []) {
    if (typeof icon.src === "string" && icon.src.startsWith("/")) {
      problems.push(`manifest.webmanifest: icon src is root-absolute ("${icon.src}")`);
    }
  }
}

if (problems.length > 0) {
  console.error(
    "Subpath verification FAILED: the build contains root-absolute asset references that " +
      "would break when served from a repository subpath instead of a domain root:\n" +
      problems.map((p) => `  - ${p}`).join("\n") +
      '\nCheck vite.config.ts\'s `base` setting (should be "./").'
  );
  process.exit(1);
}

console.log(
  `Subpath verification passed: no root-absolute asset references found across ${htmlFiles.length} HTML file(s) and manifest.webmanifest.`
);
