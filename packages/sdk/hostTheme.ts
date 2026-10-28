import {
  buildHostTokens,
  chartThemeForBrand,
  type CanvasHostThemeBrand,
  type CanvasPalette,
  type CanvasTokens,
  type ChartPalette,
} from "./tokens";
import {
  canvasRadiusForBrand,
  canvasTypographyForBrand,
  type CanvasRadius,
  type CanvasTypography,
} from "./theme";

export interface CanvasHostTheme extends CanvasTokens {
  readonly kind: string;
  readonly brand: CanvasHostThemeBrand;
  readonly tokens: CanvasTokens;
  readonly palette: CanvasPalette;
  readonly radius: CanvasRadius;
  readonly typography: CanvasTypography;
  readonly chart: {
    readonly palette: ChartPalette;
    readonly sequence: readonly string[];
  };
}

export type CanvasAction =
  | { type: "openAgent"; agentId: string }
  | { type: "newComposerChat"; userPrompt?: string }
  | {
      type: "openFile";
      path: string;
      selection?: {
        startLineNumber?: number;
        startColumn?: number;
        endLineNumber?: number;
        endColumn?: number;
      };
    };

export type SetCanvasState<T> = (action: T | ((prev: T) => T)) => void;

type ThemeBridge = {
  kind?: unknown;
  brand?: unknown;
  primary?: unknown;
  editorBackground?: unknown;
  editorForeground?: unknown;
};

function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readThemeBridge(): ThemeBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { __cursorCanvas?: { state?: { theme?: ThemeBridge } } })
    .__cursorCanvas?.state?.theme;
}

function themeFromParts(kind: string, raw: ThemeBridge | undefined): CanvasHostTheme {
  const { tokens, palette, brand } = buildHostTokens(kind, {
    brand: raw?.brand as CanvasHostThemeBrand | undefined,
    primary: typeof raw?.primary === "string" ? raw.primary : undefined,
    editorBackground: typeof raw?.editorBackground === "string" ? raw.editorBackground : undefined,
    editorForeground: typeof raw?.editorForeground === "string" ? raw.editorForeground : undefined,
  });
  const chart = chartThemeForBrand(brand);
  return {
    ...tokens,
    kind,
    brand,
    tokens,
    palette,
    radius: canvasRadiusForBrand(brand),
    typography: canvasTypographyForBrand(brand),
    chart,
  };
}

export function resolveTheme(raw: ThemeBridge | undefined): CanvasHostTheme {
  const kind = typeof raw?.kind === "string" ? raw.kind : prefersDark() ? "dark" : "light";
  return themeFromParts(kind, raw);
}

export function resolveThemeFromHost(): CanvasHostTheme {
  return resolveTheme(readThemeBridge());
}
