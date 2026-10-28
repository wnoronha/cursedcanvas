import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from "react";
import { useHostTheme, type CanvasHostTheme } from "./hooks";
import { mergeStyle } from "./style";

export type DiagramTheme = "auto" | "light" | "dark" | "host";

export type DiagramProps = {
  /** Mermaid-compatible source. Pele is a drop-in renderer (https://pele.run). */
  children: string;
  /** Optional accessible title shown above the diagram. */
  title?: string;
  /** Caption / source note under the diagram. */
  caption?: string;
  style?: CSSProperties;
  /**
   * Pele zoom controls (− / Fit / +).
   * - `true` (default): always show (same as pele.run + Fit)
   * - `"auto"`: enable zoom when scaled to fit; still show Fit controls
   * - `false`: disable
   */
  zoom?: boolean | "auto";
  /**
   * How Pele sizes the diagram (https://pele.run/api#narrow-screens).
   * - `"natural"` (default): full auto-layout, CSS-scaled to width — no C4 squish
   * - `"reflow"`: re-pack graph to the container width (Pele’s mount default)
   */
  layout?: "natural" | "reflow";
  /**
   * Color scheme for Pele CSS variables.
   * - `auto` (default): dark when the host theme is dark, else light
   * - `light` / `dark`: Pele’s documented palettes (https://pele.run/theming)
   * - `host`: map solid Cursor host palette colors into `--pele-*`
   */
  theme?: DiagramTheme;
};

type PeleModule = typeof import("pele");
type PeleZoom = NonNullable<ReturnType<PeleModule["mount"]>["zoom"]>;

/** Pele button zoom step (matches pele’s control bar). */
const ZOOM_STEP = 1.25 * 1.25;

/** Pele documented light sheet (https://pele.run/theming). */
const PELE_LIGHT: CSSProperties = {
  background: "#ffffff",
  ["--pele-bg" as string]: "#ffffff",
  ["--pele-fg" as string]: "#1f1f1f",
  ["--pele-fg-on-light" as string]: "#1f1f1f",
  ["--pele-fg-on-dark" as string]: "#ffffff",
  ["--pele-muted" as string]: "#6e6e6e",
  ["--pele-line" as string]: "#1f1f1f",
  ["--pele-surface" as string]: "#f3f3f3",
  ["--pele-surface-alt" as string]: "#e6e6e6",
  ["--pele-border" as string]: "#8a8a8a",
  ["--pele-accent" as string]: "#5b7bd5",
  ["--pele-critical" as string]: "#e45756",
  ["--pele-error" as string]: "#e45756",
  ["--pele-radius" as string]: "4px",
};

/** Pele documented dark sheet (https://pele.run/theming). */
const PELE_DARK: CSSProperties = {
  background: "#100f0f",
  ["--pele-bg" as string]: "#100f0f",
  ["--pele-fg" as string]: "#cecdc3",
  ["--pele-fg-on-light" as string]: "#1f1f1f",
  ["--pele-fg-on-dark" as string]: "#ffffff",
  ["--pele-muted" as string]: "#878580",
  ["--pele-line" as string]: "#cecdc3",
  ["--pele-surface" as string]: "#1c1b1a",
  ["--pele-surface-alt" as string]: "#282726",
  ["--pele-border" as string]: "#403e3c",
  ["--pele-accent" as string]: "#4385be",
  ["--pele-critical" as string]: "#d14d41",
  ["--pele-error" as string]: "#d14d41",
  ["--pele-radius" as string]: "4px",
};

function hostPeleVars(theme: CanvasHostTheme): CSSProperties {
  const p = theme.palette;
  // Use solid palette hexes — semantic fill/stroke tokens are alpha-blended
  // and wash out Pele surfaces (that was the earlier “looks bad” bug).
  return {
    background: p.editor,
    ["--pele-bg" as string]: p.editor,
    ["--pele-fg" as string]: p.foreground,
    ["--pele-fg-on-light" as string]: "#1f1f1f",
    ["--pele-fg-on-dark" as string]: "#ffffff",
    ["--pele-muted" as string]: p.foregroundTertiary,
    ["--pele-line" as string]: p.foregroundSecondary,
    ["--pele-surface" as string]: p.chrome,
    ["--pele-surface-alt" as string]: p.sidebar,
    ["--pele-border" as string]: p.foregroundQuaternary,
    ["--pele-accent" as string]: p.accent,
    ["--pele-critical" as string]: "#d14d41",
    ["--pele-error" as string]: "#d14d41",
    ["--pele-radius" as string]: `${theme.radius.md}px`,
  };
}

function resolveSheet(mode: DiagramTheme, host: CanvasHostTheme): CSSProperties {
  if (mode === "light") return PELE_LIGHT;
  if (mode === "dark") return PELE_DARK;
  if (mode === "host") return hostPeleVars(host);
  // auto — follow host kind (prefers-color-scheme when no IDE bridge)
  if (host.kind === "light" || host.kind === "hc-light") return PELE_LIGHT;
  return PELE_DARK;
}

function mountZoomOption(zoom: boolean | "auto"): false | { always?: boolean; controls: false } {
  if (zoom === false) return false;
  // Own − / Fit / + chrome; keep Pele pan/pinch/wheel.
  return { always: zoom === true, controls: false };
}

/**
 * Mermaid diagram rendered with [Pele](https://pele.run).
 *
 * Theme via CSS variables (`theme` prop). Dark mode works — Pele does not
 * re-render when variables change; we remount when the resolved sheet changes.
 */
export function Diagram({
  children,
  title,
  caption,
  style,
  zoom = true,
  layout = "natural",
  theme: themeMode = "auto",
}: DiagramProps): JSX.Element {
  const hostTheme = useHostTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const zoomApi = useRef<PeleZoom | undefined>(undefined);
  const [zoomReady, setZoomReady] = useState(false);
  const reactId = useId().replace(/:/g, "");
  const sheet = useMemo(() => resolveSheet(themeMode, hostTheme), [themeMode, hostTheme]);
  const showZoom = zoom !== false;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const source = typeof children === "string" ? children.trim() : "";
    let cancelled = false;
    let destroy: (() => void) | undefined;

    void (async () => {
      const pele: PeleModule = await import("pele");
      if (cancelled || !hostRef.current) return;
      try {
        // mount() defaults to container maxWidth, which re-packs C4 into a
        // narrow column (“squish”). Natural = full layout + CSS max-width:100%
        // (responsive) so Fit / zoom still work; skip autoDirection flip.
        const natural = layout === "natural";
        const diagram = pele.mount(hostRef.current, source, {
          zoom: mountZoomOption(zoom),
          idPrefix: `c-${reactId}`,
          responsive: true,
          autoDirection: !natural,
          ...(natural ? { maxWidth: Number.MAX_SAFE_INTEGER } : null),
        });
        destroy = () => diagram.destroy();
        zoomApi.current = diagram.zoom;
        if (!cancelled) setZoomReady(Boolean(diagram.zoom));
      } catch (error) {
        zoomApi.current = undefined;
        if (!cancelled) setZoomReady(false);
        const message =
          error instanceof pele.PeleError
            ? error.message
            : error instanceof Error
              ? error.message
              : String(error);
        hostRef.current.textContent = message;
      }
    })();

    return () => {
      cancelled = true;
      zoomApi.current = undefined;
      setZoomReady(false);
      destroy?.();
    };
  }, [children, zoom, layout, reactId, sheet]);

  const zoomBy = useCallback((factor: number) => {
    zoomApi.current?.zoomBy(factor);
  }, []);

  const zoomFit = useCallback(() => {
    zoomApi.current?.reset();
  }, []);

  const controlStyle: CSSProperties = {
    appearance: "none",
    display: "grid",
    placeItems: "center",
    minWidth: 28,
    height: 24,
    margin: 0,
    padding: "0 6px",
    border: 0,
    borderRadius: "calc(var(--pele-radius, 4px) - 1px)",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    fontSize: 12,
    fontWeight: 590,
    lineHeight: 1,
    cursor: "pointer",
  };

  return (
    <figure
      style={mergeStyle(
        {
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        },
        style,
      )}
    >
      {title ? (
        <figcaption
          style={{
            fontSize: 13,
            fontWeight: 590,
            color: hostTheme.text.primary,
          }}
        >
          {title}
        </figcaption>
      ) : null}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: 48,
          padding: 16,
          borderRadius: 8,
          overflow: "auto",
          ...sheet,
        }}
      >
        <div ref={hostRef} className="pele" style={{ width: "100%" }} />
        {showZoom && zoomReady ? (
          <div
            className="pele-zoom"
            role="group"
            aria-label="Diagram zoom"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              padding: 2,
              border: "1px solid var(--pele-border, #8a8a8a)",
              borderRadius: "var(--pele-radius, 4px)",
              background: "var(--pele-bg, #fff)",
              color: "var(--pele-fg, #1f1f1f)",
              lineHeight: 0,
            }}
          >
            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              style={controlStyle}
              onClick={() => zoomBy(1 / ZOOM_STEP)}
            >
              −
            </button>
            <button
              type="button"
              title="Fit to width"
              aria-label="Fit to width"
              style={controlStyle}
              onClick={zoomFit}
            >
              Fit
            </button>
            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              style={controlStyle}
              onClick={() => zoomBy(ZOOM_STEP)}
            >
              +
            </button>
          </div>
        ) : null}
      </div>
      {caption ? (
        <figcaption style={{ fontSize: 12, color: hostTheme.text.tertiary, margin: 0 }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Alias — Pele accepts Mermaid syntax as a drop-in. */
export const Mermaid = Diagram;
