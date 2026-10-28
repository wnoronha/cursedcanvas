import { useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useHostTheme } from "./hooks";
import { CanvasChevron } from "./ui";
import { mergeStyle } from "./style";

export type CollapsibleSectionProps = {
  title: string;
  leading?: ReactNode;
  count?: number;
  trailing?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  style?: CSSProperties;
};

export function CollapsibleSection({
  title,
  leading,
  count,
  trailing,
  children,
  defaultOpen = false,
  style,
}: CollapsibleSectionProps): JSX.Element {
  const theme = useHostTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={style}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "6px 0",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: theme.text.primary,
          fontSize: 13,
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        <CanvasChevron expanded={open} />
        {leading}
        <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
        {count != null ? (
          <span style={{ color: theme.text.tertiary, fontSize: 12 }}>{count}</span>
        ) : null}
        {trailing ? <span style={{ color: theme.text.tertiary }}>{trailing}</span> : null}
      </button>
      {open ? (
        <div style={mergeStyle({ paddingLeft: 20, paddingBottom: 8 })}>{children}</div>
      ) : null}
    </div>
  );
}
