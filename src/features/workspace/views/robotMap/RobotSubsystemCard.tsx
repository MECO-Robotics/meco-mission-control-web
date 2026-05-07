import { IconEdit, IconPlus } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import { RobotMechanismRow } from "./RobotMechanismRow";
import type { RobotMapSubsystemModel } from "./robotMapViewModel";

interface RobotSubsystemCardProps {
  onCreateMechanism: (subsystemId?: string) => void;
  onCreatePartInstance: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  onEditMechanism: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  onEditSubsystem: (subsystem: BootstrapPayload["subsystems"][number]) => void;
  subsystem: RobotMapSubsystemModel;
}

export function RobotSubsystemCard({
  onCreateMechanism,
  onCreatePartInstance,
  onEditMechanism,
  onEditSubsystem,
  subsystem,
}: RobotSubsystemCardProps) {
  const readinessLabel =
    subsystem.readinessState === "blocked"
      ? "Blocked"
      : subsystem.readinessState === "at-risk"
        ? "At risk"
        : "Ready";

  return (
    <article className={`robot-map-subsystem-card robot-map-subsystem-${subsystem.readinessState}`}>
      <header className="robot-map-subsystem-header">
        <div className="robot-map-subsystem-title">
          <h3>{subsystem.name}</h3>
          <span className="pill status-pill status-pill-neutral">{readinessLabel}</span>
        </div>
        <div className="robot-map-subsystem-actions">
          <button
            className="subsystem-manager-action-button subsystem-manager-action-button-primary"
            onClick={() => onCreateMechanism(subsystem.id)}
            title={`Add mechanism to ${subsystem.name}`}
            type="button"
          >
            <IconPlus />
          </button>
          <button
            className="subsystem-manager-action-button"
            onClick={() => onEditSubsystem(subsystem.record)}
            title={`Edit ${subsystem.name}`}
            type="button"
          >
            <IconEdit />
          </button>
        </div>
      </header>

      <div className="robot-map-subsystem-metrics">
        <span>Mechanisms {subsystem.mechanismCount}</span>
        <span>Parts {subsystem.partInstanceCount}</span>
        <span>Open tasks {subsystem.openTaskCount}</span>
        <span>Blocked {subsystem.blockedTaskCount}</span>
        <span>Waiting QA {subsystem.waitingQaCount}</span>
        <span>MFG open {subsystem.manufacturingIncompleteCount}</span>
      </div>

      {subsystem.mechanisms.length === 0 ? (
        <p className="empty-state">No mechanisms yet.</p>
      ) : (
        <div className="robot-map-mechanism-list">
          {subsystem.mechanisms.map((mechanism) => (
            <RobotMechanismRow
              key={mechanism.id}
              mechanism={mechanism}
              onCreatePartInstance={onCreatePartInstance}
              onEditMechanism={onEditMechanism}
            />
          ))}
        </div>
      )}
    </article>
  );
}
