import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { PartMappingsDefinitionList } from "./PartMappingsDefinitionList";
import { PartMappingsMechanismList } from "./PartMappingsMechanismList";
import { PartMappingsSummary } from "./PartMappingsSummary";
import { buildPartMappingsViewModel } from "./partMappingsViewModel";

interface PartMappingsViewProps {
  bootstrap: BootstrapPayload;
  openCreatePartDefinitionModal: () => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartDefinitionModal: (item: BootstrapPayload["partDefinitions"][number]) => void;
}

export function PartMappingsView({
  bootstrap,
  openCreatePartDefinitionModal,
  openCreatePartInstanceModal,
  openEditMechanismModal,
  openEditPartDefinitionModal,
}: PartMappingsViewProps) {
  const mechanismsById = useMemo(
    () => Object.fromEntries(bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const)),
    [bootstrap.mechanisms],
  );
  const viewModel = useMemo(() => buildPartMappingsViewModel(bootstrap), [bootstrap]);

  const hasRobotStructure =
    bootstrap.partDefinitions.length > 0 ||
    bootstrap.partInstances.length > 0 ||
    bootstrap.mechanisms.length > 0;

  return (
    <section className={`panel dense-panel part-mappings-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header part-mappings-header">
        <div className="queue-section-header">
          <h2>Part mappings</h2>
          <p className="section-copy">
            Track how part definitions are instantiated across subsystems and mechanisms.
          </p>
        </div>
        <button className="secondary-action" onClick={openCreatePartDefinitionModal} type="button">
          Add part definition
        </button>
      </div>

      {!hasRobotStructure ? (
        <div className="empty-state">
          <strong>No part structure available yet.</strong>
          <p className="section-copy">
            Create a part definition, then map it to mechanisms by adding part instances.
          </p>
        </div>
      ) : (
        <>
          <PartMappingsSummary cards={viewModel.summaryCards} />
          <div className="part-mappings-grid">
            <PartMappingsDefinitionList
              mappedRows={viewModel.mappedDefinitionRows}
              onEditPartDefinition={openEditPartDefinitionModal}
              unmappedRows={viewModel.unmappedDefinitionRows}
            />
            <PartMappingsMechanismList
              mechanismsById={mechanismsById}
              onAddPartInstance={openCreatePartInstanceModal}
              onEditMechanism={openEditMechanismModal}
              rows={viewModel.mechanismRows}
            />
          </div>
        </>
      )}
    </section>
  );
}
