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

type AutoArrangeSubsystem = Pick<
  SubsystemRecord,
  "id" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
>;

const AUTO_ARRANGE_MINIMUM_SLOT_DISTANCE = 0.08;

function isAutoArrangeSlotAvailable(
  slot: { layoutX: number; layoutY: number },
  occupiedSlots: Array<{ layoutX: number; layoutY: number }>,
) {
  return occupiedSlots.every((occupiedSlot) => {
    const xDistance = occupiedSlot.layoutX - slot.layoutX;
    const yDistance = occupiedSlot.layoutY - slot.layoutY;
    return (
      (xDistance * xDistance) + (yDistance * yDistance) >
      AUTO_ARRANGE_MINIMUM_SLOT_DISTANCE * AUTO_ARRANGE_MINIMUM_SLOT_DISTANCE
    );
  });
}

function buildAutoArrangeCandidateSlots(minimumSlotCount: number) {
  const slots: Array<{ layoutX: number; layoutY: number }> = [];
  const seenSlots = new Set<string>();

  for (let gridSize = 2; slots.length < minimumSlotCount; gridSize += 1) {
    for (let rowIndex = 0; rowIndex < gridSize; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < gridSize; columnIndex += 1) {
        const layoutX = clampLayoutCoordinate((columnIndex + 1) / (gridSize + 1));
        const layoutY = clampLayoutCoordinate((rowIndex + 1) / (gridSize + 1));

        if (layoutX === null || layoutY === null) {
          continue;
        }

        const slotKey = `${layoutX.toFixed(4)}:${layoutY.toFixed(4)}`;
        if (seenSlots.has(slotKey)) {
          continue;
        }

        seenSlots.add(slotKey);
        slots.push({ layoutX, layoutY });
      }
    }
  }

  return slots;
}

function resolveAutoArrangeZone(
  slot: { layoutX: number; layoutY: number },
  existingZone: SubsystemLayoutZone | null | undefined,
): SubsystemLayoutZone {
  if (existingZone && existingZone !== "unplaced") {
    return existingZone;
  }

  if (slot.layoutY < 0.34) {
    return "front";
  }

  if (slot.layoutY > 0.66) {
    return "rear";
  }

  if (slot.layoutX < 0.4) {
    return "left";
  }

  if (slot.layoutX > 0.6) {
    return "right";
  }

  return "center";
}

export function buildAutoArrangedLayouts(
  subsystems: readonly AutoArrangeSubsystem[],
): Record<string, SubsystemLayoutFields> {
  const layouts: Record<string, SubsystemLayoutFields> = {};
  const occupiedSlots = subsystems
    .map(resolveSubsystemLayout)
    .filter(isSubsystemPlaced)
    .map((layout) => ({
      layoutX: layout.layoutX ?? 0.5,
      layoutY: layout.layoutY ?? 0.5,
    }));
  const unplacedSubsystems = subsystems
    .filter((subsystem) => !isSubsystemPlaced(resolveSubsystemLayout(subsystem)))
    .sort((left, right) => {
      const leftSortOrder = left.sortOrder ?? Number.POSITIVE_INFINITY;
      const rightSortOrder = right.sortOrder ?? Number.POSITIVE_INFINITY;

      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder;
      }

      return left.id.localeCompare(right.id);
    });
  const candidateSlots = buildAutoArrangeCandidateSlots(
    Math.max(12, (subsystems.length + unplacedSubsystems.length) * 4),
  );
  let candidateSlotIndex = 0;

  unplacedSubsystems.forEach((subsystem, index) => {
    const nextSlot = candidateSlots.slice(candidateSlotIndex).find((slot, offset) => {
      const isAvailable = isAutoArrangeSlotAvailable(slot, occupiedSlots);
      if (isAvailable) {
        candidateSlotIndex += offset + 1;
      }
      return isAvailable;
    });

    if (!nextSlot) {
      return;
    }

    occupiedSlots.push(nextSlot);
    layouts[subsystem.id] = {
      layoutX: nextSlot.layoutX,
      layoutY: nextSlot.layoutY,
      layoutZone: resolveAutoArrangeZone(nextSlot, subsystem.layoutZone),
      layoutView: subsystem.layoutView === "top" ? subsystem.layoutView : DEFAULT_SUBSYSTEM_LAYOUT_VIEW,
      sortOrder: subsystem.sortOrder ?? index,
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
