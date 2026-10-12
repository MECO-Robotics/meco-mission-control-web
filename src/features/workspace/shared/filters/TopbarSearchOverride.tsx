import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type SearchOverride = { label: string; value: string; onChange: (value: string) => void };
type SearchOverrideContextValue = { active: SearchOverride | null; setActive: (value: SearchOverride | null) => void };
const TopbarSearchOverrideContext = createContext<SearchOverrideContextValue | null>(null);

export function TopbarSearchOverrideProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SearchOverride | null>(null);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <TopbarSearchOverrideContext.Provider value={value}>{children}</TopbarSearchOverrideContext.Provider>;
}

export function useTopbarSearchOverride() {
  return useContext(TopbarSearchOverrideContext);
}
