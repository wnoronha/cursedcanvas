/**
 * Public API for authoring `.canvas.tsx` files via `cursor/canvas`.
 * Standalone reimplementation for browser review outside Cursor.
 */
export type { CSSProperties, RefObject } from "react";
export { useEffect, useMemo, useRef, useState } from "react";

export type { CanvasHostThemeBrand, CategoryPalette, ChartPalette, Color } from "./tokens";
export {
  categoryPaletteDark,
  categoryPaletteLight,
  colorPalette,
  usageColorSequence,
} from "./tokens";

export type {
  BarChartProps,
  ChartDataPoint,
  ChartReferenceLine,
  ChartSeries,
  ChartTone,
  LineChartProps,
  PieChartProps,
} from "./charts";
export { BarChart, LineChart, PieChart } from "./charts";

export type { CollapsibleSectionProps } from "./collapsible";
export { CollapsibleSection } from "./collapsible";

export type {
  DAGLayoutEdge,
  DAGLayoutNode,
  DAGLayoutOptions,
  DAGLayoutRank,
  DAGLayoutResult,
} from "./dag";
export { computeDAGLayout } from "./dag";

export type { DiagramProps, DiagramTheme } from "./diagram";
export { Diagram, Mermaid } from "./diagram";

export type { DiffLineData, DiffLineType, DiffStatsProps, DiffViewProps } from "./diff";
export { DiffStats, DiffView } from "./diff";

export type {
  CheckboxProps,
  IconButtonProps,
  SelectOption,
  SelectProps,
  TextAreaProps,
  TextInputProps,
  ToggleProps,
} from "./forms";
export { Checkbox, IconButton, Select, TextArea, TextInput, Toggle } from "./forms";

export type { CanvasAction, CanvasHostTheme, SetCanvasState } from "./hostTheme";
export { resolveTheme } from "./hostTheme";
export { CanvasRuntimeProvider } from "./runtime";
export { useCanvasAction, useCanvasState, useHostTheme } from "./hooks";

export type { SwatchProps } from "./swatch";
export { Swatch } from "./swatch";

export type { CanvasPalette, CanvasTokens } from "./theme";
export {
  canvasPaletteDark,
  canvasPaletteGrokDark,
  canvasPaletteGrokLight,
  canvasPaletteLight,
  canvasTokens,
  canvasTokensLight,
} from "./theme";

export type { TodoItem, TodoListCardProps, TodoListProps, TodoStatus } from "./todo";
export { TodoList, TodoListCard } from "./todo";

export type {
  ButtonProps,
  CalloutProps,
  CalloutTone,
  CardBodyProps,
  CardHeaderProps,
  CardProps,
  CardSize,
  CardVariant,
  CodeProps,
  DividerProps,
  GridProps,
  H1Props,
  H2Props,
  H3Props,
  LinkProps,
  PillProps,
  PillSize,
  PillTone,
  RowProps,
  StackProps,
  StatProps,
  StatTone,
  TableColumnAlign,
  TableProps,
  TableRowTone,
  TextProps,
  TextWeight,
} from "./ui";
export {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
} from "./ui";

export { mergeStyle } from "./style";

export type { UsageBarProps, UsageBarSegment } from "./usage-bar";
export { UsageBar } from "./usage-bar";
