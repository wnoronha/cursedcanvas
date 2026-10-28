import type { CSSProperties, JSX } from "react";
import { useHostTheme } from "./hooks";
import type { Color } from "./tokens";
import { mergeStyle } from "./style";

export type SwatchProps = {
  color: Color;
  style?: CSSProperties;
};

export function Swatch({ color, style }: SwatchProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <span
      style={mergeStyle(
        {
          display: "inline-block",
          width: 24,
          height: 24,
          borderRadius: theme.radius.md,
          background: theme.category[color],
          flexShrink: 0,
        },
        style,
      )}
    />
  );
}
