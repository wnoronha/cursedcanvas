import { useEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from "react";
import { useHostTheme } from "./hooks";
import { toneColors } from "./tokens";
import { mergeStyle } from "./style";

/** Match Cursor: charts fill the host pane width (no fixed maxWidth). */
function useContainerWidth(min = 280): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(min);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const next = Math.max(min, Math.floor(el.getBoundingClientRect().width));
      setWidth((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [min]);

  return [ref, width];
}

export type ChartTone = "success" | "danger" | "warning" | "info" | "neutral";

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartSeries = {
  name: string;
  data: number[];
  tone?: ChartTone;
};

export type ChartReferenceLine = {
  value: number;
  label?: string;
  tone?: ChartTone;
};

type ValueAxisProps = {
  beginAtZero?: boolean;
  yMin?: number;
  yMax?: number;
  referenceLines?: ChartReferenceLine[];
};

export type BarChartProps = ValueAxisProps & {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  stacked?: boolean;
  horizontal?: boolean;
  normalized?: boolean;
  valueSuffix?: string;
  valuePrefix?: string;
  showValues?: boolean;
  style?: CSSProperties;
};

export type LineChartProps = ValueAxisProps & {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  fill?: boolean;
  valueSuffix?: string;
  valuePrefix?: string;
  showValues?: boolean;
  showHoverGuide?: boolean;
  style?: CSSProperties;
};

export type PieChartProps = {
  data: Array<ChartDataPoint & { tone?: ChartTone }>;
  size?: number;
  donut?: boolean;
  style?: CSSProperties;
};

function seriesColor(series: ChartSeries, index: number, sequence: readonly string[]): string {
  if (series.tone) return toneColors[series.tone];
  return sequence[index % sequence.length]!;
}

function domain(
  values: number[],
  beginAtZero: boolean,
  yMin?: number,
  yMax?: number,
  refs?: ChartReferenceLine[],
): [number, number] {
  const all = [...values, ...(refs?.map((r) => r.value) ?? [])];
  let min = yMin ?? Math.min(...all, beginAtZero ? 0 : Infinity);
  let max = yMax ?? Math.max(...all, beginAtZero ? 0 : -Infinity);
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 1;
  if (min === max) max = min + 1;
  if (beginAtZero && yMin === undefined) min = Math.min(0, min);
  return [min, max];
}

function Legend({ items }: { items: Array<{ name: string; color: string }> }): JSX.Element | null {
  const theme = useHostTheme();
  if (items.length < 2) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 8,
        fontSize: 11,
        color: theme.text.secondary,
      }}
    >
      {items.map((item) => (
        <span key={item.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: item.color,
            }}
          />
          {item.name}
        </span>
      ))}
    </div>
  );
}

export function BarChart({
  categories,
  series,
  height = 220,
  stacked,
  horizontal,
  normalized,
  valueSuffix = "",
  valuePrefix = "",
  showValues,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines,
  style,
}: BarChartProps): JSX.Element {
  const theme = useHostTheme();
  const doStack = Boolean(stacked || normalized);
  const autoLabels = showValues ?? (series.length === 1 && categories.length <= 8 && !doStack);

  const colors = series.map((s, i) => seriesColor(s, i, theme.chart.sequence));

  const stackedTotals = categories.map((_, ci) =>
    series.reduce((sum, s) => sum + (s.data[ci] ?? 0), 0),
  );

  const flatValues = doStack
    ? normalized
      ? [0, 100]
      : stackedTotals
    : series.flatMap((s) => s.data);

  const [min, max] = normalized
    ? [0, 100]
    : domain(flatValues, beginAtZero || doStack, yMin, yMax, referenceLines);

  const [wrapRef, w] = useContainerWidth();
  const pad = { top: 16, right: 16, bottom: 36, left: horizontal ? 72 : 40 };
  const h = height;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const scale = (v: number) => ((v - min) / (max - min)) * (horizontal ? plotW : plotH);

  const bars: JSX.Element[] = [];
  categories.forEach((cat, ci) => {
    let stackPos = 0;
    const groupCount = doStack ? 1 : series.length;
    const band = (horizontal ? plotH : plotW) / categories.length;
    const barSize = Math.max(4, (band * 0.7) / groupCount);

    series.forEach((s, si) => {
      const raw = s.data[ci] ?? 0;
      const val = normalized
        ? stackedTotals[ci]! > 0
          ? (raw / stackedTotals[ci]!) * 100
          : 0
        : raw;
      const len = scale(val) - scale(Math.min(min, 0));
      const color =
        series.length === 1 && !s.tone
          ? theme.chart.sequence[ci % theme.chart.sequence.length]!
          : colors[si]!;

      if (horizontal) {
        const y = pad.top + ci * band + band / 2 - barSize / 2 + (doStack ? 0 : si * barSize);
        const x = pad.left + scale(Math.min(min, 0)) + (doStack ? scale(stackPos) - scale(0) : 0);
        bars.push(
          <rect
            key={`${ci}-${si}`}
            x={x}
            y={y}
            width={Math.max(0, len)}
            height={barSize}
            fill={color}
            rx={2}
          />,
        );
        if (autoLabels) {
          bars.push(
            <text
              key={`l-${ci}-${si}`}
              x={x + Math.max(0, len) + 4}
              y={y + barSize / 2}
              fill={theme.text.tertiary}
              fontSize={10}
              dominantBaseline="middle"
            >
              {valuePrefix}
              {raw}
              {valueSuffix}
            </text>,
          );
        }
      } else {
        const x =
          pad.left +
          ci * band +
          band / 2 -
          (barSize * groupCount) / 2 +
          (doStack ? 0 : si * barSize);
        const base = pad.top + plotH - scale(Math.min(min, 0));
        const y = doStack ? base - (scale(stackPos + val) - scale(0)) : base - Math.max(0, len);
        bars.push(
          <rect
            key={`${ci}-${si}`}
            x={x}
            y={y}
            width={barSize}
            height={Math.max(0, len)}
            fill={color}
            rx={2}
          />,
        );
        if (autoLabels) {
          bars.push(
            <text
              key={`l-${ci}-${si}`}
              x={x + barSize / 2}
              y={y - 4}
              fill={theme.text.tertiary}
              fontSize={10}
              textAnchor="middle"
            >
              {valuePrefix}
              {raw}
              {valueSuffix}
            </text>,
          );
        }
      }
      if (doStack) stackPos += val;
    });

    if (!horizontal) {
      bars.push(
        <text
          key={`c-${ci}`}
          x={pad.left + ci * band + band / 2}
          y={h - 12}
          fill={theme.text.tertiary}
          fontSize={10}
          textAnchor="middle"
        >
          {cat}
        </text>,
      );
    } else {
      bars.push(
        <text
          key={`c-${ci}`}
          x={pad.left - 8}
          y={pad.top + ci * band + band / 2}
          fill={theme.text.tertiary}
          fontSize={10}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {cat}
        </text>,
      );
    }
  });

  return (
    <div ref={wrapRef} style={mergeStyle({ width: "100%" }, style)}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} role="img">
        <line
          x1={pad.left}
          y1={pad.top + plotH}
          x2={pad.left + plotW}
          y2={pad.top + plotH}
          stroke={theme.stroke.tertiary}
        />
        <line
          x1={pad.left}
          y1={pad.top}
          x2={pad.left}
          y2={pad.top + plotH}
          stroke={theme.stroke.tertiary}
        />
        {referenceLines?.map((ref, i) => {
          const pos = horizontal ? pad.left + scale(ref.value) : pad.top + plotH - scale(ref.value);
          const color = ref.tone ? toneColors[ref.tone] : theme.chart.palette.neutralLine;
          return horizontal ? (
            <g key={i}>
              <line
                x1={pos}
                y1={pad.top}
                x2={pos}
                y2={pad.top + plotH}
                stroke={color}
                strokeDasharray="4 3"
              />
              {ref.label ? (
                <text x={pos + 4} y={pad.top + 10} fill={color} fontSize={10}>
                  {ref.label}
                </text>
              ) : null}
            </g>
          ) : (
            <g key={i}>
              <line
                x1={pad.left}
                y1={pos}
                x2={pad.left + plotW}
                y2={pos}
                stroke={color}
                strokeDasharray="4 3"
              />
              {ref.label ? (
                <text
                  x={pad.left + plotW - 4}
                  y={pos - 4}
                  fill={color}
                  fontSize={10}
                  textAnchor="end"
                >
                  {ref.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {bars}
      </svg>
      <Legend items={series.map((s, i) => ({ name: s.name, color: colors[i]! }))} />
    </div>
  );
}

export function LineChart({
  categories,
  series,
  height = 220,
  fill,
  valueSuffix = "",
  valuePrefix = "",
  showValues,
  showHoverGuide = true,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines,
  style,
}: LineChartProps): JSX.Element {
  const theme = useHostTheme();
  const [hover, setHover] = useState<number | null>(null);
  const colors = series.map((s, i) => seriesColor(s, i, theme.chart.sequence));
  const [min, max] = domain(
    series.flatMap((s) => s.data),
    beginAtZero,
    yMin,
    yMax,
    referenceLines,
  );
  const [wrapRef, w] = useContainerWidth();
  const pad = { top: 16, right: 16, bottom: 36, left: 40 };
  const h = height;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const xAt = (i: number) =>
    pad.left + (categories.length <= 1 ? plotW / 2 : (i / (categories.length - 1)) * plotW);
  const yAt = (v: number) => pad.top + plotH - ((v - min) / (max - min)) * plotH;

  const paths = useMemo(
    () =>
      series.map((s) =>
        s.data.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`).join(" "),
      ),
    // recreate when plot geometry changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, categories, min, max, height, w],
  );

  return (
    <div ref={wrapRef} style={mergeStyle({ width: "100%" }, style)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={height}
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        <line
          x1={pad.left}
          y1={pad.top + plotH}
          x2={pad.left + plotW}
          y2={pad.top + plotH}
          stroke={theme.stroke.tertiary}
        />
        {series.map((s, si) => (
          <g key={s.name}>
            {fill ? (
              <path
                d={`${paths[si]} L ${xAt(categories.length - 1)} ${pad.top + plotH} L ${xAt(0)} ${pad.top + plotH} Z`}
                fill={colors[si]}
                opacity={0.15}
              />
            ) : null}
            <path d={paths[si]} fill="none" stroke={colors[si]} strokeWidth={2} />
            {s.data.map((v, i) => (
              <circle
                key={i}
                cx={xAt(i)}
                cy={yAt(v)}
                r={3}
                fill={colors[si]}
                onMouseEnter={() => setHover(i)}
              />
            ))}
            {showValues &&
              categories.length <= 20 &&
              s.data.map((v, i) => (
                <text
                  key={`v-${i}`}
                  x={xAt(i)}
                  y={yAt(v) - 8}
                  fill={theme.text.tertiary}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {valuePrefix}
                  {v}
                  {valueSuffix}
                </text>
              ))}
          </g>
        ))}
        {categories.map((cat, i) => (
          <text
            key={cat + i}
            x={xAt(i)}
            y={h - 12}
            fill={theme.text.tertiary}
            fontSize={10}
            textAnchor="middle"
          >
            {cat}
          </text>
        ))}
        {showHoverGuide && hover != null ? (
          <line
            x1={xAt(hover)}
            y1={pad.top}
            x2={xAt(hover)}
            y2={pad.top + plotH}
            stroke={theme.stroke.secondary}
            strokeDasharray="3 3"
          />
        ) : null}
        {referenceLines?.map((ref, i) => {
          const y = yAt(ref.value);
          const color = ref.tone ? toneColors[ref.tone] : theme.chart.palette.neutralLine;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + plotW}
                y2={y}
                stroke={color}
                strokeDasharray="4 3"
              />
              {ref.label ? (
                <text
                  x={pad.left + plotW - 4}
                  y={y - 4}
                  fill={color}
                  fontSize={10}
                  textAnchor="end"
                >
                  {ref.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover != null ? (
        <div style={{ fontSize: 11, color: theme.text.secondary }}>
          {categories[hover]}:{" "}
          {series.map((s) => `${s.name} ${valuePrefix}${s.data[hover]}${valueSuffix}`).join(" · ")}
        </div>
      ) : null}
      <Legend items={series.map((s, i) => ({ name: s.name, color: colors[i]! }))} />
    </div>
  );
}

export function PieChart({ data, size, donut, style }: PieChartProps): JSX.Element {
  const theme = useHostTheme();
  const [wrapRef, w] = useContainerWidth(160);
  // Explicit `size` wins; otherwise fill the host cell (capped so a lone pie
  // doesn't become a viewport-tall circle).
  const diameter = size ?? Math.max(160, Math.min(w, 420));
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const cx = diameter / 2;
  const cy = diameter / 2;
  const r = diameter / 2 - 8;
  const inner = donut ? r * 0.55 : 0;

  const slices = data.map((d, i) => {
    const frac = Math.max(0, d.value) / total;
    const start =
      -Math.PI / 2 +
      data
        .slice(0, i)
        .reduce((sum, row) => sum + (Math.max(0, row.value) / total) * Math.PI * 2, 0);
    const end = start + frac * Math.PI * 2;
    const color = d.tone
      ? toneColors[d.tone]
      : theme.chart.sequence[i % theme.chart.sequence.length]!;
    const mid = (start + end) / 2;
    const explode = active === i ? 6 : 0;
    const ox = Math.cos(mid) * explode;
    const oy = Math.sin(mid) * explode;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + ox + Math.cos(start) * r;
    const y1 = cy + oy + Math.sin(start) * r;
    const x2 = cx + ox + Math.cos(end) * r;
    const y2 = cy + oy + Math.sin(end) * r;
    const ix1 = cx + ox + Math.cos(end) * inner;
    const iy1 = cy + oy + Math.sin(end) * inner;
    const ix2 = cx + ox + Math.cos(start) * inner;
    const iy2 = cy + oy + Math.sin(start) * inner;
    const path = donut
      ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`
      : `M ${cx + ox} ${cy + oy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { path, color, label: d.label, value: d.value, frac };
  });

  return (
    <div
      ref={wrapRef}
      style={mergeStyle(
        {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
        },
        style,
      )}
    >
      <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} role="img">
        {slices.map((s, i) => (
          <path
            key={s.label + i}
            d={s.path}
            fill={s.color}
            opacity={active == null || active === i ? 1 : 0.45}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          />
        ))}
        {donut ? (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.text.primary}
            fontSize={Math.max(12, Math.round(diameter * 0.07))}
            fontWeight={590}
          >
            {Math.round(total)}
          </text>
        ) : null}
      </svg>
      <Legend items={slices.map((s) => ({ name: s.label, color: s.color }))} />
      {active != null ? (
        <div style={{ fontSize: 11, color: theme.text.secondary }}>
          {slices[active]!.label}: {slices[active]!.value} ({Math.round(slices[active]!.frac * 100)}
          %)
        </div>
      ) : null}
    </div>
  );
}
