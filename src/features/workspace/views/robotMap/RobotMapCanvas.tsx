import { useState, type ReactNode } from "react";
import { Layers3, LayoutGrid } from "lucide-react";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { clampLayoutCoordinate, isSubsystemPlaced } from "./robotMapLayout";
import { RobotMapCanvasActions } from "./RobotMapCanvasActions";
import { RobotMapUnplacedModal } from "./RobotMapUnplacedModal";
import { SubsystemMapCard } from "./SubsystemMapCard";
import { useRobotMapCanvasDrag } from "./useRobotMapCanvasDrag";
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
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [isUnplacedModalOpen, setIsUnplacedModalOpen] = useState(false);
  const [pendingPlacementSubsystemId, setPendingPlacementSubsystemId] = useState<string | null>(null);
  const { dragState, handlePointerMove, mapSurfaceRef, startDraggingSubsystem, stopDraggingSubsystem } =
    useRobotMapCanvasDrag({
      isLayoutEditEnabled,
      onDraftLayoutChange,
      onLayoutDrop,
      onSelectSubsystem,
      subsystems,
    });
  const placedSubsystems = subsystems.filter((subsystem) => isSubsystemPlaced(subsystem.layout));
  const unplacedSubsystems = subsystems.filter((subsystem) => !isSubsystemPlaced(subsystem.layout));
  const hasUnplacedSubsystems = unplacedSubsystems.length > 0;

  const beginSubsystemPlacement = (subsystemId: string) => {
    onSelectSubsystem(subsystemId);
    setPendingPlacementSubsystemId(subsystemId);
    setIsUnplacedModalOpen(false);
  };

  const placePendingSubsystem = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pendingPlacementSubsystemId || (event.target instanceof Element && event.target.closest("button"))) return;
    const bounds = mapSurfaceRef.current?.getBoundingClientRect();
    const subsystem = subsystems.find((item) => item.id === pendingPlacementSubsystemId);
    if (!bounds || !subsystem || bounds.width <= 0 || bounds.height <= 0) return;
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    onLayoutDrop(subsystem.id, {
      layoutX: clampLayoutCoordinate(x),
      layoutY: clampLayoutCoordinate(y),
      layoutZone: "center",
      layoutView: "top",
      sortOrder: subsystem.layout.sortOrder,
    });
    setPendingPlacementSubsystemId(null);
  };

  return (
    <div
      className="robot-config-canvas-shell"
      onPointerCancel={(event) => stopDraggingSubsystem(event.pointerId, event.clientX, event.clientY)}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => stopDraggingSubsystem(event.pointerId, event.clientX, event.clientY)}
    >
      <div className={`robot-config-map-surface${isLayoutEditEnabled ? " is-editing" : ""}${isOrbiting ? " is-orbiting" : ""}${pendingPlacementSubsystemId ? " is-placing-subsystem" : ""}`} onClick={placePendingSubsystem} ref={mapSurfaceRef}>
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
              <button aria-expanded={isUnplacedModalOpen} aria-haspopup="dialog" aria-label={`Show ${unplacedSubsystems.length} unplaced subsystems`} className="secondary-action queue-toolbar-action robot-config-unplaced-trigger" onClick={() => setIsUnplacedModalOpen(true)} type="button">
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
              <span>Click the robot view to place {subsystems.find((item) => item.id === pendingPlacementSubsystemId)?.name ?? "subsystem"}.</span>
              <button className="ghost-button" onClick={() => setPendingPlacementSubsystemId(null)} type="button">Cancel</button>
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
