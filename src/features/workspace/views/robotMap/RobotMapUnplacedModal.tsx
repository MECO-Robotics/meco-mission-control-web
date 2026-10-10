import { ModalDialog } from "@/components/ModalDialog";
import { LayoutGrid } from "lucide-react";

import { RobotMapCanvasActions } from "./RobotMapCanvasActions";
import { SubsystemMapCard } from "./SubsystemMapCard";
import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface RobotMapUnplacedModalProps {
  onAutoArrange: () => void;
  onClose: () => void;
  onPlaceSubsystem: (subsystemId: string) => void;
  onResetLayout: () => void;
  onSelectSubsystem: (subsystemId: string) => void;
  selectedSubsystemId: string | null;
  subsystems: RobotConfigurationSubsystemModel[];
}

export function RobotMapUnplacedModal({
  onAutoArrange,
  onClose,
  onPlaceSubsystem,
  onResetLayout,
  onSelectSubsystem,
  selectedSubsystemId,
  subsystems,
}: RobotMapUnplacedModalProps) {
  return (
    <ModalDialog label="Unplaced subsystems" onClose={onClose} dismissOnBackdrop>
      <section className="modal-card robot-config-unplaced-modal">
        <header className="robot-config-unplaced-modal-header">
          <div>
            <h2>Unplaced subsystems</h2>
            <p>{subsystems.length} waiting to be placed on the robot view.</p>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">Close</button>
        </header>

        <div className="robot-config-unplaced-modal-actions">
          <button
            className="secondary-action queue-toolbar-action robot-config-auto-arrange-trigger"
            onClick={onAutoArrange}
            type="button"
          >
            <LayoutGrid aria-hidden="true" size={14} />
            <span>Auto-arrange</span>
          </button>
          <RobotMapCanvasActions
            onResetLayout={onResetLayout}
          />
        </div>

        <div className="robot-config-unplaced-modal-list">
          {subsystems.map((subsystem) => (
            <div className="robot-config-unplaced-entry" key={subsystem.id}>
              <SubsystemMapCard
                isSelected={selectedSubsystemId === subsystem.id}
                onSelect={() => onSelectSubsystem(subsystem.id)}
                subsystem={subsystem}
              />
              <button
                className="primary-action queue-toolbar-action"
                onClick={() => onPlaceSubsystem(subsystem.id)}
                type="button"
              >
                Place
              </button>
            </div>
          ))}
        </div>
      </section>
    </ModalDialog>
  );
}
