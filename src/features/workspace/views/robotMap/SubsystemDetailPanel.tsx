import { IconEdit } from "@/components/shared/Icons";
import type { MechanismRecord, SubsystemRecord } from "@/types/recordsOrganization";
import type { PartInstanceRecord } from "@/types/recordsInventory";

import { SubsystemMechanismSection } from "./SubsystemMechanismSection";
import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface SubsystemDetailPanelProps {
  onCreateMechanism: (subsystemId?: string) => void;
  onCreatePartInstance: (mechanism: MechanismRecord) => void;
  onDeleteMechanism: (mechanismId: string) => Promise<void>;
  onEditMechanism: (mechanism: MechanismRecord) => void;
  onEditPartInstance: (partInstance: PartInstanceRecord) => void;
  onEditSubsystem: (subsystem: SubsystemRecord) => void;
  onRemovePartFromMechanism: (partInstanceId: string) => Promise<boolean>;
  onSaveSubsystemConfiguration: (
    subsystemId: string,
    patch: Partial<
      Pick<
        SubsystemRecord,
        "name" | "description" | "layoutX" | "layoutY" | "layoutZone" | "layoutView" | "sortOrder"
      >
    >,
  ) => Promise<boolean>;
  selectedSubsystem: RobotConfigurationSubsystemModel | null;
}

export function SubsystemDetailPanel({
  onCreateMechanism,
  onCreatePartInstance,
  onDeleteMechanism,
  onEditMechanism,
  onEditPartInstance,
  onEditSubsystem,
  onRemovePartFromMechanism,
  selectedSubsystem,
}: SubsystemDetailPanelProps) {
  if (!selectedSubsystem) {
    return (
      <aside className="robot-config-detail-panel">
        <h3>Subsystem Details</h3>
        <p className="empty-state">Select a subsystem to configure mechanisms and parts.</p>
      </aside>
    );
  }

  return (
    <aside className="robot-config-detail-panel">
      <header className="robot-config-detail-header">
        <div className="robot-config-detail-title-row">
          <h3>{selectedSubsystem.name}</h3>
          <button
            aria-label="Edit subsystem"
            className="icon-button robot-config-detail-title-edit"
            onClick={() => onEditSubsystem(selectedSubsystem.record)}
            title="Edit subsystem"
            type="button"
          >
            <IconEdit />
          </button>
        </div>
        <small>{`${selectedSubsystem.mechanismCount} mechanisms | ${selectedSubsystem.partCount} parts`}</small>
      </header>

      <section className="robot-config-detail-readonly">
        <h4>Description</h4>
        <p className="section-copy">{selectedSubsystem.description || "No description yet."}</p>
      </section>

      <SubsystemMechanismSection
        mechanisms={selectedSubsystem.mechanisms}
        onCreateMechanism={() => onCreateMechanism(selectedSubsystem.id)}
        onCreatePartInstance={onCreatePartInstance}
        onDeleteMechanism={onDeleteMechanism}
        onEditMechanism={onEditMechanism}
        onEditPartInstance={onEditPartInstance}
        onRemovePartFromMechanism={onRemovePartFromMechanism}
      />
    </aside>
  );
}
