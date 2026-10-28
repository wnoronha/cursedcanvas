import { createContext, useContext } from "react";
import { resolveThemeFromHost, type CanvasAction, type CanvasHostTheme } from "./hostTheme";

export interface CanvasRuntimeContextValue {
  canvasId: string;
  theme: CanvasHostTheme;
  dispatchAction: (action: CanvasAction) => void;
}

export const CanvasRuntimeContext = createContext<CanvasRuntimeContextValue | null>(null);

export function useRuntime(): CanvasRuntimeContextValue {
  const ctx = useContext(CanvasRuntimeContext);
  if (!ctx) {
    return {
      canvasId: "anonymous",
      theme: resolveThemeFromHost(),
      dispatchAction: (action) => {
        console.info("[canvas] useCanvasAction (no-op):", action);
      },
    };
  }
  return ctx;
}
