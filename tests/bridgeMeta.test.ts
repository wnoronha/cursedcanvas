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

  it("contains absolute paths outside cwd", () => {
    const meta = resolveCanvasFile({ cwd, path: "/etc/passwd" });
    expect(meta.canvasId).toBe("passwd");
    expect(meta.path).toBe("canvases/passwd.canvas.tsx");
    expect(meta.absolutePath).toBe(path.join(cwd, "canvases/passwd.canvas.tsx"));
  });

  it("contains traversal paths outside cwd", () => {
    const meta = resolveCanvasFile({ cwd, path: "../../etc/passwd" });
    expect(meta.absolutePath).toBe(path.join(cwd, "canvases/passwd.canvas.tsx"));
    expect(meta.path).toBe("canvases/passwd.canvas.tsx");
  });

  it("derives canvasId when containing escaping paths", () => {
    const meta = resolveCanvasFile({ cwd, path: "/etc/passwd", canvasId: "   " });
    expect(meta.canvasId).toBe("passwd");
    expect(meta.absolutePath).toBe(path.join(cwd, "canvases/passwd.canvas.tsx"));
  });
});
