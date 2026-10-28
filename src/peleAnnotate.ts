/**
 * Pele C4 hit-testing (ported from peel’s setC4FocusFromEl).
 * Pele marks SVG with `.pele-node` / `.pele-edge` / `.pele-edge-label` + `data-id`.
 */

export type PeleHit = {
  kind: "node" | "edge";
  /** Stable Pele `data-id` (node alias or `from-to` for Rels). */
  c4Id: string;
  label: string;
  c4From?: string;
  c4To?: string;
  element: Element;
};

function dataId(el: Element): string {
  return (
    (el instanceof HTMLElement || el instanceof SVGElement ? el.dataset.id : undefined) ||
    el.getAttribute("data-id") ||
    ""
  ).trim();
}

function cleanLabel(raw: string): string {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

/** Prefer the short name line from a C4 box (before stereotype / description). */
function nodeLabel(el: Element, id: string): string {
  const raw = cleanLabel(el.textContent || "");
  if (!raw) return id;
  // Drop common C4 stereotype suffixes in the visible string.
  const withoutStereo = raw
    .replace(/\s*\[(PERSON|SYSTEM|CONTAINER|COMPONENT|EXTERNAL)[^\]]*\]/gi, "")
    .replace(/\s*<<(person|system|container|component|external)[^>]*>>/gi, "")
    .trim();
  const first = (withoutStereo || raw).split(/\s{2,}|\n/)[0]?.trim() || raw;
  return cleanLabel(first) || id;
}

function edgeParts(edgeId: string): { from: string; to: string } | null {
  const i = edgeId.indexOf("-");
  if (i <= 0) return null;
  return { from: edgeId.slice(0, i), to: edgeId.slice(i + 1) };
}

function fromNode(el: Element): PeleHit | null {
  const id = dataId(el);
  if (!id) return null;
  const label = nodeLabel(el, id);
  return { kind: "node", c4Id: id, label, element: el };
}

function fromEdge(el: Element): PeleHit | null {
  const id = dataId(el);
  if (!id) return null;
  const parts = edgeParts(id);
  let label = "";
  if (el.classList.contains("pele-edge-label")) {
    label = cleanLabel(el.textContent || "");
  } else {
    const safe = id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    // Scope to the SVG — nodes may not be attached to `document` yet (tests / portals).
    const root: ParentNode =
      (el instanceof SVGElement ? el.ownerSVGElement : null) ??
      el.closest("svg") ??
      el.ownerDocument ??
      el;
    const labelEl = root.querySelector(`.pele-edge-label[data-id="${safe}"]`);
    label = cleanLabel(labelEl?.textContent || "");
  }
  if (!label && parts) label = `${parts.from} → ${parts.to}`;
  if (!label) label = id;
  return {
    kind: "edge",
    c4Id: id,
    label,
    c4From: parts?.from,
    c4To: parts?.to,
    element: el,
  };
}

/** Resolve a Pele C4 node or edge under `start` (or null). */
export function findPeleHit(start: EventTarget | null): PeleHit | null {
  if (!(start instanceof Element)) return null;
  if (start.closest("[data-annotate-ui], .pele-zoom")) return null;

  const node = start.closest(".pele-node");
  if (node) return fromNode(node);

  const edge = start.closest(".pele-edge, .pele-edge-label");
  if (edge) return fromEdge(edge);

  return null;
}

/** Human target string for UI + bridge. */
export function peleTargetLabel(hit: PeleHit): string {
  if (hit.kind === "edge") {
    const ends = hit.c4From && hit.c4To ? `${hit.c4From}→${hit.c4To}` : hit.c4Id;
    return hit.label && hit.label !== ends ? `Rel ${ends}: ${hit.label}` : `Rel ${ends}`;
  }
  return hit.label && hit.label !== hit.c4Id ? `${hit.label} (${hit.c4Id})` : hit.c4Id;
}
