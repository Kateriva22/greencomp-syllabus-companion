import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

// Phase 1: fully offline app. The service worker only precaches the app's
// own bundled assets (workbox "generateSW" with globPatterns over dist/).
// It never registers a runtime/network route, so there is no background
// "check for updates" network behaviour beyond the browser's own SW update
// check against the same-origin build it already downloaded.
// A relative base ("./") means every emitted asset URL (JS/CSS chunks, the
// pdf.js worker, icons, the manifest) is resolved relative to wherever
// index.html itself is served from — so the exact same build works at the
// origin root (local `vite preview`, a custom domain) and from a repository
// subpath (e.g. GitHub Pages serving this repo at
// https://<user>.github.io/greencomp-syllabus-companion/) without any
// separate build or environment-specific config. See
// scripts/verifySubpathBuild.mjs for the repeatable check that copies
// dist/ under a subpath and confirms it still loads correctly.
export default defineConfig({
  base: "./",
  // Vite 7 tightened its default dev/build-time filesystem-access allowlist
  // to the project root only. scripts/generateSampleExport.ts (a local
  // dev-only tool, run via `vite-node`, never shipped in the app) reads
  // ../test-cases one level up from app/, at the repo root, so that stays
  // the single source of truth instead of a duplicated copy. This setting
  // only controls what Vite's own tooling is willing to read/transform on
  // this machine — it has no effect on the production bundle, the app's
  // runtime behaviour, or its CSP.
  server: {
    fs: {
      allow: [repoRoot]
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "GreenComp Syllabus Companion",
        short_name: "GreenComp",
        description:
          "Offline reflective companion for reviewing a syllabus against GreenComp.",
        start_url: ".",
        display: "standalone",
        background_color: "#f4f7f4",
        theme_color: "#2f5233",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      },
      workbox: {
        // Precache the built app shell only. No runtimeCaching entries are
        // configured, so the service worker never opens a network request
        // of its own — it only serves what was already bundled at build time.
        // "mjs" is required here: the pdf.js worker ships as
        // pdf.worker.min-*.mjs, and without it in this list the worker is
        // silently left out of the precache — PDF opening would then break
        // the moment the app is used offline. See
        // scripts/verifyOfflinePdfPrecache.mjs, run automatically after
        // every production build, which fails loudly if this regresses.
        globPatterns: ["**/*.{js,mjs,css,html,svg,json,webmanifest}"],
        // The bundled pdf.worker.min-*.mjs is ~1.3 MB; Workbox's default
        // 2 MB cap would already cover it, but this is set explicitly so a
        // future dependency bump can't silently fall outside the default
        // and get dropped from the precache without any error.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "index.html"
      }
    })
  ],
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
