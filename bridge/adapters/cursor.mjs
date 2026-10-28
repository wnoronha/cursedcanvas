import { gotoSpec, resolveBin, runCommand } from "./shared.mjs";

/** @type {import('../types.mjs').AdapterId} */
export const id = "cursor";
export const label = "Cursor CLI";

/**
 * @param {import('../types.mjs').HostAction} action
 * @param {{ cwd: string }} ctx
 */
export async function handle(action, ctx) {
  const cursor = resolveBin("cursor", [
    "/usr/local/bin/cursor",
    "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
  ]);

  if (action.type === "openFile") {
    const target = gotoSpec(action.path, action.selection);
    // `cursor -g file:line` opens in the IDE
    return runCommand(cursor, ["-g", target], { cwd: ctx.cwd });
  }

  if (action.type === "askAgent") {
    const prompt = action.canvasId
      ? `${action.prompt}\n\n(Canvas: ${action.canvasId}.canvas.tsx)`
      : action.prompt;
    // Interactive agent session with initial prompt (detached)
    return runCommand(cursor, ["agent", prompt], { cwd: ctx.cwd });
  }

  if (action.type === "resumeAgent") {
    return runCommand(cursor, ["agent", "--resume", action.agentId], { cwd: ctx.cwd });
  }

  return { ok: false, error: `cursor adapter: unsupported ${action.type}`, command: "" };
}
