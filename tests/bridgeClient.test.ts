import { afterEach, describe, expect, it, vi } from "vitest";
import { bridgeUrl, eventsUrl } from "../src/bridgeClient";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("bridgeUrl", () => {
  it("defaults to localhost:8787", () => {
    vi.stubEnv("VITE_BRIDGE_URL", "");
    expect(bridgeUrl()).toBe("http://127.0.0.1:8787");
  });

  it("strips trailing slashes so paths join cleanly", () => {
    vi.stubEnv("VITE_BRIDGE_URL", "http://bridge:9000///");
    expect(bridgeUrl()).toBe("http://bridge:9000");
    expect(eventsUrl()).toBe("http://bridge:9000/events");
  });
});
