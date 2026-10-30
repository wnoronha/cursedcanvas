import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function bridgeUsage() {
  return `Cursed Canvas bridge — localhost SSE event bus

Usage:
  bun run bridge [-- --dir <path> --host <host> --port <n>]
  bun bridge/server.mjs [--dir <path> --host <host> --port <n>]

Options:
  --dir <path>   Project root for bridge file paths (default: CURSEDCANVAS_ROOT, BRIDGE_ROOT, or repo root)
  --host <host>  Bind host (default: BRIDGE_HOST or 127.0.0.1)
  --port <n>     Event bus port (default: BRIDGE_PORT or 8787)
  -h, --help     Show help
`;
}

/**
 * Parse bridge CLI flags. Pure except for defaults.
 * Precedence: flags > env > defaults.
 *
 * @param {string[]} argv
 * @param {{ cwd?: string, env?: Record<string, string | undefined> }} [overrides]
 */
export function parseBridgeArgs(argv, overrides = {}) {
  const cwd = overrides.cwd ?? process.cwd();
  const env = overrides.env ?? process.env;
  const opts = {
    root: path.resolve(env.CURSEDCANVAS_ROOT || env.BRIDGE_ROOT || PKG_ROOT),
    host: env.BRIDGE_HOST ?? "127.0.0.1",
    port: Number(env.BRIDGE_PORT ?? 8787),
  };
  const invalidPort = (flag, raw) => {
    opts.help = true;
    opts.exitCode = 1;
    opts.error = `Invalid ${flag} ${JSON.stringify(raw)}: expected a port 1-65535`;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      opts.help = true;
    } else if (a === "--dir") {
      opts.root = path.resolve(cwd, argv[++i] ?? ".");
    } else if (a === "--host") {
      opts.host = argv[++i] ?? opts.host;
    } else if (a === "--port") {
      const raw = argv[++i];
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 65535) invalidPort("--port", raw);
      else opts.port = n;
    } else if (a.startsWith("-")) {
      opts.help = true;
      opts.exitCode = 1;
      opts.unknown = a;
    } else {
      opts.help = true;
      opts.exitCode = 1;
      opts.error = `Unexpected argument ${JSON.stringify(a)}`;
    }
  }
  return opts;
}
