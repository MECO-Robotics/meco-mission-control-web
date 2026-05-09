import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export const APP_TOPBAR_SLOT_IDS = {
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
  if (typeof document === "undefined") {
    return fallbackToInline ? children : null;
  }

  const host = document.getElementById(APP_TOPBAR_SLOT_IDS[slot]);
  if (!host) {
    return fallbackToInline ? children : null;
  }

  return createPortal(children, host);
}
