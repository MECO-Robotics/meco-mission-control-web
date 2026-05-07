import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { RobotMapSummary } from "./RobotMapSummary";
import { RobotSubsystemCard } from "./RobotSubsystemCard";
import { buildRobotMapViewModel } from "./robotMapViewModel";

interface RobotMapViewProps {
  bootstrap: BootstrapPayload;
  openCreateMechanismModal: (subsystemId?: string) => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openCreateSubsystemModal: () => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditSubsystemModal: (subsystem: BootstrapPayload["subsystems"][number]) => void;
}

export function RobotMapView({
  bootstrap,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openEditMechanismModal,
  openEditSubsystemModal,
}: RobotMapViewProps) {
  const viewModel = buildRobotMapViewModel(bootstrap);

  return (
    <section className={`panel dense-panel robot-map-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Robot structure</h2>
        </div>
        <button className="secondary-action" onClick={openCreateSubsystemModal} type="button">
          Add subsystem
        </button>
      </div>

      <RobotMapSummary summary={viewModel.summary} />

      {viewModel.subsystems.length === 0 ? (
        <div className="empty-state robot-map-empty">
          <strong>No subsystems yet.</strong>
          <p className="section-copy">
            Start by creating a subsystem, then add mechanisms and part instances.
          </p>
          <button className="primary-action" onClick={openCreateSubsystemModal} type="button">
            Add subsystem
          </button>
        </div>
      ) : (
        <div className="robot-map-subsystem-grid">
          {viewModel.subsystems.map((subsystem) => (
            <RobotSubsystemCard
              key={subsystem.id}
              onCreateMechanism={openCreateMechanismModal}
              onCreatePartInstance={openCreatePartInstanceModal}
              onEditMechanism={openEditMechanismModal}
              onEditSubsystem={openEditSubsystemModal}
              subsystem={subsystem}
            />
          ))}
        </div>
      )}
    </section>
  );
}
