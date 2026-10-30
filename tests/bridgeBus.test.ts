import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { attachSse, publish, recentEvents, subscriberCount } from "../bridge/events.mjs";
import { canvasActionToHost } from "../bridge/types.mjs";

describe("publish / recentEvents", () => {
  it("assigns incrementing ids and timestamps", () => {
    const a = publish({ kind: "annotation", text: "a" });
    const b = publish({ kind: "annotation", text: "b" });
    expect(b.id).toBe(a.id + 1);
    expect(typeof a.ts).toBe("string");
  });

  it("attachSse sends hello, replays after Last-Event-ID, and cleans up", () => {
    const marker = publish({ kind: "annotation", text: "replay-me" });
    const written: string[] = [];
    const handlers: Record<string, () => void> = {};
    const req = {
      headers: { "last-event-id": String(marker.id - 1) },
      on: (ev: string, fn: () => void) => {
        handlers[ev] = fn;
      },
    };
    const res = {
      writeHead: () => {},
      write: (c: string) => written.push(c),
    };
    const before = subscriberCount();
    attachSse(
      req as unknown as import("node:http").IncomingMessage,
      res as unknown as import("node:http").ServerResponse,
      { cwd: "/tmp", port: 1, host: "127.0.0.1" },
    );
    expect(subscriberCount()).toBe(before + 1);
    expect(written[0]).toContain("event: hello");
    expect(written.some((c) => c.includes("replay-me"))).toBe(true);

    const live: string[] = [];
    res.write = (c: string) => live.push(c);
    publish({ kind: "annotation", text: "live-frame" });
    expect(live.some((c) => c.includes("live-frame"))).toBe(true);
    expect(written.some((c) => c.includes("live-frame"))).toBe(false);

    handlers["close"]();
    expect(subscriberCount()).toBe(before);
  });

  it("fresh subscribers get the tail, not the whole ring", () => {
    for (let i = 0; i < 25; i++) publish({ kind: "annotation", text: `tail-${i}` });
    const written = [];
    const handlers = {};
    const req = {
      headers: {},
      on: (ev, fn) => {
        handlers[ev] = fn;
      },
    };
    const res = {
      writeHead: () => {},
      write: (c) => written.push(c),
    };
    const before = subscriberCount();
    attachSse(
      req as unknown as import("node:http").IncomingMessage,
      res as unknown as import("node:http").ServerResponse,
      { cwd: "/tmp", port: 1, host: "127.0.0.1" },
    );
    expect(subscriberCount()).toBe(before + 1);
    const body = written.join("\n");
    expect(written[0]).toContain("event: hello");
    expect(body).not.toContain('"tail-0"');
    expect(body).toContain('"tail-24"');

    handlers["close"]();
    expect(subscriberCount()).toBe(before);
  });

  it("recentEvents honors limit", () => {
    publish({ kind: "annotation", text: "x" });
    const all = recentEvents(1000);
    const few = recentEvents(1);
    expect(few.length).toBe(1);
    expect(few[0]).toEqual(all[all.length - 1]);
  });

  it("caps the ring buffer at 200", () => {
    const first = publish({ kind: "annotation", text: "cap-start" });
    for (let i = 0; i < 205; i++) publish({ kind: "annotation", text: `fill-${i}` });
    const buf = recentEvents(1000);
    expect(buf.length).toBe(200);
    expect(buf[0].id).toBe(first.id + 6);
    expect(subscriberCount()).toBe(0);
  });
});

describe("canvasActionToHost", () => {
  it("maps openFile", () => {
    expect(canvasActionToHost({ type: "openFile", path: "a.tsx" })).toMatchObject({
      type: "openFile",
      path: "a.tsx",
    });
  });

  it("maps newComposerChat with default and custom prompts", () => {
    expect(canvasActionToHost({ type: "newComposerChat" }, { canvasId: "c" })).toMatchObject({
      type: "askAgent",
      canvasId: "c",
    });
    expect(canvasActionToHost({ type: "newComposerChat", userPrompt: "  " }).prompt).toContain(
      "refine",
    );
    expect(canvasActionToHost({ type: "newComposerChat", userPrompt: "do X" }).prompt).toBe("do X");
  });

  it("maps openAgent and passes askAgent/resumeAgent through", () => {
    expect(canvasActionToHost({ type: "openAgent", agentId: "9" })).toEqual({
      type: "resumeAgent",
      agentId: "9",
    });
    expect(canvasActionToHost({ type: "askAgent", prompt: "hi" }).type).toBe("askAgent");
  });

  it("throws on invalid and unknown actions", () => {
    expect(() => canvasActionToHost(null)).toThrow("Invalid action");
    expect(() => canvasActionToHost({})).toThrow("Invalid action");
    expect(() => canvasActionToHost({ type: "nope" })).toThrow("Unknown action type");
  });
});

describe("bridge server (live, bun child process)", () => {
  const PORT = 18900 + (process.pid % 900);
  const BASE = `http://127.0.0.1:${PORT}`;
  let child: ChildProcess | null = null;

  async function waitForHealth(): Promise<void> {
    const deadline = Date.now() + 10000;
    for (;;) {
      try {
        const res = await fetch(`${BASE}/health`);
        if (res.ok) return;
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) throw new Error("bridge did not start");
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  afterAll(() => {
    child?.kill();
  });

  it("serves health, 400s, and recent", async () => {
    child = spawn("bun", ["bridge/server.mjs"], {
      env: { ...process.env, BRIDGE_PORT: String(PORT) },
      stdio: "ignore",
    });
    await waitForHealth();

    const health = await (await fetch(`${BASE}/health`)).json();
    expect(health).toMatchObject({ ok: true, mode: "events" });

    const empty = await fetch(`${BASE}/annotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });
    expect(empty.status).toBe(400);

    const badJson = await fetch(`${BASE}/annotate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{oops",
    });
    expect(badJson.status).toBe(400);

    const ok = await (
      await fetch(`${BASE}/annotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Tighten H1", canvasId: "example-overview" }),
      })
    ).json();
    expect(ok.ok).toBe(true);
    expect(ok.event.instruction).toContain("Tighten H1");

    const badAction = await fetch(`${BASE}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: { type: "nope" } }),
    });
    expect(badAction.status).toBe(400);

    const recent = await (await fetch(`${BASE}/recent?limit=2`)).json();
    expect(Array.isArray(recent.events)).toBe(true);
    expect(recent.events.length).toBeLessThanOrEqual(2);

    const missing = await fetch(`${BASE}/nope`);
    expect(missing.status).toBe(404);
  }, 20000);
});
