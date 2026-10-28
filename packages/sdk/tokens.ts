export type CanvasHostThemeBrand = "cursor" | "grok";

export type Color =
  | "gray"
  | "purple"
  | "green"
  | "yellow"
  | "cyan"
  | "pink"
  | "blue"
  | "orange"
  | "red";

export type CategoryPalette = Readonly<Record<Color, string>>;

export interface CanvasPalette {
  readonly foreground: string;
  readonly foregroundSecondary: string;
  readonly foregroundTertiary: string;
  readonly foregroundQuaternary: string;
  readonly editor: string;
  readonly chrome: string;
  readonly sidebar: string;
  readonly elevated: string;
  readonly fillPrimary: string;
  readonly fillSecondary: string;
  readonly fillTertiary: string;
  readonly fillQuaternary: string;
  readonly strokePrimary: string;
  readonly strokeSecondary: string;
  readonly strokeTertiary: string;
  readonly strokeFocused: string;
  readonly accent: string;
  readonly buttonBackground: string;
  readonly buttonForeground: string;
  readonly buttonHoverBackground: string;
  readonly link: string;
  readonly diffInsertedLine: string;
  readonly diffRemovedLine: string;
  readonly diffStripAdded: string;
  readonly diffStripRemoved: string;
}

export const canvasPaletteDark: CanvasPalette = {
  foreground: "#F0F0F0",
  foregroundSecondary: "#F0F0F0BD",
  foregroundTertiary: "#F0F0F099",
  foregroundQuaternary: "#F0F0F05C",
  editor: "#181818",
  chrome: "#141414",
  sidebar: "#141414",
  elevated: "#181818",
  fillPrimary: "#F0F0F033",
  fillSecondary: "#F0F0F024",
  fillTertiary: "#F0F0F014",
  fillQuaternary: "#F0F0F00F",
  strokePrimary: "#F0F0F033",
  strokeSecondary: "#F0F0F01F",
  strokeTertiary: "#F0F0F014",
  strokeFocused: "#81A1C1",
  accent: "#81A1C1",
  buttonBackground: "#81A1C1",
  buttonForeground: "#181818",
  buttonHoverBackground: "#9BB4D0",
  link: "#81A1C1",
  diffInsertedLine: "#1F8A6526",
  diffRemovedLine: "#C0484826",
  diffStripAdded: "#1F8A65A0",
  diffStripRemoved: "#C04848A0",
};

export const canvasPaletteLight: CanvasPalette = {
  foreground: "#141414",
  foregroundSecondary: "#141414BD",
  foregroundTertiary: "#14141499",
  foregroundQuaternary: "#1414145C",
  editor: "#FCFCFC",
  chrome: "#F5F5F5",
  sidebar: "#F5F5F5",
  elevated: "#FFFFFF",
  fillPrimary: "#14141433",
  fillSecondary: "#14141424",
  fillTertiary: "#14141414",
  fillQuaternary: "#1414140F",
  strokePrimary: "#14141433",
  strokeSecondary: "#1414141F",
  strokeTertiary: "#14141414",
  strokeFocused: "#2E79B5",
  accent: "#2E79B5",
  buttonBackground: "#2E79B5",
  buttonForeground: "#FFFFFF",
  buttonHoverBackground: "#256899",
  link: "#2E79B5",
  diffInsertedLine: "#1F8A6520",
  diffRemovedLine: "#C0484820",
  diffStripAdded: "#1F8A65A0",
  diffStripRemoved: "#C04848A0",
};

export const canvasPaletteGrokDark = canvasPaletteDark;
export const canvasPaletteGrokLight = canvasPaletteLight;

export const categoryPaletteDark: CategoryPalette = {
  gray: "#A0A0A0",
  purple: "#A78BFA",
  green: "#4ADE80",
  yellow: "#FACC15",
  cyan: "#22D3EE",
  pink: "#F472B6",
  blue: "#60A5FA",
  orange: "#FB923C",
  red: "#F87171",
};

export const categoryPaletteLight: CategoryPalette = {
  gray: "#6B7280",
  purple: "#7C3AED",
  green: "#16A34A",
  yellow: "#CA8A04",
  cyan: "#0891B2",
  pink: "#DB2777",
  blue: "#2563EB",
  orange: "#EA580C",
  red: "#DC2626",
};

export const categoryPaletteGrokDark = categoryPaletteDark;
export const categoryPaletteGrokLight = categoryPaletteLight;
export const colorPalette = categoryPaletteDark;

export const usageColorSequence: readonly Color[] = [
  "gray",
  "purple",
  "green",
  "yellow",
  "cyan",
  "pink",
  "blue",
  "orange",
  "red",
];

export const chartPalette = {
  green: "#1F8A65E8",
  darkGreen: "#0D855AE0",
  lightGreen: "#52B896E0",
  mintGreen: "#7DCAB0E0",
  blue: "#2E79B5E0",
  lightBlue: "#70B0D8E0",
  indigo: "#5A6CC0F0",
  lightIndigo: "#9AAADCE0",
  purple: "#7B64B8F0",
  lightPurple: "#AA98D8E0",
  warmPink: "#C85898E0",
  lightPink: "#E8A0C4E0",
  brightOrange: "#F0A040E0",
  deepOrange: "#C06028E0",
  goldenYellow: "#E8C030E0",
  darkAmber: "#C04848E0",
  warmPeach: "#F0A088E0",
  vibrantTeal: "#2A9A8AE0",
  muted: "#8888A8E0",
  neutralLine: "#888899D0",
} as const;

export type ChartPalette = { readonly [K in keyof typeof chartPalette]: string };

export const chartPaletteGrok = chartPalette;

export const chartColorSequence: readonly string[] = [
  chartPalette.blue,
  chartPalette.brightOrange,
  chartPalette.purple,
  chartPalette.green,
  chartPalette.warmPink,
  chartPalette.goldenYellow,
  chartPalette.indigo,
  chartPalette.vibrantTeal,
  chartPalette.deepOrange,
  chartPalette.lightBlue,
];

export const chartColorSequenceGrok = chartColorSequence;

export interface CanvasTokens {
  bg: {
    editor: string;
    chrome: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    link: string;
    onAccent: string;
  };
  stroke: {
    primary: string;
    secondary: string;
    tertiary: string;
    focused: string;
  };
  fill: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  accent: {
    primary: string;
    control: string;
    controlHover: string;
  };
  diff: {
    insertedLine: string;
    removedLine: string;
    stripAdded: string;
    stripRemoved: string;
  };
  category: CategoryPalette;
}

function tokensFromPalette(palette: CanvasPalette, category: CategoryPalette): CanvasTokens {
  return {
    bg: {
      editor: palette.editor,
      chrome: palette.chrome,
      elevated: palette.elevated,
    },
    text: {
      primary: palette.foreground,
      secondary: palette.foregroundSecondary,
      tertiary: palette.foregroundTertiary,
      quaternary: palette.foregroundQuaternary,
      link: palette.link,
      onAccent: palette.buttonForeground,
    },
    stroke: {
      primary: palette.strokePrimary,
      secondary: palette.strokeSecondary,
      tertiary: palette.strokeTertiary,
      focused: palette.strokeFocused,
    },
    fill: {
      primary: palette.fillPrimary,
      secondary: palette.fillSecondary,
      tertiary: palette.fillTertiary,
      quaternary: palette.fillQuaternary,
    },
    accent: {
      primary: palette.accent,
      control: palette.buttonBackground,
      controlHover: palette.buttonHoverBackground,
    },
    diff: {
      insertedLine: palette.diffInsertedLine,
      removedLine: palette.diffRemovedLine,
      stripAdded: palette.diffStripAdded,
      stripRemoved: palette.diffStripRemoved,
    },
    category,
  };
}

export const canvasTokens = tokensFromPalette(canvasPaletteDark, categoryPaletteDark);
export const canvasTokensLight = tokensFromPalette(canvasPaletteLight, categoryPaletteLight);

export function parseHexColor(value: string): { r: number; g: number; b: number } | undefined {
  const raw = value.trim();
  if (!raw.startsWith("#")) return undefined;
  let hex = raw.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (hex.length === 8) {
    hex = hex.slice(0, 6);
  } else if (hex.length !== 6) {
    return undefined;
  }
  const n = Number.parseInt(hex, 16);
  if (Number.isNaN(n)) return undefined;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function parseCanvasHostThemeBrand(value: unknown): CanvasHostThemeBrand {
  return value === "grok" ? "grok" : "cursor";
}

export interface CanvasHostThemeOverrides {
  readonly brand?: CanvasHostThemeBrand;
  readonly primary?: string;
  readonly editorBackground?: string;
  readonly editorForeground?: string;
}

export function applyWorkbenchSurfaces(
  palette: CanvasPalette,
  surfaces: Pick<CanvasHostThemeOverrides, "editorBackground" | "editorForeground">,
): CanvasPalette {
  return {
    ...palette,
    editor: surfaces.editorBackground ?? palette.editor,
    elevated: surfaces.editorBackground ?? palette.elevated,
    foreground: surfaces.editorForeground ?? palette.foreground,
  };
}

export function applyPrimaryColor(palette: CanvasPalette, primary: string): CanvasPalette {
  const rgb = parseHexColor(primary);
  if (!rgb) return palette;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const onAccent = luminance > 0.55 ? "#141414" : "#FFFFFF";
  return {
    ...palette,
    accent: primary,
    buttonBackground: primary,
    buttonHoverBackground: primary,
    buttonForeground: onAccent,
    link: primary,
    strokeFocused: primary,
  };
}

export function buildHostTokens(
  kind: string,
  overrides?: CanvasHostThemeOverrides,
): {
  tokens: CanvasTokens;
  palette: CanvasPalette;
  brand: CanvasHostThemeBrand;
} {
  const brand = parseCanvasHostThemeBrand(overrides?.brand);
  const light = kind === "light" || kind === "hc-light";
  let palette = light ? canvasPaletteLight : canvasPaletteDark;
  const category = light ? categoryPaletteLight : categoryPaletteDark;
  palette = applyWorkbenchSurfaces(palette, {
    editorBackground: overrides?.editorBackground,
    editorForeground: overrides?.editorForeground,
  });
  if (brand !== "grok" && overrides?.primary) {
    palette = applyPrimaryColor(palette, overrides.primary);
  }
  return {
    tokens: tokensFromPalette(palette, category),
    palette,
    brand,
  };
}

export function chartThemeForBrand(brand: CanvasHostThemeBrand): {
  palette: ChartPalette;
  sequence: readonly string[];
} {
  if (brand === "grok") {
    return { palette: chartPaletteGrok, sequence: chartColorSequenceGrok };
  }
  return { palette: chartPalette, sequence: chartColorSequence };
}

export const toneColors = {
  success: chartPalette.green,
  danger: chartPalette.darkAmber,
  warning: chartPalette.brightOrange,
  info: chartPalette.blue,
  neutral: chartPalette.muted,
} as const;
