import path from "node:path";

/**
 * @param {string[]} argv
 * @param {{ cwd?: string }} [env]
 */
export function parseArgs(argv, env = {}) {
  const cwd = env.cwd ?? process.cwd();
  const opts = {
    dir: cwd,
    port: 5173,
    bridgePort: 8787,
    host: "127.0.0.1",
    bridge: true,
    open: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      opts.help = true;
    } else if (a === "-v" || a === "--version") {
      opts.version = true;
    } else if (a === "--no-bridge") {
      opts.bridge = false;
    } else if (a === "--no-open") {
      opts.open = false;
    } else if (a === "--dir") {
      opts.dir = path.resolve(cwd, argv[++i] ?? ".");
    } else if (a === "--port") {
      opts.port = Number(argv[++i]);
    } else if (a === "--bridge-port") {
      opts.bridgePort = Number(argv[++i]);
    } else if (a === "--host") {
      opts.host = argv[++i] ?? opts.host;
    } else if (a.startsWith("-")) {
      opts.help = true;
      opts.exitCode = 1;
      opts.unknown = a;
    }
  }
  return opts;
}

/** Prevent path traversal out of the static root. */
export function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent((urlPath.split("?")[0] || "/").replace(/\\/g, "/"));
  const rel = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.normalize(path.join(root, rel));
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}
