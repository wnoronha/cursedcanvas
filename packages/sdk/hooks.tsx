import { useCallback, useState } from "react";
import type { CanvasAction, CanvasHostTheme, SetCanvasState } from "./hostTheme";
import { useRuntime } from "./runtimeContext";

export type { CanvasAction, CanvasHostTheme, SetCanvasState };

export function useHostTheme(): CanvasHostTheme {
  return useRuntime().theme;
}

function storageKey(canvasId: string, key: string): string {
  return `cursedcanvas:${canvasId}:${key}`;
}

function readStored<T>(canvasId: string, key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(canvasId, key));
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useCanvasState<T>(key: string, defaultValue: T): [T, SetCanvasState<T>] {
  const { canvasId } = useRuntime();
  const [value, setValue] = useState<T>(() => readStored(canvasId, key, defaultValue));

  const setCanvasState = useCallback<SetCanvasState<T>>(
    (action) => {
      setValue((prev) => {
        const next = typeof action === "function" ? (action as (p: T) => T)(prev) : action;
        try {
          window.localStorage.setItem(storageKey(canvasId, key), JSON.stringify(next));
        } catch {
          /* ignore quota / private mode */
        }
        return next;
      });
    },
    [canvasId, key],
  );

  return [value, setCanvasState];
}

export function useCanvasAction(): (action: CanvasAction) => void {
  return useRuntime().dispatchAction;
}
