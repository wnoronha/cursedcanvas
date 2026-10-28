import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { useHostTheme } from "./hooks";
import { mergeStyle } from "./style";

export type TextInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password" | "number" | "url" | "search";
  style?: CSSProperties;
};

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  style,
}: TextInputProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={mergeStyle(
        {
          height: 28,
          width: "100%",
          boxSizing: "border-box",
          padding: "0 10px",
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.stroke.secondary}`,
          background: theme.bg.editor,
          color: theme.text.primary,
          fontSize: 13,
          outline: "none",
        },
        style,
      )}
    />
  );
}

export type TextAreaProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  style?: CSSProperties;
};

export function TextArea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  style,
}: TextAreaProps): JSX.Element {
  const theme = useHostTheme();
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || style?.height) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, style?.height]);

  return (
    <textarea
      ref={ref}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      onChange={(e) => onChange?.(e.target.value)}
      style={mergeStyle(
        {
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 10px",
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.stroke.secondary}`,
          background: theme.bg.editor,
          color: theme.text.primary,
          fontSize: 13,
          lineHeight: "18px",
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        },
        style,
      )}
    />
  );
}

export type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  style?: CSSProperties;
};

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  style,
}: CheckboxProps): JSX.Element {
  const theme = useHostTheme();
  const box = (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
      style={{ accentColor: theme.accent.primary, width: 14, height: 14 }}
    />
  );
  if (!label) {
    return <span style={style}>{box}</span>;
  }
  return (
    <label
      style={mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: theme.text.primary,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      )}
    >
      {box}
      {label}
    </label>
  );
}

export type ToggleProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  style?: CSSProperties;
};

export function Toggle({
  checked,
  onChange,
  disabled,
  size = "sm",
  style,
}: ToggleProps): JSX.Element {
  const theme = useHostTheme();
  const trackH = size === "md" ? 20 : 16;
  const trackW = size === "md" ? 36 : 28;
  const knob = size === "md" ? 16 : 12;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={mergeStyle(
        {
          width: trackW,
          height: trackH,
          borderRadius: 999,
          border: "none",
          padding: 2,
          background: checked ? theme.accent.control : theme.fill.primary,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          position: "relative",
        },
        style,
      )}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? trackW - knob - 2 : 2,
          width: knob,
          height: knob,
          borderRadius: 999,
          background: theme.text.onAccent,
          transition: "left 120ms ease",
        }}
      />
    </button>
  );
}

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  style,
}: SelectProps): JSX.Element {
  const theme = useHostTheme();
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={mergeStyle(
        {
          height: 28,
          width: "100%",
          boxSizing: "border-box",
          padding: "0 8px",
          borderRadius: theme.radius.sm,
          border: `1px solid ${theme.stroke.secondary}`,
          background: theme.bg.editor,
          color: theme.text.primary,
          fontSize: 13,
          colorScheme: theme.kind.includes("light") ? "light" : "dark",
        },
        style,
      )}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export type IconButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "circle";
  size?: "sm" | "md";
  style?: CSSProperties;
};

export function IconButton({
  children,
  onClick,
  disabled,
  title,
  variant = "default",
  size = "md",
  style,
}: IconButtonProps): JSX.Element {
  const theme = useHostTheme();
  const dim = size === "sm" ? 16 : 20;
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          width: dim,
          height: dim,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: variant === "circle" ? 999 : theme.radius.sm,
          background: variant === "circle" ? theme.fill.secondary : "transparent",
          color: theme.text.secondary,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          padding: 0,
        },
        style,
      )}
    >
      {children}
    </button>
  );
}
