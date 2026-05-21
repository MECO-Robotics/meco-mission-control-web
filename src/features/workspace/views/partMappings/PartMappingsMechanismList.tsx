import { IconEdit, IconPlus } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MechanismMappingRow } from "./partMappingsViewModel";

interface PartMappingsMechanismListProps {
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  onAddPartInstance: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  onEditMechanism: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  rows: MechanismMappingRow[];
}

export function PartMappingsMechanismList({
  mechanismsById,
  onAddPartInstance,
  onEditMechanism,
  rows,
}: PartMappingsMechanismListProps) {
  return (
    <section className="panel-subsection part-mappings-group">
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3>Mechanism mapping status</h3>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="part-mappings-mechanism-list">
          {rows.map((row) => {
            const mechanism = mechanismsById[row.id];

            return (
              <article className="part-mappings-mechanism-row" key={row.id}>
                <div className="part-mappings-mechanism-main">
                  <strong>{row.name}</strong>
                  <small>{row.subsystemName}</small>
                  <div className="part-mappings-definition-metrics">
                    <span>{row.instanceCount} instances</span>
                    <span>{row.definitionCount} definitions</span>
                    <span>{row.openTaskCount} open tasks</span>
                    <span>{row.riskCount} active risks</span>
                    <span>{row.manufacturingOpenCount} manufacturing open</span>
                  </div>
                </div>
                {mechanism ? (
                  <div className="part-mappings-mechanism-actions">
                    <button
                      className="subsystem-manager-action-button subsystem-manager-action-button-primary"
                      onClick={() => onAddPartInstance(mechanism)}
                      type="button"
                      title={`Add part instance to ${row.name}`}
                    >
                      <IconPlus />
                    </button>
                    <button
                      className="subsystem-manager-action-button"
                      onClick={() => onEditMechanism(mechanism)}
                      type="button"
                      title={`Edit ${row.name}`}
                    >
                      <IconEdit />
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No mechanisms are available yet.</p>
      )}
    </section>
  );
}
