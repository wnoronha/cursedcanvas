import path from "node:path";
import { describe, expect, it } from "vitest";
import { bridgeUsage, parseBridgeArgs } from "../bridge/args.mjs";

describe("parseBridgeArgs", () => {
  it("defaults to repo root, localhost, and 8787", () => {
    const opts = parseBridgeArgs([], { env: {} });
    expect(opts.host).toBe("127.0.0.1");
    expect(opts.port).toBe(8787);
    expect(typeof opts.root).toBe("string");
  });

  it("accepts --dir --host --port flags", () => {
    const opts = parseBridgeArgs(["--dir", "apps/demo", "--host", "0.0.0.0", "--port", "9000"], {
      cwd: "/repo",
      env: {},
    });
    expect(opts.root).toBe(path.resolve("/repo", "apps/demo"));
    expect(opts.host).toBe("0.0.0.0");
    expect(opts.port).toBe(9000);
  });

  it("prefers flags over env", () => {
    const opts = parseBridgeArgs(["--dir", "elsewhere"], {
      cwd: "/repo",
      env: { CURSEDCANVAS_ROOT: "/env/root", BRIDGE_PORT: "8000" },
    });
    expect(opts.root).toBe(path.resolve("/repo", "elsewhere"));
    expect(opts.port).toBe(8000);
  });

  it("reads env roots and bind", () => {
    const opts = parseBridgeArgs([], {
      env: {
        CURSEDCANVAS_ROOT: "/env/root",
        BRIDGE_ROOT: "/fallback",
        BRIDGE_HOST: "0.0.0.0",
        BRIDGE_PORT: "8001",
      },
    });
    expect(opts.root).toBe(path.resolve("/env/root"));
    expect(opts.host).toBe("0.0.0.0");
    expect(opts.port).toBe(8001);
  });

  it("falls back to BRIDGE_ROOT when CURSEDCANVAS_ROOT is unset", () => {
    const opts = parseBridgeArgs([], { env: { BRIDGE_ROOT: "/fallback" } });
    expect(opts.root).toBe(path.resolve("/fallback"));
  });

  it("rejects invalid ports with help and an error", () => {
    for (const argv of [
      ["--port", "abc"],
      ["--port", "0"],
      ["--port", "70000"],
    ]) {
      const opts = parseBridgeArgs(argv, { env: {} });
      expect(opts.help).toBe(true);
      expect(opts.exitCode).toBe(1);
      expect(typeof opts.error).toBe("string");
    }
  });

  it("marks unknown flags and --help", () => {
    expect(parseBridgeArgs(["--wat"], { env: {} }).unknown).toBe("--wat");
    expect(parseBridgeArgs(["--help"], { env: {} }).help).toBe(true);
  });

  it("documents --dir in usage", () => {
    expect(bridgeUsage()).toContain("--dir");
  });
});
