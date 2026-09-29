import { useMemo, useRef, useState, type ReactNode } from "react";

import { Layers3 } from "lucide-react";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { buildUnplacedLayout, clampLayoutCoordinate, isSubsystemPlaced } from "./robotMapLayout";
import { RobotMapCanvasActions } from "./RobotMapCanvasActions";
import { RobotMapUnplacedModal } from "./RobotMapUnplacedModal";
import { SubsystemMapCard } from "./SubsystemMapCard";
import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface RobotMapCanvasProps {
  cadViewer: (onOrbitingChange: (isOrbiting: boolean) => void) => ReactNode;
  isLayoutEditEnabled: boolean;
  onAddSubsystem: () => void;
  onAutoArrange: () => void;
  onDraftLayoutChange: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onLayoutDrop: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onResetLayout: () => void;
  onSelectSubsystem: (subsystemId: string) => void;
  onToggleLayoutEdit: () => void;
  selectedSubsystemId: string | null;
  subsystems: RobotConfigurationSubsystemModel[];
}

interface DragState {
  offsetX: number;
  offsetY: number;
  pointerId: number;
  startedFromUnplaced: boolean;
  subsystemId: string;
}

function toLayoutCoordinates(
  mapSurfaceBounds: DOMRect,
  clientX: number,
  clientY: number,
) {
  const x = clampLayoutCoordinate((clientX - mapSurfaceBounds.left) / mapSurfaceBounds.width);
  const y = clampLayoutCoordinate((clientY - mapSurfaceBounds.top) / mapSurfaceBounds.height);
  const isInsideSurface =
    clientX >= mapSurfaceBounds.left &&
    clientX <= mapSurfaceBounds.right &&
    clientY >= mapSurfaceBounds.top &&
    clientY <= mapSurfaceBounds.bottom;

  return { isInsideSurface, x, y };
}

export function RobotMapCanvas({
  cadViewer,
  isLayoutEditEnabled,
  onAddSubsystem,
  onAutoArrange,
  onDraftLayoutChange,
  onLayoutDrop,
  onResetLayout,
  onSelectSubsystem,
  onToggleLayoutEdit,
  selectedSubsystemId,
  subsystems,
}: RobotMapCanvasProps) {
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [isUnplacedModalOpen, setIsUnplacedModalOpen] = useState(false);
  const [pendingPlacementSubsystemId, setPendingPlacementSubsystemId] = useState<string | null>(null);

  const subsystemById = useMemo(
    () => Object.fromEntries(subsystems.map((subsystem) => [subsystem.id, subsystem] as const)),
    [subsystems],
  );
  const placedSubsystems = subsystems.filter((subsystem) => isSubsystemPlaced(subsystem.layout));
  const unplacedSubsystems = subsystems.filter((subsystem) => !isSubsystemPlaced(subsystem.layout));
  const hasUnplacedSubsystems = unplacedSubsystems.length > 0;

  const placePendingSubsystem = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pendingPlacementSubsystemId) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }

    const mapSurfaceBounds = mapSurfaceRef.current?.getBoundingClientRect();
    const subsystem = subsystemById[pendingPlacementSubsystemId];
    if (!mapSurfaceBounds || !subsystem) {
      return;
    }

    const pointer = toLayoutCoordinates(mapSurfaceBounds, event.clientX, event.clientY);
    if (!pointer.isInsideSurface || pointer.x === null || pointer.y === null) {
      return;
    }

    onSelectSubsystem(subsystem.id);
    onLayoutDrop(subsystem.id, {
      layoutX: pointer.x,
      layoutY: pointer.y,
      layoutZone: "center",
      layoutView: "top",
      sortOrder: subsystem.layout.sortOrder,
    });
    setPendingPlacementSubsystemId(null);
  };

  const beginSubsystemPlacement = (subsystemId: string) => {
    onSelectSubsystem(subsystemId);
    setPendingPlacementSubsystemId(subsystemId);
    setIsUnplacedModalOpen(false);
  };

  const startDraggingSubsystem = (
    event: React.PointerEvent<HTMLButtonElement>,
    subsystem: RobotConfigurationSubsystemModel,
  ) => {
    if (!isLayoutEditEnabled) {
      return;
    }

    const mapSurfaceBounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!mapSurfaceBounds) {
      return;
    }

    if (mapSurfaceBounds.width <= 0 || mapSurfaceBounds.height <= 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startedFromUnplaced = !isSubsystemPlaced(subsystem.layout);
    let offsetX: number;
    let offsetY: number;

    if (startedFromUnplaced) {
      const cardBounds = event.currentTarget.getBoundingClientRect();
      offsetX =
        (event.clientX - (cardBounds.left + cardBounds.width / 2)) / mapSurfaceBounds.width;
      offsetY =
        (event.clientY - (cardBounds.top + cardBounds.height / 2)) / mapSurfaceBounds.height;
    } else {
      const pointer = toLayoutCoordinates(mapSurfaceBounds, event.clientX, event.clientY);
      if (pointer.x === null || pointer.y === null) {
        return;
      }

      const fallbackX = subsystem.layout.layoutX ?? 0.5;
      const fallbackY = subsystem.layout.layoutY ?? 0.5;
      offsetX = pointer.x - fallbackX;
      offsetY = pointer.y - fallbackY;
    }

    setDragState({
      offsetX,
      offsetY,
      pointerId: event.pointerId,
      startedFromUnplaced,
      subsystemId: subsystem.id,
    });
    onSelectSubsystem(subsystem.id);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const mapSurfaceBounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!mapSurfaceBounds) {
      return;
    }

    const pointer = toLayoutCoordinates(mapSurfaceBounds, event.clientX, event.clientY);
    if (pointer.x === null || pointer.y === null) {
      return;
    }

    const subsystem = subsystemById[dragState.subsystemId];
    const previousZone = subsystem?.layout.layoutZone ?? "unplaced";
    const nextZone = previousZone === "unplaced" ? "center" : previousZone;

    onDraftLayoutChange(dragState.subsystemId, {
      layoutX: clampLayoutCoordinate(pointer.x - dragState.offsetX),
      layoutY: clampLayoutCoordinate(pointer.y - dragState.offsetY),
      layoutZone: nextZone,
      layoutView: "top",
      sortOrder: subsystem?.layout.sortOrder ?? null,
    });
  };

  const stopDraggingSubsystem = (
    pointerId: number,
    pointerClientX: number,
    pointerClientY: number,
  ) => {
    if (!dragState || dragState.pointerId !== pointerId) {
      return;
    }

    const mapSurfaceBounds = mapSurfaceRef.current?.getBoundingClientRect();
    if (!mapSurfaceBounds) {
      setDragState(null);
      return;
    }

    const pointer = toLayoutCoordinates(mapSurfaceBounds, pointerClientX, pointerClientY);
    const subsystem = subsystemById[dragState.subsystemId];
    const previousZone = subsystem?.layout.layoutZone ?? "unplaced";
    const nextZone = previousZone === "unplaced" ? "center" : previousZone;

    if (pointer.x === null || pointer.y === null) {
      setDragState(null);
      return;
    }

    const draftLayout: SubsystemLayoutFields = {
      layoutX: clampLayoutCoordinate(pointer.x - dragState.offsetX),
      layoutY: clampLayoutCoordinate(pointer.y - dragState.offsetY),
      layoutZone: nextZone,
      layoutView: "top",
      sortOrder: subsystem?.layout.sortOrder ?? null,
    };
    const finalLayout =
      pointer.isInsideSurface || !dragState.startedFromUnplaced
        ? draftLayout
        : buildUnplacedLayout(subsystem?.layout.sortOrder ?? null);

    onLayoutDrop(dragState.subsystemId, finalLayout);
    setDragState(null);
  };

  return (
    <div
      className="robot-config-canvas-shell"
      onPointerCancel={(event) => stopDraggingSubsystem(event.pointerId, event.clientX, event.clientY)}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => stopDraggingSubsystem(event.pointerId, event.clientX, event.clientY)}
    >
      <div
        className={`robot-config-map-surface${isLayoutEditEnabled ? " is-editing" : ""}${isOrbiting ? " is-orbiting" : ""}${pendingPlacementSubsystemId ? " is-placing-subsystem" : ""}`}
        onClick={placePendingSubsystem}
        ref={mapSurfaceRef}
      >
        <div className="robot-config-map-layer">
          {placedSubsystems.map((subsystem) => (
            <div
              className="robot-config-card-layer"
              key={subsystem.id}
              style={{
                left: `${(subsystem.layout.layoutX ?? 0.5) * 100}%`,
                top: `${(subsystem.layout.layoutY ?? 0.5) * 100}%`,
              }}
            >
              <SubsystemMapCard
                isDragging={dragState?.subsystemId === subsystem.id}
                isEditable={isLayoutEditEnabled}
                isSelected={selectedSubsystemId === subsystem.id}
                onPointerDown={(event) => startDraggingSubsystem(event, subsystem)}
                onSelect={() => onSelectSubsystem(subsystem.id)}
                subsystem={subsystem}
              />
            </div>
          ))}

          <div className="robot-config-map-edit-overlay">
            {hasUnplacedSubsystems ? (
              <button
                aria-expanded={isUnplacedModalOpen}
                aria-haspopup="dialog"
                aria-label={`Show ${unplacedSubsystems.length} unplaced subsystems`}
                className="secondary-action queue-toolbar-action robot-config-unplaced-trigger"
                onClick={() => setIsUnplacedModalOpen(true)}
                type="button"
              >
                <Layers3 aria-hidden="true" size={14} />
                <span>Unplaced</span>
                <span className="robot-config-unplaced-count">{unplacedSubsystems.length}</span>
              </button>
            ) : null}
            <button
              aria-checked={isLayoutEditEnabled}
              className={`robot-config-edit-toggle${isLayoutEditEnabled ? " is-active" : ""}`}
              onClick={onToggleLayoutEdit}
              role="switch"
              title={isLayoutEditEnabled ? "Disable edit mode" : "Enable edit mode"}
              type="button"
            >
              <span className="robot-config-edit-toggle-label">Edit</span>
              <span aria-hidden="true" className="robot-config-edit-toggle-track">
                <span className="robot-config-edit-toggle-thumb" />
              </span>
            </button>
          </div>

          {!hasUnplacedSubsystems ? (
            <div className="robot-config-map-actions-overlay">
              <RobotMapCanvasActions onAddSubsystem={onAddSubsystem} onResetLayout={onResetLayout} />
            </div>
          ) : null}

          {pendingPlacementSubsystemId ? (
            <div className="robot-config-placement-prompt" role="status">
              <span>Click the robot view to place {subsystemById[pendingPlacementSubsystemId]?.name ?? "subsystem"}.</span>
              <button className="ghost-button" onClick={() => setPendingPlacementSubsystemId(null)} type="button">
                Cancel
              </button>
            </div>
          ) : null}
        </div>

        <div className="robot-config-embedded-cad">
          {cadViewer(setIsOrbiting)}
        </div>
      </div>

      {isUnplacedModalOpen && hasUnplacedSubsystems ? (
        <RobotMapUnplacedModal
          onAddSubsystem={onAddSubsystem}
          onAutoArrange={onAutoArrange}
          onClose={() => setIsUnplacedModalOpen(false)}
          onPlaceSubsystem={beginSubsystemPlacement}
          onResetLayout={onResetLayout}
          onSelectSubsystem={onSelectSubsystem}
          selectedSubsystemId={selectedSubsystemId}
          subsystems={unplacedSubsystems}
        />
      ) : null}
    </div>
  );
}
