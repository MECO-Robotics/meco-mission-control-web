import { IconEdit } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionMappingRow } from "./partMappingsViewModel";

interface PartMappingsDefinitionListProps {
  mappedRows: PartDefinitionMappingRow[];
  onEditPartDefinition: (item: BootstrapPayload["partDefinitions"][number]) => void;
  unmappedRows: PartDefinitionMappingRow[];
}

function renderLinks(label: string, values: string[]) {
  if (values.length === 0) {
    return <small>{label}: None</small>;
  }

  return <small>{label}: {values.join(" | ")}</small>;
}

export function PartMappingsDefinitionList({
  mappedRows,
  onEditPartDefinition,
  unmappedRows,
}: PartMappingsDefinitionListProps) {
  return (
    <section className="panel-subsection part-mappings-group">
      <div className="roster-section-header">
        <div className="roster-section-title">
          <h3>Definition coverage</h3>
        </div>
      </div>

      {unmappedRows.length > 0 ? (
        <div className="part-mappings-definition-list">
          {unmappedRows.map((row) => (
            <article className="part-mappings-definition-card is-unmapped" key={`unmapped-${row.definition.id}`}>
              <div className="part-mappings-definition-main">
                <strong>{row.definition.name}</strong>
                <small>Part #{row.definition.partNumber} r{row.definition.revision || "0"}</small>
                <small>Needs first instance mapping to subsystem/mechanism.</small>
              </div>
              <button
                className="subsystem-manager-action-button"
                onClick={() => onEditPartDefinition(row.definition)}
                type="button"
                title={`Edit ${row.definition.name}`}
              >
                <IconEdit />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">All part definitions are mapped to at least one instance.</p>
      )}

      {mappedRows.length > 0 ? (
        <div className="part-mappings-definition-list">
          {mappedRows.map((row) => (
            <article className="part-mappings-definition-card" key={row.definition.id}>
              <div className="part-mappings-definition-main">
                <div className="part-mappings-definition-title-row">
                  <strong>{row.definition.name}</strong>
                  {row.definition.isArchived ? (
                    <span className="pill status-pill status-pill-neutral">Archived</span>
                  ) : null}
                </div>
                <small>Part #{row.definition.partNumber} r{row.definition.revision || "0"}</small>
                <div className="part-mappings-definition-metrics">
                  <span>{row.instanceCount} instances</span>
                  <span>{row.openTaskCount} open tasks</span>
                  <span>{row.riskCount} active risks</span>
                  <span>{row.manufacturingOpenCount} manufacturing open</span>
                  <span>{row.purchaseOpenCount} purchases open</span>
                </div>
                {renderLinks("Subsystems", row.subsystemLabels)}
                {renderLinks("Mechanisms", row.mechanismLabels)}
              </div>
              <button
                className="subsystem-manager-action-button"
                onClick={() => onEditPartDefinition(row.definition)}
                type="button"
                title={`Edit ${row.definition.name}`}
              >
                <IconEdit />
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
