import { IconEdit, IconPlus } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RobotMapMechanismModel } from "./robotMapViewModel";

interface RobotMechanismRowProps {
  mechanism: RobotMapMechanismModel;
  onCreatePartInstance: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  onEditMechanism: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
}

export function RobotMechanismRow({
  mechanism,
  onCreatePartInstance,
  onEditMechanism,
}: RobotMechanismRowProps) {
  return (
    <div className="robot-map-mechanism-row">
      <div className="robot-map-mechanism-main">
        <strong>{mechanism.name}</strong>
        <div className="robot-map-mechanism-metrics">
          <span>Parts {mechanism.partInstanceCount}</span>
          <span>Open {mechanism.openTaskCount}</span>
          <span>QA {mechanism.waitingQaCount}</span>
          <span>High risk {mechanism.activeHighRiskCount}</span>
          <span>MFG {mechanism.manufacturingIncompleteCount}</span>
        </div>
      </div>
      <div className="robot-map-mechanism-actions">
        <button
          className="subsystem-manager-action-button subsystem-manager-action-button-primary"
          onClick={() => onCreatePartInstance(mechanism.record)}
          title={`Add part instance to ${mechanism.name}`}
          type="button"
        >
          <IconPlus />
        </button>
        <button
          className="subsystem-manager-action-button"
          onClick={() => onEditMechanism(mechanism.record)}
          title={`Edit ${mechanism.name}`}
          type="button"
        >
          <IconEdit />
        </button>
      </div>
    </div>
  );
}
