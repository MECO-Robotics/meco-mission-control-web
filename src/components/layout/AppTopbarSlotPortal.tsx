import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const APP_TOPBAR_SLOT_IDS = {
  controls: "workspace-topbar-slot-controls",
  search: "workspace-topbar-slot-search",
} as const;

export type AppTopbarSlot = keyof typeof APP_TOPBAR_SLOT_IDS;

export function AppTopbarSlotPortal({
  children,
  fallbackToInline = true,
  slot,
}: {
  children: ReactNode;
  fallbackToInline?: boolean;
  slot: AppTopbarSlot;
}) {
  const [host, setHost] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") {
      return null;
    }

    return document.getElementById(APP_TOPBAR_SLOT_IDS[slot]);
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const resolveHost = () => {
      const nextHost = document.getElementById(APP_TOPBAR_SLOT_IDS[slot]);
      setHost((current) => (current === nextHost ? current : nextHost));
    };

    resolveHost();

    const observer = new MutationObserver(resolveHost);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [host, slot]);

  if (typeof document === "undefined") {
    return fallbackToInline ? children : null;
  }

  if (!host) {
    return fallbackToInline ? children : null;
  }

  return createPortal(children, host);
}
