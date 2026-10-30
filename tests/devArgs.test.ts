import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDevArgs } from "../scripts/dev.mjs";

describe("parseDevArgs", () => {
  it("extracts --dir and forwards the rest to vite", () => {
    const { dir, rest } = parseDevArgs(["--dir", "apps/demo", "--port", "5174"], {
      cwd: "/repo",
    });
    expect(dir).toBe(path.resolve("/repo", "apps/demo"));
    expect(rest).toEqual(["--port", "5174"]);
  });

  it("leaves dir unset when no flag is given", () => {
    const { dir, rest } = parseDevArgs(["--host", "0.0.0.0"], { cwd: "/repo" });
    expect(dir).toBeUndefined();
    expect(rest).toEqual(["--host", "0.0.0.0"]);
  });

  it("drops the bare bun separator", () => {
    const { dir, rest } = parseDevArgs(["--", "--dir", "docs"], { cwd: "/repo" });
    expect(dir).toBe(path.resolve("/repo", "docs"));
    expect(rest).toEqual([]);
  });
});
