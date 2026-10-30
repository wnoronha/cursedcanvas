import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type JSX,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useHostTheme } from "cursor/canvas";
import { ANNOTATE_EVENT } from "./annotateEvents";
import { findPeleHit, peleTargetLabel, type PeleHit } from "./peleAnnotate";

export type RegionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type AnnotateSubmit = {
  text: string;
  target: string;
  rect: RegionRect;
  c4Id?: string;
  c4Label?: string;
  c4From?: string;
  c4To?: string;
};

type Props = {
  canvasId: string;
  bridgeUp: boolean | null;
  /** Mount Annotate / Cancel / status into the topbar. */
  toolbarTarget?: HTMLElement | null;
  onSubmit: (input: AnnotateSubmit) => Promise<boolean>;
  children: ReactNode;
};

type Phase = "idle" | "selecting" | "comment";

type Draft = {
  target: string;
  rect: RegionRect;
  c4Id?: string;
  c4Label?: string;
  c4From?: string;
  c4To?: string;
};

type HoverHit = RegionRect & {
  target: string;
  c4Id?: string;
  c4Label?: string;
  c4From?: string;
  c4To?: string;
};

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "BUTTON", "SELECT", "A"]);

function labelFor(el: HTMLElement): string {
  const heading = el.querySelector?.("h1, h2, h3, h4");
  const raw = (heading?.textContent || el.getAttribute("aria-label") || el.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return el.tagName.toLowerCase();
  return raw.length > 72 ? `${raw.slice(0, 69)}…` : raw;
}

function isSelectable(el: HTMLElement, root: HTMLElement): boolean {
  if (el === root) return false;
  if (SKIP.has(el.tagName)) return false;
  if (el.closest("[data-annotate-ui]")) return false;
  const role = el.getAttribute("role");
  if (role === "img" || role === "presentation") return false;
  if (/^H[1-6]$/.test(el.tagName)) return true;
  if (el.tagName === "TABLE" || el.tagName === "SECTION" || el.tagName === "ARTICLE") {
    return true;
  }
  const r = el.getBoundingClientRect();
  if (r.width < 80 || r.height < 28) return false;
  if (r.height > window.innerHeight * 0.85) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "inline" || style.display === "contents") return false;
  const pad =
    parseFloat(style.paddingTop) +
    parseFloat(style.paddingBottom) +
    parseFloat(style.paddingLeft) +
    parseFloat(style.paddingRight);
  const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  const hasBg =
    style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
  return pad >= 8 || border >= 1 || hasBg || el.tagName === "DIV";
}

function findBlock(start: EventTarget | null, root: HTMLElement): HTMLElement | null {
  if (!(start instanceof Node)) return null;
  let node: Node | null = start;
  let best: HTMLElement | null = null;
  while (node && node !== root) {
    if (node instanceof HTMLElement && isSelectable(node, root)) {
      best = node;
      if (
        /^H[1-6]$/.test(node.tagName) ||
        node.tagName === "TABLE" ||
        parseFloat(window.getComputedStyle(node).borderTopWidth) >= 1
      ) {
        return node;
      }
    }
    node = node.parentNode;
  }
  return best;
}

function measureElement(el: Element, root: HTMLElement): RegionRect {
  const rootRect = root.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    top: r.top - rootRect.top + root.scrollTop,
    left: r.left - rootRect.left + root.scrollLeft,
    width: Math.max(8, r.width),
    height: Math.max(8, r.height),
  };
}

function measureBlock(el: HTMLElement, root: HTMLElement): HoverHit {
  return { ...measureElement(el, root), target: labelFor(el) };
}

function measurePele(hit: PeleHit, root: HTMLElement): HoverHit {
  return {
    ...measureElement(hit.element, root),
    target: peleTargetLabel(hit),
    c4Id: hit.c4Id,
    c4Label: hit.label,
    c4From: hit.c4From,
    c4To: hit.c4To,
  };
}

/** Prefer Pele C4 node/edge; else HTML block (cards, headings, …). */
function hitAt(start: EventTarget | null, root: HTMLElement): HoverHit | null {
  const pele = findPeleHit(start);
  if (pele) return measurePele(pele, root);
  const el = findBlock(start, root);
  return el ? measureBlock(el, root) : null;
}

function clientToLocal(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rootRect = root.getBoundingClientRect();
  return {
    x: clientX - rootRect.left + root.scrollLeft,
    y: clientY - rootRect.top + root.scrollTop,
  };
}

export function AnnotateTool({
  canvasId,
  bridgeUp,
  toolbarTarget,
  onSubmit,
  children,
}: Props): JSX.Element {
  const theme = useHostTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [hover, setHover] = useState<HoverHit | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<RegionRect | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const activeRect: (RegionRect & { target?: string }) | null =
    phase === "comment" && draft ? { ...draft.rect, target: draft.target } : hover;
  const selecting = phase === "selecting";
  const annotateDisabled = canvasId === "none" || bridgeUp === false || bridgeUp === null;

  const startAnnotate = useCallback(() => {
    if (annotateDisabled) return;
    setPhase("selecting");
    setDraft(null);
    setHover(null);
    setDragOrigin(null);
    setDragRect(null);
    setText("");
    setStatus("Click a C4 node/edge, a block, or drag a region");
  }, [annotateDisabled]);

  const cancel = useCallback(() => {
    setPhase("idle");
    setDraft(null);
    setHover(null);
    setDragOrigin(null);
    setDragRect(null);
    setText("");
    setStatus(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "idle") cancel();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [phase, cancel]);

  useEffect(() => {
    const onAnnotateRequest = () => {
      if (annotateDisabled || phase !== "idle") return;
      startAnnotate();
    };
    window.addEventListener(ANNOTATE_EVENT, onAnnotateRequest);
    return () => window.removeEventListener(ANNOTATE_EVENT, onAnnotateRequest);
  }, [annotateDisabled, phase, startAnnotate]);

  useEffect(() => {
    if (phase === "comment") {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [phase]);

  // Leaving a canvas cancels an in-progress annotate.
  const prevCanvasId = useRef(canvasId);
  useEffect(() => {
    if (prevCanvasId.current === canvasId) return;
    prevCanvasId.current = canvasId;
    cancel();
  }, [canvasId, cancel]);

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!selecting || !rootRef.current) return;
    if (dragOrigin) {
      const cur = clientToLocal(rootRef.current, e.clientX, e.clientY);
      const left = Math.min(dragOrigin.x, cur.x);
      const top = Math.min(dragOrigin.y, cur.y);
      const width = Math.abs(cur.x - dragOrigin.x);
      const height = Math.abs(cur.y - dragOrigin.y);
      setDragRect({ top, left, width, height });
      setHover(null);
      return;
    }
    setHover(hitAt(e.target, rootRef.current));
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!selecting || !rootRef.current) return;
    if ((e.target as HTMLElement).closest?.("[data-annotate-ui]")) return;
    if (e.button !== 0) return;
    e.preventDefault();
    const origin = clientToLocal(rootRef.current, e.clientX, e.clientY);
    setDragOrigin(origin);
    setDragRect({ top: origin.y, left: origin.x, width: 0, height: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const finishSelection = (hit: HoverHit) => {
    setDraft({
      rect: {
        top: hit.top,
        left: hit.left,
        width: hit.width,
        height: hit.height,
      },
      target: hit.target,
      c4Id: hit.c4Id,
      c4Label: hit.c4Label,
      c4From: hit.c4From,
      c4To: hit.c4To,
    });
    setPhase("comment");
    setHover(null);
    setDragOrigin(null);
    setDragRect(null);
    setStatus(`Comment on “${hit.target}”`);
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!selecting || !rootRef.current || !dragOrigin) return;
    const root = rootRef.current;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    const cur = clientToLocal(root, e.clientX, e.clientY);
    const width = Math.abs(cur.x - dragOrigin.x);
    const height = Math.abs(cur.y - dragOrigin.y);
    const under = document.elementFromPoint(e.clientX, e.clientY);

    if (width < 6 && height < 6) {
      const hit = hitAt(under, root);
      if (hit) {
        finishSelection(hit);
      } else {
        setDragOrigin(null);
        setDragRect(null);
        setStatus("Click a C4 node/edge, a block, or drag a region");
      }
      return;
    }

    const left = Math.min(dragOrigin.x, cur.x);
    const top = Math.min(dragOrigin.y, cur.y);
    const cx = left + width / 2;
    const cy = top + height / 2;
    const rootRect = root.getBoundingClientRect();
    const centerEl = document.elementFromPoint(
      rootRect.left + cx - root.scrollLeft,
      rootRect.top + cy - root.scrollTop,
    );
    const hit = hitAt(centerEl, root);
    finishSelection(
      hit ?? {
        top,
        left,
        width,
        height,
        target: `Region ${Math.round(width)}×${Math.round(height)}`,
      },
    );
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || !draft || busy) return;
    if (!bridgeUp) {
      setStatus("Bridge down — run bun run bridge");
      return;
    }
    setBusy(true);
    const ok = await onSubmit({
      text: value,
      target: draft.target,
      rect: draft.rect,
      c4Id: draft.c4Id,
      c4Label: draft.c4Label,
      c4From: draft.c4From,
      c4To: draft.c4To,
    });
    setBusy(false);
    if (ok) {
      // Publish feedback is the topbar bus chip (circle → spinner), not text.
      setStatus(null);
      setPhase("idle");
      setDraft(null);
      setText("");
    } else {
      setStatus("Bridge error — annotation not sent");
    }
  };

  const outline =
    dragRect ??
    (activeRect
      ? {
          top: activeRect.top,
          left: activeRect.left,
          width: activeRect.width,
          height: activeRect.height,
        }
      : null);

  const commentWidth = draft ? Math.max(300, Math.min(draft.rect.width, 440)) : 0;
  // Clamp the comment form into the visible root so low selections
  // do not push it out of view.
  const rootW = rootRef.current?.clientWidth ?? 0;
  const rootH = rootRef.current?.clientHeight ?? 0;
  const commentTop = draft
    ? Math.max(0, Math.min(draft.rect.top + draft.rect.height + 10, Math.max(0, rootH - 240)))
    : 0;
  const commentLeft = draft
    ? Math.max(0, Math.min(draft.rect.left, Math.max(0, rootW - commentWidth - 8)))
    : 0;

  const toolbar = (
    <div
      data-annotate-ui
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {phase === "idle" ? (
        <button
          type="button"
          data-testid="annotate-start"
          onClick={startAnnotate}
          disabled={annotateDisabled}
          title={
            bridgeUp === false
              ? "Bridge down — run bun run bridge"
              : bridgeUp === null
                ? "Checking bridge…"
                : "Annotate → click C4 node/edge or block → comment · or ⌘K then Enter"
          }
          style={{
            border: `1px solid ${theme.stroke.secondary}`,
            background: theme.fill.tertiary,
            color: theme.text.primary,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            cursor: annotateDisabled ? "not-allowed" : "pointer",
            opacity: annotateDisabled ? 0.55 : 1,
          }}
        >
          Annotate
        </button>
      ) : (
        <button
          type="button"
          data-testid="annotate-cancel"
          onClick={cancel}
          title={
            phase === "selecting"
              ? "Click a C4 node/edge or block · drag a region · Esc cancels"
              : "Add a comment, then Send · Esc to cancel"
          }
          style={{
            border: `1px solid ${theme.stroke.secondary}`,
            background: "transparent",
            color: theme.text.secondary,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      )}
      {status ? (
        <span
          data-testid="annotate-status"
          title={status}
          style={{
            fontSize: 12,
            color: theme.text.secondary,
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : null}

      <div
        ref={rootRef}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{
          position: "relative",
          minHeight: "100%",
          cursor: selecting ? "crosshair" : undefined,
          userSelect: selecting ? "none" : undefined,
        }}
      >
        {children}

        {outline ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: outline.top,
              left: outline.left,
              width: outline.width,
              height: outline.height,
              borderRadius: 8,
              border: `1.5px solid ${theme.accent.primary}`,
              background: selecting || dragRect ? `${theme.accent.primary}18` : "transparent",
              boxShadow: `0 0 0 1px ${theme.accent.primary}33`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        ) : null}

        {phase === "comment" && draft ? (
          <form
            data-annotate-ui
            data-testid="annotate-comment"
            onSubmit={(e) => void submit(e)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: commentTop,
              left: commentLeft,
              width: commentWidth,
              zIndex: 4,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${theme.stroke.secondary}`,
              background: theme.bg.elevated,
              boxShadow: "0 10px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: 11, color: theme.text.tertiary }}>
              Target: {draft.target}
              {draft.c4Id ? (
                <span style={{ opacity: 0.75 }}>
                  {" "}
                  · c4Id={draft.c4Id}
                  {draft.c4From && draft.c4To ? ` · ${draft.c4From}→${draft.c4To}` : ""}
                </span>
              ) : null}
            </div>
            <textarea
              ref={inputRef}
              data-testid="annotate-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Describe the change for agents… (⌘↵ to send)"
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                border: `1px solid ${theme.stroke.tertiary}`,
                borderRadius: 8,
                background: theme.bg.editor,
                color: theme.text.primary,
                padding: 8,
                font: "inherit",
                fontSize: 13,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={cancel}
                style={{
                  border: "none",
                  background: "transparent",
                  color: theme.text.tertiary,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="annotate-send"
                disabled={busy || !text.trim() || bridgeUp === false}
                title="Send (⌘↵ / Ctrl+Enter)"
                style={{
                  border: "none",
                  background: theme.accent.primary,
                  color: theme.text.onAccent,
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: busy ? "wait" : "pointer",
                  opacity: text.trim() && bridgeUp !== false ? 1 : 0.45,
                }}
              >
                {busy ? "Sending…" : "Send to agents"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </>
  );
}
