import { useMemo, useRef, useState } from "react";

import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { buildUnplacedLayout, clampLayoutCoordinate, isSubsystemPlaced } from "./robotMapLayout";
import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface DragState {
  offsetX: number;
  offsetY: number;
  pointerId: number;
  startedFromUnplaced: boolean;
  subsystemId: string;
}

interface UseRobotMapCanvasDragArgs {
  isLayoutEditEnabled: boolean;
  onDraftLayoutChange: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onLayoutDrop: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onSelectSubsystem: (subsystemId: string) => void;
  subsystems: RobotConfigurationSubsystemModel[];
}

function toLayoutCoordinates(bounds: DOMRect, clientX: number, clientY: number) {
  const x = clampLayoutCoordinate((clientX - bounds.left) / bounds.width);
  const y = clampLayoutCoordinate((clientY - bounds.top) / bounds.height);
  const isInsideSurface =
    clientX >= bounds.left && clientX <= bounds.right &&
    clientY >= bounds.top && clientY <= bounds.bottom;

  return { isInsideSurface, x, y };
}

export function useRobotMapCanvasDrag({
  isLayoutEditEnabled,
  onDraftLayoutChange,
  onLayoutDrop,
  onSelectSubsystem,
  subsystems,
}: UseRobotMapCanvasDragArgs) {
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const subsystemById = useMemo(
    () => Object.fromEntries(subsystems.map((subsystem) => [subsystem.id, subsystem] as const)),
    [subsystems],
  );

  const startDraggingSubsystem = (
    event: React.PointerEvent<HTMLButtonElement>,
    subsystem: RobotConfigurationSubsystemModel,
  ) => {
    if (!isLayoutEditEnabled) return;

    const bounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startedFromUnplaced = !isSubsystemPlaced(subsystem.layout);
    let offsetX: number;
    let offsetY: number;

    if (startedFromUnplaced) {
      const card = event.currentTarget.getBoundingClientRect();
      offsetX = (event.clientX - (card.left + card.width / 2)) / bounds.width;
      offsetY = (event.clientY - (card.top + card.height / 2)) / bounds.height;
    } else {
      const pointer = toLayoutCoordinates(bounds, event.clientX, event.clientY);
      if (pointer.x === null || pointer.y === null) return;
      offsetX = pointer.x - (subsystem.layout.layoutX ?? 0.5);
      offsetY = pointer.y - (subsystem.layout.layoutY ?? 0.5);
    }

    setDragState({ offsetX, offsetY, pointerId: event.pointerId, startedFromUnplaced, subsystemId: subsystem.id });
    onSelectSubsystem(subsystem.id);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const bounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const pointer = toLayoutCoordinates(bounds, event.clientX, event.clientY);
    if (pointer.x === null || pointer.y === null) return;

    const subsystem = subsystemById[dragState.subsystemId];
    onDraftLayoutChange(dragState.subsystemId, {
      layoutX: clampLayoutCoordinate(pointer.x - dragState.offsetX),
      layoutY: clampLayoutCoordinate(pointer.y - dragState.offsetY),
      layoutZone: subsystem?.layout.layoutZone === "unplaced" ? "center" : subsystem?.layout.layoutZone ?? "center",
      layoutView: "top",
      sortOrder: subsystem?.layout.sortOrder ?? null,
    });
  };

  const stopDraggingSubsystem = (pointerId: number, clientX: number, clientY: number) => {
    if (!dragState || dragState.pointerId !== pointerId) return;
    const bounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!bounds) {
      setDragState(null);
      return;
    }
    const pointer = toLayoutCoordinates(bounds, clientX, clientY);
    const subsystem = subsystemById[dragState.subsystemId];
    if (pointer.x === null || pointer.y === null) {
      setDragState(null);
      return;
    }

    const draft: SubsystemLayoutFields = {
      layoutX: clampLayoutCoordinate(pointer.x - dragState.offsetX),
      layoutY: clampLayoutCoordinate(pointer.y - dragState.offsetY),
      layoutZone: subsystem?.layout.layoutZone === "unplaced" ? "center" : subsystem?.layout.layoutZone ?? "center",
      layoutView: "top",
      sortOrder: subsystem?.layout.sortOrder ?? null,
    };
    const layout = pointer.isInsideSurface || !dragState.startedFromUnplaced
      ? draft
      : buildUnplacedLayout(subsystem?.layout.sortOrder ?? null);
    onLayoutDrop(dragState.subsystemId, layout);
    setDragState(null);
  };

  return { dragState, handlePointerMove, mapSurfaceRef, startDraggingSubsystem, stopDraggingSubsystem };
}
