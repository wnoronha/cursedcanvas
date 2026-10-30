#!/usr/bin/env node
/**
 * Localhost canvas event bus for agent monitors (SSE only — no agent spawn).
 *
 *   GET  /events     SSE stream (action | annotation | hello)
 *   GET  /recent     JSON ring buffer
 *   POST /annotate   { text, canvasId?, path?, target?, rect?, c4Id?, c4From?, c4To?, selection? }
 *   POST /action     { action, canvasId? }
 *   GET  /health
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canvasActionToHost } from "./types.mjs";
import { resolveCanvasFile } from "./meta.mjs";
import { clampRecentLimit, readBody, validRect } from "./validate.mjs";
import { attachSse, publish, recentEvents, subscriberCount } from "./events.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(
  process.env.CURSEDCANVAS_ROOT || process.env.BRIDGE_ROOT || path.join(__dirname, ".."),
);
const PORT = Number(process.env.BRIDGE_PORT ?? 8787);
const HOST = process.env.BRIDGE_HOST ?? "127.0.0.1";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Last-Event-ID",
  };
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    ...corsHeaders(),
  });
  res.end(payload);
}

/**
 * @param {object} body
 * @param {string} [fallbackPath]
 */
function fileMetaFromBody(body, fallbackPath) {
  return resolveCanvasFile({
    cwd: ROOT,
    canvasId: typeof body.canvasId === "string" ? body.canvasId : undefined,
    path:
      typeof body.path === "string"
        ? body.path
        : typeof fallbackPath === "string"
          ? fallbackPath
          : undefined,
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      cwd: ROOT,
      mode: "events",
      subscribers: subscriberCount(),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/events") {
    attachSse(req, res, { cwd: ROOT, port: PORT, host: HOST });
    return;
  }

  if (req.method === "GET" && url.pathname === "/recent") {
    json(res, 200, {
      events: recentEvents(clampRecentLimit(url.searchParams.get("limit") ?? 20)),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/annotate") {
    try {
      const body = await readBody(req);
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        json(res, 400, { ok: false, error: "text is required" });
        return;
      }
      const file = fileMetaFromBody(body);
      const target = typeof body.target === "string" ? body.target.trim() : undefined;
      const c4Id = typeof body.c4Id === "string" ? body.c4Id.trim() : undefined;
      const c4Label = typeof body.c4Label === "string" ? body.c4Label.trim() : undefined;
      const c4From = typeof body.c4From === "string" ? body.c4From.trim() : undefined;
      const c4To = typeof body.c4To === "string" ? body.c4To.trim() : undefined;
      const c4Hint = c4Id
        ? c4From && c4To
          ? `— C4 Rel ${c4From}→${c4To} (${c4Id})`
          : `— C4 element “${c4Label || c4Id}” (${c4Id})`
        : target
          ? `— focus UI block “${target}”`
          : "";
      const instruction = [
        "Edit the canvas file",
        file.absolutePath ? `(${file.absolutePath})` : "",
        c4Hint,
        `— ${text}`,
      ]
        .filter(Boolean)
        .join(" ");

      const event = publish({
        kind: "annotation",
        text,
        target,
        rect: validRect(body.rect),
        c4Id,
        c4Label,
        c4From,
        c4To,
        selection: body.selection,
        source: typeof body.source === "string" ? body.source : "api",
        instruction,
        ...file,
      });
      console.log(
        `[bridge] annotation ←`,
        event.file ?? "-",
        c4Id ? `[c4:${c4Id}]` : target ? `[${target}]` : "",
        text.slice(0, 80),
        `(subs=${subscriberCount()})`,
      );
      json(res, 200, { ok: true, event, subscribers: subscriberCount() });
    } catch (err) {
      json(res, 400, {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/action") {
    try {
      const body = await readBody(req);
      const hostAction = canvasActionToHost(body.action, {
        canvasId: body.canvasId,
      });

      const openPath = hostAction.type === "openFile" ? hostAction.path : undefined;
      const file = fileMetaFromBody(body, openPath);

      const text =
        hostAction.type === "askAgent"
          ? hostAction.prompt
          : hostAction.type === "openFile"
            ? `Open ${hostAction.path}`
            : hostAction.type === "resumeAgent"
              ? `Resume ${hostAction.agentId}`
              : undefined;

      const instruction =
        hostAction.type === "askAgent"
          ? `Act on canvas ${file.file ?? file.canvasId ?? "unknown"} at ${file.absolutePath ?? file.path ?? "canvases/"} — ${hostAction.prompt}`
          : hostAction.type === "openFile"
            ? `Open ${file.absolutePath ?? hostAction.path}`
            : text;

      const event = publish({
        kind: "action",
        action: hostAction,
        text,
        instruction,
        selection: hostAction.type === "openFile" ? hostAction.selection : undefined,
        source: "viewer",
        ...file,
      });
      console.log(
        `[bridge] event ←`,
        hostAction.type,
        event.file ?? "",
        `(subs=${subscriberCount()})`,
      );
      json(res, 200, {
        ok: true,
        mode: "events",
        event,
        subscribers: subscriberCount(),
        hint: `Agents: curl -N http://${HOST}:${PORT}/events`,
      });
    } catch (err) {
      json(res, 400, {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  json(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[bridge] http://${HOST}:${PORT}  SSE=/events`);
});
