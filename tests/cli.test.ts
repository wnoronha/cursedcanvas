import path from "node:path";
import { describe, expect, it } from "vitest";
import { browserCommand, parseArgs, safeJoin } from "../bin/lib.mjs";

describe("parseArgs", () => {
  it("applies defaults and flags", () => {
    const opts = parseArgs(
      ["--port", "4000", "--bridge-port", "9000", "--no-open", "--no-bridge"],
      { cwd: "/tmp/proj" },
    );
    expect(opts.port).toBe(4000);
    expect(opts.bridgePort).toBe(9000);
    expect(opts.open).toBe(false);
    expect(opts.bridge).toBe(false);
    expect(opts.dir).toBe("/tmp/proj");
  });

  it("resolves --dir against cwd", () => {
    const opts = parseArgs(["--dir", "apps/demo"], { cwd: "/repo" });
    expect(opts.dir).toBe(path.resolve("/repo", "apps/demo"));
  });

  it("marks unknown flags", () => {
    const opts = parseArgs(["--wat"]);
    expect(opts.help).toBe(true);
    expect(opts.exitCode).toBe(1);
    expect(opts.unknown).toBe("--wat");
  });

  it("rejects invalid ports with help and an error", () => {
    for (const argv of [
      ["--port", "abc"],
      ["--port", "0"],
      ["--port", "70000"],
      ["--bridge-port", "-1"],
    ]) {
      const opts = parseArgs(argv, { cwd: "/tmp/proj" });
      expect(opts.help).toBe(true);
      expect(opts.exitCode).toBe(1);
      expect(typeof opts.error).toBe("string");
    }
  });

  it("keeps defaults after a rejected port", () => {
    const opts = parseArgs(["--port", "nope"], { cwd: "/tmp/proj" });
    expect(opts.port).toBe(5173);
  });
});

describe("browserCommand", () => {
  it("maps platforms to open commands", () => {
    expect(browserCommand("darwin")).toBe("open");
    expect(browserCommand("win32")).toBe("start");
    expect(browserCommand("linux")).toBe("xdg-open");
  });
});

describe("safeJoin", () => {
  const root = path.resolve("/srv/dist");

  it("maps / to index.html", () => {
    expect(safeJoin(root, "/")).toBe(path.join(root, "index.html"));
  });

  it("blocks path traversal", () => {
    expect(safeJoin(root, "/../../etc/passwd")).toBeNull();
  });
});
