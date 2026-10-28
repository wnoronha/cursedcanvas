import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveCanvasFile } from "../bridge/meta.mjs";

describe("resolveCanvasFile", () => {
  const cwd = "/tmp/cc-project";

  it("builds path from canvasId", () => {
    const meta = resolveCanvasFile({ cwd, canvasId: "example-overview" });
    expect(meta.path).toBe("canvases/example-overview.canvas.tsx");
    expect(meta.file).toBe("example-overview.canvas.tsx");
    expect(meta.absolutePath).toBe(path.join(cwd, "canvases/example-overview.canvas.tsx"));
  });

  it("derives canvasId from path", () => {
    const meta = resolveCanvasFile({
      cwd,
      path: "canvases/foo.canvas.tsx",
    });
    expect(meta.canvasId).toBe("foo");
    expect(meta.file).toBe("foo.canvas.tsx");
  });

  it("prefixes bare filenames with canvases/", () => {
    const meta = resolveCanvasFile({ cwd, path: "bar.canvas.tsx" });
    expect(meta.path).toBe("canvases/bar.canvas.tsx");
  });
});
