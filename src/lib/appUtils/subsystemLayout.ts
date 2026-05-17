import type { SubsystemLayoutView, SubsystemLayoutZone } from "@/types/recordsOrganization";

export const SUBSYSTEM_LAYOUT_ZONES: readonly SubsystemLayoutZone[] = [
  "front",
  "rear",
  "left",
  "right",
  "center",
  "top",
  "unplaced",
];

export const DEFAULT_SUBSYSTEM_LAYOUT_ZONE: SubsystemLayoutZone = "unplaced";
export const DEFAULT_SUBSYSTEM_LAYOUT_VIEW: SubsystemLayoutView = "top";

export interface SubsystemLayoutFields {
  layoutX: number | null;
  layoutY: number | null;
  layoutZone: SubsystemLayoutZone;
  layoutView: SubsystemLayoutView;
  sortOrder: number | null;
}

function normalizeLayoutCoordinate(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(1, value));
}

export function normalizeSubsystemLayoutFields(layout: {
  layoutX?: number | null;
  layoutY?: number | null;
  layoutZone?: SubsystemLayoutZone | null;
  layoutView?: SubsystemLayoutView | null;
  sortOrder?: number | null;
}): SubsystemLayoutFields {
  const layoutZone =
    layout.layoutZone && SUBSYSTEM_LAYOUT_ZONES.includes(layout.layoutZone)
      ? layout.layoutZone
      : DEFAULT_SUBSYSTEM_LAYOUT_ZONE;

  return {
    layoutX: normalizeLayoutCoordinate(layout.layoutX),
    layoutY: normalizeLayoutCoordinate(layout.layoutY),
    layoutZone,
    layoutView: layout.layoutView === "top" ? "top" : DEFAULT_SUBSYSTEM_LAYOUT_VIEW,
    sortOrder: typeof layout.sortOrder === "number" && Number.isFinite(layout.sortOrder)
      ? Math.round(layout.sortOrder)
      : null,
  };
}

export function withDefaultSubsystemLayout<T extends {
  layoutX?: number | null;
  layoutY?: number | null;
  layoutZone?: SubsystemLayoutZone | null;
  layoutView?: SubsystemLayoutView | null;
  sortOrder?: number | null;
}>(record: T): T & SubsystemLayoutFields {
  return {
    ...record,
    ...normalizeSubsystemLayoutFields(record),
  };
}
