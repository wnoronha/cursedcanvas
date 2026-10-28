import type { CSSProperties, JSX, ReactNode } from "react";
import { useHostTheme } from "./hooks";
import { usageColorSequence, type Color } from "./tokens";
import { mergeStyle } from "./style";

export interface UsageBarSegment {
  readonly id: string;
  readonly value: number;
  readonly color?: Color;
}

export type UsageBarProps = {
  readonly segments: readonly UsageBarSegment[];
  readonly total: number;
  readonly topLeftLabel?: ReactNode;
  readonly topRightLabel?: ReactNode;
  readonly style?: CSSProperties;
};

export function UsageBar({
  segments,
  total,
  topLeftLabel,
  topRightLabel,
  style,
}: UsageBarProps): JSX.Element {
  const theme = useHostTheme();
  const safeTotal = total > 0 ? total : 1;
  const sum = segments.reduce(
    (acc, s) => acc + (Number.isFinite(s.value) && s.value > 0 ? s.value : 0),
    0,
  );
  const remainder = Math.max(0, safeTotal - sum);

  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: 6 }, style)}>
      {(topLeftLabel != null || topRightLabel != null) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: theme.text.secondary,
          }}
        >
          <span>{topLeftLabel}</span>
          <span>{topRightLabel}</span>
        </div>
      )}
      <div
        style={{
          display: "flex",
          height: 8,
          borderRadius: theme.radius.full,
          overflow: "hidden",
          background: theme.fill.tertiary,
          gap: 2,
        }}
      >
        {segments.map((seg, i) => {
          const value = Number.isFinite(seg.value) && seg.value > 0 ? seg.value : 0;
          if (value <= 0) return null;
          const colorKey = seg.color ?? usageColorSequence[i % usageColorSequence.length]!;
          return (
            <div
              key={seg.id}
              style={{
                width: `${(value / safeTotal) * 100}%`,
                background: theme.category[colorKey],
                borderRadius: theme.radius.sm,
              }}
              title={seg.id}
            />
          );
        })}
        {remainder > 0 ? <div style={{ flex: 1, minWidth: 0 }} /> : null}
      </div>
    </div>
  );
}
