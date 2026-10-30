import path from "node:path";

/**
 * Normalize canvas file metadata so SSE consumers always get enough to act.
 *
 * @param {{
 *   cwd: string,
 *   canvasId?: string,
 *   path?: string,
 * }} input
 */
export function resolveCanvasFile(input) {
  const cwd = input.cwd;
  let canvasId =
    typeof input.canvasId === "string" && input.canvasId.trim()
      ? input.canvasId.replace(/\.canvas\.tsx$/i, "").trim()
      : undefined;

  let rel =
    typeof input.path === "string" && input.path.trim()
      ? input.path.trim().replace(/\\/g, "/")
      : undefined;

  if (!rel && canvasId) {
    rel = `canvases/${canvasId}.canvas.tsx`;
  }

  if (rel && !canvasId) {
    const base = path.posix.basename(rel);
    canvasId = base.replace(/\.canvas\.tsx$/i, "");
  }

  if (!rel) {
    return {
      cwd,
      canvasId,
      path: undefined,
      file: undefined,
      absolutePath: undefined,
    };
  }

  // Keep repo-relative paths under canvases/ when possible
  if (!rel.startsWith("canvases/") && !path.isAbsolute(rel)) {
    rel = rel.includes("/") ? rel : `canvases/${rel}`;
  }

  const absolutePath = path.isAbsolute(rel) ? rel : path.resolve(cwd, rel);
  // Contain resolved paths to the project root. Absolute or escaping
  // request paths fall back to canvases/<id> so SSE instructions
  // never point agents at files outside the repo.
  const relToCwd = path.relative(cwd, absolutePath);
  const escapes =
    relToCwd === ".." || relToCwd.startsWith(`..${path.sep}`) || path.isAbsolute(relToCwd);
  if (escapes) {
    if (!canvasId) {
      return {
        cwd,
        canvasId,
        path: undefined,
        file: undefined,
        absolutePath: undefined,
      };
    }
    rel = `canvases/${canvasId}.canvas.tsx`;
    const containedAbs = path.resolve(cwd, rel);
    return {
      cwd,
      canvasId,
      path: rel,
      file: path.basename(containedAbs),
      absolutePath: containedAbs,
    };
  }
  const file = path.basename(absolutePath);
  const repoPath = path.isAbsolute(rel) ? path.relative(cwd, rel).replace(/\\/g, "/") : rel;

  return {
    cwd,
    canvasId: canvasId ?? file.replace(/\.canvas\.tsx$/i, ""),
    path: repoPath,
    file,
    absolutePath,
  };
}
