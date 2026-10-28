#!/usr/bin/env node
/**
 * Cursed Canvas CLI — run via GitHub Release tarball or local checkout:
 *   bunx -p https://github.com/wnoronha/cursedcanvas/releases/download/v0.1.0/cursedcanvas-0.1.0.tgz cursedcanvas
 *   bun start   (from a built checkout)
 *   cc          (bin alias)
 *
 * Starts the SSE bridge + serves the built viewer (dist/).
 * For local authoring with HMR, use `bun run dev` from a checkout.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, safeJoin } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const DIST = path.join(PKG_ROOT, "dist");
const BRIDGE = path.join(PKG_ROOT, "bridge", "server.mjs");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function printHelp() {
  console.log(`Cursed Canvas (CC) — Cursor-style .canvas.tsx viewer + event bus

Usage:
  cursedcanvas [options]
  cc [options]

Options:
  --dir <path>           Project root for bridge file paths (default: cwd)
  --port <n>             Viewer port (default: 5173)
  --bridge-port <n>      Event bus port (default: 8787)
  --host <host>          Bind host (default: 127.0.0.1)
  --no-bridge            Serve viewer only
  --no-open              Do not open a browser
  -h, --help             Show help
  -v, --version          Show version

Examples:
  bunx -p <release-tarball-url> cursedcanvas
  bunx -p <release-tarball-url> cursedcanvas --dir ./my-project
  bun start -- --port 4173
`);
}

function readPkgVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function startStaticServer({ host, port, root }) {
  const server = http.createServer((req, res) => {
    const filePath = safeJoin(root, req.url || "/");
    if (!filePath) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === "ENOENT" && !path.extname(filePath)) {
          fs.readFile(path.join(root, "index.html"), (e2, html) => {
            if (e2) {
              res.writeHead(404).end("Not found");
              return;
            }
            res.writeHead(200, { "Content-Type": MIME[".html"] }).end(html);
          });
          return;
        }
        res.writeHead(404).end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
      });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

function startBridge({ root, host, port }) {
  const child = spawn(process.execPath, [BRIDGE], {
    env: {
      ...process.env,
      CURSEDCANVAS_ROOT: root,
      BRIDGE_ROOT: root,
      BRIDGE_HOST: host,
      BRIDGE_PORT: String(port),
    },
    stdio: "inherit",
  });
  return child;
}

async function openBrowser(url) {
  const { platform } = process;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", detached: true, shell: platform === "win32" }).unref();
  } catch {
    /* ignore */
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.unknown) console.error(`Unknown option: ${opts.unknown}`);
  if (opts.help) {
    printHelp();
    process.exit(opts.exitCode ?? 0);
  }
  if (opts.version) {
    console.log(readPkgVersion());
    process.exit(0);
  }

  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error(
      `Missing built viewer at ${DIST}.\nRun \`bun run build\` in the Cursed Canvas checkout, or install a published release.`,
    );
    process.exit(1);
  }

  let bridgeChild = null;
  if (opts.bridge) {
    if (!fs.existsSync(BRIDGE)) {
      console.error(`Bridge not found at ${BRIDGE}`);
      process.exit(1);
    }
    bridgeChild = startBridge({
      root: opts.dir,
      host: opts.host,
      port: opts.bridgePort,
    });
  }

  const viewerUrl = `http://${opts.host}:${opts.port}/`;
  try {
    await startStaticServer({
      host: opts.host,
      port: opts.port,
      root: DIST,
    });
  } catch (err) {
    console.error(`Viewer failed to bind ${opts.host}:${opts.port}:`, err);
    bridgeChild?.kill("SIGTERM");
    process.exit(1);
  }

  console.log(`[cursedcanvas] viewer  ${viewerUrl}`);
  if (opts.bridge) {
    console.log(
      `[cursedcanvas] bridge  http://${opts.host}:${opts.bridgePort}/events  (root=${opts.dir})`,
    );
  }
  console.log(`[cursedcanvas] stop with Ctrl+C`);

  if (opts.open) await openBrowser(viewerUrl);

  const shutdown = () => {
    bridgeChild?.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
