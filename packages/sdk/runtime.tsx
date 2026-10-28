import { useCallback, useMemo, type ReactNode } from "react";
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
  const theme = useMemo(() => resolveThemeFromHost(), []);
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
