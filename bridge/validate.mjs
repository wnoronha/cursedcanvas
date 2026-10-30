/**
 * Boundary validation for the localhost event bus.
 * Pure helpers live here so tests can import them without
 * starting the HTTP server (server.mjs listens on import).
 */

export const MAX_BODY_BYTES = 256 * 1024;
export const MAX_RECENT_LIMIT = 200;
export const DEFAULT_RECENT_LIMIT = 20;

/** Read and parse a JSON body, rejecting past `limit` bytes. */
export function readBody(req, limit = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let failed = false;
    req.on("data", (c) => {
      if (failed) return;
      size += c.length;
      if (size > limit) {
        failed = true;
        req.destroy?.();
        reject(new Error("body too large"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (failed) return;
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/** Narrow an unknown pinned-region payload, dropping malformed shapes. */
export function validRect(value) {
  if (!value || typeof value !== "object") return undefined;
  const { top, left, width, height } = value;
  for (const n of [top, left, width, height]) {
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  }
  return { top, left, width, height };
}

/** Clamp `GET /recent?limit=` into 1..MAX, defaulting on garbage. */
export function clampRecentLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_RECENT_LIMIT;
  return Math.min(MAX_RECENT_LIMIT, Math.max(1, Math.floor(n)));
}
