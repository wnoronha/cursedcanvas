import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import path from "node:path";

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, detach?: boolean }} [opts]
 * @returns {Promise<{ ok: true, pid?: number, command: string } | { ok: false, error: string, command: string }>}
 */
export function runCommand(cmd, args, opts = {}) {
  const command = [cmd, ...args].join(" ");
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, {
        cwd: opts.cwd,
        detached: opts.detach ?? true,
        stdio: opts.detach === false ? ["ignore", "pipe", "pipe"] : "ignore",
        env: process.env,
        shell: false,
      });
      if (opts.detach !== false) {
        child.unref();
        resolve({ ok: true, pid: child.pid, command });
        return;
      }
      let stderr = "";
      child.stderr?.on("data", (d) => {
        stderr += String(d);
      });
      child.on("error", (err) => {
        resolve({ ok: false, error: err.message, command });
      });
      child.on("close", (code) => {
        if (code === 0) resolve({ ok: true, pid: child.pid, command });
        else
          resolve({
            ok: false,
            error: stderr.trim() || `exit ${code}`,
            command,
          });
      });
    } catch (err) {
      resolve({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        command,
      });
    }
  });
}

/** @param {string} filePath */
export function whichSync(filePath) {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Resolve a binary from PATH-ish known locations. */
export function resolveBin(name, extras = []) {
  const home = process.env.HOME ?? "";
  const candidates = [
    ...extras,
    path.join(home, ".local", "bin", name),
    path.join("/opt/homebrew/bin", name),
    path.join("/usr/local/bin", name),
    name,
  ];
  for (const c of candidates) {
    if (c === name) return name; // let PATH resolve via spawn
    if (whichSync(c)) return c;
  }
  return name;
}

/**
 * @param {string} filePath
 * @param {{ startLineNumber?: number }} [selection]
 */
export function gotoSpec(filePath, selection) {
  const line = selection?.startLineNumber;
  if (line && line > 0) return `${filePath}:${line}`;
  return filePath;
}
