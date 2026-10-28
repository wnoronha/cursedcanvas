import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import { CanvasRuntimeProvider, Text, useHostTheme, type CanvasAction } from "cursor/canvas";
import { ActionBar, type ActionBarItem } from "./ActionBar";
import { AnnotateTool } from "./AnnotateTool";
import { requestAnnotate } from "./annotateEvents";
import { checkBridge, dispatchToBridge, postAnnotation, type BridgeResult } from "./bridgeClient";

type CanvasModule = { default: ComponentType };

const modules = import.meta.glob<CanvasModule>("../canvases/*.canvas.tsx");
const lazyCanvases = Object.fromEntries(
  Object.entries(modules).map(([path, loader]) => [path, lazy(loader)]),
) as Record<string, LazyExoticComponent<ComponentType>>;
const CONTENT_MAX = 920;

function canvasIdFromPath(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/\.canvas\.tsx$/, "");
}

const APP_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function isMac(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

type HeadingPos = { el: HTMLElement; top: number; text: string };

function headingPositions(scroller: HTMLElement, root: HTMLElement): HeadingPos[] {
  const sRect = scroller.getBoundingClientRect();
  return Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3")).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      el,
      top: r.top - sRect.top + scroller.scrollTop,
      text: (el.textContent ?? "").trim().replace(/\s+/g, " "),
    };
  });
}

/** Heading currently at / above the viewport top (falls back to first). */
function currentHeadingLabel(scroller: HTMLElement, root: HTMLElement, stickyOffset = 0): string {
  const positions = headingPositions(scroller, root);
  if (positions.length === 0) return "";
  const origin = scroller.scrollTop + stickyOffset;
  const eps = 12;
  let current = positions[0]!;
  for (const p of positions) {
    if (p.top <= origin + eps) current = p;
    else break;
  }
  return current.text;
}

/** Next/prev h1–h3 inside `root`, scrolled within `scroller`. */
function jumpHeading(
  scroller: HTMLElement,
  root: HTMLElement,
  direction: 1 | -1,
  stickyOffset = 0,
): boolean {
  const positions = headingPositions(scroller, root);
  if (positions.length === 0) return false;

  // Skip headings already at/near the viewport top (page title, etc.).
  const origin = scroller.scrollTop + stickyOffset;
  const eps = 48;
  const target =
    direction === 1
      ? positions.find((p) => p.top > origin + eps)
      : [...positions].reverse().find((p) => p.top < origin - eps);

  if (!target) return false;
  scroller.scrollTo({
    top: Math.max(0, target.top - stickyOffset),
    behavior: "smooth",
  });
  return true;
}

function KbdHint({ children }: { children: ReactNode }) {
  const theme = useHostTheme();
  return (
    <span
      style={{
        fontSize: 10,
        lineHeight: "14px",
        color: theme.text.tertiary,
        border: `1px solid ${theme.stroke.tertiary}`,
        borderRadius: 4,
        padding: "2px 5px",
        fontFamily: APP_FONT,
        fontWeight: 500,
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        height: "100vh",
        maxHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.bg.chrome,
        color: theme.text.primary,
        fontFamily: APP_FONT,
      }}
    >
      {children}
    </div>
  );
}

function Viewer() {
  const theme = useHostTheme();
  const entries = useMemo(
    () =>
      Object.keys(modules)
        .map((path) => ({ path, id: canvasIdFromPath(path) }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [],
  );

  const initial =
    entries.find((e) => e.id === "example-overview")?.path ?? entries[0]?.path ?? null;

  const [selected, setSelected] = useState<string | null>(initial);
  const [bridgeUp, setBridgeUp] = useState<boolean | null>(null);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [lastResult, setLastResult] = useState<BridgeResult | null>(null);
  const [toolbarEl, setToolbarEl] = useState<HTMLDivElement | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sectionLabel, setSectionLabel] = useState("");
  const mainRef = useRef<HTMLElement | null>(null);
  const canvasRootRef = useRef<HTMLDivElement | null>(null);

  const refreshSectionLabel = useCallback(() => {
    const scroller = mainRef.current;
    const root = canvasRootRef.current;
    if (!scroller || !root) return;
    setSectionLabel(currentHeadingLabel(scroller, root, 8));
  }, []);

  const LazyCanvas = selected ? (lazyCanvases[selected] ?? null) : null;

  const canvasId = selected ? canvasIdFromPath(selected) : "none";
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const info = await checkBridge();
      if (cancelled) return;
      if (!info) {
        setBridgeUp(false);
        setSubscribers(null);
        return;
      }
      setBridgeUp(true);
      setSubscribers(info.subscribers);
    };
    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "TEXTAREA" || t.isContentEditable) &&
        !t.closest?.("[data-testid=action-bar]")
      ) {
        return;
      }
      e.preventDefault();
      setPaletteOpen((open) => !open);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "PageDown" && e.key !== "PageUp") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (paletteOpen) return;
      if (isTypingTarget(e.target)) return;
      const scroller = mainRef.current;
      const root = canvasRootRef.current;
      if (!scroller || !root) return;
      // Header sits outside <main>; small inset so the heading isn't flush.
      const moved = jumpHeading(scroller, root, e.key === "PageDown" ? 1 : -1, 8);
      if (moved) {
        e.preventDefault();
        window.setTimeout(refreshSectionLabel, 320);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, refreshSectionLabel]);

  useEffect(() => {
    const scroller = mainRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        refreshSectionLabel();
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // After canvas mount / HMR / tab changes, pick up the title heading.
    const id = window.setTimeout(refreshSectionLabel, 50);
    const id2 = window.setTimeout(refreshSectionLabel, 400);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.clearTimeout(id);
      window.clearTimeout(id2);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [selected, LazyCanvas, refreshSectionLabel]);

  const onAction = useCallback(
    (action: CanvasAction) => {
      void (async () => {
        const withPrompt: CanvasAction =
          action.type === "newComposerChat" && !action.userPrompt
            ? {
                type: "newComposerChat",
                userPrompt: `Please review the canvas "${canvasId}" in canvases/${canvasId}.canvas.tsx`,
              }
            : action;
        setPublishing(true);
        try {
          const result = await dispatchToBridge(withPrompt, { canvasId });
          setLastResult(result);
          if (typeof result.subscribers === "number") {
            setSubscribers(result.subscribers);
          }
          if (!result.ok) console.warn("[bridge]", result.error ?? result);
          else console.info("[bridge]", result.event?.kind, result.hint);
        } finally {
          setPublishing(false);
        }
      })();
    },
    [canvasId],
  );

  const onAnnotate = useCallback(
    async ({
      text,
      target,
      rect,
      c4Id,
      c4Label,
      c4From,
      c4To,
    }: {
      text: string;
      target: string;
      rect: { top: number; left: number; width: number; height: number };
      c4Id?: string;
      c4Label?: string;
      c4From?: string;
      c4To?: string;
    }) => {
      if (canvasId === "none") return false;
      setPublishing(true);
      try {
        const result = await postAnnotation({
          text,
          target,
          rect,
          c4Id,
          c4Label,
          c4From,
          c4To,
          canvasId,
          path: `canvases/${canvasId}.canvas.tsx`,
        });
        setLastResult(result);
        if (typeof result.subscribers === "number") {
          setSubscribers(result.subscribers);
        }
        return result.ok;
      } finally {
        setPublishing(false);
      }
    },
    [canvasId],
  );

  const actionItems = useMemo((): ActionBarItem[] => {
    const canvasActions: ActionBarItem[] = entries.map((entry) => ({
      id: `canvas:${entry.id}`,
      group: "Canvas",
      label: entry.id,
      detail:
        entry.path === selected
          ? "Current · canvases/" + entry.id + ".canvas.tsx"
          : `canvases/${entry.id}.canvas.tsx`,
      run: () => setSelected(entry.path),
    }));

    const commands: ActionBarItem[] = [
      {
        id: "cmd:annotate",
        group: "Command",
        label: "Annotate",
        detail: "Select a C4 node/edge or block and comment for agents",
        run: () => requestAnnotate(),
      },
    ];

    return [...commands, ...canvasActions];
  }, [entries, selected]);

  const listenerCount = subscribers ?? 0;
  const bridgeCount = bridgeUp === null ? "—" : String(listenerCount);
  const bridgeAccent =
    bridgeUp === null
      ? theme.text.tertiary
      : bridgeUp
        ? theme.diff.stripAdded
        : theme.diff.stripRemoved;
  const bridgeTitle = publishing
    ? "Publishing to event bus…"
    : bridgeUp === false
      ? "Event bus down — run bun run bridge"
      : bridgeUp === null
        ? "Checking event bus…"
        : [
            "Event bus online",
            listenerCount === 0
              ? "No agents subscribed yet"
              : `${listenerCount} SSE subscriber${listenerCount === 1 ? "" : "s"}`,
            lastResult?.ok && lastResult.event?.id != null
              ? `Last publish #${lastResult.event.id}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");

  const modK = isMac() ? "⌘K" : "Ctrl+K";

  return (
    <Shell>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: `1px solid ${theme.stroke.tertiary}`,
          background: theme.bg.chrome,
        }}
      >
        <div
          style={{
            maxWidth: CONTENT_MAX,
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: theme.text.primary,
              flex: "0 0 auto",
            }}
          >
            Cursed Canvas
          </span>

          {entries.length === 0 ? (
            <Text size="small" tone="tertiary">
              Drop `.canvas.tsx` into `/canvases`
            </Text>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
                flex: "1 1 auto",
                maxWidth: 520,
              }}
            >
              <button
                type="button"
                data-testid="canvas-switcher"
                onClick={openPalette}
                title={`Open action bar (${modK})`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  maxWidth: 220,
                  border: `1px solid ${theme.stroke.secondary}`,
                  borderRadius: 8,
                  background: theme.bg.elevated,
                  color: theme.text.primary,
                  padding: "6px 10px",
                  font: "inherit",
                  fontSize: 13,
                  cursor: "pointer",
                  flex: "0 1 auto",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {canvasId === "none" ? "Select canvas…" : canvasId}
                </span>
                <KbdHint>{modK}</KbdHint>
              </button>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flex: "0 1 auto",
                  minWidth: 0,
                  // Match switcher control height (6+13+6) so text/kbd sit on one baseline.
                  minHeight: 32,
                }}
              >
                {sectionLabel ? (
                  <span
                    data-testid="section-heading"
                    title={sectionLabel}
                    style={{
                      fontSize: 13,
                      lineHeight: "20px",
                      color: theme.text.secondary,
                      whiteSpace: "nowrap",
                      flex: "0 0 auto",
                    }}
                  >
                    {sectionLabel.length > 30 ? `${sectionLabel.slice(0, 30)}…` : sectionLabel}
                  </span>
                ) : null}
                <span
                  title="PageUp / PageDown jump between h1–h3"
                  style={{
                    flex: "0 0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <KbdHint>Pg↑↓</KbdHint>
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: "auto",
              flex: "0 1 auto",
              minWidth: 0,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div
              ref={setToolbarEl}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            />
            <span
              data-testid="bridge-chip"
              title={bridgeTitle}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                lineHeight: "14px",
                fontWeight: 500,
                padding: "2px 5px",
                borderRadius: 4,
                border: `1px solid ${theme.stroke.tertiary}`,
                color: theme.text.tertiary,
                background: "transparent",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
                fontFamily: APP_FONT,
              }}
            >
              {publishing ? (
                <span
                  className="bridge-spinner"
                  style={{ color: bridgeAccent }}
                  aria-label="Publishing to event bus"
                />
              ) : (
                <span
                  aria-label={
                    bridgeUp === null
                      ? "Checking event bus"
                      : bridgeUp
                        ? "Event bus up"
                        : "Event bus down"
                  }
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: bridgeAccent,
                    flex: "0 0 auto",
                    boxShadow:
                      bridgeUp === true ? `0 0 0 2px ${theme.diff.stripAdded}33` : undefined,
                  }}
                />
              )}
              <span aria-hidden>·</span>
              <span>{bridgeCount}</span>
            </span>
          </div>
        </div>
      </header>

      <main ref={mainRef} style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <div
          ref={canvasRootRef}
          style={{
            maxWidth: CONTENT_MAX,
            margin: "0 auto",
            padding: "24px 20px",
          }}
        >
          <CanvasRuntimeProvider canvasId={canvasId} onAction={onAction}>
            {LazyCanvas ? (
              <AnnotateTool
                canvasId={canvasId}
                bridgeUp={bridgeUp}
                toolbarTarget={toolbarEl}
                onSubmit={onAnnotate}
              >
                <Suspense fallback={<Text tone="tertiary">Loading canvas…</Text>}>
                  <LazyCanvas />
                </Suspense>
              </AnnotateTool>
            ) : (
              <Text tone="secondary">Add a file under `canvases/*.canvas.tsx` and refresh.</Text>
            )}
          </CanvasRuntimeProvider>
        </div>
      </main>

      <ActionBar
        key={paletteOpen ? "open" : "closed"}
        open={paletteOpen}
        onClose={closePalette}
        items={actionItems}
      />
    </Shell>
  );
}

export default function App() {
  return (
    <CanvasRuntimeProvider canvasId="__viewer__" onAction={() => {}}>
      <Viewer />
    </CanvasRuntimeProvider>
  );
}
