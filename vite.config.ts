import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Public surface is `cursor/canvas` only. `@cursedcanvas/sdk` is an
      // internal link: bun copies file: packages on install, so
      // packages/cursor-pkg/canvas.ts must import it by package name
      // (a relative ../sdk path breaks once copied to node_modules).
      // Keep this alias pointing at the same source for Vite HMR.
      "cursor/canvas": path.resolve(root, "packages/sdk/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
