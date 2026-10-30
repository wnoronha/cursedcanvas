import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolveThemeFromHost, type CanvasAction } from "./hostTheme";
import { CanvasRuntimeContext } from "./runtimeContext";

export function CanvasRuntimeProvider({
  canvasId,
  children,
  onAction,
}: {
  canvasId: string;
  children: ReactNode;
  onAction?: (action: CanvasAction) => void;
}) {
  const [theme, setTheme] = useState(() => resolveThemeFromHost());
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(resolveThemeFromHost());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const dispatchAction = useCallback(
    (action: CanvasAction) => {
      if (onAction) {
        onAction(action);
        return;
      }
      console.info("[canvas] useCanvasAction (no-op outside Cursor):", action);
    },
    [onAction],
  );

  const value = useMemo(
    () => ({ canvasId, theme, dispatchAction }),
    [canvasId, theme, dispatchAction],
  );

  return <CanvasRuntimeContext.Provider value={value}>{children}</CanvasRuntimeContext.Provider>;
}
