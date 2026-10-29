/**
 * Generic host actions — canvas Cursor actions map onto these.
 * Published over SSE; viewers and agents consume them from the event bus.
 */

/**
 * @typedef {object} OpenFileAction
 * @property {'openFile'} type
 * @property {string} path
 * @property {{ startLineNumber?: number, startColumn?: number, endLineNumber?: number, endColumn?: number }} [selection]
 */

/**
 * @typedef {object} AskAgentAction
 * @property {'askAgent'} type
 * @property {string} prompt
 * @property {string} [canvasId]
 */

/**
 * @typedef {object} ResumeAgentAction
 * @property {'resumeAgent'} type
 * @property {string} agentId
 */

/**
 * @typedef {OpenFileAction | AskAgentAction | ResumeAgentAction} HostAction
 */

/**
 * Map Cursor canvas `CanvasAction` → generic `HostAction`.
 * @param {object} action
 * @param {{ canvasId?: string }} [ctx]
 * @returns {HostAction}
 */
export function canvasActionToHost(action, ctx = {}) {
  if (!action || typeof action !== "object" || !("type" in action)) {
    throw new Error("Invalid action");
  }
  const canvasId =
    typeof action.canvasId === "string"
      ? action.canvasId
      : typeof ctx.canvasId === "string"
        ? ctx.canvasId
        : undefined;

  switch (action.type) {
    case "openFile":
      return {
        type: "openFile",
        path: String(action.path),
        selection: action.selection,
      };
    case "newComposerChat":
      return {
        type: "askAgent",
        prompt:
          typeof action.userPrompt === "string" && action.userPrompt.trim()
            ? action.userPrompt
            : "Please look at the current canvas and help me refine it.",
        canvasId,
      };
    case "openAgent":
      return {
        type: "resumeAgent",
        agentId: String(action.agentId),
      };
    case "askAgent":
    case "resumeAgent":
      return /** @type {HostAction} */ (action);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
