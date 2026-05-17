import { IconEdit, IconPlus, IconTrash } from "@/components/shared/Icons";
import type { MechanismRecord } from "@/types/recordsOrganization";
import type { PartInstanceRecord } from "@/types/recordsInventory";

import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface SubsystemMechanismSectionProps {
  mechanisms: RobotConfigurationSubsystemModel["mechanisms"];
  onCreateMechanism: () => void;
  onCreatePartInstance: (mechanism: MechanismRecord) => void;
  onDeleteMechanism: (mechanismId: string) => Promise<void>;
  onEditMechanism: (mechanism: MechanismRecord) => void;
  onEditPartInstance: (partInstance: PartInstanceRecord) => void;
  onRemovePartFromMechanism: (partInstanceId: string) => Promise<boolean>;
}

export function SubsystemMechanismSection({
  mechanisms,
  onCreateMechanism,
  onCreatePartInstance,
  onDeleteMechanism,
  onEditMechanism,
  onEditPartInstance,
  onRemovePartFromMechanism,
}: SubsystemMechanismSectionProps) {
  return (
    <section className="robot-config-detail-mechanisms">
      <div className="robot-config-mechanism-header">
        <h4>Mechanisms</h4>
        <button
          aria-label="Add mechanism"
          className="icon-button robot-config-mechanism-add-button"
          onClick={onCreateMechanism}
          title="Add mechanism"
          type="button"
        >
          <IconPlus />
        </button>
      </div>
      {mechanisms.length > 0 ? (
        <div className="robot-config-mechanism-scroll">
          <div className="robot-config-mechanism-list">
            {mechanisms.map((mechanism) => (
              <details className="robot-config-mechanism-item" key={mechanism.id}>
                <summary>
                  <span>{mechanism.name}</span>
                  <small>{`${mechanism.partCount} parts`}</small>
                </summary>
                <p>{mechanism.description || "No description yet."}</p>
                <div className="robot-config-row-actions">
                  <button
                    className="subsystem-manager-action-button subsystem-manager-action-button-primary"
                    onClick={() => onCreatePartInstance(mechanism.record)}
                    type="button"
                  >
                    <IconPlus /> Add part
                  </button>
                  <button
                    className="subsystem-manager-action-button"
                    onClick={() => onEditMechanism(mechanism.record)}
                    type="button"
                  >
                    <IconEdit /> Edit
                  </button>
                  <button
                    className="subsystem-manager-action-button"
                    onClick={async () => {
                      if (!window.confirm(`Delete mechanism "${mechanism.name}"?`)) {
                        return;
                      }

                      await onDeleteMechanism(mechanism.id);
                    }}
                    type="button"
                  >
                    <IconTrash /> Delete
                  </button>
                </div>
                {mechanism.parts.length > 0 ? (
                  <ul className="robot-config-part-list">
                    {mechanism.parts.map((part) => (
                      <li key={part.id}>
                        <span>{`${part.name} (${part.quantity})`}</span>
                        <div className="robot-config-row-actions">
                          <button
                            className="subsystem-manager-action-button"
                            onClick={() => onEditPartInstance(part.record)}
                            type="button"
                          >
                            <IconEdit /> Edit part
                          </button>
                          <button
                            className="subsystem-manager-action-button"
                            onClick={async () => {
                              await onRemovePartFromMechanism(part.id);
                            }}
                            type="button"
                          >
                            Remove from mechanism
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No parts yet. Add part.</p>
                )}
              </details>
            ))}
          </div>
        </div>
      ) : (
        <p className="empty-state">No mechanisms yet. Add first mechanism.</p>
      )}
    </section>
  );
}
