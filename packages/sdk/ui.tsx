import {
  createContext,
  useContext,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from "react";
import { useHostTheme } from "./hooks";
import { mergeStyle } from "./style";
import { toneColors } from "./tokens";

export type StackProps = {
  children?: ReactNode;
  gap?: number;
  style?: CSSProperties;
};

export function Stack({ children, gap = 12, style }: StackProps): JSX.Element {
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap }, style)}>
      {children}
    </div>
  );
}

export type RowProps = {
  children?: ReactNode;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  wrap?: boolean;
  style?: CSSProperties;
};

const alignMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;

const justifyMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
} as const;

export function Row({
  children,
  gap = 8,
  align = "center",
  justify = "start",
  wrap,
  style,
}: RowProps): JSX.Element {
  return (
    <div
      style={mergeStyle(
        {
          display: "flex",
          flexDirection: "row",
          gap,
          alignItems: alignMap[align],
          justifyContent: justifyMap[justify],
          flexWrap: wrap ? "wrap" : "nowrap",
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

export type GridProps = {
  children?: ReactNode;
  columns: number | string;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  style?: CSSProperties;
};

export function Grid({
  children,
  columns,
  gap = 12,
  align = "stretch",
  style,
}: GridProps): JSX.Element {
  const template = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return (
    <div
      style={mergeStyle(
        {
          display: "grid",
          gridTemplateColumns: template,
          gap,
          alignItems: alignMap[align],
        },
        style,
      )}
    >
      {children}
    </div>
  );
}

export type DividerProps = { style?: CSSProperties };

export function Divider({ style }: DividerProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <div
      role="separator"
      style={mergeStyle(
        {
          height: 1,
          background: theme.stroke.tertiary,
          width: "100%",
          border: "none",
        },
        style,
      )}
    />
  );
}

export function Spacer(): JSX.Element {
  return <div style={{ flex: 1, minWidth: 0 }} />;
}

export type TableColumnAlign = "left" | "center" | "right";
export type TableRowTone = "success" | "danger" | "warning" | "info" | "neutral";

export type TableProps = {
  headers: ReactNode[];
  rows: ReactNode[][];
  columnAlign?: Array<TableColumnAlign | undefined>;
  rowTone?: Array<TableRowTone | undefined>;
  framed?: boolean;
  striped?: boolean;
  stickyHeader?: boolean;
  style?: CSSProperties;
  emptyMessage?: ReactNode;
};

export function Table({
  headers,
  rows,
  columnAlign,
  rowTone,
  framed = true,
  striped,
  stickyHeader,
  style,
  emptyMessage,
}: TableProps): JSX.Element {
  const theme = useHostTheme();
  const shell: CSSProperties = framed
    ? {
        border: `1px solid ${theme.stroke.tertiary}`,
        borderRadius: theme.radius.md,
        overflow: "auto",
      }
    : { overflow: "auto" };

  return (
    <div style={mergeStyle(shell, style)}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          lineHeight: "18px",
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: columnAlign?.[i] ?? "left",
                  padding: "8px 12px",
                  color: theme.text.secondary,
                  fontWeight: 500,
                  borderBottom: `1px solid ${theme.stroke.tertiary}`,
                  background: theme.bg.elevated,
                  position: stickyHeader ? "sticky" : undefined,
                  top: stickyHeader ? 0 : undefined,
                  zIndex: stickyHeader ? 1 : undefined,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: "12px",
                  color: theme.text.tertiary,
                  textAlign: "center",
                }}
              >
                {emptyMessage ?? "No rows"}
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => {
              const cells = [...row];
              while (cells.length < headers.length) cells.push("");
              const tone = rowTone?.[ri];
              return (
                <tr
                  key={ri}
                  style={{
                    background: striped && ri % 2 === 1 ? theme.fill.quaternary : undefined,
                  }}
                >
                  {cells.slice(0, headers.length).map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        textAlign: columnAlign?.[ci] ?? "left",
                        padding: "8px 12px",
                        color: theme.text.primary,
                        borderBottom: `1px solid ${theme.stroke.tertiary}`,
                        verticalAlign: "top",
                      }}
                    >
                      {ci === 0 && tone ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 999,
                              background: toneColors[tone],
                              flexShrink: 0,
                            }}
                          />
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const TextNestContext = createContext(false);

export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextProps = {
  children?: ReactNode;
  tone?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "body" | "small";
  as?: "p" | "span";
  weight?: TextWeight;
  italic?: boolean;
  truncate?: boolean | "start" | "end";
  style?: CSSProperties;
};

const weightMap: Record<TextWeight, number> = {
  normal: 400,
  medium: 500,
  semibold: 590,
  bold: 700,
};

export function Text({
  children,
  tone = "primary",
  size = "body",
  as,
  weight = "normal",
  italic,
  truncate,
  style,
}: TextProps): JSX.Element {
  const theme = useHostTheme();
  const nested = useContext(TextNestContext);
  const Tag = as ?? (nested ? "span" : "p");
  const trunc =
    truncate === true || truncate === "end"
      ? ({
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        } as CSSProperties)
      : truncate === "start"
        ? ({
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            direction: "rtl",
            textAlign: "left",
          } as CSSProperties)
        : undefined;

  return (
    <TextNestContext.Provider value={true}>
      <Tag
        style={mergeStyle(
          {
            margin: 0,
            color: theme.text[tone],
            fontSize: size === "small" ? 12 : 14,
            lineHeight: size === "small" ? "16px" : "20px",
            fontWeight: weightMap[weight],
            fontStyle: italic ? "italic" : undefined,
            ...trunc,
          },
          style,
        )}
      >
        {children}
      </Tag>
    </TextNestContext.Provider>
  );
}

export type H1Props = { children?: ReactNode; style?: CSSProperties };
export type H2Props = { children?: ReactNode; style?: CSSProperties };
export type H3Props = { children?: ReactNode; style?: CSSProperties };

export function H1({ children, style }: H1Props): JSX.Element {
  const theme = useHostTheme();
  return (
    <h1
      style={mergeStyle(
        {
          margin: 0,
          color: theme.text.primary,
          fontSize: theme.typography.h1.fontSize,
          lineHeight: theme.typography.h1.lineHeight,
          fontWeight: theme.typography.h1.fontWeight,
        },
        style,
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, style }: H2Props): JSX.Element {
  const theme = useHostTheme();
  return (
    <h2
      style={mergeStyle(
        {
          margin: 0,
          color: theme.text.primary,
          fontSize: theme.typography.h2.fontSize,
          lineHeight: theme.typography.h2.lineHeight,
          fontWeight: theme.typography.h2.fontWeight,
        },
        style,
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, style }: H3Props): JSX.Element {
  const theme = useHostTheme();
  return (
    <h3
      style={mergeStyle(
        {
          margin: 0,
          color: theme.text.primary,
          fontSize: theme.typography.h3.fontSize,
          lineHeight: theme.typography.h3.lineHeight,
          fontWeight: theme.typography.h3.fontWeight,
        },
        style,
      )}
    >
      {children}
    </h3>
  );
}

export type CodeProps = { children?: ReactNode; style?: CSSProperties };

export function Code({ children, style }: CodeProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <code
      style={mergeStyle(
        {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.92em",
          background: theme.fill.tertiary,
          padding: "1px 5px",
          borderRadius: theme.radius.sm,
          color: theme.text.primary,
        },
        style,
      )}
    >
      {children}
    </code>
  );
}

export type LinkProps = {
  children?: ReactNode;
  href: string;
  style?: CSSProperties;
};

export function Link({ children, href, style }: LinkProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={mergeStyle(
        {
          color: theme.text.link,
          textDecoration: "underline",
          textUnderlineOffset: 2,
        },
        style,
      )}
    >
      {children}
    </a>
  );
}

export type CardSize = "base" | "lg";
export type CardVariant = "default" | "borderless";

export function CanvasChevron({ expanded }: { expanded: boolean }): JSX.Element {
  const theme = useHostTheme();
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 120ms ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        fill="none"
        stroke={theme.text.tertiary}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CardCtx = {
  size: CardSize;
  stickyHeader?: boolean;
  collapsible?: boolean;
  open: boolean;
  toggle: () => void;
};

const CardContext = createContext<CardCtx | null>(null);

export type CardProps = {
  children?: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  stickyHeader?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: CSSProperties;
};

export function Card({
  children,
  variant = "default",
  size = "base",
  stickyHeader,
  collapsible,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  style,
}: CardProps): JSX.Element {
  const theme = useHostTheme();
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <CardContext.Provider value={{ size, stickyHeader, collapsible, open, toggle }}>
      <div
        style={mergeStyle(
          {
            background: theme.bg.elevated,
            border: variant === "default" ? `1px solid ${theme.stroke.tertiary}` : "none",
            borderRadius: variant === "default" ? theme.radius.lg : 0,
            overflow: "hidden",
          },
          style,
        )}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

export type CardHeaderProps = {
  children?: ReactNode;
  trailing?: ReactNode;
  style?: CSSProperties;
};

export function CardHeader({ children, trailing, style }: CardHeaderProps): JSX.Element {
  const theme = useHostTheme();
  const ctx = useContext(CardContext);
  const height = ctx?.size === "lg" ? 32 : 28;
  const interactive = Boolean(ctx?.collapsible);

  const content = (
    <>
      {ctx?.collapsible ? <CanvasChevron expanded={ctx.open} /> : null}
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {trailing}
    </>
  );

  const baseStyle = mergeStyle(
    {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minHeight: height,
      padding: "0 12px",
      fontSize: 12,
      fontWeight: 500,
      color: theme.text.secondary,
      borderBottom: `1px solid ${theme.stroke.tertiary}`,
      background: theme.bg.elevated,
      position: ctx?.stickyHeader ? "sticky" : undefined,
      top: ctx?.stickyHeader ? 0 : undefined,
      zIndex: ctx?.stickyHeader ? 1 : undefined,
      cursor: interactive ? "pointer" : undefined,
      width: "100%",
      textAlign: "left",
      boxSizing: "border-box",
    },
    style,
  );

  if (interactive) {
    return (
      <button type="button" onClick={ctx?.toggle} style={baseStyle}>
        {content}
      </button>
    );
  }
  return <div style={baseStyle}>{content}</div>;
}

export type CardBodyProps = { children?: ReactNode; style?: CSSProperties };

export function CardBody({ children, style }: CardBodyProps): JSX.Element | null {
  const ctx = useContext(CardContext);
  if (ctx?.collapsible && !ctx.open) return null;
  return <div style={mergeStyle({ padding: 12 }, style)}>{children}</div>;
}

export type ButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  onClick?: () => void;
};

export function Button({
  children,
  variant = "secondary",
  disabled,
  type = "button",
  style,
  onClick,
}: ButtonProps): JSX.Element {
  const theme = useHostTheme();
  const styles: Record<string, CSSProperties> = {
    primary: {
      background: theme.accent.control,
      color: theme.text.onAccent,
      border: "1px solid transparent",
    },
    secondary: {
      background: theme.fill.tertiary,
      color: theme.text.primary,
      border: `1px solid ${theme.stroke.secondary}`,
    },
    ghost: {
      background: "transparent",
      color: theme.text.secondary,
      border: "1px solid transparent",
    },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          height: 24,
          padding: "0 10px",
          borderRadius: theme.radius.sm,
          fontSize: 12,
          fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          width: "fit-content",
          ...styles[variant],
        },
        style,
      )}
    >
      {children}
    </button>
  );
}

export type PillTone = "neutral" | "added" | "deleted" | "renamed" | "success" | "warning" | "info";
export type PillSize = "sm" | "md";
export type PillProps = {
  children?: ReactNode;
  active?: boolean;
  tone?: PillTone;
  size?: PillSize;
  leadingContent?: ReactNode;
  keyboardHint?: string;
  disabled?: boolean;
  title?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Pill({
  children,
  active,
  size = "md",
  leadingContent,
  keyboardHint,
  disabled,
  title,
  style,
  onClick,
}: PillProps): JSX.Element {
  const theme = useHostTheme();
  const sm = size === "sm";
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: sm ? 20 : 24,
          padding: sm ? "0 6px" : "0 10px",
          borderRadius: theme.radius.full,
          fontSize: sm ? 11 : 12,
          fontWeight: 500,
          color: active ? theme.text.primary : theme.text.secondary,
          background: active ? theme.fill.primary : theme.fill.quaternary,
          border: sm ? "none" : `1px solid ${theme.stroke.tertiary}`,
          cursor: onClick && !disabled ? "pointer" : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      )}
    >
      {leadingContent}
      {children}
      {keyboardHint ? (
        <span style={{ color: theme.text.tertiary, fontSize: 11 }}>{keyboardHint}</span>
      ) : null}
    </Tag>
  );
}

export type StatTone = "success" | "danger" | "warning" | "info";
export type StatProps = {
  value: ReactNode;
  label: string;
  tone?: StatTone;
  style?: CSSProperties;
};

export function Stat({ value, label, tone, style }: StatProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: 2 }, style)}>
      <div
        style={{
          fontSize: 20,
          lineHeight: "26px",
          fontWeight: 590,
          color: tone ? toneColors[tone] : theme.text.primary,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: theme.text.tertiary }}>{label}</div>
    </div>
  );
}

export type CalloutTone = "info" | "success" | "warning" | "danger" | "neutral";
export type CalloutProps = {
  children?: ReactNode;
  tone?: CalloutTone;
  title?: ReactNode;
  icon?: ReactNode;
  style?: CSSProperties;
};

const calloutIcons: Record<CalloutTone, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  danger: "×",
  neutral: "·",
};

export function Callout({
  children,
  tone = "info",
  title,
  icon,
  style,
}: CalloutProps): JSX.Element {
  const theme = useHostTheme();
  const accent = tone === "neutral" ? theme.text.secondary : toneColors[tone];
  return (
    <div
      style={mergeStyle(
        {
          display: "flex",
          gap: 10,
          padding: 12,
          borderRadius: theme.radius.md,
          background: theme.fill.quaternary,
          border: `1px solid ${theme.stroke.tertiary}`,
        },
        style,
      )}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: theme.radius.sm,
          background: accent,
          color: theme.text.onAccent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {icon ?? calloutIcons[tone]}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        {title ? (
          <div style={{ fontSize: 13, fontWeight: 590, color: theme.text.primary }}>{title}</div>
        ) : null}
        <div style={{ fontSize: 13, lineHeight: "18px", color: theme.text.secondary }}>
          {children}
        </div>
      </div>
    </div>
  );
}
