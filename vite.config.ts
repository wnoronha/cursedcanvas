import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  // CURSEDCANVAS_DIR (set by `bun run dev -- --dir <path>`) points the viewer
  // at another project's canvases. Dev-only: production builds always bundle
  // this repo's canvases/.
  const envDir = process.env.CURSEDCANVAS_DIR?.trim();
  const externalRoot = envDir ? path.resolve(envDir) : null;
  const externalDir =
    command === "serve" && externalRoot && externalRoot !== root
      ? path.join(externalRoot, "canvases")
      : null;

  /** Absolute /@fs URLs for every canvas in the external dir, or null. */
  let externalFiles = null;
  if (externalDir) {
    if (!fs.existsSync(externalDir)) {
      console.warn(`[cursedcanvas] canvases dir not found: ${externalDir} (using repo canvases/)`);
    } else {
      externalFiles = fs
        .readdirSync(externalDir)
        .filter((f) => f.endsWith(".canvas.tsx"))
        .sort()
        .map((f) => `/@fs${path.join(externalDir, f).replace(/\\/g, "/")}`);
    }
  }

  return {
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
      fs: {
        allow: externalDir ? [root, externalDir] : [root],
      },
    },
    define: {
      __EXTERNAL_CANVAS_FILES__: JSON.stringify(externalFiles),
    },
    build: {
      // Pele (~710 kB min) ships as its own lazy chunk — dynamic import in
      // packages/sdk/diagram.tsx, fetched only when a Diagram mounts and never
      // referenced by index.html — so it sits outside the first-load budget.
      chunkSizeWarningLimit: 800,
    },
  };
});
