import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { routes } from "./src/lib/routes";

function staticRouteEntries(): Plugin {
  return {
    name: "static-route-entries",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset") {
        this.error("Missing built index.html for static route entries");
      }
      // All entries reference the same base-prefixed JS/CSS. No duplicated app bundles.
      for (const route of routes) {
        this.emitFile({
          type: "asset",
          fileName: `${route}/index.html`,
          source: entry.source,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), staticRouteEntries()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
