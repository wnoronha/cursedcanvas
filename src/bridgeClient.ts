import type { CanvasAction } from "cursor/canvas";

export type BridgeEvent = {
  id: number;
  ts: string;
  kind: "action" | "annotation" | "hello";
  cwd?: string;
  canvasId?: string;
  file?: string;
  path?: string;
  absolutePath?: string;
  action?: unknown;
  text?: string;
  target?: string;
  instruction?: string;
  rect?: { top: number; left: number; width: number; height: number };
  c4Id?: string;
  c4Label?: string;
  c4From?: string;
  c4To?: string;
  selection?: unknown;
  source?: string;
};

export type BridgeResult = {
  ok: boolean;
  mode?: "events";
  action?: unknown;
  event?: BridgeEvent;
  subscribers?: number;
  error?: string;
  hint?: string;
};

const DEFAULT_URL = "http://127.0.0.1:8787";

export function bridgeUrl(): string {
  return (import.meta.env.VITE_BRIDGE_URL as string | undefined) ?? DEFAULT_URL;
}

export function eventsUrl(): string {
  return `${bridgeUrl()}/events`;
}

export async function checkBridge(): Promise<{
  ok: boolean;
  subscribers: number;
} | null> {
  try {
    const res = await fetch(`${bridgeUrl()}/health`);
    if (!res.ok) return null;
    const body = (await res.json()) as { subscribers?: number };
    return { ok: true, subscribers: body.subscribers ?? 0 };
  } catch {
    return null;
  }
}

export async function dispatchToBridge(
  action: CanvasAction,
  options: { canvasId?: string } = {},
): Promise<BridgeResult> {
  try {
    const res = await fetch(`${bridgeUrl()}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        canvasId: options.canvasId,
        spawn: false,
      }),
    });
    return (await res.json()) as BridgeResult;
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `${err.message} (is the bridge running? bun run bridge)`
          : String(err),
    };
  }
}

export async function postAnnotation(input: {
  text: string;
  canvasId?: string;
  path?: string;
  target?: string;
  rect?: { top: number; left: number; width: number; height: number };
  c4Id?: string;
  c4Label?: string;
  c4From?: string;
  c4To?: string;
}): Promise<BridgeResult> {
  try {
    const res = await fetch(`${bridgeUrl()}/annotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, source: "viewer" }),
    });
    return (await res.json()) as BridgeResult;
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `${err.message} (is the bridge running? bun run bridge)`
          : String(err),
    };
  }
}
