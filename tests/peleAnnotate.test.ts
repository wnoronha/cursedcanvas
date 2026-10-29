import { describe, expect, it } from "vitest";
import { findPeleHit, peleTargetLabel } from "../src/peleAnnotate";

function svgMarkup(inner: string): SVGSVGElement {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  return wrap.querySelector("svg")!;
}

describe("findPeleHit", () => {
  it("hits a Pele node by data-id", () => {
    const svg = svgMarkup(`<g class="pele-node" data-id="api"><text>API Application</text></g>`);
    const text = svg.querySelector("text")!;
    const hit = findPeleHit(text);
    expect(hit?.kind).toBe("node");
    expect(hit?.c4Id).toBe("api");
    expect(hit?.label).toContain("API");
  });

  it("hits a Pele edge and parses from/to", () => {
    const svg = svgMarkup(
      `<g class="pele-edge" data-id="spa-api"></g>
       <g class="pele-edge-label" data-id="spa-api"><text>Uses</text></g>`,
    );
    const edge = svg.querySelector(".pele-edge")!;
    const hit = findPeleHit(edge);
    expect(hit?.kind).toBe("edge");
    expect(hit?.c4Id).toBe("spa-api");
    expect(hit?.c4From).toBe("spa");
    expect(hit?.c4To).toBe("api");
    expect(hit?.label).toBe("Uses");
  });

  it("ignores annotate UI chrome", () => {
    const host = document.createElement("div");
    host.innerHTML = `<div data-annotate-ui><span class="pele-node" data-id="x">X</span></div>`;
    const node = host.querySelector(".pele-node")!;
    expect(findPeleHit(node)).toBeNull();
  });

  it("resolves dashed aliases structurally (from contains dash)", () => {
    const svg = svgMarkup(
      `<g class="pele-node" data-id="svc-a"><text>Service A</text></g>
       <g class="pele-node" data-id="api"><text>API</text></g>
       <g class="pele-edge" data-id="svc-a-api"></g>
       <g class="pele-edge-label" data-id="svc-a-api"><text>Uses</text></g>`,
    );
    const hit = findPeleHit(svg.querySelector(".pele-edge")!);
    expect(hit?.c4From).toBe("svc-a");
    expect(hit?.c4To).toBe("api");
  });

  it("resolves dashed aliases structurally (to contains dash)", () => {
    const svg = svgMarkup(
      `<g class="pele-node" data-id="spa"><text>SPA</text></g>
       <g class="pele-node" data-id="svc-a"><text>Service A</text></g>
       <g class="pele-edge" data-id="spa-svc-a"></g>`,
    );
    const hit = findPeleHit(svg.querySelector(".pele-edge")!);
    expect(hit?.c4From).toBe("spa");
    expect(hit?.c4To).toBe("svc-a");
  });

  it("falls back to last-dash split without rendered nodes", () => {
    const svg = svgMarkup(`<g class="pele-edge" data-id="svc-a-api"></g>`);
    const hit = findPeleHit(svg.querySelector(".pele-edge")!);
    expect(hit?.c4From).toBe("svc-a");
    expect(hit?.c4To).toBe("api");
  });
});

describe("peleTargetLabel", () => {
  it("formats nodes and edges", () => {
    expect(
      peleTargetLabel({
        kind: "node",
        c4Id: "api",
        label: "API",
        element: document.createElement("div"),
      }),
    ).toBe("API (api)");
    expect(
      peleTargetLabel({
        kind: "edge",
        c4Id: "a-b",
        label: "calls",
        c4From: "a",
        c4To: "b",
        element: document.createElement("div"),
      }),
    ).toBe("Rel a→b: calls");
  });
});
