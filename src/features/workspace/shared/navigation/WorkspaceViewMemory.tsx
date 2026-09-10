import { createContext, useCallback, useContext, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

// Retain navigation filters while their view is unmounted, without retaining editors or data.
const ViewMemory = createContext<Map<string, unknown> | null>(null);

export function WorkspaceViewMemory({ children }: { children: ReactNode }) {
  const values = useRef(new Map<string, unknown>());
  return <ViewMemory.Provider value={values.current}>{children}</ViewMemory.Provider>;
}

export function useRememberedViewState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const memory = useContext(ViewMemory);
  const [value, setValue] = useState<T>(() => memory?.has(key) ? memory.get(key) as T : initial);
  const update: Dispatch<SetStateAction<T>> = useCallback(next => {
    setValue(previous => {
      const resolved = typeof next === "function" ? (next as (value: T) => T)(previous) : next;
      memory?.set(key, resolved);
      return resolved;
    });
  }, [key, memory]);
  return [value, update];
}
