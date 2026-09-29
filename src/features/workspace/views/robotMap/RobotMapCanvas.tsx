import { LayoutGrid, Upload } from "lucide-react";
import type { SubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

import { isSubsystemPlaced } from "./robotMapLayout";
import { RobotMapCanvasActions } from "./RobotMapCanvasActions";
import { SubsystemMapCard } from "./SubsystemMapCard";
import { useRobotMapCanvasDrag } from "./useRobotMapCanvasDrag";
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
  referenceImageStorageNotice: string | null;
  selectedSubsystemId: string | null;
  subsystems: RobotConfigurationSubsystemModel[];
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
  referenceImageStorageNotice,
  selectedSubsystemId,
  subsystems,
}: RobotMapCanvasProps) {
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
          <div className="robot-config-map-empty">
            <p>Upload an isometric layout image to place subsystems on a robot reference.</p>
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

        {referenceImageStorageNotice ? (
          <p className="robot-config-map-storage-notice" role="status">
            {referenceImageStorageNotice}
          </p>
        ) : null}

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
              <button
                className="secondary-action queue-toolbar-action robot-config-auto-arrange-trigger"
                onClick={onAutoArrange}
                type="button"
              >
                <LayoutGrid aria-hidden="true" size={14} />
                <span>Auto-arrange</span>
              </button>
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
