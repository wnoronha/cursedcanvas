import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useHostTheme } from "cursor/canvas";

/** Same stack as the viewer shell — portals to document.body lose inheritance. */
const APP_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export type ActionBarItem = {
  id: string;
  label: string;
  detail?: string;
  group?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  items: ActionBarItem[];
  onClose: () => void;
  placeholder?: string;
};

export function ActionBar({
  open,
  items,
  onClose,
  placeholder = "Type a command or canvas name…",
}: Props): JSX.Element | null {
  const theme = useHostTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.detail?.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    );
  }, [items, query]);

  const activeIndex = filtered.length === 0 ? 0 : Math.min(active, filtered.length - 1);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const runAt = (index: number) => {
    const item = filtered[index];
    if (!item) return;
    onClose();
    queueMicrotask(() => item.run());
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(filtered.length ? (activeIndex + 1) % filtered.length : 0);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(filtered.length ? (activeIndex - 1 + filtered.length) % filtered.length : 0);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      runAt(activeIndex);
    }
  };

  return createPortal(
    <div
      data-testid="action-bar"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        background: "rgba(0,0,0,0.32)",
        fontFamily: APP_FONT,
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        style={{
          width: "min(560px, calc(100vw - 32px))",
          background: theme.bg.elevated,
          color: theme.text.primary,
          border: `1px solid ${theme.stroke.secondary}`,
          borderRadius: 12,
          boxShadow: "0 16px 48px rgba(0,0,0,0.28)",
          overflow: "hidden",
          fontFamily: APP_FONT,
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKey}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls="action-bar-list"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            padding: "14px 16px",
            fontSize: 15,
            background: "transparent",
            color: theme.text.primary,
            borderBottom: `1px solid ${theme.stroke.tertiary}`,
            fontFamily: APP_FONT,
          }}
        />
        <div
          id="action-bar-list"
          role="listbox"
          style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0" }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", color: theme.text.tertiary, fontSize: 13 }}>
              No matches
            </div>
          ) : (
            filtered.map((item, i) => {
              const selected = i === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runAt(i)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "baseline",
                    gap: 10,
                    border: "none",
                    background: selected ? theme.fill.secondary : "transparent",
                    color: theme.text.primary,
                    textAlign: "left",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontFamily: APP_FONT,
                    fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1, fontWeight: 550 }}>{item.label}</span>
                  {item.detail ? (
                    <span style={{ color: theme.text.tertiary, fontSize: 12 }}>{item.detail}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "8px 16px",
            borderTop: `1px solid ${theme.stroke.tertiary}`,
            fontSize: 11,
            color: theme.text.tertiary,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
