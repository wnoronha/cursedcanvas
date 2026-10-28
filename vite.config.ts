import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Prefer the file: cursor package; keep an explicit alias for HMR.
      "cursor/canvas": path.resolve(root, "packages/sdk/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
