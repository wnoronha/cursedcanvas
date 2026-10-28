/**
 * In-memory event bus for agent monitors (SSE).
 * Keeps a short ring buffer so late subscribers can catch up via Last-Event-ID.
 */

const MAX_BUFFER = 200;

/** @typedef {object} BridgeEvent
 * @property {number} id
 * @property {string} ts ISO timestamp
 * @property {'action' | 'annotation' | 'hello'} kind
 * @property {string} [cwd] Repo root
 * @property {string} [canvasId] Canvas id without extension
 * @property {string} [file] Basename e.g. example-overview.canvas.tsx
 * @property {string} [path] Repo-relative path e.g. canvases/….canvas.tsx
 * @property {string} [absolutePath] Absolute file path for editors/agents
 * @property {unknown} [action] HostAction / CanvasAction payload
 * @property {string} [text] Freeform annotation / instruction
 * @property {string} [target] Hovered/pinned UI label
 * @property {object} [rect] Optional pinned block geometry
 * @property {string} [c4Id] Pele C4 node/edge data-id
 * @property {string} [c4Label] C4 display label
 * @property {string} [c4From] Rel source id (edges)
 * @property {string} [c4To] Rel target id (edges)
 * @property {object} [selection] Optional selection hint
 * @property {string} [source] e.g. "viewer" | "api"
 * @property {string} [instruction] One-line agent hint
 */

let nextId = 1;
/** @type {BridgeEvent[]} */
const buffer = [];
/** @type {Set<import('node:http').ServerResponse>} */
const subscribers = new Set();

/**
 * @param {Omit<BridgeEvent, 'id' | 'ts'>} partial
 * @returns {BridgeEvent}
 */
export function publish(partial) {
  const event = {
    ...partial,
    id: nextId++,
    ts: new Date().toISOString(),
  };
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  const chunk = formatSse(event);
  for (const res of subscribers) {
    try {
      res.write(chunk);
    } catch {
      subscribers.delete(res);
    }
  }
  return event;
}

/**
 * @param {BridgeEvent} event
 */
function formatSse(event) {
  return `id: ${event.id}\nevent: ${event.kind}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {{ cwd: string, port: number, host: string }} meta
 */
export function attachSse(req, res, meta) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  // Replay after Last-Event-ID when present
  const lastRaw = req.headers["last-event-id"];
  const lastId = lastRaw ? Number(lastRaw) : 0;
  const replay = Number.isFinite(lastId) ? buffer.filter((e) => e.id > lastId) : buffer.slice(-20);

  res.write(
    formatSse({
      id: 0,
      ts: new Date().toISOString(),
      kind: "hello",
      text: `Cursed Canvas bridge — monitor this stream; edit canvases/ when you get action|annotation events`,
      source: "bridge",
      canvasId: undefined,
      action: {
        cwd: meta.cwd,
        events: `http://${meta.host}:${meta.port}/events`,
        annotate: `POST http://${meta.host}:${meta.port}/annotate`,
      },
    }),
  );

  for (const event of replay) {
    if (event.id === 0) continue;
    res.write(formatSse(event));
  }

  subscribers.add(res);
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
      subscribers.delete(res);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    subscribers.delete(res);
  });
}

export function subscriberCount() {
  return subscribers.size;
}

export function recentEvents(limit = 20) {
  return buffer.slice(-limit);
}
