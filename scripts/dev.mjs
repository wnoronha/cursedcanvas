import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Parse `bun run dev` flags. Extracts `--dir`, forwards the rest to vite.
 * `--dir <path>` sets CURSEDCANVAS_DIR so the viewer lists that
 * project's `canvases/` instead of this repo's.
 *
 * @param {string[]} argv
 * @param {{ cwd?: string }} [env]
 */
export function parseDevArgs(argv, env = {}) {
  const cwd = env.cwd ?? process.cwd();
  const rest = [];
  let dir;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    else if (a === "--dir") dir = path.resolve(cwd, argv[++i] ?? ".");
    else rest.push(a);
  }
  return { dir, rest };
}

if (import.meta.main) {
  const { dir, rest } = parseDevArgs(process.argv.slice(2));
  const child = spawn(process.execPath, ["x", "vite", ...rest], {
    env: {
      ...process.env,
      ...(dir ? { CURSEDCANVAS_DIR: dir } : {}),
    },
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}
