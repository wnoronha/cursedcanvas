import { gotoSpec, resolveBin, runCommand } from "./shared.mjs";

/** @type {import('../types.mjs').AdapterId} */
export const id = "agy";
export const label = "agy (Antigravity)";

/**
 * @param {import('../types.mjs').HostAction} action
 * @param {{ cwd: string }} ctx
 */
export async function handle(action, ctx) {
  const agy = resolveBin("agy", [`${process.env.HOME}/.local/bin/agy`]);
  // File open is an editor concern — reuse Cursor goto when available,
  // otherwise fall back to macOS `open`.
  const cursor = resolveBin("cursor", ["/usr/local/bin/cursor"]);

  if (action.type === "openFile") {
    const target = gotoSpec(action.path, action.selection);
    const viaCursor = await runCommand(cursor, ["-g", target], {
      cwd: ctx.cwd,
    });
    if (viaCursor.ok) return viaCursor;
    return runCommand("open", [action.path], { cwd: ctx.cwd });
  }

  if (action.type === "askAgent") {
    const prompt = action.canvasId
      ? `${action.prompt}\n\n(Canvas: ${action.canvasId}.canvas.tsx)`
      : action.prompt;
    // Interactive session with initial prompt
    return runCommand(agy, ["--prompt-interactive", prompt], {
      cwd: ctx.cwd,
    });
  }

  if (action.type === "resumeAgent") {
    return runCommand(agy, ["--conversation", action.agentId], {
      cwd: ctx.cwd,
    });
  }

  return { ok: false, error: `agy adapter: unsupported ${action.type}`, command: "" };
}
