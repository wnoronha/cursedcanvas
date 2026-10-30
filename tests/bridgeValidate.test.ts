import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { clampRecentLimit, readBody, validRect } from "../bridge/validate.mjs";

function mockReq(chunks) {
  const req = new EventEmitter();
  req.destroy = () => {};
  process.nextTick(() => {
    for (const c of chunks) req.emit("data", Buffer.from(c));
    req.emit("end");
  });
  return req;
}

describe("readBody", () => {
  it("parses JSON bodies", async () => {
    await expect(readBody(mockReq(['{"a":1}']))).resolves.toEqual({ a: 1 });
  });

  it("resolves empty for empty bodies", async () => {
    await expect(readBody(mockReq([]))).resolves.toEqual({});
  });

  it("rejects malformed JSON", async () => {
    await expect(readBody(mockReq(["{oops"]))).rejects.toThrow();
  });

  it("rejects bodies past the byte limit", async () => {
    await expect(readBody(mockReq(["x".repeat(10)]), 8)).rejects.toThrow("body too large");
  });
});

describe("validRect", () => {
  it("passes well-formed rects through", () => {
    const rect = { top: 1, left: 2, width: 3, height: 4 };
    expect(validRect(rect)).toEqual(rect);
  });

  it("drops non-objects and partial shapes", () => {
    expect(validRect(null)).toBeUndefined();
    expect(validRect("10,10")).toBeUndefined();
    expect(validRect({ top: 1, left: 2, width: 3 })).toBeUndefined();
  });

  it("drops non-finite coordinates", () => {
    expect(validRect({ top: NaN, left: 0, width: 1, height: 1 })).toBeUndefined();
    expect(validRect({ top: 0, left: Infinity, width: 1, height: 1 })).toBeUndefined();
  });
});

describe("clampRecentLimit", () => {
  it("defaults on missing or garbage", () => {
    expect(clampRecentLimit(undefined)).toBe(20);
    expect(clampRecentLimit("abc")).toBe(20);
  });

  it("floors at 1 and caps at 200", () => {
    expect(clampRecentLimit("0")).toBe(1);
    expect(clampRecentLimit("-3")).toBe(1);
    expect(clampRecentLimit("5")).toBe(5);
    expect(clampRecentLimit("5.9")).toBe(5);
    expect(clampRecentLimit("9999")).toBe(200);
  });
});
