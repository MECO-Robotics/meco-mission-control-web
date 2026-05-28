import {
  DEFAULT_SUBSYSTEM_LAYOUT_VIEW,
  DEFAULT_SUBSYSTEM_LAYOUT_ZONE,
  normalizeSubsystemLayoutFields,
  type SubsystemLayoutFields,
} from "@/lib/appUtils/subsystemLayout";
import type { SubsystemLayoutZone, SubsystemRecord } from "@/types/recordsOrganization";

export const ROBOT_MAP_ZONE_LABELS: Record<SubsystemLayoutZone, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left",
  right: "Right",
  center: "Center",
  top: "Top / Elevated",
  unplaced: "Unplaced",
};

export function clampLayoutCoordinate(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0.04, Math.min(0.96, value));
}

export function isSubsystemPlaced(layout: SubsystemLayoutFields) {
  return layout.layoutX !== null && layout.layoutY !== null;
}

export function resolveSubsystemLayout(
  subsystem: Pick<
    SubsystemRecord,
    "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
  >,
) {
  const normalized = normalizeSubsystemLayoutFields(subsystem);

  return {
    ...normalized,
    layoutX: clampLayoutCoordinate(normalized.layoutX),
    layoutY: clampLayoutCoordinate(normalized.layoutY),
  };
}

export function buildAutoArrangedLayouts(
  subsystems: Array<Pick<SubsystemRecord, "id" | "layoutZone" | "layoutView">>,
): Record<string, SubsystemLayoutFields> {
  const layouts: Record<string, SubsystemLayoutFields> = {};
  const radiusX = 0.34;
  const radiusY = 0.26;

  subsystems.forEach((subsystem, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, subsystems.length);
    const nextZone = subsystem.layoutZone && subsystem.layoutZone !== "unplaced"
      ? subsystem.layoutZone
      : "center";

    layouts[subsystem.id] = {
      layoutX: clampLayoutCoordinate(0.5 + Math.cos(angle) * radiusX),
      layoutY: clampLayoutCoordinate(0.5 + Math.sin(angle) * radiusY),
      layoutZone: nextZone,
      layoutView: subsystem.layoutView === "top" ? subsystem.layoutView : DEFAULT_SUBSYSTEM_LAYOUT_VIEW,
      sortOrder: index,
    };
  });

  return layouts;
}

export function buildUnplacedLayout(sortOrder: number | null = null): SubsystemLayoutFields {
  return {
    layoutX: null,
    layoutY: null,
    layoutZone: DEFAULT_SUBSYSTEM_LAYOUT_ZONE,
    layoutView: DEFAULT_SUBSYSTEM_LAYOUT_VIEW,
    sortOrder,
  };
}
