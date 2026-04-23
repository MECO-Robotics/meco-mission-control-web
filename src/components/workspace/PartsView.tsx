import { useMemo, useState } from "react";

import { IconManufacturing, IconTasks } from "../shared/Icons";
import type { BootstrapPayload, PartDefinitionRecord } from "../../types";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "./WorkspaceViewShared";
import { getStatusPillStyle } from "./workspaceUtils";
import { WORKSPACE_PANEL_STYLE } from "./workspaceTypes";
import { PART_STATUS_OPTIONS } from "./workspaceOptions";

interface PartsViewProps {
  bootstrap: BootstrapPayload;
  handleDeletePartDefinition: (id: string) => void;
  isDeletingPartDefinition: boolean;
  openCreatePartDefinitionModal: () => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function PartsView({
  bootstrap,
  handleDeletePartDefinition,
  isDeletingPartDefinition,
  openCreatePartDefinitionModal,
  openEditPartDefinitionModal,
  partDefinitionsById,
  subsystemsById,
}: PartsViewProps) {
  const [partSearch, setPartSearch] = useState("");
  const [partSubsystem, setPartSubsystem] = useState("all");
  const [partStatus, setPartStatus] = useState("all");

  const filteredPartDefinitions = useMemo(() => {
    const search = partSearch.toLowerCase();
    return bootstrap.partDefinitions.filter((partDefinition) => {
      const materialName = partDefinition.materialId
        ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name ?? ""
        : "";

      return (
        !search ||
        partDefinition.name.toLowerCase().includes(search) ||
        partDefinition.partNumber.toLowerCase().includes(search) ||
        partDefinition.type.toLowerCase().includes(search) ||
        partDefinition.source.toLowerCase().includes(search) ||
        materialName.toLowerCase().includes(search)
      );
    });
  }, [bootstrap.materials, bootstrap.partDefinitions, partSearch]);

  const filteredPartInstances = useMemo(() => {
    const search = partSearch.toLowerCase();
    return bootstrap.partInstances.filter((partInstance) => {
      const definition = partDefinitionsById[partInstance.partDefinitionId];
      const matchesSearch =
        !search ||
        partInstance.name.toLowerCase().includes(search) ||
        definition?.name.toLowerCase().includes(search) ||
        definition?.partNumber.toLowerCase().includes(search);
      const matchesSubsystem = partSubsystem === "all" || partInstance.subsystemId === partSubsystem;
      const matchesStatus = partStatus === "all" || partInstance.status === partStatus;
      return matchesSearch && matchesSubsystem && matchesStatus;
    });
  }, [bootstrap.partInstances, partDefinitionsById, partSearch, partStatus, partSubsystem]);

  return (
    <section className="panel dense-panel part-manager-shell" style={WORKSPACE_PANEL_STYLE}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Part manager</h2>
          <p className="section-copy" style={{ color: "var(--text-copy)" }}>
            Reusable part definitions and subsystem-specific part instances for traceability.
          </p>
        </div>
        <div className="panel-actions filter-toolbar part-manager-toolbar">
          <SearchToolbarInput
            ariaLabel="Search parts"
            onChange={setPartSearch}
            placeholder="Search parts..."
            value={partSearch}
          />

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter parts by subsystem"
            icon={<IconManufacturing />}
            onChange={setPartSubsystem}
            options={bootstrap.subsystems}
            value={partSubsystem}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter parts by status"
            icon={<IconTasks />}
            onChange={setPartStatus}
            options={PART_STATUS_OPTIONS}
            value={partStatus}
          />

          <button
            aria-label="Add part definition"
            className="primary-action queue-toolbar-action part-manager-toolbar-action"
            onClick={openCreatePartDefinitionModal}
            title="Add part definition"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="panel-subsection">
        <div className="table-shell">
          <div
            className="ops-table ops-table-header"
            style={{
              gridTemplateColumns: "minmax(180px, 2fr) 1fr 0.6fr 0.8fr 1fr 0.8fr",
              borderBottom: "1px solid var(--border-base)",
              color: "var(--text-copy)",
            }}
          >
            <span style={{ textAlign: "left" }}>Part</span>
            <span>Number</span>
            <span>Rev</span>
            <span>Type</span>
            <span>Material</span>
            <span>Actions</span>
          </div>
        {filteredPartDefinitions.map((partDefinition) => (
            <div
              className="ops-table ops-row editable-action-host editable-row-clickable"
              key={partDefinition.id}
              onClick={() => openEditPartDefinitionModal(partDefinition)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEditPartDefinitionModal(partDefinition);
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                gridTemplateColumns: "minmax(180px, 2fr) 1fr 0.6fr 0.8fr 1fr 0.8fr",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
                background: "var(--bg-row-alt)",
                cursor: "pointer",
              }}
              title={`Edit ${partDefinition.name}`}
            >
              <TableCell label="Part">
                <strong style={{ color: "var(--text-title)" }}>{partDefinition.name}</strong>
                {partDefinition.description ? <small>{partDefinition.description}</small> : null}
              </TableCell>
              <TableCell label="Number">{partDefinition.partNumber}</TableCell>
              <TableCell label="Rev">{partDefinition.revision}</TableCell>
              <TableCell label="Type">{partDefinition.type}</TableCell>
              <TableCell label="Material">
                {(partDefinition.materialId
                  ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name
                  : null) ?? "Unassigned"}
              </TableCell>
              <TableCell label="Actions" valueClassName="table-cell-actions">
                <span
                  className="part-manager-row-actions editable-action-reveal"
                  style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end", width: "100%" }}
                >
                  <EditableHoverIndicator className="editable-hover-indicator-inline" />
                  <button
                    className="danger-action part-manager-danger-action"
                    disabled={isDeletingPartDefinition}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeletePartDefinition(partDefinition.id);
                    }}
                    style={{ padding: "0.35rem 0.6rem" }}
                    type="button"
                  >
                    Delete
                  </button>
                </span>
              </TableCell>
            </div>
          ))}
          {filteredPartDefinitions.length === 0 ? (
            <p className="empty-state">No part definitions match the current search.</p>
          ) : null}
        </div>
      </div>

      <div className="panel-subsection">
        <div className="roster-section-header">
          <h3 style={{ color: "var(--text-title)" }}>Part instances</h3>
        </div>
        <div className="table-shell">
          <div
            className="ops-table ops-table-header"
            style={{
              gridTemplateColumns: "minmax(180px, 2fr) 1fr 1fr 0.5fr 0.8fr",
              borderBottom: "1px solid var(--border-base)",
              color: "var(--text-copy)",
            }}
          >
            <span style={{ textAlign: "left" }}>Instance</span>
            <span>Definition</span>
            <span>Subsystem</span>
            <span>Qty</span>
            <span>Status</span>
          </div>
          {filteredPartInstances.map((partInstance) => (
            <div
              className="ops-table ops-row"
              key={partInstance.id}
              style={{
                gridTemplateColumns: "minmax(180px, 2fr) 1fr 1fr 0.5fr 0.8fr",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
                background: "var(--bg-row-alt)",
              }}
            >
              <TableCell label="Instance">
                <strong style={{ color: "var(--text-title)" }}>{partInstance.name}</strong>
                <small>{partInstance.trackIndividually ? "Individual tracking" : "Bulk quantity"}</small>
              </TableCell>
              <TableCell label="Definition">
                {partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part"}
              </TableCell>
              <TableCell label="Subsystem">
                {(partInstance.subsystemId ? subsystemsById[partInstance.subsystemId]?.name : null) ?? "Unknown"}
              </TableCell>
              <TableCell label="Qty">{partInstance.quantity}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span style={getStatusPillStyle(partInstance.status)}>{partInstance.status}</span>
              </TableCell>
            </div>
          ))}
          {filteredPartInstances.length === 0 ? (
            <p className="empty-state">No part instances match the current filters.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
