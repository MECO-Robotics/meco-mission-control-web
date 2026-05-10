import { useMemo, useRef, useState } from "react";

import { LayoutGrid, Upload } from "lucide-react";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { buildUnplacedLayout, clampLayoutCoordinate, isSubsystemPlaced } from "./robotMapLayout";
import { RobotMapCanvasActions } from "./RobotMapCanvasActions";
import { SubsystemMapCard } from "./SubsystemMapCard";
import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface RobotMapCanvasProps {
  isLayoutEditEnabled: boolean;
  onAddSubsystem: () => void;
  onAutoArrange: () => void;
  onDraftLayoutChange: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onLayoutDrop: (subsystemId: string, layout: SubsystemLayoutFields) => void;
  onReferenceImageSelected: (file: File) => void;
  onResetLayout: () => void;
  onSelectSubsystem: (subsystemId: string) => void;
  onToggleLayoutEdit: () => void;
  referenceImageUrl: string | null;
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

const ROBOT_MAP_UPLOAD_INPUT_ID = "robot-config-map-upload-input";

export function RobotMapCanvas({
  isLayoutEditEnabled,
  onAddSubsystem,
  onAutoArrange,
  onDraftLayoutChange,
  onLayoutDrop,
  onReferenceImageSelected,
  onResetLayout,
  onSelectSubsystem,
  onToggleLayoutEdit,
  referenceImageUrl,
  selectedSubsystemId,
  subsystems,
}: RobotMapCanvasProps) {
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const subsystemById = useMemo(
    () => Object.fromEntries(subsystems.map((subsystem) => [subsystem.id, subsystem] as const)),
    [subsystems],
  );
  const placedSubsystems = subsystems.filter((subsystem) => isSubsystemPlaced(subsystem.layout));
  const unplacedSubsystems = subsystems.filter((subsystem) => !isSubsystemPlaced(subsystem.layout));
  const hasPlacedSubsystems = placedSubsystems.length > 0;
  const hasUnplacedSubsystems = unplacedSubsystems.length > 0;

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

    const pointer = toLayoutCoordinates(mapSurfaceBounds, event.clientX, event.clientY);
    if (pointer.x === null || pointer.y === null) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const fallbackX = subsystem.layout.layoutX ?? 0.5;
    const fallbackY = subsystem.layout.layoutY ?? 0.5;

    setDragState({
      offsetX: pointer.x - fallbackX,
      offsetY: pointer.y - fallbackY,
      pointerId: event.pointerId,
      startedFromUnplaced: !isSubsystemPlaced(subsystem.layout),
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
      <div className={`robot-config-map-surface${isLayoutEditEnabled ? " is-editing" : ""}`} ref={mapSurfaceRef}>
        {referenceImageUrl ? (
          <img
            alt="Robot isometric reference"
            className="robot-config-reference-image"
            src={referenceImageUrl}
          />
        ) : (
          <div className="robot-config-isometric-placeholder" aria-label="Isometric placeholder">
            <div className="robot-config-isometric-cube">
              <span className="robot-config-cube-face robot-config-cube-face-top" />
              <span className="robot-config-cube-face robot-config-cube-face-left" />
              <span className="robot-config-cube-face robot-config-cube-face-right" />
            </div>
            <small>Upload an isometric robot image to use as reference.</small>
          </div>
        )}

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
          <label
            aria-label="Upload isometric image"
            className="icon-button robot-config-map-upload-button"
            htmlFor={ROBOT_MAP_UPLOAD_INPUT_ID}
            title="Upload isometric image"
          >
            <Upload aria-hidden="true" size={14} />
          </label>
          <input
            accept="image/*"
            className="robot-config-upload-input"
            id={ROBOT_MAP_UPLOAD_INPUT_ID}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              onReferenceImageSelected(file);
              event.target.value = "";
            }}
            type="file"
          />
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
      </div>

      {hasUnplacedSubsystems ? (
        <section className="robot-config-unplaced">
          <header className="robot-config-unplaced-header">
            <div>
              <h3>Unplaced Subsystems</h3>
              <small>
                {isLayoutEditEnabled
                  ? "Drag onto the isometric layout to set placement."
                  : "Enable Edit Layout to drag subsystems."}
              </small>
            </div>
            <div className="robot-config-unplaced-actions">
              {!hasPlacedSubsystems ? (
                <button
                  className="secondary-action queue-toolbar-action robot-config-auto-arrange-trigger"
                  onClick={onAutoArrange}
                  type="button"
                >
                  <LayoutGrid aria-hidden="true" size={14} />
                  <span>Auto-arrange</span>
                </button>
              ) : null}
              <RobotMapCanvasActions onAddSubsystem={onAddSubsystem} onResetLayout={onResetLayout} />
            </div>
          </header>
          <div className="robot-config-unplaced-grid">
            {unplacedSubsystems.map((subsystem) => (
              <SubsystemMapCard
                key={subsystem.id}
                isDragging={dragState?.subsystemId === subsystem.id}
                isEditable={isLayoutEditEnabled}
                isSelected={selectedSubsystemId === subsystem.id}
                onPointerDown={(event) => startDraggingSubsystem(event, subsystem)}
                onSelect={() => onSelectSubsystem(subsystem.id)}
                subsystem={subsystem}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
