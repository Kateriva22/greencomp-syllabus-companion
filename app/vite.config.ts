import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Phase 1: fully offline app. The service worker only precaches the app's
// own bundled assets (workbox "generateSW" with globPatterns over dist/).
// It never registers a runtime/network route, so there is no background
// "check for updates" network behaviour beyond the browser's own SW update
// check against the same-origin build it already downloaded.
export default defineConfig({
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
        globPatterns: ["**/*.{js,css,html,svg,json}"],
        navigateFallback: "index.html"
      }
    })
  ],
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
